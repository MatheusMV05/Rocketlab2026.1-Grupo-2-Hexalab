import pytest_asyncio
from httpx import ASGITransport, AsyncClient
from sqlalchemy.ext.asyncio import async_sessionmaker, create_async_engine

from app.database import Base, get_db
from app.main import app
from app.tickets.models import DADOS_MOCK, GoldTickets


@pytest_asyncio.fixture
async def cliente_async():
    motor = create_async_engine("sqlite+aiosqlite:///:memory:")
    async with motor.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    fabrica = async_sessionmaker(motor, expire_on_commit=False)

    async with fabrica() as sessao:
        for dado in DADOS_MOCK:
            sessao.add(GoldTickets(**dado))
        await sessao.commit()

    async def _get_db_teste():
        async with fabrica() as sessao:
            yield sessao

    app.dependency_overrides[get_db] = _get_db_teste

    async with AsyncClient(
        transport=ASGITransport(app=app),
        base_url="http://test",
    ) as cliente:
        yield cliente

    app.dependency_overrides.clear()
    await motor.dispose()


# --- happy path ---


async def test_listar_tickets_retorna_200_com_prioridade(cliente_async):
    resposta = await cliente_async.get("/api/tickets")

    assert resposta.status_code == 200
    dados = resposta.json()

    assert "items" in dados
    assert "total" in dados
    assert "page" in dados
    assert "size" in dados
    assert "pages" in dados

    assert dados["total"] > 0
    for item in dados["items"]:
        assert "prioridade" in item
        assert item["prioridade"] in ("Alta", "Media", "Baixa")


async def test_listar_tickets_prioridade_calculada_corretamente(cliente_async):
    resposta = await cliente_async.get("/api/tickets?status=Aberto")

    assert resposta.status_code == 200
    for item in resposta.json()["items"]:
        assert item["prioridade"] == "Alta"


async def test_listar_tickets_paginacao_padrao(cliente_async):
    resposta = await cliente_async.get("/api/tickets")
    dados = resposta.json()

    assert dados["page"] == 1
    assert dados["size"] == 20
    assert dados["pages"] == 1


async def test_listar_tickets_paginacao_com_size_pequeno(cliente_async):
    resposta = await cliente_async.get("/api/tickets?size=5&page=1")
    dados = resposta.json()

    assert resposta.status_code == 200
    assert len(dados["items"]) == 5
    assert dados["total"] == 20
    assert dados["pages"] == 4


async def test_listar_tickets_filtro_tipo_problema(cliente_async):
    resposta = await cliente_async.get("/api/tickets?tipo_problema=Entrega")

    assert resposta.status_code == 200
    for item in resposta.json()["items"]:
        assert item["tipo_problema"].lower() == "entrega"


async def test_listar_tickets_filtro_status(cliente_async):
    resposta = await cliente_async.get("/api/tickets?status=Fechado")

    assert resposta.status_code == 200
    for item in resposta.json()["items"]:
        assert item["status"].lower() == "fechado"


async def test_listar_tickets_filtro_agente(cliente_async):
    resposta = await cliente_async.get("/api/tickets?agente=Ana Silva")

    assert resposta.status_code == 200
    for item in resposta.json()["items"]:
        assert item["agente_suporte"].lower() == "ana silva"


async def test_listar_tickets_filtro_data_inicio(cliente_async):
    resposta = await cliente_async.get("/api/tickets?data_inicio=01-10-2024")

    assert resposta.status_code == 200
    for item in resposta.json()["items"]:
        dia, mes, ano = item["data_abertura"].split("-")
        from datetime import date
        assert date(int(ano), int(mes), int(dia)) >= date(2024, 10, 1)


async def test_listar_tickets_filtro_data_fim(cliente_async):
    resposta = await cliente_async.get("/api/tickets?data_fim=31-08-2024")

    assert resposta.status_code == 200
    for item in resposta.json()["items"]:
        dia, mes, ano = item["data_abertura"].split("-")
        from datetime import date
        assert date(int(ano), int(mes), int(dia)) <= date(2024, 8, 31)


async def test_listar_tickets_sem_resultados_retorna_lista_vazia(cliente_async):
    resposta = await cliente_async.get("/api/tickets?tipo_problema=TipoQueNaoExiste")

    assert resposta.status_code == 200
    dados = resposta.json()
    assert dados["items"] == []
    assert dados["total"] == 0


async def test_listar_tickets_ordenado_por_data_decrescente(cliente_async):
    resposta = await cliente_async.get("/api/tickets?size=5")
    itens = resposta.json()["items"]

    from datetime import datetime
    datas = [datetime.strptime(item["data_abertura"], "%d-%m-%Y") for item in itens]
    assert datas == sorted(datas, reverse=True)


# --- erros de validação (422) ---


async def test_listar_tickets_page_zero_retorna_422(cliente_async):
    resposta = await cliente_async.get("/api/tickets?page=0")
    assert resposta.status_code == 422


async def test_listar_tickets_size_zero_retorna_422(cliente_async):
    resposta = await cliente_async.get("/api/tickets?size=0")
    assert resposta.status_code == 422


async def test_listar_tickets_size_acima_do_limite_retorna_422(cliente_async):
    resposta = await cliente_async.get("/api/tickets?size=200")
    assert resposta.status_code == 422


async def test_listar_tickets_data_inicio_invalida_retorna_422(cliente_async):
    resposta = await cliente_async.get("/api/tickets?data_inicio=31-13-2024")
    assert resposta.status_code == 422


async def test_listar_tickets_data_fim_anterior_a_inicio_retorna_422(cliente_async):
    resposta = await cliente_async.get(
        "/api/tickets?data_inicio=30-12-2024&data_fim=01-01-2024"
    )
    assert resposta.status_code == 422
    assert "detail" in resposta.json()

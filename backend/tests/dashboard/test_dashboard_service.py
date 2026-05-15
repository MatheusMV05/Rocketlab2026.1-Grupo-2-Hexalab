import pytest
from unittest.mock import AsyncMock, patch

from app.dashboard import service
from app.dashboard.schemas import (
    KpiResponse,
    VendasMensalResponse,
    TopProdutosResponse,
    RegiaoResponse,
    StatusPedidosResponse,
    MatrizProdutosResponse,
)
from app.dashboard.models import (
    mock_kpis,
    mock_vendas_mensal,
    mock_top_produtos,
    mock_por_regiao,
    mock_status_pedidos,
    mock_matriz_produtos,
)


@pytest.fixture
def mock_db():
    return AsyncMock()


# Verifica se o service retorna o schema correto com os valores dos KPIs
@pytest.mark.asyncio
async def test_get_kpis_returns_correct_schema(mock_db):
    with patch("app.dashboard.repository.get_kpis", new=AsyncMock(return_value=mock_kpis())):
        result = await service.get_kpis(mock_db)

    assert isinstance(result, KpiResponse)
    assert result.receita_total == 487320.50
    assert result.total_pedidos == 1243
    assert result.ticket_medio == 392.05
    assert result.total_clientes == 836


# Verifica se retorna 12 meses com o primeiro e o último corretos
@pytest.mark.asyncio
async def test_get_vendas_mensal_returns_correct_schema(mock_db):
    with patch("app.dashboard.repository.get_vendas_mensal", new=AsyncMock(return_value=mock_vendas_mensal())):
        result = await service.get_vendas_mensal(mock_db)

    assert isinstance(result, VendasMensalResponse)
    assert len(result.items) == 12
    assert result.items[0].mes_ano == "Jun/2024"
    assert result.items[-1].mes_ano == "Mai/2025"


# Verifica se a ordenação cronológica é aplicada mesmo com dados fora de ordem
@pytest.mark.asyncio
async def test_get_vendas_mensal_ordered_oldest_to_newest(mock_db):
    shuffled = list(reversed(mock_vendas_mensal()))
    with patch("app.dashboard.repository.get_vendas_mensal", new=AsyncMock(return_value=shuffled)):
        result = await service.get_vendas_mensal(mock_db)

    meses = [item.mes_ano for item in result.items]
    assert meses[0] == "Jun/2024"
    assert meses[-1] == "Mai/2025"


# Verifica se os 10 produtos estão ordenados por receita de forma decrescente
@pytest.mark.asyncio
async def test_get_top_produtos_returns_sorted_by_revenue(mock_db):
    with patch("app.dashboard.repository.get_top_produtos", new=AsyncMock(return_value=mock_top_produtos())):
        result = await service.get_top_produtos(mock_db)

    assert isinstance(result, TopProdutosResponse)
    assert len(result.items) == 10
    revenues = [item.receita_total for item in result.items]
    assert revenues == sorted(revenues, reverse=True)


# Verifica se os estados estão ordenados por receita decrescente e o primeiro é São Paulo
@pytest.mark.asyncio
async def test_get_por_regiao_returns_sorted_by_revenue(mock_db):
    with patch("app.dashboard.repository.get_por_regiao", new=AsyncMock(return_value=mock_por_regiao())):
        result = await service.get_por_regiao(mock_db)

    assert isinstance(result, RegiaoResponse)
    assert result.items[0].estado == "São Paulo"
    revenues = [item.receita_total for item in result.items]
    assert revenues == sorted(revenues, reverse=True)


# Verifica se a soma de todos os percentuais é aproximadamente 100%
@pytest.mark.asyncio
async def test_get_status_pedidos_percentuals_sum_to_100(mock_db):
    with patch("app.dashboard.repository.get_status_pedidos", new=AsyncMock(return_value=mock_status_pedidos())):
        result = await service.get_status_pedidos(mock_db)

    assert isinstance(result, StatusPedidosResponse)
    total_percentual = sum(item.percentual for item in result.items)
    assert abs(total_percentual - 100.0) < 0.1


# Verifica se os status estão ordenados pelo total de pedidos de forma decrescente
@pytest.mark.asyncio
async def test_get_status_pedidos_returns_sorted_by_total(mock_db):
    with patch("app.dashboard.repository.get_status_pedidos", new=AsyncMock(return_value=mock_status_pedidos())):
        result = await service.get_status_pedidos(mock_db)

    totals = [item.total for item in result.items]
    assert totals == sorted(totals, reverse=True)


# Verifica se os percentuais têm no máximo 2 casas decimais
@pytest.mark.asyncio
async def test_get_status_pedidos_percentual_precision(mock_db):
    with patch("app.dashboard.repository.get_status_pedidos", new=AsyncMock(return_value=mock_status_pedidos())):
        result = await service.get_status_pedidos(mock_db)

    for item in result.items:
        assert item.percentual == round(item.percentual, 2)


@pytest.mark.asyncio
async def test_get_matriz_produtos_retorna_schema_correto(mock_db):
    with patch("app.dashboard.repository.get_matriz_produtos", new=AsyncMock(return_value=mock_matriz_produtos())):
        result = await service.get_matriz_produtos(mock_db)

    assert isinstance(result, MatrizProdutosResponse)
    assert len(result.items) == 16
    assert result.mediana_volume > 0


@pytest.mark.asyncio
async def test_get_matriz_produtos_itens_tem_campos_novos(mock_db):
    with patch("app.dashboard.repository.get_matriz_produtos", new=AsyncMock(return_value=mock_matriz_produtos())):
        result = await service.get_matriz_produtos(mock_db)

    item = result.items[0]
    assert hasattr(item, "categoria")
    assert hasattr(item, "quadrante")
    assert hasattr(item, "bloco_anterior")


@pytest.mark.asyncio
async def test_get_matriz_produtos_respeita_limites(mock_db):
    dados_mock = mock_matriz_produtos(limite_estrelas=2, limite_ofensores=1)
    with patch("app.dashboard.repository.get_matriz_produtos", new=AsyncMock(return_value=dados_mock)):
        result = await service.get_matriz_produtos(mock_db)

    quadrantes = [item.quadrante for item in result.items]
    assert quadrantes.count("estrelas") == 2
    assert quadrantes.count("ofensores") == 1


@pytest.mark.asyncio
async def test_get_matriz_estrelas_ordenadas_por_volume(mock_db):
    dados_mock = mock_matriz_produtos()
    with patch("app.dashboard.repository.get_matriz_produtos", new=AsyncMock(return_value=dados_mock)):
        result = await service.get_matriz_produtos(mock_db)

    estrelas = [i for i in result.items if i.quadrante == "estrelas"]
    volumes = [i.volume for i in estrelas]
    assert volumes == sorted(volumes, reverse=True)


@pytest.mark.asyncio
async def test_get_matriz_oportunidades_ordenadas_por_nota(mock_db):
    dados_mock = mock_matriz_produtos()
    with patch("app.dashboard.repository.get_matriz_produtos", new=AsyncMock(return_value=dados_mock)):
        result = await service.get_matriz_produtos(mock_db)

    ops = [i for i in result.items if i.quadrante == "oportunidades"]
    notas = [i.satisfacao for i in ops]
    assert notas == sorted(notas, reverse=True)


@pytest.mark.asyncio
async def test_get_matriz_ofensores_ordenados_por_nota_crescente(mock_db):
    dados_mock = mock_matriz_produtos()
    with patch("app.dashboard.repository.get_matriz_produtos", new=AsyncMock(return_value=dados_mock)):
        result = await service.get_matriz_produtos(mock_db)

    ofensores = [i for i in result.items if i.quadrante == "ofensores"]
    notas = [i.satisfacao for i in ofensores]
    assert notas == sorted(notas)


@pytest.mark.asyncio
async def test_get_matriz_status_sem_neutro(mock_db):
    dados_mock = mock_matriz_produtos()
    with patch("app.dashboard.repository.get_matriz_produtos", new=AsyncMock(return_value=dados_mock)):
        result = await service.get_matriz_produtos(mock_db)

    for item in result.items:
        assert item.status in ("bom", "ruim")
        assert item.status != "neutro"

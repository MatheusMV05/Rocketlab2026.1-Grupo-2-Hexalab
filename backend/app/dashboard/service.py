from sqlalchemy.ext.asyncio import AsyncSession

from app.dashboard import repository
from app.dashboard.schemas import (
    KpiResponse,
    VendasMensalResponse,
    VendasMensalItem,
    TopProdutosResponse,
    TopProdutoItem,
    RegiaoResponse,
    RegiaoItem,
    StatusPedidosResponse,
    StatusPedidoItem,
    TaxaSatisfacaoResponse,
    MatrizProdutosResponse,
    MatrizProdutoItem,
    EntregasResponse,
    EntregaItem,
    ReceitaGraficoItem,
    ReceitaGraficoResponse,
    FiltrosOpcoesResponse,
)


async def get_kpis(
    db: AsyncSession, ano: str = "", mes: str = "", localidade: str = ""
) -> KpiResponse:
    data = await repository.get_kpis(db, ano, mes, localidade)
    return KpiResponse(**data)


_MESES = {"Jan": 1, "Fev": 2, "Mar": 3, "Abr": 4, "Mai": 5, "Jun": 6,
          "Jul": 7, "Ago": 8, "Set": 9, "Out": 10, "Nov": 11, "Dez": 12}


def _mes_ano_para_ordem(mes_ano: str) -> tuple[int, int]:
    mes, ano = mes_ano.split("/")
    return int(ano), _MESES[mes]


async def get_vendas_mensal(db: AsyncSession) -> VendasMensalResponse:
    data = await repository.get_vendas_mensal(db)
    items = sorted(
        [VendasMensalItem(**item) for item in data],
        key=lambda x: _mes_ano_para_ordem(x.mes_ano),
    )
    return VendasMensalResponse(items=items)


async def get_top_produtos(
    db: AsyncSession, ano: str = "", mes: str = "", localidade: str = ""
) -> TopProdutosResponse:
    data = await repository.get_top_produtos(db, ano, mes, localidade)
    items = sorted(
        [TopProdutoItem(**item) for item in data["items"]],
        key=lambda x: x.receita_total,
        reverse=True,
    )
    return TopProdutosResponse(
        items=items,
        variacao_receita=data["variacao_receita"],
        variacao_volume=data["variacao_volume"],
        periodo_ref=data["periodo_ref"],
    )


async def get_por_regiao(db: AsyncSession) -> RegiaoResponse:
    data = await repository.get_por_regiao(db)
    items = sorted(
        [RegiaoItem(**item) for item in data],
        key=lambda x: x.receita_total,
        reverse=True,
    )
    return RegiaoResponse(items=items)


async def get_status_pedidos(
    db: AsyncSession, ano: str = "", mes: str = "", localidade: str = ""
) -> StatusPedidosResponse:
    data = await repository.get_status_pedidos(db, ano, mes, localidade)
    total = sum(item["total"] for item in data["items"])
    items = sorted(
        [
            StatusPedidoItem(
                status=item["status"],
                total=item["total"],
                percentual=round(item["total"] / total * 100, 2) if total > 0 else 0.0,
            )
            for item in data["items"]
        ],
        key=lambda x: x.total,
        reverse=True,
    )
    return StatusPedidosResponse(
        items=items,
        variacao_total=data["variacao_total"],
        periodo_ref=data["periodo_ref"],
    )


async def get_taxa_satisfacao(
    db: AsyncSession, ano: str = "", mes: str = "", localidade: str = ""
) -> TaxaSatisfacaoResponse:
    data = await repository.get_taxa_satisfacao(db, ano, mes, localidade)
    return TaxaSatisfacaoResponse(**data)


async def get_matriz_produtos(
    db: AsyncSession,
    ano: str = "",
    mes: str = "",
    localidade: str = "",
    limite_estrelas: int = 4,
    limite_oportunidades: int = 4,
    limite_alerta_vermelho: int = 4,
    limite_ofensores: int = 4,
    corte_satisfacao: float = 4.0,
    corte_volume: int = 50,
) -> MatrizProdutosResponse:
    data = await repository.get_matriz_produtos(
        db, ano, mes, localidade,
        limite_estrelas, limite_oportunidades, limite_alerta_vermelho, limite_ofensores,
        corte_satisfacao, corte_volume,
    )
    items = [MatrizProdutoItem(**item) for item in data["items"]]
    return MatrizProdutosResponse(items=items, volume_total=data["volume_total"])


async def get_receita_grafico(
    db: AsyncSession, ano: str = "", mes: str = "", localidade: str = ""
) -> ReceitaGraficoResponse:
    data = await repository.get_receita_grafico(db, ano, mes, localidade)
    items = [ReceitaGraficoItem(**item) for item in data["items"]]
    return ReceitaGraficoResponse(items=items, modo=data["modo"])


async def get_entregas_todas(
    db: AsyncSession,
    status: list[str] | None = None,
    ano: str = "",
    mes: str = "",
    ordem: str = "desc",
    busca: str = "",
) -> list[dict]:
    return await repository.get_entregas_todas(db, status, ano, mes, ordem, busca)


async def get_entregas(
    db: AsyncSession,
    pagina: int = 1,
    por_pagina: int = 7,
    status: list[str] | None = None,
    ano: str = "",
    mes: str = "",
    ordem: str = "desc",
    busca: str = "",
) -> EntregasResponse:
    data = await repository.get_entregas(db, pagina, por_pagina, status, ano, mes, ordem, busca)
    items = [EntregaItem(**item) for item in data["items"]]
    return EntregasResponse(
        items=items,
        total=data["total"],
        pagina=data["pagina"],
        por_pagina=data["por_pagina"],
        total_paginas=data["total_paginas"],
    )


async def get_filtros_opcoes(db: AsyncSession) -> FiltrosOpcoesResponse:
    data = await repository.get_filtros_opcoes(db)
    return FiltrosOpcoesResponse(**data)


async def atualizar_entrega(db: AsyncSession, id_entrega: str, dados: dict) -> EntregaItem:
    campos = {k: v for k, v in dados.items() if v is not None}
    result = await repository.atualizar_entrega(db, id_entrega, campos)
    if result is None:
        raise ValueError(f"Entrega {id_entrega} não encontrada")
    return EntregaItem(**result)

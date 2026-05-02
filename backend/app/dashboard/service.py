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
)


async def get_kpis(db: AsyncSession) -> KpiResponse:
    data = await repository.get_kpis(db)
    return KpiResponse(**data)


async def get_vendas_mensal(db: AsyncSession) -> VendasMensalResponse:
    data = await repository.get_vendas_mensal(db)
    return VendasMensalResponse(
        items=[VendasMensalItem(**item) for item in data]
    )


async def get_top_produtos(db: AsyncSession) -> TopProdutosResponse:
    data = await repository.get_top_produtos(db)
    items = sorted(
        [TopProdutoItem(**item) for item in data],
        key=lambda x: x.receita_total,
        reverse=True,
    )
    return TopProdutosResponse(items=items)


async def get_por_regiao(db: AsyncSession) -> RegiaoResponse:
    data = await repository.get_por_regiao(db)
    items = sorted(
        [RegiaoItem(**item) for item in data],
        key=lambda x: x.receita_total,
        reverse=True,
    )
    return RegiaoResponse(items=items)


async def get_status_pedidos(db: AsyncSession) -> StatusPedidosResponse:
    data = await repository.get_status_pedidos(db)
    total = sum(item["total"] for item in data)
    items = sorted(
        [
            StatusPedidoItem(
                status=item["status"],
                total=item["total"],
                percentual=round(item["total"] / total * 100, 2) if total > 0 else 0.0,
            )
            for item in data
        ],
        key=lambda x: x.total,
        reverse=True,
    )
    return StatusPedidosResponse(items=items)

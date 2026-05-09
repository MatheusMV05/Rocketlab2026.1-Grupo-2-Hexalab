from sqlalchemy.ext.asyncio import AsyncSession

from app.dashboard.models import (
    mock_kpis,
    mock_vendas_mensal,
    mock_top_produtos,
    mock_por_regiao,
    mock_status_pedidos,
    mock_taxa_satisfacao,
    mock_matriz_produtos,
    mock_entregas,
)


# TODO: substituir pela query real —> depende do módulo pedidos e clientes
async def get_kpis(db: AsyncSession) -> dict:
    return mock_kpis()


# TODO: substituir pela query real —> depende do módulo pedidos
async def get_vendas_mensal(db: AsyncSession) -> list[dict]:
    return mock_vendas_mensal()


# TODO: substituir pela query real —> depende do módulo produtos e pedidos
async def get_top_produtos(db: AsyncSession) -> list[dict]:
    return mock_top_produtos()


# TODO: substituir pela query real —> depende do módulo pedidos e clientes
async def get_por_regiao(db: AsyncSession) -> list[dict]:
    return mock_por_regiao()


# TODO: substituir pela query real —> depende do módulo pedidos
async def get_status_pedidos(db: AsyncSession) -> list[dict]:
    return mock_status_pedidos()


# TODO: substituir pela query real —> depende do módulo avaliações/NPS
async def get_taxa_satisfacao(db: AsyncSession) -> dict:
    return mock_taxa_satisfacao()


# TODO: substituir pela query real —> depende dos módulos produtos e avaliações
async def get_matriz_produtos(db: AsyncSession) -> list[dict]:
    return mock_matriz_produtos()


# TODO: substituir pela query real —> depende do módulo pedidos/logística
async def get_entregas(db: AsyncSession, pagina: int = 1, por_pagina: int = 7) -> dict:
    return mock_entregas(pagina, por_pagina)

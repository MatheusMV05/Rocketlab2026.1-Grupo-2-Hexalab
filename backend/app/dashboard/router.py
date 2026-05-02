from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.dashboard import service
from app.dashboard.schemas import (
    KpiResponse,
    VendasMensalResponse,
    TopProdutosResponse,
    RegiaoResponse,
    StatusPedidosResponse,
)

router = APIRouter()


@router.get("/kpis", response_model=KpiResponse)
# KPIs gerais: receita total, total de pedidos, ticket médio e total de clientes
async def get_kpis(db: AsyncSession = Depends(get_db)):
    try:
        return await service.get_kpis(db)
    except Exception:
        raise HTTPException(status_code=500, detail="Erro ao buscar KPIs.")


@router.get("/vendas-mensal", response_model=VendasMensalResponse)
# Evolução mensal de receita e pedidos dos últimos 12 meses, do mais antigo ao mais recente
async def get_vendas_mensal(db: AsyncSession = Depends(get_db)):
    try:
        return await service.get_vendas_mensal(db)
    except Exception:
        raise HTTPException(status_code=500, detail="Erro ao buscar vendas mensais.")


@router.get("/top-produtos", response_model=TopProdutosResponse)
# Top 10 produtos por receita, ordenados de forma decrescente
async def get_top_produtos(db: AsyncSession = Depends(get_db)):
    try:
        return await service.get_top_produtos(db)
    except Exception:
        raise HTTPException(status_code=500, detail="Erro ao buscar top produtos.")


@router.get("/por-regiao", response_model=RegiaoResponse)
# Receita e volume de pedidos por estado, ordenados por receita decrescente
async def get_por_regiao(db: AsyncSession = Depends(get_db)):
    try:
        return await service.get_por_regiao(db)
    except Exception:
        raise HTTPException(status_code=500, detail="Erro ao buscar dados por região.")


@router.get("/status-pedidos", response_model=StatusPedidosResponse)
# Distribuição dos pedidos por status com total e percentual calculado
async def get_status_pedidos(db: AsyncSession = Depends(get_db)):
    try:
        return await service.get_status_pedidos(db)
    except Exception:
        raise HTTPException(status_code=500, detail="Erro ao buscar status dos pedidos.")

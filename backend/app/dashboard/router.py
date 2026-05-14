from typing import List

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.dashboard import service
from app.dashboard.schemas import (
    KpiResponse,
    VendasMensalResponse,
    TopProdutosResponse,
    RegiaoResponse,
    StatusPedidosResponse,
    TaxaSatisfacaoResponse,
    MatrizProdutosResponse,
    EntregasResponse,
    EntregaItem,
    ReceitaGraficoResponse,
    AtualizarEntregaRequest,
    FiltrosOpcoesResponse,
)

router = APIRouter()


@router.get("/filtros-opcoes", response_model=FiltrosOpcoesResponse)
async def get_filtros_opcoes(db: AsyncSession = Depends(get_db)):
    try:
        return await service.get_filtros_opcoes(db)
    except Exception:
        raise HTTPException(status_code=500, detail="Erro ao buscar opções de filtro.")


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


@router.get("/taxa-satisfacao", response_model=TaxaSatisfacaoResponse)
# Taxa de satisfação atual, meta e total de avaliações
async def get_taxa_satisfacao(db: AsyncSession = Depends(get_db)):
    try:
        return await service.get_taxa_satisfacao(db)
    except Exception:
        raise HTTPException(status_code=500, detail="Erro ao buscar taxa de satisfação.")


@router.get("/matriz-produtos", response_model=MatrizProdutosResponse)
# Seleção por cotas: retorna os N melhores de cada quadrante conforme critérios de ordenação
async def get_matriz_produtos(
    ano: str = "",
    mes: str = "",
    localidade: str = "",
    limite_estrelas: int = 4,
    limite_oportunidades: int = 4,
    limite_alerta_vermelho: int = 4,
    limite_ofensores: int = 4,
    db: AsyncSession = Depends(get_db),
):
    try:
        return await service.get_matriz_produtos(
            db, ano, mes, localidade,
            limite_estrelas, limite_oportunidades, limite_alerta_vermelho, limite_ofensores,
        )
    except Exception:
        raise HTTPException(status_code=500, detail="Erro ao buscar matriz de produtos.")


@router.get("/receita-grafico", response_model=ReceitaGraficoResponse)
# Dados do gráfico de receita com granularidade dinâmica: semanal, comparativo entre anos, ou mensal
async def get_receita_grafico(
    ano: str = "",
    mes: str = "",
    localidade: str = "",
    db: AsyncSession = Depends(get_db),
):
    try:
        return await service.get_receita_grafico(db, ano, mes, localidade)
    except Exception:
        raise HTTPException(status_code=500, detail="Erro ao buscar dados do gráfico de receita.")


@router.get("/entregas", response_model=EntregasResponse)
async def get_entregas(
    pagina: int = 1,
    por_pagina: int = 7,
    status: List[str] = Query(default=[]),
    ano: str = "",
    mes: str = "",
    db: AsyncSession = Depends(get_db),
):
    try:
        return await service.get_entregas(db, pagina, por_pagina, status or None, ano, mes)
    except Exception:
        raise HTTPException(status_code=500, detail="Erro ao buscar entregas.")


@router.put("/entregas/{id_entrega}", response_model=EntregaItem)
async def atualizar_entrega(
    id_entrega: str,
    dados: AtualizarEntregaRequest,
    db: AsyncSession = Depends(get_db),
):
    try:
        return await service.atualizar_entrega(db, id_entrega, dados.model_dump())
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception:
        raise HTTPException(status_code=500, detail="Erro ao atualizar entrega.")

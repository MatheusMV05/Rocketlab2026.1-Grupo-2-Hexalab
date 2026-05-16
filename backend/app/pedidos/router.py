from typing import Optional
from sqlalchemy.ext.asyncio import AsyncSession
from fastapi import APIRouter, HTTPException, Query, Depends
from app.database import get_db
from datetime import datetime, date
from app.pedidos.schemas import (
    ListaPedidoPaginada, PedidoItem, KpisPedidos, AnaliseFluxo, 
    PedidoCreate, PedidoUpdate, PedidoDetalhe
)
from app.pedidos.service import PedidoService

router = APIRouter(prefix="/pedidos", tags=["Pedidos"])

def parse_date_br(date_str: Optional[str]) -> Optional[date]:
    if not date_str:
        return None
    try:
        return datetime.strptime(date_str, "%d-%m-%Y").date()
    except ValueError:
        raise HTTPException(status_code=422, detail="Data inválida. Use o formato DD-MM-YYYY.")

@router.get("/", response_model=ListaPedidoPaginada, summary="Listagem e Busca de Pedidos")
async def listar_pedidos(
    query: Optional[str] = Query(None, description="Busca por nome de cliente ou produto"),
    status: Optional[str] = Query(None, description="Filtro por status (ex: Aprovado, Pendente, Cancelado)"),
    categoria: Optional[str] = Query(None, description="Filtro por categoria de produto"),
    data_inicio: Optional[str] = Query(None, description="Data inicial do período (DD-MM-YYYY)"),
    data_fim: Optional[str] = Query(None, description="Data final do período (DD-MM-YYYY)"),
    ano: Optional[int] = Query(None, description="Filtrar por ano"),
    mes: Optional[int] = Query(None, description="Filtrar por mês (1-12)"),
    pagina: int = Query(1, ge=1, description="Número da página"),
    tamanho: int = Query(20, ge=1, le=100, description="Tamanho da página"),
    db: AsyncSession = Depends(get_db)
):
    """
    Lista pedidos com paginação e filtros (status, categoria, data de início e fim).
    Feature 3.1 — Listagem e Filtros de Pedidos (US-08)
    """
    dt_inicio = parse_date_br(data_inicio)
    dt_fim = parse_date_br(data_fim)
    
    return await PedidoService.listar_pedidos(
        db=db,
        query=query,
        status=status,
        categoria=categoria,
        data_inicio=dt_inicio,
        data_fim=dt_fim,
        ano=ano,
        mes=mes,
        pagina=pagina,
        tamanho=tamanho
    )

@router.get("/kpis", response_model=KpisPedidos, summary="KPIs Gerais de Pedidos")
async def obter_kpis_pedidos(db: AsyncSession = Depends(get_db)):
    """
    Retorna contagens de pedidos agrupadas por status (processando, aprovados, recusados, reembolsados).
    """
    return await PedidoService.obter_kpis(db)

@router.get("/analise-fluxo", response_model=AnaliseFluxo, summary="Análise de Fluxo de Pedidos")
async def obter_analise_fluxo(db: AsyncSession = Depends(get_db)):
    """
    Retorna a análise de fluxo por categoria de produto com dados reais do banco.
    """
    return await PedidoService.obter_analise_fluxo(db)

@router.get("/{pedido_id}", response_model=PedidoDetalhe, summary="Detalhes do Pedido")
async def obter_pedido(pedido_id: str, db: AsyncSession = Depends(get_db)):
    """
    Obtém os detalhes completos de um pedido específico.
    """
    pedido = await PedidoService.obter_pedido_por_id(db=db, pedido_id=pedido_id)
    if not pedido:
        raise HTTPException(status_code=404, detail="Pedido não encontrado")
    return pedido

@router.post("/", response_model=PedidoDetalhe, summary="Criar Novo Pedido", status_code=201)
async def criar_pedido(pedido_in: PedidoCreate, db: AsyncSession = Depends(get_db)):
    """
    Cria um novo registro de pedido no banco de dados.
    """
    return await PedidoService.criar_pedido(db=db, pedido_in=pedido_in)

@router.patch("/{pedido_id}", response_model=PedidoDetalhe, summary="Atualizar Pedido")
async def atualizar_pedido(pedido_id: str, update_in: PedidoUpdate, db: AsyncSession = Depends(get_db)):
    """
    Atualiza parcialmente os dados de um pedido existente.
    """
    pedido = await PedidoService.atualizar_pedido(db=db, pedido_id=pedido_id, update_in=update_in)
    if not pedido:
        raise HTTPException(status_code=404, detail="Pedido não encontrado")
    return pedido

@router.delete("/{pedido_id}", summary="Deletar Pedido", status_code=204)
async def deletar_pedido(pedido_id: str, db: AsyncSession = Depends(get_db)):
    """
    Remove permanentemente um pedido do banco de dados.
    """
    sucesso = await PedidoService.deletar_pedido(db=db, pedido_id=pedido_id)
    if not sucesso:
        raise HTTPException(status_code=404, detail="Pedido não encontrado")
    return None

from typing import Optional
from sqlalchemy.ext.asyncio import AsyncSession
from fastapi import APIRouter, HTTPException, Query, Depends
from app.database import get_db
from datetime import datetime, date
from app.pedidos.schemas import ListaPedidoPaginada, PedidoItem
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

@router.get("/{pedido_id}", response_model=PedidoItem, summary="Detalhes do Pedido")
async def obter_pedido(pedido_id: str, db: AsyncSession = Depends(get_db)):
    """
    Obtém os detalhes completos de um pedido específico.
    """
    pedido = await PedidoService.obter_pedido_por_id(db=db, pedido_id=pedido_id)
    if not pedido:
        raise HTTPException(status_code=404, detail="Pedido não encontrado")
    return pedido

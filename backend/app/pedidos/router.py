from fastapi import APIRouter, HTTPException, Query
from typing import Optional
from datetime import date
from app.pedidos.schemas import ListaPedidoPaginada, PedidoDetalhe
from app.pedidos.service import PedidoService

router = APIRouter(prefix="/pedidos", tags=["Pedidos"])

@router.get("/", response_model=ListaPedidoPaginada, summary="Listagem e Busca de Pedidos")
async def listar_pedidos(
    search: Optional[str] = Query(None, description="Busca livre por nome do cliente ou produto"),
    status: Optional[str] = Query(None, description="Filtro por status (ex: Aprovado, Pendente, Cancelado)"),
    categoria: Optional[str] = Query(None, description="Filtro por categoria de produto"),
    data_inicio: Optional[date] = Query(None, description="Data inicial do período (YYYY-MM-DD)"),
    data_fim: Optional[date] = Query(None, description="Data final do período (YYYY-MM-DD)"),
    pagina: int = Query(1, ge=1, description="Número da página"),
    tamanho: int = Query(10, ge=1, le=100, description="Tamanho da página")
):
    """
    Lista pedidos com paginação e filtros (busca livre, status, categoria, data de início e fim).
    Feature 3.1 — Listagem e Filtros de Pedidos (US-08)
    """
    return await PedidoService.listar_pedidos(
        search=search,
        status=status,
        categoria=categoria,
        data_inicio=data_inicio,
        data_fim=data_fim,
        pagina=pagina,
        tamanho=tamanho
    )

@router.get("/{pedido_id}", response_model=PedidoDetalhe, summary="Detalhes do Pedido")
async def obter_pedido(pedido_id: int):
    """
    Obtém os detalhes completos de um pedido específico.
    """
    pedido = await PedidoService.obter_pedido_por_id(pedido_id)
    if not pedido:
        raise HTTPException(status_code=404, detail="Pedido não encontrado")
    return pedido

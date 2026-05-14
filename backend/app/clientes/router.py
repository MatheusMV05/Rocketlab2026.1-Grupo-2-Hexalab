from fastapi import APIRouter, HTTPException, Query
from typing import List, Optional
from app.clientes.schemas import ListaClientePaginada, ClientePerfil, PedidoAba, AvaliacaoAba, TicketAba
from app.clientes.service import ClienteService

router = APIRouter(prefix="/clientes", tags=["Clientes"])

@router.get("/", response_model=ListaClientePaginada, summary="Listagem e Busca de Clientes")
async def listar_clientes(
    query: Optional[str] = Query(None, description="Busca por nome ou e-mail"),
    estado: Optional[str] = Query(None, description="Filtro por estado"),
    pagina: int = Query(1, ge=1, description="Número da página"),
    tamanho: int = Query(20, ge=1, le=100, description="Tamanho da página")
):
    """
    Lista clientes com paginação, busca por nome/email e filtro por estado.
    Feature 2.1 — Listagem e Busca de Clientes
    """
    return await ClienteService.listar_clientes(query=query, estado=estado, pagina=pagina, tamanho=tamanho)


@router.get("/{cliente_id}", response_model=ClientePerfil, summary="Perfil 360 do Cliente")
async def obter_perfil_cliente(cliente_id: int):
    """
    Obtém o perfil completo de um cliente.
    Feature 2.2 — Perfil 360 do Cliente
    """
    cliente = await ClienteService.obter_perfil_cliente(cliente_id)
    if not cliente:
        raise HTTPException(status_code=404, detail="Cliente nao encontrado.")
    return cliente


@router.get("/{cliente_id}/pedidos", response_model=List[PedidoAba], summary="Histórico de Pedidos")
async def obter_pedidos_cliente(cliente_id: int):
    """
    Obtém o histórico de pedidos de um cliente.
    US-07 — Aba Pedidos
    """
    await _validar_cliente_existe(cliente_id)
    return await ClienteService.obter_pedidos_cliente(cliente_id)


@router.get("/{cliente_id}/avaliacoes", response_model=List[AvaliacaoAba], summary="Avaliações do Cliente")
async def obter_avaliacoes_cliente(cliente_id: int):
    """
    Obtém as avaliações realizadas por um cliente.
    US-07 — Aba Avaliações
    """
    await _validar_cliente_existe(cliente_id)
    return await ClienteService.obter_avaliacoes_cliente(cliente_id)


@router.get("/{cliente_id}/tickets", response_model=List[TicketAba], summary="Tickets de Suporte")
async def obter_tickets_cliente(cliente_id: int):
    """
    Obtém os tickets de suporte abertos por um cliente.
    US-07 — Aba Tickets
    """
    await _validar_cliente_existe(cliente_id)
    return await ClienteService.obter_tickets_cliente(cliente_id)


async def _validar_cliente_existe(cliente_id: int):
    cliente = await ClienteService.obter_perfil_cliente(cliente_id)
    if not cliente:
        raise HTTPException(status_code=404, detail="Cliente nao encontrado.")

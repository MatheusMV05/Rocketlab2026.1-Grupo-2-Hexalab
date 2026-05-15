from fastapi import APIRouter, HTTPException, Query, Depends
from typing import List, Optional
from sqlalchemy.ext.asyncio import AsyncSession
from app.database import get_db
from app.clientes.schemas import (
    ListaClientePaginada, ClientePerfil, PedidoAba, 
    AvaliacaoAba, TicketAba, KpisClientes,
    ClienteCreate, ClienteUpdate
)
from app.clientes.service import ClienteService

router = APIRouter(prefix="/clientes", tags=["Clientes"])

@router.post("/", response_model=ClientePerfil, status_code=201, summary="Criar Novo Cliente")
async def criar_cliente(dados: ClienteCreate, db: AsyncSession = Depends(get_db)):
    """
    Cria um novo cliente no banco de dados.
    """
    return await ClienteService.criar_cliente(db, dados)

@router.patch("/{cliente_id}", response_model=ClientePerfil, summary="Atualizar Cliente")
async def atualizar_cliente(cliente_id: str, dados: ClienteUpdate, db: AsyncSession = Depends(get_db)):
    """
    Atualiza os dados de um cliente existente.
    """
    cliente = await ClienteService.atualizar_cliente(db, cliente_id, dados)
    if not cliente:
        raise HTTPException(status_code=404, detail="Cliente não encontrado")
    return cliente

@router.delete("/{cliente_id}", summary="Deletar Cliente")
async def deletar_cliente(cliente_id: str, db: AsyncSession = Depends(get_db)):
    """
    Remove um cliente do banco de dados.
    """
    sucesso = await ClienteService.deletar_cliente(db, cliente_id)
    if not sucesso:
        raise HTTPException(status_code=404, detail="Cliente não encontrado")
    return {"message": "Cliente deletado com sucesso"}

@router.get("/", response_model=ListaClientePaginada, summary="Listagem e Busca de Clientes")
async def listar_clientes(
    query: Optional[str] = Query(None, description="Busca por nome ou e-mail"),
    estado: Optional[str] = Query(None, description="Filtro por estado"),
    pagina: int = Query(1, ge=1, description="Número da página"),
    tamanho: int = Query(20, ge=1, le=100, description="Tamanho da página"),
    db: AsyncSession = Depends(get_db)
):
    """
    Lista clientes com paginação, busca por nome/email e filtro por estado.
    Conectado ao banco de dados real.
    """
    return await ClienteService.listar_clientes(
        db, query=query, estado=estado, pagina=pagina, tamanho=tamanho
    )

@router.get("/kpis", response_model=KpisClientes, summary="KPIs Gerais de Clientes")
async def obter_kpis_clientes(db: AsyncSession = Depends(get_db)):
    """
    Retorna os indicadores agregados da base de clientes.
    """
    return await ClienteService.obter_kpis_clientes(db)

@router.get("/localizacoes", response_model=List[str], summary="Sugestões de Localização")
async def obter_sugestoes_localizacao(
    q: str = Query(..., min_length=2),
    db: AsyncSession = Depends(get_db)
):
    """
    Retorna uma lista de cidades/estados únicos baseados no termo de busca.
    """
    return await ClienteService.obter_sugestoes_localizacao(db, q)

@router.get("/{cliente_id}", response_model=ClientePerfil, summary="Perfil 360 do Cliente")
async def obter_perfil_cliente(cliente_id: str, db: AsyncSession = Depends(get_db)):
    """
    Obtém o perfil completo de um cliente do banco real.
    """
    cliente = await ClienteService.obter_perfil_cliente(db, cliente_id)
    if not cliente:
        raise HTTPException(status_code=404, detail="Cliente nao encontrado.")
    return cliente

@router.get("/{cliente_id}/pedidos", response_model=List[PedidoAba], summary="Histórico de Pedidos")
async def obter_pedidos_cliente(cliente_id: str, db: AsyncSession = Depends(get_db)):
    """
    Obtém o histórico de pedidos de um cliente.
    """
    return await ClienteService.obter_pedidos_cliente(db, cliente_id)

@router.get("/{cliente_id}/avaliacoes", response_model=List[AvaliacaoAba], summary="Avaliações do Cliente")
async def obter_avaliacoes_cliente(cliente_id: str, db: AsyncSession = Depends(get_db)):
    """
    Obtém as avaliações realizadas por um cliente.
    """
    return await ClienteService.obter_avaliacoes_cliente(db, cliente_id)

@router.get("/{cliente_id}/tickets", response_model=List[TicketAba], summary="Tickets de Suporte")
async def obter_tickets_cliente(cliente_id: str, db: AsyncSession = Depends(get_db)):
    """
    Obtém os tickets de suporte abertos por um cliente.
    """
    return await ClienteService.obter_tickets_cliente(db, cliente_id)

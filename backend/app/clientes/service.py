from typing import List, Optional
from app.clientes.schemas import ClienteList, ClientePerfil, PaginatedClienteList, PedidoAba, AvaliacaoAba, TicketAba
from app.clientes.repository import ClienteRepository

class ClienteService:
    @staticmethod
    async def listar_clientes(query: Optional[str] = None, estado: Optional[str] = None, page: int = 1, size: int = 10) -> PaginatedClienteList:
        resultados = await ClienteRepository.listar_clientes(query=query, estado=estado)
        
        total = len(resultados)
        start = (page - 1) * size
        end = start + size
        paginated = resultados[start:end]
        
        items = [ClienteList(**c) for c in paginated]
        pages = (total + size - 1) // size if size > 0 else 0
        
        return PaginatedClienteList(
            items=items,
            total=total,
            page=page,
            size=size,
            pages=pages
        )

    @staticmethod
    async def obter_perfil_cliente(cliente_id: int) -> Optional[ClientePerfil]:
        cliente = await ClienteRepository.obter_cliente_por_id(cliente_id)
        if cliente:
            return ClientePerfil(**cliente)
        return None

    @staticmethod
    async def obter_pedidos_cliente(cliente_id: int) -> List[PedidoAba]:
        pedidos = await ClienteRepository.obter_pedidos_cliente(cliente_id)
        return [PedidoAba(**p) for p in pedidos]

    @staticmethod
    async def obter_avaliacoes_cliente(cliente_id: int) -> List[AvaliacaoAba]:
        avaliacoes = await ClienteRepository.obter_avaliacoes_cliente(cliente_id)
        return [AvaliacaoAba(**a) for a in avaliacoes]

    @staticmethod
    async def obter_tickets_cliente(cliente_id: int) -> List[TicketAba]:
        tickets = await ClienteRepository.obter_tickets_cliente(cliente_id)
        return [TicketAba(**t) for t in tickets]

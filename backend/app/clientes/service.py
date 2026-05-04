from typing import List, Optional
from app.clientes.schemas import ClienteResumo, ClientePerfil, ListaClientePaginada, PedidoAba, AvaliacaoAba, TicketAba
from app.clientes.repository import ClienteRepository

class ClienteService:
    @staticmethod
    async def listar_clientes(query: Optional[str] = None, estado: Optional[str] = None, pagina: int = 1, tamanho: int = 10) -> ListaClientePaginada:
        resultados = await ClienteRepository.listar_clientes(query=query, estado=estado)
        
        total = len(resultados)
        inicio = (pagina - 1) * tamanho
        fim = inicio + tamanho
        paginado = resultados[inicio:fim]
        
        itens = [ClienteResumo(**c) for c in paginado]
        paginas = (total + tamanho - 1) // tamanho if tamanho > 0 else 0
        
        return ListaClientePaginada(
            itens=itens,
            total=total,
            pagina=pagina,
            tamanho=tamanho,
            paginas=paginas
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

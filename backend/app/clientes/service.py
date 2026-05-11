from typing import List, Optional
from app.clientes.schemas import ClienteListagem, ClientePerfil, ListaClientePaginada, PedidoAba, AvaliacaoAba, TicketAba
from app.clientes.repository import ClienteRepository

class ClienteService:
    @staticmethod
    async def listar_clientes(query: Optional[str] = None, estado: Optional[str] = None, pagina: int = 1, tamanho: int = 20) -> ListaClientePaginada:
        resultados = await ClienteRepository.listar_clientes(query=query, estado=estado)
        
        total = len(resultados)
        inicio = (pagina - 1) * tamanho
        fim = inicio + tamanho
        paginado = resultados[inicio:fim]
        
        itens = [ClienteListagem(**c) for c in paginado]
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
            # Formatar datas para string brasileiro
            c_dict = cliente.copy()
            c_dict["data_cadastro"] = cliente["data_cadastro"].strftime("%d-%m-%Y")
            if cliente.get("ultimo_pedido"):
                c_dict["ultimo_pedido"] = cliente["ultimo_pedido"].strftime("%d-%m-%Y")
            else:
                c_dict["ultimo_pedido"] = None
            return ClientePerfil(**c_dict)
        return None

    @staticmethod
    async def obter_pedidos_cliente(cliente_id: int) -> List[PedidoAba]:
        pedidos = await ClienteRepository.obter_pedidos_cliente(cliente_id)
        # Ordenar por data decrescente conforme US-07
        pedidos.sort(key=lambda x: x["data"], reverse=True)
        return [
            PedidoAba(
                id=p["id"],
                nome_produto=p["nome_produto"],
                categoria=p["categoria"],
                valor=p["valor"],
                data=p["data"].strftime("%d-%m-%Y"),
                status=p["status"]
            ) for p in pedidos
        ]

    @staticmethod
    async def obter_avaliacoes_cliente(cliente_id: int) -> List[AvaliacaoAba]:
        avaliacoes = await ClienteRepository.obter_avaliacoes_cliente(cliente_id)
        return [AvaliacaoAba(**a) for a in avaliacoes]

    @staticmethod
    async def obter_tickets_cliente(cliente_id: int) -> List[TicketAba]:
        tickets = await ClienteRepository.obter_tickets_cliente(cliente_id)
        return [
            TicketAba(
                id=t["id"],
                tipo_problema=t["tipo_problema"],
                data_abertura=t["data_abertura"].strftime("%d-%m-%Y"),
                tempo_resolucao_horas=t.get("tempo_resolucao_horas"),
                nota_avaliacao=t.get("nota_avaliacao")
            ) for t in tickets
        ]

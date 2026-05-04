from typing import Optional
from datetime import date
from app.pedidos.schemas import ListaPedidoPaginada, PedidoDetalhe
from app.pedidos.repository import PedidoRepository

class PedidoService:
    @staticmethod
    async def listar_pedidos(
        status: Optional[str] = None,
        data_inicio: Optional[date] = None,
        data_fim: Optional[date] = None,
        categoria: Optional[str] = None,
        pagina: int = 1,
        tamanho: int = 10
    ) -> ListaPedidoPaginada:
        resultados = await PedidoRepository.listar_pedidos(
            status=status,
            data_inicio=data_inicio,
            data_fim=data_fim,
            categoria=categoria
        )
        
        total = len(resultados)
        inicio = (pagina - 1) * tamanho
        fim = inicio + tamanho
        paginado = resultados[inicio:fim]
        
        itens = [PedidoDetalhe(**p) for p in paginado]
        paginas = (total + tamanho - 1) // tamanho if tamanho > 0 else 0
        
        return ListaPedidoPaginada(
            itens=itens,
            total=total,
            pagina=pagina,
            tamanho=tamanho,
            paginas=paginas
        )

    @staticmethod
    async def obter_pedido_por_id(pedido_id: int) -> Optional[PedidoDetalhe]:
        pedido = await PedidoRepository.obter_pedido_por_id(pedido_id)
        if pedido:
            return PedidoDetalhe(**pedido)
        return None

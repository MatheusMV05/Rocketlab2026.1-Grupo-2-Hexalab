from typing import Optional
from datetime import date
from fastapi import HTTPException
from app.pedidos.schemas import ListaPedidoPaginada, PedidoItem
from app.pedidos.repository import PedidoRepository

class PedidoService:
    @staticmethod
    def _map_to_pedido_item(p: dict) -> PedidoItem:
        return PedidoItem(
            id=p["id_pedido"],
            nome_cliente=p["nome_cliente"],
            nome_produto=p["nome_produto"],
            categoria=p["categoria"],
            valor=p["valor_pedido"],
            quantidade=p["quantidade"],
            data=p["data_pedido"].strftime("%d-%m-%Y"),
            metodo_pagamento=p["metodo_pagamento"],
            status=p["status"]
        )

    @staticmethod
    async def listar_pedidos(
        status: Optional[str] = None,
        data_inicio: Optional[date] = None,
        data_fim: Optional[date] = None,
        categoria: Optional[str] = None,
        pagina: int = 1,
        tamanho: int = 20
    ) -> ListaPedidoPaginada:
        if data_inicio and data_fim and data_fim < data_inicio:
            raise HTTPException(status_code=422, detail="data_fim não pode ser anterior a data_inicio")

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
        
        itens = [PedidoService._map_to_pedido_item(p) for p in paginado]
        paginas = (total + tamanho - 1) // tamanho if tamanho > 0 else 0
        
        return ListaPedidoPaginada(
            itens=itens,
            total=total,
            pagina=pagina,
            tamanho=tamanho,
            paginas=paginas
        )

    @staticmethod
    async def obter_pedido_por_id(pedido_id: int) -> Optional[PedidoItem]:
        pedido = await PedidoRepository.obter_pedido_por_id(pedido_id)
        if pedido:
            return PedidoService._map_to_pedido_item(pedido)
        return None

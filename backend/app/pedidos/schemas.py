from pydantic import BaseModel
from typing import List, Optional
from datetime import date

class PedidoDetalhe(BaseModel):
    id_pedido: int
    id_cliente: int
    nome_cliente: str
    id_produto: int
    nome_produto: str
    categoria: str
    valor_pedido: float
    quantidade: int
    data_pedido: date
    metodo_pagamento: str
    status: str

class ListaPedidoPaginada(BaseModel):
    itens: List[PedidoDetalhe]
    total: int
    pagina: int
    tamanho: int
    paginas: int

from pydantic import BaseModel
from typing import List

class PedidoItem(BaseModel):
    id: str
    cod_pedido: str
    nome_cliente: str
    cod_produto: str
    nome_produto: str
    categoria: str
    valor: float
    quantidade: int
    data: str
    metodo_pagamento: str
    status: str
    risco: str

class ListaPedidoPaginada(BaseModel):
    itens: List[PedidoItem]
    total: int
    pagina: int
    tamanho: int
    paginas: int

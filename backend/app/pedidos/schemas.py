from pydantic import BaseModel
from typing import List

class PedidoItem(BaseModel):
    id: int
    nome_cliente: str
    nome_produto: str
    categoria: str
    valor: float
    quantidade: int
    data: str
    metodo_pagamento: str
    status: str

class ListaPedidoPaginada(BaseModel):
    itens: List[PedidoItem]
    total: int
    pagina: int
    tamanho: int
    paginas: int

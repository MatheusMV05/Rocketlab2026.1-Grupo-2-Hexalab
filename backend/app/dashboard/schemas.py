from pydantic import BaseModel


class KpiResponse(BaseModel):
    receita_total: float
    total_pedidos: int
    ticket_medio: float
    total_clientes: int


class VendasMensalItem(BaseModel):
    mes_ano: str
    receita_total: float
    total_pedidos: int


class VendasMensalResponse(BaseModel):
    items: list[VendasMensalItem]


class TopProdutoItem(BaseModel):
    nome_produto: str
    categoria: str
    receita_total: float


class TopProdutosResponse(BaseModel):
    items: list[TopProdutoItem]


class RegiaoItem(BaseModel):
    estado: str
    receita_total: float
    total_pedidos: int


class RegiaoResponse(BaseModel):
    items: list[RegiaoItem]


class StatusPedidoItem(BaseModel):
    status: str
    total: int
    percentual: float


class StatusPedidosResponse(BaseModel):
    items: list[StatusPedidoItem]

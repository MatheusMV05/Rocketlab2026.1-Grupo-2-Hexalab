from pydantic import BaseModel
from typing import List, Optional

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

class KpisPedidos(BaseModel):
    processando: int
    processando_valor: float
    aprovados: int
    aprovados_valor: float
    recusados: int
    recusados_valor: float
    reembolsados: int
    reembolsados_valor: float
    total: int
    total_valor: float

class EtapaFluxo(BaseModel):
    id: str
    titulo: str
    total_pedidos: int
    status: str
    problemas: List[str]
    gargalos: List[str]

class AnaliseFluxo(BaseModel):
    etapas: List[EtapaFluxo]
    total_pedidos: int

class PedidoCreate(BaseModel):
    id_pedido: str
    id_cliente: str
    id_produto: str
    valor: float
    quantidade: int
    data: str  # Formato DD-MM-YYYY
    metodo_pagamento: str
    status: str

class PedidoUpdate(BaseModel):
    valor: Optional[float] = None
    quantidade: Optional[int] = None
    metodo_pagamento: Optional[str] = None
    status: Optional[str] = None
    data: Optional[str] = None  # Formato DD-MM-YYYY

class ProdutoNoPedido(BaseModel):
    cod_produto: str
    nome_produto: str
    categoria: str
    valor: float
    quantidade: int

class PedidoDetalhe(BaseModel):
    id: str
    cod_pedido: str
    id_cliente: str
    nome_cliente: str
    valor_total: float
    data: str
    metodo_pagamento: str
    status: str
    quantidade_total: int
    produtos: List[ProdutoNoPedido]

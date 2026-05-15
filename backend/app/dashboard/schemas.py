from pydantic import BaseModel


class KpiResponse(BaseModel):
    receita_total: float
    total_pedidos: int
    ticket_medio: float
    total_clientes: int
    variacao_receita: float | None = None
    variacao_pedidos: float | None = None
    variacao_ticket: float | None = None
    variacao_clientes: float | None = None
    periodo_ref: str = ""


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
    total_unidades: int


class TopProdutosResponse(BaseModel):
    items: list[TopProdutoItem]
    variacao_receita: float | None = None
    variacao_volume: float | None = None
    periodo_ref: str = ""


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
    variacao_total: float | None = None
    periodo_ref: str = ""


class TaxaSatisfacaoResponse(BaseModel):
    valor: float
    total_avaliacoes: int
    variacao: float | None = None
    periodo_ref: str = ""


class MatrizProdutoItem(BaseModel):
    nome: str
    categoria: str
    volume_produto: int
    volume_total: int
    participacao_percentual: float   # % real sobre total de produtos avaliados (0-100)
    participacao_rank: float         # percentil de volume entre os produtos exibidos (0-100)
    satisfacao: float
    qtd_avaliacoes: int
    status: str        # "bom" | "ruim"
    quadrante: str     # "estrelas" | "oportunidades" | "alerta_vermelho" | "ofensores"
    bloco_anterior: str


class MatrizProdutosResponse(BaseModel):
    items: list[MatrizProdutoItem]
    volume_total: int


class ReceitaGraficoItem(BaseModel):
    label: str
    receita: float
    meta: float


class ReceitaGraficoResponse(BaseModel):
    items: list[ReceitaGraficoItem]
    modo: str  # "semanal" | "comparativo" | "mensal"


class EntregaItem(BaseModel):
    id: str
    cliente: str
    status: str
    prazo: str


class EntregasResponse(BaseModel):
    items: list[EntregaItem]
    total: int
    pagina: int
    por_pagina: int
    total_paginas: int


class FiltrosOpcoesResponse(BaseModel):
    anos: list[str]
    estados: list[str]


class AtualizarEntregaRequest(BaseModel):
    cliente: str | None = None
    status: str | None = None
    prazo: str | None = None

from pydantic import BaseModel
from typing import List, Optional
from datetime import date

class ClienteList(BaseModel):
    id: int
    nome_completo: str
    email: str
    cidade: str
    estado: str
    total_gasto: float
    total_pedidos: int
    segmento_rfm: str

class PaginatedClienteList(BaseModel):
    items: List[ClienteList]
    total: int
    page: int
    size: int
    pages: int

class ClientePerfil(BaseModel):
    id: int
    nome_completo: str
    email: str
    cidade: str
    estado: str
    genero: str
    idade: int
    data_cadastro: date
    origem: str
    total_gasto: float
    total_pedidos: int
    ticket_medio: float
    ultimo_pedido: Optional[date]
    nps_medio: float
    tickets_abertos: int
    segmento_rfm: str

class PedidoAba(BaseModel):
    id: int
    nome_produto: str
    categoria: str
    valor: float
    data: date
    status: str

class AvaliacaoAba(BaseModel):
    id_pedido: int
    nota_produto: int
    nps: int
    comentario: Optional[str]

class TicketAba(BaseModel):
    id: int
    tipo_problema: str
    data_abertura: date
    tempo_resolucao: Optional[str]
    nota_avaliacao: Optional[int]

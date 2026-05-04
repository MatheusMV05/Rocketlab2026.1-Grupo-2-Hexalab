from pydantic import BaseModel
from typing import List, Optional

class ClienteListagem(BaseModel):
    id: int
    nome_completo: str
    email: str
    cidade: str
    estado: str
    total_gasto: float
    total_pedidos: int
    segmento_rfm: str

class ListaClientePaginada(BaseModel):
    itens: List[ClienteListagem]
    total: int
    pagina: int
    tamanho: int
    paginas: int

class ClientePerfil(BaseModel):
    id: int
    nome_completo: str
    email: str
    cidade: str
    estado: str
    genero: str
    idade: int
    data_cadastro: str
    origem: str
    total_gasto: float
    total_pedidos: int
    ticket_medio: float
    ultimo_pedido: Optional[str]
    nps_medio: Optional[float]
    tickets_abertos: int
    segmento_rfm: str

class PedidoAba(BaseModel):
    id: int
    nome_produto: str
    categoria: str
    valor: float
    data: str
    status: str

class AvaliacaoAba(BaseModel):
    id_pedido: int
    nota_produto: int
    nps: int
    comentario: Optional[str]

class TicketAba(BaseModel):
    id: int
    tipo_problema: str
    data_abertura: str
    tempo_resolucao_horas: Optional[int]
    nota_avaliacao: Optional[int]

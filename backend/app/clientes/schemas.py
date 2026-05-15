from pydantic import BaseModel
from typing import List, Optional

class ClienteListagem(BaseModel):
    id: str
    nome_completo: str
    telefone: Optional[str] = "—"
    cidade: str
    estado: str
    total_gasto: float
    total_pedidos: int
    segmento_rfm: str
    origem: str
    data_cadastro: str

class ListaClientePaginada(BaseModel):
    itens: List[ClienteListagem]
    total: int
    pagina: int
    tamanho: int
    paginas: int

class ClientePerfil(BaseModel):
    id: str
    nome_completo: str
    email: Optional[str] = "—"
    telefone: Optional[str] = "—"
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
    id: str
    nome_produto: str
    categoria: str
    valor: float
    data: str
    status: str
    metodo_pagamento: Optional[str]
    quantidade: int

class AvaliacaoAba(BaseModel):
    id_pedido: str
    nota_produto: int
    nps: int
    comentario: Optional[str]

class TicketAba(BaseModel):
    id: str
    tipo_problema: str
    data_abertura: str
    tempo_resolucao_horas: Optional[float]
    nota_avaliacao: Optional[int]

class KpisClientes(BaseModel):
    total_clientes: int
    media_receita: float
    taxa_satisfacao: float
    media_compra: float

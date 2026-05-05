from typing import List, Optional

from pydantic import BaseModel


class TicketItem(BaseModel):
    id: int
    id_cliente: int
    id_pedido: int
    tipo_problema: str
    status: str

    # formato DD-MM-YYYY conforme convenção da API
    data_abertura: str
    data_resolucao: Optional[str]

    # nulos para tickets ainda em aberto
    tempo_resolucao_horas: Optional[int]
    agente_suporte: str
    nota_avaliacao: Optional[int]

    # calculado pelo service — nunca nulo
    prioridade: str


class PaginatedTicketList(BaseModel):
    items: List[TicketItem]
    total: int
    page: int
    size: int
    pages: int

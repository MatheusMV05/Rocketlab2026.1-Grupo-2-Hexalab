from typing import List, Optional

from pydantic import BaseModel


class TicketResposta(BaseModel):
    sk: str
    id: str
    cliente_id: str
    cliente_nome: str
    status: str
    resolvido: bool
    duracao: str
    tipo: str
    responsavel: str
    avaliacao: Optional[int] = None


class ListaTicketsResposta(BaseModel):
    itens: List[TicketResposta]
    total: int
    total_ativos: int
    pagina: int
    paginas: int


class KpisResposta(BaseModel):
    total_tickets: int
    tickets_atrasados: int
    tickets_nao_resolvidos: int
    tempo_medio: str


class SugestaoClienteResposta(BaseModel):
    id: str
    nome: str


class PorStatusItem(BaseModel):
    status: str
    total: int


class PorStatusResposta(BaseModel):
    itens: List[PorStatusItem]
    volume_total: int


class ProblemaRecorrenteItem(BaseModel):
    posicao: int
    rotulo: str
    total: int


class ProblemasResposta(BaseModel):
    itens: List[ProblemaRecorrenteItem]
    volume_total: int


class AgenteSuporteOpcao(BaseModel):
    nome: str


class AreaIncidenciaItem(BaseModel):
    posicao: int
    rotulo: str
    total: int


class AreasResposta(BaseModel):
    itens: List[AreaIncidenciaItem]
    volume_total: int


class TaxaSatisfacaoResposta(BaseModel):
    valor: int
    meta: int
    total_tickets: int


class TicketsFiltrosOpcoes(BaseModel):
    tipos: List[str]
    status: List[str]


class TicketEditavel(BaseModel):
    sla_status: Optional[str] = None
    tipo_problema: Optional[str] = None
    agente_suporte: Optional[str] = None
    fl_resolvido: Optional[bool] = None

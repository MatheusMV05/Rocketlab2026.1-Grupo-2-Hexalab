import math
from datetime import date
from typing import Optional

from app.tickets.models import GoldTickets
from app.tickets.schemas import ListaTicketPaginada, TicketItem


def calcular_prioridade(tempo_resolucao_horas: Optional[int]) -> str:
    # tickets sem resolução são sempre Alta independente do tempo
    if tempo_resolucao_horas is None or tempo_resolucao_horas > 72:
        return "Alta"
    if tempo_resolucao_horas >= 24:
        return "Media"
    return "Baixa"


def _formatar_data(valor: Optional[date]) -> Optional[str]:
    if valor is None:
        return None
    return valor.strftime("%d-%m-%Y")


def processar_tickets(
    tickets: list[GoldTickets],
    pagina: int,
    tamanho: int,
    total: int,
) -> ListaTicketPaginada:
    itens = [
        TicketItem(
            id=ticket.id,
            id_cliente=ticket.id_cliente,
            id_pedido=ticket.id_pedido,
            tipo_problema=ticket.tipo_problema,
            status=ticket.status,
            data_abertura=_formatar_data(ticket.data_abertura),
            data_resolucao=_formatar_data(ticket.data_resolucao),
            tempo_resolucao_horas=ticket.tempo_resolucao_horas,
            agente_suporte=ticket.agente_suporte,
            nota_avaliacao=ticket.nota_avaliacao,
            prioridade=calcular_prioridade(ticket.tempo_resolucao_horas),
        )
        for ticket in tickets
    ]

    paginas = math.ceil(total / tamanho) if total > 0 else 0

    return ListaTicketPaginada(
        itens=itens,
        total=total,
        pagina=pagina,
        tamanho=tamanho,
        paginas=paginas,
    )

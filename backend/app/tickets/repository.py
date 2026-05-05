from datetime import date
from typing import Optional

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.tickets.models import GoldTickets


async def buscar_tickets(
    sessao: AsyncSession,
    tipo_problema: Optional[str],
    status: Optional[str],
    agente: Optional[str],
    data_inicio: Optional[date],
    data_fim: Optional[date],
    pagina: int,
    tamanho: int,
) -> tuple[list[GoldTickets], int]:
    # constrói lista de filtros para reutilizar na contagem e na busca paginada
    filtros = []

    # comparações de texto usam LOWER() para evitar sensibilidade a maiúsculas
    if tipo_problema:
        filtros.append(func.lower(GoldTickets.tipo_problema) == tipo_problema.lower())
    if status:
        filtros.append(func.lower(GoldTickets.status) == status.lower())
    if agente:
        filtros.append(func.lower(GoldTickets.agente_suporte) == agente.lower())

    # filtros de período aplicados sobre data_abertura
    if data_inicio:
        filtros.append(GoldTickets.data_abertura >= data_inicio)
    if data_fim:
        filtros.append(GoldTickets.data_abertura <= data_fim)

    # consulta de contagem total (sem OFFSET/LIMIT) para montar paginação
    consulta_contagem = select(func.count(GoldTickets.id))
    if filtros:
        consulta_contagem = consulta_contagem.where(*filtros)
    total = (await sessao.execute(consulta_contagem)).scalar_one()

    # consulta paginada ordenada por data_abertura decrescente
    consulta = select(GoldTickets).order_by(GoldTickets.data_abertura.desc())
    if filtros:
        consulta = consulta.where(*filtros)
    consulta = consulta.offset((pagina - 1) * tamanho).limit(tamanho)

    resultado = await sessao.execute(consulta)
    return list(resultado.scalars().all()), total

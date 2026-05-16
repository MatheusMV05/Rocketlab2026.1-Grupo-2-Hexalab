import logging
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.tickets.schemas import (
    AgenteSuporteOpcao,
    AreasResposta,
    KpisResposta,
    ListaTicketsResposta,
    PorStatusResposta,
    ProblemasResposta,
    SugestaoClienteResposta,
    TaxaSatisfacaoResposta,
    TicketEditavel,
    TicketResposta,
    TicketsFiltrosOpcoes,
)
from app.tickets.service import TicketService

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/tickets", tags=["tickets"])


def _falhar(mensagem: str, exc: Exception) -> HTTPException:
    logger.exception(mensagem)
    return HTTPException(status_code=500, detail=f"{mensagem}: {exc}")


@router.get("", response_model=ListaTicketsResposta)
async def listar_tickets(
    pagina: int = Query(1, ge=1),
    por_pagina: int = Query(6, ge=1, le=100),
    cliente: Optional[str] = Query(None),
    tipos: Optional[List[str]] = Query(None),
    status: Optional[List[str]] = Query(None),
    ordenacao: Optional[str] = Query(None),
    ano: Optional[str] = Query(None),
    mes: Optional[str] = Query(None),
    localidade: Optional[str] = Query(None),
    busca: Optional[str] = Query(None),
    db: AsyncSession = Depends(get_db),
) -> ListaTicketsResposta:
    try:
        return await TicketService.obter_lista(
            db,
            pagina=pagina,
            por_pagina=por_pagina,
            cliente=cliente,
            tipos=tipos,
            status=status,
            ordenacao=ordenacao,
            ano=ano,
            mes=mes,
            localidade=localidade,
            busca=busca,
        )
    except Exception as exc:
        raise _falhar("Erro ao listar tickets", exc) from exc


@router.get("/kpis", response_model=KpisResposta)
async def obter_kpis(db: AsyncSession = Depends(get_db)) -> KpisResposta:
    try:
        return await TicketService.obter_kpis(db)
    except Exception as exc:
        raise _falhar("Erro ao calcular KPIs", exc) from exc


@router.get("/clientes-sugestoes", response_model=List[SugestaoClienteResposta])
async def sugerir_clientes(
    termo: str = Query(..., min_length=1),
    db: AsyncSession = Depends(get_db),
) -> List[SugestaoClienteResposta]:
    try:
        return await TicketService.sugerir_clientes(db, termo)
    except Exception as exc:
        raise _falhar("Erro ao buscar sugestões", exc) from exc


@router.get("/agentes-suporte", response_model=List[AgenteSuporteOpcao])
async def listar_agentes_suporte(
    sugestao: Optional[str] = Query(None, description="Filtro opcional por nome"),
    db: AsyncSession = Depends(get_db),
) -> List[AgenteSuporteOpcao]:
    try:
        return await TicketService.listar_agentes_suporte(db, sugestao)
    except Exception as exc:
        raise _falhar("Erro ao listar agentes", exc) from exc


@router.get("/filtros-opcoes", response_model=TicketsFiltrosOpcoes)
async def listar_opcoes_filtro(db: AsyncSession = Depends(get_db)) -> TicketsFiltrosOpcoes:
    try:
        return await TicketService.listar_opcoes_filtro(db)
    except Exception as exc:
        raise _falhar("Erro ao listar opções de filtro", exc) from exc


@router.get("/por-status", response_model=PorStatusResposta)
async def grafico_por_status(
    ano: Optional[str] = Query(None),
    mes: Optional[str] = Query(None),
    localidade: Optional[str] = Query(None),
    db: AsyncSession = Depends(get_db),
) -> PorStatusResposta:
    try:
        return await TicketService.obter_por_status(db, ano, mes, localidade)
    except Exception as exc:
        raise _falhar("Erro ao agrupar por status", exc) from exc


@router.get("/problemas-recorrentes", response_model=ProblemasResposta)
async def grafico_problemas(
    ano: Optional[str] = Query(None),
    mes: Optional[str] = Query(None),
    localidade: Optional[str] = Query(None),
    db: AsyncSession = Depends(get_db),
) -> ProblemasResposta:
    try:
        return await TicketService.obter_problemas_recorrentes(db, ano, mes, localidade)
    except Exception as exc:
        raise _falhar("Erro ao calcular top problemas", exc) from exc


@router.get("/areas-incidencia", response_model=AreasResposta)
async def grafico_areas(
    ano: Optional[str] = Query(None),
    mes: Optional[str] = Query(None),
    localidade: Optional[str] = Query(None),
    db: AsyncSession = Depends(get_db),
) -> AreasResposta:
    try:
        return await TicketService.obter_areas_incidencia(db, ano, mes, localidade)
    except Exception as exc:
        raise _falhar("Erro ao calcular áreas", exc) from exc


@router.get("/taxa-satisfacao-suporte", response_model=TaxaSatisfacaoResposta)
async def grafico_taxa_satisfacao(
    ano: Optional[str] = Query(None),
    mes: Optional[str] = Query(None),
    localidade: Optional[str] = Query(None),
    db: AsyncSession = Depends(get_db),
) -> TaxaSatisfacaoResposta:
    try:
        return await TicketService.obter_taxa_satisfacao(db, ano, mes, localidade)
    except Exception as exc:
        raise _falhar("Erro ao calcular taxa de satisfação", exc) from exc


@router.patch("/{sk_ticket}", response_model=TicketResposta)
async def atualizar_ticket(
    sk_ticket: str,
    body: TicketEditavel,
    db: AsyncSession = Depends(get_db),
) -> TicketResposta:
    if not body.model_dump(exclude_none=True):
        raise HTTPException(status_code=400, detail="Nenhum campo informado para atualização")
    try:
        atualizado = await TicketService.atualizar(db, sk_ticket, body)
    except HTTPException:
        raise
    except Exception as exc:
        raise _falhar("Erro ao atualizar ticket", exc) from exc
    if atualizado is None:
        raise HTTPException(status_code=404, detail="Ticket não encontrado")
    return atualizado

from datetime import date, datetime
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.tickets.repository import buscar_tickets
from app.tickets.schemas import PaginatedTicketList
from app.tickets.service import processar_tickets

roteador = APIRouter(tags=["tickets"])


def _parsear_data(valor: Optional[str], nome_campo: str) -> Optional[date]:
    # converte string DD-MM-YYYY para date; levanta 422 se o formato for inválido
    if valor is None:
        return None
    try:
        return datetime.strptime(valor, "%d-%m-%Y").date()
    except ValueError:
        raise HTTPException(
            status_code=422,
            detail=f"Formato inválido para '{nome_campo}'. Use DD-MM-YYYY.",
        )


@roteador.get("/tickets", response_model=PaginatedTicketList)
async def listar_tickets(
    tipo_problema: Optional[str] = Query(None),
    status: Optional[str] = Query(None),
    agente: Optional[str] = Query(None),
    data_inicio: Optional[str] = Query(None),
    data_fim: Optional[str] = Query(None),
    page: int = Query(1, ge=1),
    size: int = Query(20, ge=1, le=100),
    sessao: AsyncSession = Depends(get_db),
) -> PaginatedTicketList:
    inicio = _parsear_data(data_inicio, "data_inicio")
    fim = _parsear_data(data_fim, "data_fim")

    if inicio and fim and fim < inicio:
        raise HTTPException(
            status_code=422,
            detail="data_fim deve ser maior ou igual a data_inicio.",
        )

    try:
        tickets, total = await buscar_tickets(
            sessao=sessao,
            tipo_problema=tipo_problema,
            status=status,
            agente=agente,
            data_inicio=inicio,
            data_fim=fim,
            pagina=page,
            tamanho=size,
        )
        return processar_tickets(tickets, page, size, total)
    except HTTPException:
        raise
    except Exception:
        raise HTTPException(status_code=500, detail="Erro ao buscar tickets.")

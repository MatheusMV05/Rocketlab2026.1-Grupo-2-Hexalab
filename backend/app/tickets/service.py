import math
from typing import Any, Dict, List, Optional

from fastapi import HTTPException

from sqlalchemy.ext.asyncio import AsyncSession

from app.tickets.repository import TicketRepository
from app.tickets.schemas import (
    AgenteSuporteOpcao,
    AreaIncidenciaItem,
    AreasResposta,
    KpisResposta,
    ListaTicketsResposta,
    PorStatusItem,
    PorStatusResposta,
    ProblemaRecorrenteItem,
    ProblemasResposta,
    SugestaoClienteResposta,
    TaxaSatisfacaoResposta,
    TicketEditavel,
    TicketResposta,
    TicketsFiltrosOpcoes,
)


META_SATISFACAO = 90


def formatar_duracao(horas: Optional[float]) -> str:
    if horas is None:
        return "—"
    return f"{int(horas)} horas"


def _identificador_curto(id_ticket: Optional[str], sk_ticket: Optional[str]) -> str:
    base = id_ticket or sk_ticket or ""
    if not base:
        return ""
    return base if base.startswith("#") else f"#{base[:5]}"


def _ticket_para_resposta(t: Dict[str, Any]) -> TicketResposta:
    raw_nota = t.get("nota_avaliacao")
    avaliacao = int(raw_nota) if raw_nota is not None else None
    return TicketResposta(
        sk=str(t.get("sk_ticket") or ""),
        id=_identificador_curto(t.get("id_ticket"), t.get("sk_ticket")),
        cliente_id=str(t.get("id_cliente") or ""),
        cliente_nome=t.get("cliente_nome") or "",
        status=t.get("sla_status") or "—",
        resolvido=t.get("fl_resolvido") == 1,
        duracao=formatar_duracao(t.get("tempo_resolucao_horas")),
        tipo=t.get("tipo_problema") or "—",
        responsavel=t.get("agente_suporte") or "—",
        avaliacao=avaliacao,
    )


class TicketService:
    @staticmethod
    async def obter_lista(
        db: AsyncSession,
        pagina: int,
        por_pagina: int,
        cliente: Optional[str],
        tipos: Optional[List[str]],
        status: Optional[List[str]],
        ordenacao: Optional[str],
        ano: Optional[str],
        mes: Optional[str],
        localidade: Optional[str],
        busca: Optional[str],
    ) -> ListaTicketsResposta:
        brutos, total = await TicketRepository.listar(
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
        total_ativos = await TicketRepository.total_ativos(db)
        itens = [_ticket_para_resposta(t) for t in brutos]
        paginas = max(1, math.ceil(total / por_pagina)) if total > 0 else 1
        return ListaTicketsResposta(
            itens=itens,
            total=total,
            total_ativos=total_ativos,
            pagina=pagina,
            paginas=paginas,
        )

    @staticmethod
    async def obter_kpis(db: AsyncSession) -> KpisResposta:
        dados = await TicketRepository.kpis(db)
        return KpisResposta(
            total_tickets=dados["total"],
            tickets_atrasados=dados["atrasados"],
            tickets_nao_resolvidos=dados["nao_resolvidos"],
            tempo_medio=f"{int(dados['tempo_medio_horas'])} horas",
        )

    @staticmethod
    async def obter_por_status(
        db: AsyncSession,
        ano: Optional[str],
        mes: Optional[str],
        localidade: Optional[str],
    ) -> PorStatusResposta:
        brutos = await TicketRepository.agrupar_por_status(db, ano, mes, localidade)
        itens = [PorStatusItem(status=item["status"], total=item["total"]) for item in brutos]
        volume = sum(i.total for i in itens)
        return PorStatusResposta(itens=itens, volume_total=volume)

    @staticmethod
    async def obter_problemas_recorrentes(
        db: AsyncSession,
        ano: Optional[str],
        mes: Optional[str],
        localidade: Optional[str],
    ) -> ProblemasResposta:
        brutos = await TicketRepository.top_problemas(db, ano, mes, localidade)
        itens = [
            ProblemaRecorrenteItem(posicao=idx + 1, rotulo=item["rotulo"], total=item["total"])
            for idx, item in enumerate(brutos)
        ]
        volume = sum(i.total for i in itens)
        return ProblemasResposta(itens=itens, volume_total=volume)

    @staticmethod
    async def obter_areas_incidencia(
        db: AsyncSession,
        ano: Optional[str],
        mes: Optional[str],
        localidade: Optional[str],
    ) -> AreasResposta:
        brutos = await TicketRepository.top_areas_categoria(db, ano, mes, localidade)
        itens = [
            AreaIncidenciaItem(posicao=idx + 1, rotulo=item["rotulo"], total=item["total"])
            for idx, item in enumerate(brutos)
        ]
        volume = sum(i.total for i in itens)
        return AreasResposta(itens=itens, volume_total=volume)

    @staticmethod
    async def obter_taxa_satisfacao(
        db: AsyncSession,
        ano: Optional[str],
        mes: Optional[str],
        localidade: Optional[str],
    ) -> TaxaSatisfacaoResposta:
        dados = await TicketRepository.taxa_satisfacao(db, ano, mes, localidade)
        media_nota = dados["media_nota"]
        valor_pct = int(round(((media_nota - 1) / 4) * 100)) if media_nota else 0
        valor_pct = max(0, min(100, valor_pct))
        return TaxaSatisfacaoResposta(
            valor=valor_pct,
            meta=META_SATISFACAO,
            total_tickets=dados["total_avaliados"],
        )

    @staticmethod
    async def sugerir_clientes(db: AsyncSession, termo: str) -> List[SugestaoClienteResposta]:
        if not termo:
            return []
        brutos = await TicketRepository.sugerir_clientes(db, termo)
        return [SugestaoClienteResposta(id=b["id"], nome=b["nome"]) for b in brutos]

    @staticmethod
    async def listar_agentes_suporte(
        db: AsyncSession, termo: Optional[str]
    ) -> List[AgenteSuporteOpcao]:
        nomes = await TicketRepository.agentes_suporte_disponiveis(db, termo, limite=250)
        return [AgenteSuporteOpcao(nome=n) for n in nomes]

    @staticmethod
    async def listar_opcoes_filtro(db: AsyncSession) -> TicketsFiltrosOpcoes:
        dados = await TicketRepository.listar_opcoes_filtro(db)
        return TicketsFiltrosOpcoes(tipos=dados["tipos"], status=dados["status"])

    @staticmethod
    async def atualizar(
        db: AsyncSession, sk_ticket: str, body: TicketEditavel
    ) -> Optional[TicketResposta]:
        dados = body.model_dump(exclude_none=True)
        if "agente_suporte" in dados:
            ag = dados["agente_suporte"]
            valor = ag.strip() if isinstance(ag, str) else ""
            if valor:
                if not await TicketRepository.agente_suporte_existe(db, valor):
                    raise HTTPException(
                        status_code=400,
                        detail="Este responsável não está cadastrado na base.",
                    )
                dados["agente_suporte"] = valor
            else:
                del dados["agente_suporte"]
        atualizado = await TicketRepository.atualizar(db, sk_ticket, dados)
        if atualizado is None:
            return None
        return _ticket_para_resposta(atualizado)

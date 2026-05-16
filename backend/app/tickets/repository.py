from typing import Any, Dict, List, Optional, Tuple

from sqlalchemy import Select, case, distinct, func, literal, or_, select, update
from sqlalchemy.ext.asyncio import AsyncSession

from app.tickets.models import ClienteDim, DataDim, PedidoFato, ProdutoDim, TicketFato


# Predicados básicos derivados de `fl_resolvido` (bigint 0/1 no DW).
_COND_NAO_RESOLVIDO = or_(
    TicketFato.fl_resolvido != 1,
    TicketFato.fl_resolvido.is_(None),
)


def _condicao_busca(busca: Optional[str]):
    """Busca em id_ticket e nome/sobrenome do cliente."""
    if not busca:
        return None
    termo = busca.strip()
    if not termo:
        return None
    padrao = f"%{termo}%"
    return or_(
        TicketFato.id_ticket.ilike(padrao),
        ClienteDim.nome.ilike(padrao),
        ClienteDim.sobrenome.ilike(padrao),
        (ClienteDim.nome + " " + ClienteDim.sobrenome).ilike(padrao),
    )


def _condicao_cliente(cliente: Optional[str]):
    if not cliente:
        return None
    termo = cliente.lstrip("#").strip()
    if not termo:
        return None
    padrao = f"%{termo}%"
    return or_(
        TicketFato.id_cliente.ilike(padrao),
        ClienteDim.nome.ilike(padrao),
        ClienteDim.sobrenome.ilike(padrao),
        (ClienteDim.nome + " " + ClienteDim.sobrenome).ilike(padrao),
    )


def _filtros_periodo(
    ano: Optional[str], mes: Optional[str], localidade: Optional[str]
) -> List[Any]:
    """Retorna lista de WHERE clauses para Ano/Mês/Localidade.

    Assume `dim_data.data_completa` em formato ISO `YYYY-MM-DD`.
    """
    where: List[Any] = []
    if ano:
        where.append(func.substr(DataDim.data_completa, 1, 4) == str(ano))
    if mes:
        mes_str = str(mes).zfill(2)
        where.append(func.substr(DataDim.data_completa, 6, 2) == mes_str)
    if localidade:
        where.append(ClienteDim.estado.ilike(f"%{localidade}%"))
    return where


def _aplicar_joins_periodo(stmt: Select, com_localidade: bool = True) -> Select:
    """Adiciona JOIN com dim_data e (opcionalmente) dim_clientes ao stmt."""
    stmt = stmt.join(DataDim, TicketFato.sk_data_abertura == DataDim.sk_data, isouter=True)
    if com_localidade:
        stmt = stmt.join(
            ClienteDim, TicketFato.id_cliente == ClienteDim.id_cliente, isouter=True
        )
    return stmt


class TicketRepository:
    @staticmethod
    async def listar(
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
    ) -> Tuple[List[Dict[str, Any]], int]:
        filtros: List[Any] = list(_filtros_periodo(ano, mes, localidade))

        cond_cliente = _condicao_cliente(cliente)
        if cond_cliente is not None:
            filtros.append(cond_cliente)
        cond_busca = _condicao_busca(busca)
        if cond_busca is not None:
            filtros.append(cond_busca)
        if tipos:
            filtros.append(TicketFato.tipo_problema.in_(tipos))
        if status:
            filtros.append(TicketFato.sla_status.in_(status))
        if ordenacao:
            filtros.append(TicketFato.sla_status == ordenacao)

        base = (
            select(TicketFato.sk_ticket)
            .join(DataDim, TicketFato.sk_data_abertura == DataDim.sk_data, isouter=True)
            .join(ClienteDim, TicketFato.id_cliente == ClienteDim.id_cliente, isouter=True)
        )
        if filtros:
            base = base.where(*filtros)

        consulta_total = select(func.count()).select_from(base.subquery())
        total = (await db.execute(consulta_total)).scalar_one()

        stmt = _aplicar_joins_periodo(
            select(TicketFato, ClienteDim.nome, ClienteDim.sobrenome)
        )
        if filtros:
            stmt = stmt.where(*filtros)
        stmt = (
            stmt.order_by(TicketFato.sk_data_abertura.desc())
            .offset((pagina - 1) * por_pagina)
            .limit(por_pagina)
        )

        result = await db.execute(stmt)
        itens: List[Dict[str, Any]] = []
        for ticket, nome, sobrenome in result.all():
            d = ticket.__dict__.copy()
            d.pop("_sa_instance_state", None)
            partes = [p for p in [nome, sobrenome] if p]
            d["cliente_nome"] = " ".join(partes) if partes else ""
            itens.append(d)
        return itens, int(total or 0)

    @staticmethod
    async def total_ativos(db: AsyncSession) -> int:
        stmt = select(func.count(TicketFato.sk_ticket)).where(_COND_NAO_RESOLVIDO)
        return int((await db.execute(stmt)).scalar() or 0)

    @staticmethod
    async def kpis(db: AsyncSession) -> Dict[str, Any]:
        stmt = select(
            func.count(TicketFato.sk_ticket).label("total"),
            func.count(case((TicketFato.tipo_problema.ilike("%atras%"), 1))).label("atrasados"),
            func.count(case((_COND_NAO_RESOLVIDO, 1))).label("nao_resolvidos"),
            func.avg(TicketFato.tempo_resolucao_horas).label("tempo_medio"),
        )
        row = (await db.execute(stmt)).first()
        return {
            "total": int(row[0] or 0),
            "atrasados": int(row[1] or 0),
            "nao_resolvidos": int(row[2] or 0),
            "tempo_medio_horas": float(row[3]) if row[3] is not None else 0.0,
        }

    @staticmethod
    async def agrupar_por_status(
        db: AsyncSession,
        ano: Optional[str],
        mes: Optional[str],
        localidade: Optional[str],
    ) -> List[Dict[str, Any]]:
        filtros = _filtros_periodo(ano, mes, localidade)
        stmt = (
            _aplicar_joins_periodo(
                select(
                    TicketFato.sla_status.label("rotulo"),
                    func.count(TicketFato.sk_ticket).label("total"),
                )
            )
            .where(TicketFato.sla_status.is_not(None))
            .group_by(TicketFato.sla_status)
            .order_by(func.count(TicketFato.sk_ticket).desc())
        )
        if filtros:
            stmt = stmt.where(*filtros)
        result = await db.execute(stmt)
        return [{"status": row[0] or "—", "total": int(row[1])} for row in result.all()]

    @staticmethod
    async def top_problemas(
        db: AsyncSession,
        ano: Optional[str],
        mes: Optional[str],
        localidade: Optional[str],
        limite: int = 5,
    ) -> List[Dict[str, Any]]:
        filtros = _filtros_periodo(ano, mes, localidade)
        rotulo_tipo = func.coalesce(
            func.nullif(func.trim(TicketFato.tipo_problema), literal("")),
            literal("Sem tipo"),
        )
        stmt = (
            _aplicar_joins_periodo(
                select(
                    rotulo_tipo.label("rotulo"),
                    func.count(TicketFato.sk_ticket).label("total"),
                )
            )
            .group_by(rotulo_tipo)
            .order_by(func.count(TicketFato.sk_ticket).desc())
            .limit(limite)
        )
        if filtros:
            stmt = stmt.where(*filtros)
        result = await db.execute(stmt)
        return [{"rotulo": row[0] or "—", "total": int(row[1])} for row in result.all()]

    @staticmethod
    async def top_areas_categoria(
        db: AsyncSession,
        ano: Optional[str],
        mes: Optional[str],
        localidade: Optional[str],
        limite: int = 5,
    ) -> List[Dict[str, Any]]:
        filtros = _filtros_periodo(ano, mes, localidade)
        stmt = (
            select(
                ProdutoDim.categoria.label("rotulo"),
                func.count(distinct(TicketFato.sk_ticket)).label("total"),
            )
            .join(PedidoFato, TicketFato.sk_pedido == PedidoFato.sk_pedido)
            .join(ProdutoDim, PedidoFato.sk_produto == ProdutoDim.sk_produto)
            .join(DataDim, TicketFato.sk_data_abertura == DataDim.sk_data, isouter=True)
            .join(ClienteDim, TicketFato.id_cliente == ClienteDim.id_cliente, isouter=True)
            .where(ProdutoDim.categoria.is_not(None))
            .group_by(ProdutoDim.categoria)
            .order_by(func.count(distinct(TicketFato.sk_ticket)).desc())
            .limit(limite)
        )
        if filtros:
            stmt = stmt.where(*filtros)
        result = await db.execute(stmt)
        return [{"rotulo": row[0] or "—", "total": int(row[1])} for row in result.all()]

    @staticmethod
    async def taxa_satisfacao(
        db: AsyncSession,
        ano: Optional[str],
        mes: Optional[str],
        localidade: Optional[str],
    ) -> Dict[str, Any]:
        filtros = _filtros_periodo(ano, mes, localidade)
        stmt = (
            _aplicar_joins_periodo(
                select(
                    func.avg(TicketFato.nota_avaliacao).label("media"),
                    func.count(TicketFato.sk_ticket).label("avaliados"),
                )
            ).where(TicketFato.nota_avaliacao.is_not(None))
        )
        if filtros:
            stmt = stmt.where(*filtros)
        row = (await db.execute(stmt)).first()
        return {
            "media_nota": float(row[0]) if row[0] is not None else 0.0,
            "total_avaliados": int(row[1] or 0),
        }

    @staticmethod
    async def sugerir_clientes(db: AsyncSession, termo: str, limite: int = 10) -> List[Dict[str, Any]]:
        padrao = f"%{termo.lstrip('#').strip()}%"
        stmt = (
            select(ClienteDim.id_cliente, ClienteDim.nome, ClienteDim.sobrenome)
            .where(
                or_(
                    ClienteDim.id_cliente.ilike(padrao),
                    ClienteDim.nome.ilike(padrao),
                    ClienteDim.sobrenome.ilike(padrao),
                )
            )
            .distinct()
            .limit(limite)
        )
        result = await db.execute(stmt)
        sugestoes: List[Dict[str, Any]] = []
        for id_cliente, nome, sobrenome in result.all():
            partes = [p for p in [nome, sobrenome] if p]
            sugestoes.append(
                {
                    "id": id_cliente,
                    "nome": " ".join(partes) if partes else (id_cliente or ""),
                }
            )
        return sugestoes

    @staticmethod
    async def listar_opcoes_filtro(db: AsyncSession) -> Dict[str, List[str]]:
        stmt_tipos = (
            select(TicketFato.tipo_problema)
            .where(TicketFato.tipo_problema.is_not(None))
            .distinct()
            .order_by(TicketFato.tipo_problema)
        )
        stmt_status = (
            select(TicketFato.sla_status)
            .where(TicketFato.sla_status.is_not(None))
            .distinct()
            .order_by(TicketFato.sla_status)
        )
        tipos = [row[0] for row in (await db.execute(stmt_tipos)).all() if row[0]]
        status = [row[0] for row in (await db.execute(stmt_status)).all() if row[0]]
        return {"tipos": tipos, "status": status}

    @staticmethod
    async def buscar_um(db: AsyncSession, sk_ticket: str) -> Optional[Dict[str, Any]]:
        stmt = (
            select(TicketFato, ClienteDim.nome, ClienteDim.sobrenome)
            .outerjoin(ClienteDim, TicketFato.id_cliente == ClienteDim.id_cliente)
            .where(TicketFato.sk_ticket == sk_ticket)
        )
        row = (await db.execute(stmt)).first()
        if not row:
            return None
        ticket, nome, sobrenome = row
        d = ticket.__dict__.copy()
        d.pop("_sa_instance_state", None)
        partes = [p for p in [nome, sobrenome] if p]
        d["cliente_nome"] = " ".join(partes) if partes else ""
        return d

    @staticmethod
    async def atualizar(
        db: AsyncSession, sk_ticket: str, dados: Dict[str, Any]
    ) -> Optional[Dict[str, Any]]:
        valores: Dict[str, Any] = {k: v for k, v in dados.items() if v is not None}
        if "fl_resolvido" in valores and isinstance(valores["fl_resolvido"], bool):
            valores["fl_resolvido"] = 1 if valores["fl_resolvido"] else 0
        if not valores:
            return await TicketRepository.buscar_um(db, sk_ticket)

        stmt = (
            update(TicketFato)
            .where(TicketFato.sk_ticket == sk_ticket)
            .values(**valores)
        )
        await db.execute(stmt)
        await db.commit()
        return await TicketRepository.buscar_um(db, sk_ticket)

    @staticmethod
    async def agentes_suporte_disponiveis(
        db: AsyncSession, termo: Optional[str], limite: int = 200
    ) -> List[str]:
        col = TicketFato.agente_suporte
        trimmed = func.trim(col)
        where_list: List[Any] = [col.isnot(None), trimmed != literal("")]
        termo_esc = termo.strip() if termo else ""
        if termo_esc:
            where_list.append(trimmed.ilike(f"%{termo_esc}%"))
        stmt = (
            select(trimmed.label("nome"))
            .where(*where_list)
            .distinct()
            .order_by(trimmed.asc())
            .limit(limite)
        )
        return [row[0] for row in (await db.execute(stmt)).all() if row[0]]

    @staticmethod
    async def agente_suporte_existe(db: AsyncSession, nome: str) -> bool:
        esperado = nome.strip()
        if not esperado:
            return False
        trimmed = func.trim(TicketFato.agente_suporte)
        stmt = select(func.count(TicketFato.sk_ticket)).where(trimmed == esperado).limit(1)
        resultado = await db.execute(stmt)
        row = resultado.scalar_one()
        return int(row or 0) > 0

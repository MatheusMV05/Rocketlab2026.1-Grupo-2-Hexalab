from math import ceil
from datetime import datetime

from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

from app.dashboard.models import _entregas_overrides

_MESES_ABREV = ["", "Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"]


def _periodo_anterior_info(ano: str, mes: str) -> tuple[str, str, str]:
    """Retorna (ano_ant, mes_ant, label) para comparação com o período anterior."""
    if mes:
        ano_ref = ano if ano else str(datetime.now().year)
        mes_int = int(mes)
        if mes_int > 1:
            return ano_ref, str(mes_int - 1), _MESES_ABREV[mes_int - 1]
        return str(int(ano_ref) - 1), "12", "Dez"
    if ano:
        return str(int(ano) - 1), "", str(int(ano) - 1)
    # Sem filtro: compara mês atual com o mês anterior
    now = datetime.now()
    if now.month > 1:
        return str(now.year), str(now.month - 1), _MESES_ABREV[now.month - 1]
    return str(now.year - 1), "12", "Dez"


def _variacao_pct(atual: float, anterior: float) -> float | None:
    if not anterior:
        return None
    return round((atual - anterior) / abs(anterior) * 100, 1)


async def _query_agregado(
    db: AsyncSession,
    sql_template: str,
    ano: str,
    mes: str,
    localidade: str,
    ano_key: str = "ano",
    mes_key: str = "mes",
) -> "any":
    loc_join = "JOIN dim_clientes dc ON dc.sk_cliente = fp.sk_cliente" if localidade else ""
    loc_filter = "AND dc.estado = :localidade" if localidade else ""
    ano_filter = f"AND dd.ano::text = :{ano_key}" if ano else ""
    mes_filter = f"AND dd.mes::text = :{mes_key}" if mes else ""
    sql = text(sql_template.format(
        loc_join=loc_join, loc_filter=loc_filter,
        ano_filter=ano_filter, mes_filter=mes_filter,
    ))
    params: dict = {"localidade": localidade}
    if ano:
        params[ano_key] = ano
    if mes:
        params[mes_key] = mes
    return (await db.execute(sql, params)).mappings().first()

_STATUS_DISPLAY = {
    "aprovado": "Entregue",
    "processando": "Em Processamento",
    "reembolsado": "Reembolsado",
    "recusado": "Cancelado",
}

_STATUS_DB = {v: k for k, v in _STATUS_DISPLAY.items()}

_SQL_PERIODO_MATRIZ = text("""
    WITH vendas_por_produto AS (
        SELECT
            fp.sk_produto,
            SUM(fp.quantidade) AS volume_produto
        FROM fat_pedidos fp
        JOIN dim_data     dd ON dd.sk_data    = fp.sk_data_pedido AND dd.ano > 0
        JOIN dim_clientes dc ON dc.sk_cliente = fp.sk_cliente
        WHERE fp.fl_pedido_aprovado = 1
          AND (:ano        = '' OR dd.ano::text  = :ano)
          AND (:mes        = '' OR dd.mes::text  = :mes)
          AND (:localidade = '' OR dc.estado     = :localidade)
        GROUP BY fp.sk_produto
    ),
    avaliacoes_por_produto AS (
        SELECT
            fa.sk_produto,
            AVG(fa.nota_produto)   AS media_avaliacao,
            COUNT(fa.nota_produto) AS qtd_avaliacoes
        FROM fat_avaliacoes fa
        JOIN fat_pedidos   fp ON fp.sk_pedido   = fa.sk_pedido AND fp.fl_pedido_aprovado = 1
        JOIN dim_data      dd ON dd.sk_data     = fp.sk_data_pedido AND dd.ano > 0
        JOIN dim_clientes  dc ON dc.sk_cliente  = fp.sk_cliente
        WHERE fa.nota_produto BETWEEN 1 AND 5
          AND (:ano        = '' OR dd.ano::text  = :ano)
          AND (:mes        = '' OR dd.mes::text  = :mes)
          AND (:localidade = '' OR dc.estado     = :localidade)
        GROUP BY fa.sk_produto
    ),
    totais AS (
        SELECT SUM(v.volume_produto) AS volume_total
        FROM vendas_por_produto v
        JOIN avaliacoes_por_produto a ON a.sk_produto = v.sk_produto
    ),
    pct AS (
        SELECT
            v.sk_produto,
            v.volume_produto,
            t.volume_total,
            (v.volume_produto::numeric / NULLIF(t.volume_total, 0)) * 100 AS participacao
        FROM vendas_por_produto v CROSS JOIN totais t
    ),
    base AS (
        SELECT
            p.nome_produto                                                        AS nome,
            p.categoria,
            pct.volume_produto,
            pct.volume_total,
            ROUND(pct.participacao, 2)                                            AS participacao_percentual,
            ROUND(a.media_avaliacao::numeric, 2)                                  AS satisfacao,
            a.qtd_avaliacoes,
            ROUND(
                CAST(PERCENT_RANK() OVER (ORDER BY pct.volume_produto) * 100 AS numeric),
                1
            )                                                                     AS participacao_rank
        FROM dim_produtos p
        JOIN pct                    ON pct.sk_produto = p.sk_produto
        JOIN avaliacoes_por_produto a ON a.sk_produto  = p.sk_produto
        WHERE p.ativo = 1
    )
    SELECT
        nome, categoria, volume_produto, volume_total,
        participacao_percentual, participacao_rank,
        satisfacao, qtd_avaliacoes,
        CASE
            WHEN participacao_rank >= :corte_vol AND satisfacao >= :corte_sat THEN 'estrelas'
            WHEN participacao_rank <  :corte_vol AND satisfacao >= :corte_sat THEN 'oportunidades'
            WHEN participacao_rank >= :corte_vol AND satisfacao <  :corte_sat THEN 'alerta_vermelho'
            ELSE 'ofensores'
        END AS quadrante
    FROM base
""")


def _periodo_anterior(ano: str, mes: str) -> tuple[str, str]:
    if mes:
        mes_int = int(mes)
        if mes_int > 1:
            return ano, str(mes_int - 1)
        ano_int = int(ano) if ano else 2025
        return str(ano_int - 1), "12"
    if ano:
        return str(int(ano) - 1), ""
    return "", ""


def _calcular_status(satisfacao: float, corte: float = 4.0) -> str:
    return "bom" if satisfacao >= corte else "ruim"


async def _query_periodo_matriz(
    db: AsyncSession,
    ano: str,
    mes: str,
    localidade: str,
    corte_satisfacao: float = 4.0,
    corte_volume: int = 50,
) -> dict:
    result = await db.execute(
        _SQL_PERIODO_MATRIZ,
        {"ano": ano, "mes": mes, "localidade": localidade, "corte_sat": corte_satisfacao, "corte_vol": corte_volume},
    )
    rows = result.mappings().all()

    if not rows:
        return {"items": [], "volume_total": 0}

    volume_total = int(rows[0]["volume_total"] or 0)

    items = [
        {
            "nome": row["nome"],
            "categoria": row["categoria"],
            "volume_produto": int(row["volume_produto"]),
            "volume_total": volume_total,
            "participacao_percentual": float(row["participacao_percentual"] or 0),
            "participacao_rank": float(row["participacao_rank"] or 0),
            "satisfacao": float(row["satisfacao"]),
            "qtd_avaliacoes": int(row["qtd_avaliacoes"]),
            "quadrante": row["quadrante"],
        }
        for row in rows
    ]
    return {"items": items, "volume_total": volume_total}


_SQL_KPI = """
    SELECT
        SUM(fp.receita_bruta_brl)     AS receita_total,
        COUNT(*)                      AS total_pedidos,
        AVG(fp.valor_pedido_brl)      AS ticket_medio,
        COUNT(DISTINCT fp.sk_cliente) AS total_clientes
    FROM fat_pedidos fp
    JOIN dim_data dd ON dd.sk_data = fp.sk_data_pedido AND dd.ano > 0
    {loc_join}
    WHERE fp.fl_pedido_aprovado = 1
      {ano_filter}
      {mes_filter}
      {loc_filter}
"""


async def get_kpis(db: AsyncSession, ano: str = "", mes: str = "", localidade: str = "") -> dict:
    row = await _query_agregado(db, _SQL_KPI, ano, mes, localidade)
    receita = round(float(row["receita_total"] or 0), 2)
    pedidos = int(row["total_pedidos"] or 0)
    ticket  = round(float(row["ticket_medio"] or 0), 2)
    clientes = int(row["total_clientes"] or 0)

    ano_ant, mes_ant, periodo_ref = _periodo_anterior_info(ano, mes)
    row_ant = await _query_agregado(db, _SQL_KPI, ano_ant, mes_ant, localidade,
                                    ano_key="ano_ant", mes_key="mes_ant")
    var_receita  = _variacao_pct(receita,  float(row_ant["receita_total"] or 0))
    var_pedidos  = _variacao_pct(pedidos,  float(row_ant["total_pedidos"] or 0))
    var_ticket   = _variacao_pct(ticket,   float(row_ant["ticket_medio"] or 0))
    var_clientes = _variacao_pct(clientes, float(row_ant["total_clientes"] or 0))

    return {
        "receita_total": receita,
        "total_pedidos": pedidos,
        "ticket_medio": ticket,
        "total_clientes": clientes,
        "variacao_receita": var_receita,
        "variacao_pedidos": var_pedidos,
        "variacao_ticket": var_ticket,
        "variacao_clientes": var_clientes,
        "periodo_ref": periodo_ref or "",
    }


async def get_vendas_mensal(db: AsyncSession) -> list[dict]:
    sql = text("""
        SELECT dd.ano, dd.mes,
               SUM(fp.receita_bruta_brl) AS receita,
               COUNT(*)                  AS pedidos
        FROM fat_pedidos fp
        JOIN dim_data dd ON dd.sk_data = fp.sk_data_pedido AND dd.ano > 0
        WHERE fp.fl_pedido_aprovado = 1
        GROUP BY dd.ano, dd.mes
        ORDER BY dd.ano DESC, dd.mes DESC
        LIMIT 12
    """)
    rows = (await db.execute(sql)).mappings().all()
    return [
        {
            "mes_ano": f"{_MESES_ABREV[int(row['mes'])]}/{row['ano']}",
            "receita_total": round(float(row["receita"]), 2),
            "total_pedidos": int(row["pedidos"]),
        }
        for row in reversed(rows)
    ]


_SQL_TOP_PRODUTOS = """
    SELECT p.nome_produto, p.categoria,
           SUM(fp.receita_bruta_brl) AS receita,
           SUM(fp.quantidade)        AS unidades
    FROM fat_pedidos fp
    JOIN dim_produtos p  ON p.sk_produto  = fp.sk_produto
    JOIN dim_data    dd  ON dd.sk_data    = fp.sk_data_pedido AND dd.ano > 0
    {loc_join}
    WHERE fp.fl_pedido_aprovado = 1
      {ano_filter}
      {mes_filter}
      {loc_filter}
    GROUP BY p.nome_produto, p.categoria
    ORDER BY receita DESC
    LIMIT 10
"""

_SQL_TOP_TOTAL = """
    SELECT SUM(fp.receita_bruta_brl) AS receita, SUM(fp.quantidade) AS unidades
    FROM fat_pedidos fp
    JOIN dim_data dd ON dd.sk_data = fp.sk_data_pedido AND dd.ano > 0
    {loc_join}
    WHERE fp.fl_pedido_aprovado = 1
      {ano_filter}
      {mes_filter}
      {loc_filter}
"""


async def get_top_produtos(
    db: AsyncSession, ano: str = "", mes: str = "", localidade: str = ""
) -> dict:
    loc_join = "JOIN dim_clientes dc ON dc.sk_cliente = fp.sk_cliente" if localidade else ""
    loc_filter = "AND dc.estado = :localidade" if localidade else ""
    ano_filter = "AND dd.ano::text = :ano" if ano else ""
    mes_filter = "AND dd.mes::text = :mes" if mes else ""
    params: dict = {"localidade": localidade}
    if ano: params["ano"] = ano
    if mes: params["mes"] = mes

    sql = text(_SQL_TOP_PRODUTOS.format(
        loc_join=loc_join, loc_filter=loc_filter,
        ano_filter=ano_filter, mes_filter=mes_filter,
    ))
    rows = (await db.execute(sql, params)).mappings().all()
    items = [
        {
            "nome_produto": row["nome_produto"],
            "categoria": row["categoria"],
            "receita_total": round(float(row["receita"]), 2),
            "total_unidades": int(row["unidades"]),
        }
        for row in rows
    ]

    receita_atual = sum(i["receita_total"] for i in items[:5])
    volume_atual  = sum(i["total_unidades"] for i in items[:5])

    ano_ant, mes_ant, periodo_ref = _periodo_anterior_info(ano, mes)
    row_ant = await _query_agregado(db, _SQL_TOP_TOTAL, ano_ant, mes_ant, localidade,
                                    ano_key="ano_ant", mes_key="mes_ant")
    var_receita = _variacao_pct(receita_atual, float(row_ant["receita"] or 0))
    var_volume  = _variacao_pct(float(volume_atual), float(row_ant["unidades"] or 0))

    return {
        "items": items,
        "variacao_receita": var_receita,
        "variacao_volume": var_volume,
        "periodo_ref": periodo_ref or "",
    }


async def get_por_regiao(db: AsyncSession) -> list[dict]:
    sql = text("""
        SELECT dc.estado,
               SUM(fp.receita_bruta_brl) AS receita,
               COUNT(*)                  AS pedidos
        FROM fat_pedidos fp
        JOIN dim_clientes dc ON dc.sk_cliente = fp.sk_cliente
        WHERE fp.fl_pedido_aprovado = 1
        GROUP BY dc.estado
        ORDER BY receita DESC
        LIMIT 10
    """)
    rows = (await db.execute(sql)).mappings().all()
    return [
        {
            "estado": row["estado"],
            "receita_total": round(float(row["receita"]), 2),
            "total_pedidos": int(row["pedidos"]),
        }
        for row in rows
    ]


_SQL_STATUS_TOTAL = """
    SELECT COUNT(*) AS total
    FROM fat_pedidos fp
    JOIN dim_data dd ON dd.sk_data = fp.sk_data_pedido AND dd.ano > 0
    {loc_join}
    WHERE 1=1
      {ano_filter}
      {mes_filter}
      {loc_filter}
"""


async def get_status_pedidos(
    db: AsyncSession, ano: str = "", mes: str = "", localidade: str = ""
) -> list[dict]:
    loc_join = "JOIN dim_clientes dc ON dc.sk_cliente = fp.sk_cliente" if localidade else ""
    loc_filter = "AND dc.estado = :localidade" if localidade else ""
    ano_filter = "AND dd.ano::text = :ano" if ano else ""
    mes_filter = "AND dd.mes::text = :mes" if mes else ""
    params: dict = {"localidade": localidade}
    if ano: params["ano"] = ano
    if mes: params["mes"] = mes

    sql = text(f"""
        SELECT fp.status, COUNT(*) AS total
        FROM fat_pedidos fp
        JOIN dim_data dd ON dd.sk_data = fp.sk_data_pedido AND dd.ano > 0
        {loc_join}
        WHERE 1=1
          {ano_filter}
          {mes_filter}
          {loc_filter}
        GROUP BY fp.status
        ORDER BY total DESC
    """)
    rows = (await db.execute(sql, params)).mappings().all()
    total_atual = sum(int(r["total"]) for r in rows)

    ano_ant, mes_ant, periodo_ref = _periodo_anterior_info(ano, mes)
    row_ant = await _query_agregado(db, _SQL_STATUS_TOTAL, ano_ant, mes_ant, localidade,
                                    ano_key="ano_ant", mes_key="mes_ant")
    variacao_total = _variacao_pct(float(total_atual), float(row_ant["total"] or 0))

    items = [
        {
            "status": _STATUS_DISPLAY.get(row["status"], row["status"].title()),
            "total": int(row["total"]),
        }
        for row in rows
    ]
    return {"items": items, "variacao_total": variacao_total, "periodo_ref": periodo_ref or ""}


_SQL_TAXA_SATISFACAO = """
    SELECT
        COUNT(*)                                             AS total,
        SUM(CASE WHEN fa.nota_nps >= 7 THEN 1 ELSE 0 END)  AS positivos
    FROM fat_avaliacoes fa
    JOIN fat_pedidos fp ON fp.sk_pedido = fa.sk_pedido AND fp.fl_pedido_aprovado = 1
    JOIN dim_data dd ON dd.sk_data = fp.sk_data_pedido AND dd.ano > 0
    {loc_join}
    WHERE 1=1
      {ano_filter}
      {mes_filter}
      {loc_filter}
"""


def _calcular_taxa_satisfacao(row) -> float:
    total = int(row["total"] or 0)
    if total == 0:
        return 0.0
    positivos = int(row["positivos"] or 0)
    return round(positivos / total * 100, 1)


async def get_taxa_satisfacao(
    db: AsyncSession,
    ano: str = "",
    mes: str = "",
    localidade: str = "",
) -> dict:
    loc_join = "JOIN dim_clientes dc ON dc.sk_cliente = fp.sk_cliente" if localidade else ""
    loc_filter = "AND dc.estado = :localidade" if localidade else ""
    ano_filter = "AND dd.ano::text = :ano" if ano else ""
    mes_filter = "AND dd.mes::text = :mes" if mes else ""

    sql_filtrado = text(_SQL_TAXA_SATISFACAO.format(
        loc_join=loc_join, loc_filter=loc_filter,
        ano_filter=ano_filter, mes_filter=mes_filter,
    ))
    params: dict = {"ano": ano, "mes": mes, "localidade": localidade}
    row = (await db.execute(sql_filtrado, params)).mappings().first()
    valor = _calcular_taxa_satisfacao(row)
    total = int(row["total"] or 0)

    ano_ant, mes_ant, periodo_ref = _periodo_anterior_info(ano, mes)
    sql_ant = text(_SQL_TAXA_SATISFACAO.format(
        loc_join=loc_join, loc_filter=loc_filter,
        ano_filter="AND dd.ano::text = :ano_ant" if ano_ant else "",
        mes_filter="AND dd.mes::text = :mes_ant" if mes_ant else "",
    ))
    params_ant: dict = {"localidade": localidade}
    if ano_ant: params_ant["ano_ant"] = ano_ant
    if mes_ant: params_ant["mes_ant"] = mes_ant
    row_ant = (await db.execute(sql_ant, params_ant)).mappings().first()
    variacao = _variacao_pct(valor, _calcular_taxa_satisfacao(row_ant))

    return {
        "valor": valor,
        "total_avaliacoes": total,
        "variacao": variacao,
        "periodo_ref": periodo_ref or "",
    }


async def get_matriz_produtos(
    db: AsyncSession,
    ano: str = "",
    mes: str = "",
    localidade: str = "",
    limite_estrelas: int = 4,
    limite_oportunidades: int = 4,
    limite_alerta_vermelho: int = 4,
    limite_ofensores: int = 4,
    corte_satisfacao: float = 4.0,
    corte_volume: int = 50,
) -> dict:
    atual = await _query_periodo_matriz(db, ano, mes, localidade, corte_satisfacao, corte_volume)

    if not atual["items"]:
        return {"items": [], "volume_total": 0}

    ano_ant, mes_ant = _periodo_anterior(ano, mes)
    anterior = await _query_periodo_matriz(db, ano_ant, mes_ant, localidade, corte_satisfacao, corte_volume)
    bloco_anterior_map = {item["nome"]: item["quadrante"] for item in anterior["items"]}

    for item in atual["items"]:
        item["bloco_anterior"] = bloco_anterior_map.get(item["nome"], "desconhecido")
        item["status"] = _calcular_status(item["satisfacao"], corte_satisfacao)

    quadrantes: dict[str, list] = {
        "estrelas": [], "oportunidades": [], "alerta_vermelho": [], "ofensores": [],
    }
    for item in atual["items"]:
        quadrantes[item["quadrante"]].append(item)

    # Estrelas: maior volume, desempate por maior nota
    quadrantes["estrelas"].sort(key=lambda x: (-x["volume_produto"], -x["satisfacao"]))
    # Oportunidades: maior nota, desempate por maior volume
    quadrantes["oportunidades"].sort(key=lambda x: (-x["satisfacao"], -x["volume_produto"]))
    # Alerta Vermelho: maior volume, desempate por menor nota
    quadrantes["alerta_vermelho"].sort(key=lambda x: (-x["volume_produto"], x["satisfacao"]))
    # Ofensores: menor nota, desempate por menor volume
    quadrantes["ofensores"].sort(key=lambda x: (x["satisfacao"], x["volume_produto"]))

    selecionados = (
        quadrantes["estrelas"][:limite_estrelas]
        + quadrantes["oportunidades"][:limite_oportunidades]
        + quadrantes["alerta_vermelho"][:limite_alerta_vermelho]
        + quadrantes["ofensores"][:limite_ofensores]
    )

    return {"items": selecionados, "volume_total": atual["volume_total"]}


async def get_receita_grafico(
    db: AsyncSession, ano: str = "", mes: str = "", localidade: str = ""
) -> dict:
    loc_join = "JOIN dim_clientes dc ON dc.sk_cliente = fp.sk_cliente" if localidade else ""
    loc_filter = "AND dc.estado = :localidade" if localidade else ""
    params: dict = {"localidade": localidade}

    if mes and ano:
        params["ano"] = ano
        params["mes"] = mes
        sql = text(f"""
            SELECT dd.semana_ano,
                   MIN(dd.data_completa) AS data_inicio,
                   SUM(fp.receita_bruta_brl) AS receita
            FROM fat_pedidos fp
            JOIN dim_data dd ON dd.sk_data = fp.sk_data_pedido AND dd.ano > 0
            {loc_join}
            WHERE fp.fl_pedido_aprovado = 1
              AND dd.ano::text = :ano AND dd.mes::text = :mes
              {loc_filter}
            GROUP BY dd.semana_ano
            ORDER BY dd.semana_ano
        """)
        rows = (await db.execute(sql, params)).mappings().all()
        modo = "semanal"
        receitas = [float(r["receita"]) for r in rows]
        meta_base = (sum(receitas) / len(receitas) * 0.9) if receitas else 0.0
        items = [
            {
                "label": f"Sem {i + 1}",
                "receita": round(receitas[i], 2),
                "meta": round(meta_base, 2),
            }
            for i in range(len(rows))
        ]
    else:
        if ano:
            params["ano"] = ano
            ano_filter = "AND dd.ano::text = :ano"
        else:
            ano_filter = ""
        if mes:
            params["mes"] = mes
            mes_filter = "AND dd.mes::text = :mes"
        else:
            mes_filter = ""
        sql = text(f"""
            SELECT dd.ano, dd.mes,
                   SUM(fp.receita_bruta_brl) AS receita
            FROM fat_pedidos fp
            JOIN dim_data dd ON dd.sk_data = fp.sk_data_pedido AND dd.ano > 0
            {loc_join}
            WHERE fp.fl_pedido_aprovado = 1
              {ano_filter}
              {mes_filter}
              {loc_filter}
            GROUP BY dd.ano, dd.mes
            ORDER BY dd.ano DESC, dd.mes DESC
            LIMIT 12
        """)
        rows = (await db.execute(sql, params)).mappings().all()
        modo = "mensal"
        receitas = [float(r["receita"]) for r in rows]
        meta_base = (sum(receitas) / len(receitas) * 0.9) if receitas else 0.0
        items = [
            {
                "label": f"{_MESES_ABREV[int(r['mes'])]}/{r['ano']}",
                "receita": round(float(r["receita"]), 2),
                "meta": round(meta_base, 2),
            }
            for r in reversed(rows)
        ]

    return {"items": items, "modo": modo}


async def get_entregas(
    db: AsyncSession,
    pagina: int = 1,
    por_pagina: int = 10,
    status: list[str] | None = None,
    ano: str = "",
    mes: str = "",
    ordem: str = "desc",
    busca: str = "",
) -> dict:
    conditions = ["dd.ano > 0"]
    params: dict = {"limit": por_pagina, "offset": (pagina - 1) * por_pagina}

    if status:
        db_statuses = [_STATUS_DB.get(s, s.lower()) for s in status]
        placeholders = ", ".join(f":s{i}" for i in range(len(db_statuses)))
        conditions.append(f"fp.status IN ({placeholders})")
        for i, s in enumerate(db_statuses):
            params[f"s{i}"] = s

    if ano:
        conditions.append("dd.ano::text = :ano")
        params["ano"] = ano

    if mes:
        conditions.append("dd.mes::text = :mes")
        params["mes"] = mes

    if busca:
        conditions.append("(dc.nome || ' ' || dc.sobrenome) ILIKE :busca")
        params["busca"] = f"%{busca}%"

    where = " AND ".join(conditions)

    count_sql = text(f"""
        SELECT COUNT(*) FROM fat_pedidos fp
        JOIN dim_clientes dc ON dc.sk_cliente = fp.sk_cliente
        JOIN dim_data dd ON dd.sk_data = fp.sk_data_pedido
        WHERE {where}
    """)
    total = (await db.execute(count_sql, params)).scalar() or 0

    data_sql = text(f"""
        SELECT fp.id_pedido,
               dc.nome || ' ' || dc.sobrenome AS cliente,
               fp.status,
               dd.data_completa               AS prazo
        FROM fat_pedidos fp
        JOIN dim_clientes dc ON dc.sk_cliente = fp.sk_cliente
        JOIN dim_data     dd ON dd.sk_data    = fp.sk_data_pedido
        WHERE {where}
        ORDER BY {("cliente ASC" if ordem == "cliente_az" else "cliente DESC" if ordem == "cliente_za" else ("fp.sk_data_pedido ASC" if ordem == "asc" else "fp.sk_data_pedido DESC"))}
        LIMIT :limit OFFSET :offset
    """)
    rows = (await db.execute(data_sql, params)).mappings().all()

    items = [
        {
            "id": row["id_pedido"],
            "cliente": row["cliente"],
            "status": _STATUS_DISPLAY.get(row["status"], row["status"].title()),
            "prazo": row["prazo"] or "",
        }
        for row in rows
    ]

    return {
        "items": items,
        "total": int(total),
        "pagina": pagina,
        "por_pagina": por_pagina,
        "total_paginas": ceil(int(total) / por_pagina) if total > 0 else 1,
    }


async def get_entregas_todas(
    db: AsyncSession,
    status: list[str] | None = None,
    ano: str = "",
    mes: str = "",
    ordem: str = "desc",
    busca: str = "",
) -> list[dict]:
    conditions = ["dd.ano > 0"]
    params: dict = {}

    if status:
        db_statuses = [_STATUS_DB.get(s, s.lower()) for s in status]
        placeholders = ", ".join(f":s{i}" for i in range(len(db_statuses)))
        conditions.append(f"fp.status IN ({placeholders})")
        for i, s in enumerate(db_statuses):
            params[f"s{i}"] = s

    if ano:
        conditions.append("dd.ano::text = :ano")
        params["ano"] = ano

    if mes:
        conditions.append("dd.mes::text = :mes")
        params["mes"] = mes

    if busca:
        conditions.append("(dc.nome || ' ' || dc.sobrenome) ILIKE :busca")
        params["busca"] = f"%{busca}%"

    where = " AND ".join(conditions)
    if ordem == "cliente_az":
        order_clause = "cliente ASC"
    elif ordem == "cliente_za":
        order_clause = "cliente DESC"
    elif ordem == "asc":
        order_clause = "fp.sk_data_pedido ASC"
    else:
        order_clause = "fp.sk_data_pedido DESC"

    sql = text(f"""
        SELECT fp.id_pedido,
               dc.nome || ' ' || dc.sobrenome AS cliente,
               fp.status,
               dd.data_completa               AS prazo
        FROM fat_pedidos fp
        JOIN dim_clientes dc ON dc.sk_cliente = fp.sk_cliente
        JOIN dim_data     dd ON dd.sk_data    = fp.sk_data_pedido
        WHERE {where}
        ORDER BY {order_clause}
    """)
    rows = (await db.execute(sql, params)).mappings().all()
    return [
        {
            "id": row["id_pedido"],
            "cliente": row["cliente"],
            "status": _STATUS_DISPLAY.get(row["status"], row["status"].title()),
            "prazo": str(row["prazo"]) if row["prazo"] else "",
        }
        for row in rows
    ]


async def get_filtros_opcoes(db: AsyncSession) -> dict:
    sql_anos = text("""
        SELECT DISTINCT dd.ano
        FROM fat_pedidos fp
        JOIN dim_data dd ON dd.sk_data = fp.sk_data_pedido AND dd.ano > 0
        ORDER BY dd.ano
    """)
    sql_estados = text("""
        SELECT DISTINCT dc.estado
        FROM fat_pedidos fp
        JOIN dim_clientes dc ON dc.sk_cliente = fp.sk_cliente
        WHERE dc.estado IS NOT NULL
        ORDER BY dc.estado
    """)
    anos = [str(r["ano"]) for r in (await db.execute(sql_anos)).mappings().all()]
    estados = [r["estado"] for r in (await db.execute(sql_estados)).mappings().all()]
    return {"anos": anos, "estados": estados}


async def atualizar_entrega(db: AsyncSession, id_entrega: str, campos: dict) -> dict | None:
    sql = text("""
        SELECT fp.id_pedido,
               dc.nome || ' ' || dc.sobrenome AS cliente,
               fp.status,
               dd.data_completa               AS prazo
        FROM fat_pedidos fp
        JOIN dim_clientes dc ON dc.sk_cliente = fp.sk_cliente
        JOIN dim_data     dd ON dd.sk_data    = fp.sk_data_pedido AND dd.ano > 0
        WHERE fp.id_pedido = :id
    """)
    row = (await db.execute(sql, {"id": id_entrega})).mappings().first()
    if row is None:
        return None
    base = {
        "id": row["id_pedido"],
        "cliente": row["cliente"],
        "status": _STATUS_DISPLAY.get(row["status"], row["status"].title()),
        "prazo": row["prazo"] or "",
    }
    _entregas_overrides[id_entrega] = {**_entregas_overrides.get(id_entrega, {}), **campos}
    return {**base, **_entregas_overrides[id_entrega]}

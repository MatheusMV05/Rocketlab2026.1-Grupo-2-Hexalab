from math import ceil

from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

from app.dashboard.models import _entregas_overrides

_MESES_ABREV = ["", "Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"]

_STATUS_DISPLAY = {
    "aprovado": "Entregue",
    "processando": "Em Processamento",
    "reembolsado": "Reembolsado",
    "recusado": "Cancelado",
}

_STATUS_DB = {v: k for k, v in _STATUS_DISPLAY.items()}

_SQL_PERIODO_MATRIZ = text("""
    WITH periodo AS (
        SELECT
            p.sk_produto,
            p.nome_produto        AS nome,
            p.categoria,
            COUNT(DISTINCT fp.sk_pedido)    AS volume,
            AVG(fa.nota_produto)            AS satisfacao
        FROM dim_produtos p
        JOIN fat_pedidos   fp ON fp.sk_produto  = p.sk_produto  AND fp.fl_pedido_aprovado = 1
        JOIN dim_data      dd ON dd.sk_data      = fp.sk_data_pedido AND dd.ano > 0
        JOIN dim_clientes  dc ON dc.sk_cliente   = fp.sk_cliente
        LEFT JOIN fat_avaliacoes fa
               ON fa.sk_produto = p.sk_produto AND fa.sk_pedido = fp.sk_pedido
        WHERE p.ativo = 1
          AND (:ano        = '' OR dd.ano::text   = :ano)
          AND (:mes        = '' OR dd.mes::text   = :mes)
          AND (:localidade = '' OR dc.estado      = :localidade)
        GROUP BY p.sk_produto, p.nome_produto, p.categoria
        HAVING AVG(fa.nota_produto) IS NOT NULL
           AND COUNT(DISTINCT fp.sk_pedido) > 0
    ),
    medians AS (
        SELECT
            PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY volume)     AS med_vol,
            PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY satisfacao) AS med_sat
        FROM periodo
    )
    SELECT
        p.nome,
        p.categoria,
        p.volume,
        ROUND(p.satisfacao::numeric, 2)  AS satisfacao,
        m.med_vol                        AS mediana_volume,
        m.med_sat                        AS mediana_satisfacao,
        CASE
            WHEN p.volume >= m.med_vol AND p.satisfacao >= m.med_sat THEN 'estrelas'
            WHEN p.volume <  m.med_vol AND p.satisfacao >= m.med_sat THEN 'oportunidades'
            WHEN p.volume >= m.med_vol AND p.satisfacao <  m.med_sat THEN 'alerta_vermelho'
            ELSE 'ofensores'
        END AS quadrante
    FROM periodo p CROSS JOIN medians m
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


def _calcular_status(satisfacao: float) -> str:
    if satisfacao >= 4.0:
        return "bom"
    if satisfacao >= 3.5:
        return "neutro"
    return "ruim"


async def _query_periodo_matriz(db: AsyncSession, ano: str, mes: str, localidade: str) -> dict:
    result = await db.execute(_SQL_PERIODO_MATRIZ, {"ano": ano, "mes": mes, "localidade": localidade})
    rows = result.mappings().all()

    if not rows:
        return {"items": [], "mediana_volume": 0.0, "mediana_satisfacao": 0.0}

    mediana_volume = float(rows[0]["mediana_volume"])
    mediana_satisfacao = float(rows[0]["mediana_satisfacao"])

    items = [
        {
            "nome": row["nome"],
            "categoria": row["categoria"],
            "volume": int(row["volume"]),
            "satisfacao": float(row["satisfacao"]),
            "quadrante": row["quadrante"],
        }
        for row in rows
    ]
    return {"items": items, "mediana_volume": mediana_volume, "mediana_satisfacao": mediana_satisfacao}


async def get_kpis(db: AsyncSession) -> dict:
    sql = text("""
        SELECT
            SUM(receita_bruta_brl)       AS receita_total,
            COUNT(*)                     AS total_pedidos,
            AVG(valor_pedido_brl)        AS ticket_medio,
            COUNT(DISTINCT sk_cliente)   AS total_clientes
        FROM fat_pedidos
        WHERE fl_pedido_aprovado = 1
    """)
    row = (await db.execute(sql)).mappings().first()
    return {
        "receita_total": round(float(row["receita_total"] or 0), 2),
        "total_pedidos": int(row["total_pedidos"] or 0),
        "ticket_medio": round(float(row["ticket_medio"] or 0), 2),
        "total_clientes": int(row["total_clientes"] or 0),
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


async def get_top_produtos(db: AsyncSession) -> list[dict]:
    sql = text("""
        SELECT p.nome_produto, p.categoria,
               SUM(fp.receita_bruta_brl) AS receita,
               SUM(fp.quantidade)        AS unidades
        FROM fat_pedidos fp
        JOIN dim_produtos p ON p.sk_produto = fp.sk_produto
        WHERE fp.fl_pedido_aprovado = 1
        GROUP BY p.nome_produto, p.categoria
        ORDER BY receita DESC
        LIMIT 10
    """)
    rows = (await db.execute(sql)).mappings().all()
    return [
        {
            "nome_produto": row["nome_produto"],
            "categoria": row["categoria"],
            "receita_total": round(float(row["receita"]), 2),
            "total_unidades": int(row["unidades"]),
        }
        for row in rows
    ]


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


async def get_status_pedidos(db: AsyncSession) -> list[dict]:
    sql = text("""
        SELECT status, COUNT(*) AS total
        FROM fat_pedidos
        GROUP BY status
        ORDER BY total DESC
    """)
    rows = (await db.execute(sql)).mappings().all()
    return [
        {
            "status": _STATUS_DISPLAY.get(row["status"], row["status"].title()),
            "total": int(row["total"]),
        }
        for row in rows
    ]


async def get_taxa_satisfacao(db: AsyncSession) -> dict:
    sql = text("""
        SELECT
            COUNT(*)                                                  AS total,
            SUM(CASE WHEN nota_nps >= 9 THEN 1 ELSE 0 END)           AS promotores,
            SUM(CASE WHEN nota_nps <= 6 THEN 1 ELSE 0 END)           AS detratores
        FROM fat_avaliacoes
    """)
    row = (await db.execute(sql)).mappings().first()
    total = int(row["total"] or 0)
    promotores = int(row["promotores"] or 0)
    detratores = int(row["detratores"] or 0)
    nps = round((promotores - detratores) / total * 100, 1) if total > 0 else 0.0
    return {
        "valor": nps,
        "meta": 50.0,
        "total_avaliacoes": total,
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
) -> dict:
    atual = await _query_periodo_matriz(db, ano, mes, localidade)

    if not atual["items"]:
        return {"items": [], "mediana_volume": 0.0}

    ano_ant, mes_ant = _periodo_anterior(ano, mes)
    anterior = await _query_periodo_matriz(db, ano_ant, mes_ant, localidade)
    bloco_anterior_map = {item["nome"]: item["quadrante"] for item in anterior["items"]}

    for item in atual["items"]:
        item["bloco_anterior"] = bloco_anterior_map.get(item["nome"], "desconhecido")
        item["status"] = _calcular_status(item["satisfacao"])

    quadrantes: dict[str, list] = {
        "estrelas": [],
        "oportunidades": [],
        "alerta_vermelho": [],
        "ofensores": [],
    }
    for item in atual["items"]:
        quadrantes[item["quadrante"]].append(item)

    quadrantes["estrelas"].sort(key=lambda x: (-x["satisfacao"], -x["volume"]))
    quadrantes["oportunidades"].sort(key=lambda x: -x["satisfacao"])
    quadrantes["alerta_vermelho"].sort(key=lambda x: (x["satisfacao"], -x["volume"]))
    quadrantes["ofensores"].sort(key=lambda x: -x["volume"])

    selecionados = (
        quadrantes["estrelas"][:limite_estrelas]
        + quadrantes["oportunidades"][:limite_oportunidades]
        + quadrantes["alerta_vermelho"][:limite_alerta_vermelho]
        + quadrantes["ofensores"][:limite_ofensores]
    )

    return {"items": selecionados, "mediana_volume": atual["mediana_volume"]}


async def get_receita_grafico(
    db: AsyncSession, ano: str = "", mes: str = "", localidade: str = ""
) -> dict:
    loc_join = "JOIN dim_clientes dc ON dc.sk_cliente = fp.sk_cliente" if localidade else ""
    loc_filter = "AND dc.estado = :localidade" if localidade else ""
    params: dict = {"localidade": localidade}

    if mes:
        ano_ref = int(ano) if ano else 2025
        params["ano"] = str(ano_ref)
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
        sql = text(f"""
            SELECT dd.ano, dd.mes,
                   SUM(fp.receita_bruta_brl) AS receita
            FROM fat_pedidos fp
            JOIN dim_data dd ON dd.sk_data = fp.sk_data_pedido AND dd.ano > 0
            {loc_join}
            WHERE fp.fl_pedido_aprovado = 1
              {ano_filter}
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
    por_pagina: int = 7,
    status: list[str] | None = None,
    ano: str = "",
    mes: str = "",
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

    where = " AND ".join(conditions)

    count_sql = text(f"""
        SELECT COUNT(*) FROM fat_pedidos fp
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
        ORDER BY fp.sk_data_pedido DESC
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

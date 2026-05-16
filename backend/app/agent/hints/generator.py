from __future__ import annotations

import re
from typing import Any, Dict, List, Tuple
from app.agent.db.adapters import DatabaseAdapter


_PADRAO_CREATE_TABLE = re.compile(
    r"(CREATE\s+TABLE\s+(?:IF\s+NOT\s+EXISTS\s+)?[`\"\[]?([A-Za-z_][A-Za-z0-9_]*)[\s\S]*?;)",
    re.IGNORECASE,
)
_PADRAO_IDENTIFICADOR = re.compile(r"^[A-Za-z_][A-Za-z0-9_]*$")


_COLUNAS_PARA_LISTAR_VALORES = [
    "tipo_problema",
    "sla_status",
    "genero",
    "segmento_valor",
    "categoria_top",
    "estado",
    "nivel_engajamento",
    "canais_utilizados",
    "dispositivos_utilizados",
    "categoria",
    "faixa_preco",
    "status_estoque",
    "antiguidade_cadastro",
    "origem",
    "categoria_nps",
    "satisfacao_produto",
    "tipo_evento",
    "etapa_funil",
    "canal",
    "origem_sessao",
    "status_tempo_pagina",
    "metodo_pagamento",
    "status",
]
_COLUNAS_LISTAR_SET = set(_COLUNAS_PARA_LISTAR_VALORES)


_PALAVRAS_CHAVE_NUMERICAS = (
    "qtd_",
    "quantidade",
    "valor",
    "receita",
    "preco",
    "ticket",
    "tempo",
    "idade",
    "nps",
    "taxa",
    "total_",
    "media",
    "avg_",
    "pct",
    "dias",
    "peso",
    "estoque",
)


def _extrair_blocos_tabelas(esquema_ddl: str) -> Dict[str, str]:
    blocos: Dict[str, str] = {}
    for correspondencia in _PADRAO_CREATE_TABLE.finditer(esquema_ddl or ""):
        bloco = correspondencia.group(1).strip()
        nome = correspondencia.group(2)
        blocos[nome] = bloco
    return blocos


def _tipo_coluna(definicao_coluna: str) -> str:
    partes = definicao_coluna.split(None, 1)
    if len(partes) < 2:
        return ""

    tipo = partes[1].rstrip(",")
    tipo = re.split(
        r"\b(?:PRIMARY\s+KEY|NOT\s+NULL|NULL|DEFAULT|UNIQUE|CHECK|REFERENCES|COLLATE)\b",
        tipo,
        maxsplit=1,
        flags=re.IGNORECASE,
    )[0]
    return tipo.strip().upper()


def _extrair_colunas_e_tipos(bloco_tabela: str) -> List[Tuple[str, str]]:
    correspondencia = re.search(r"\(([\s\S]*?)\)\s*;?$", bloco_tabela)
    if not correspondencia:
        return []

    bloco_colunas = correspondencia.group(1)
    colunas: List[Tuple[str, str]] = []
    for linha in bloco_colunas.splitlines():
        linha = linha.strip().rstrip(",")
        if not linha:
            continue
        if re.match(r"^(PRIMARY|FOREIGN|UNIQUE|CHECK|CONSTRAINT)\b", linha, flags=re.IGNORECASE):
            continue

        m = re.match(r"[`\"\[]?([A-Za-z_][A-Za-z0-9_]*)", linha)
        if m:
            colunas.append((m.group(1), _tipo_coluna(linha)))

    return colunas


def _quote_identificador(nome: str) -> str:
    if not _PADRAO_IDENTIFICADOR.match(nome):
        raise ValueError(f"Identificador invalido: {nome}")
    return f'"{nome}"'


def _normalizar_valor(valor: Any) -> str:
    if valor is None:
        return "NULL"
    return str(valor)


def _descricao_coluna(nome_coluna: str, tipo_coluna: str) -> str:
    nome_normalizado = nome_coluna.lower()
    tipo_normalizado = tipo_coluna.lower()

    if nome_normalizado.startswith(("sk_", "id_")):
        return "Coluna de identificador/chave; use para joins, contagens ou referencia, nao para listar valores no prompt."

    if "data" in nome_normalizado or "timestamp" in nome_normalizado or any(
        termo in tipo_normalizado for termo in ("date", "time", "timestamp")
    ):
        return "Coluna temporal; use para filtros de periodo, ordenacao e agrupamentos por data."

    if any(termo in nome_normalizado for termo in _PALAVRAS_CHAVE_NUMERICAS) or any(
        termo in tipo_normalizado for termo in ("int", "real", "float", "numeric", "decimal")
    ):
        return "Coluna numerica/continua; use para soma, media, min/max, ordenacao ou filtros de faixa."

    return "Coluna descritiva ou de texto livre; use como contexto, mas nao injete valores distintos automaticamente."


def generate_examples_from_schema(
    esquema_ddl: str,
    db: DatabaseAdapter | None = None,
    limite_valores: int = 60,
) -> List[Dict[str, Any]]:
    """Gera hints do schema para o prompt.

    Se a coluna estiver em _COLUNAS_PARA_LISTAR_VALORES, busca valores reais no
    banco com SELECT DISTINCT e retorna esses valores. Para qualquer outra
    coluna, retorna apenas uma descricao de uso sem executar listagem de valores.
    """
    blocos = _extrair_blocos_tabelas(esquema_ddl or "")
    exemplos: List[Dict[str, Any]] = []

    for tabela, bloco in blocos.items():
        for coluna, tipo_coluna in _extrair_colunas_e_tipos(bloco):
            deve_listar = coluna.lower() in _COLUNAS_LISTAR_SET
            valores: list[str] = []
            erro: str | None = None

            if not deve_listar:
                valores = []
            elif db is None: 
                erro = "DatabaseAdapter nao informado; valores reais nao foram extraidos."
            else:
                try:
                    valores = db.distinct_values(
                        tabela=tabela,
                        coluna=coluna,
                        limite=limite_valores,
                    )
                except Exception as exc:
                    erro = str(exc)

            exemplos.append(
                {
                    "table": tabela,
                    "column": coluna,
                    "type": tipo_coluna,
                    "list_values": deve_listar,
                    "values": valores,
                    "description": (
                        "Coluna categorica controlada; valores reais extraidos do banco para orientar filtros."
                        if deve_listar
                        else _descricao_coluna(coluna, tipo_coluna)
                    ),
                    "error": erro or "",
                }
            )

    return exemplos


def gerar_exemplos_do_esquema(
    esquema_ddl: str,
    db_connection_string: str | None = None, 
    limite_valores: int = 20,
) -> List[Dict[str, Any]]:
    """Alias em portugues para o gerador de hints do schema."""
    return generate_examples_from_schema(
        esquema_ddl=esquema_ddl,
        db_connection_string=db_connection_string, 
        limite_valores=limite_valores,
    )

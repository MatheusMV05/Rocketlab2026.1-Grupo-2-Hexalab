from __future__ import annotations

import re
from typing import Dict, List, Tuple


_PADRAO_CREATE_TABLE = re.compile(
    r"(CREATE\s+TABLE\s+(?:IF\s+NOT\s+EXISTS\s+)?[`\"\[]?([A-Za-z_][A-Za-z0-9_]*)[\s\S]*?;)",
    re.IGNORECASE,
)


def _extrair_blocos_tabelas(esquema_ddl: str) -> Dict[str, str]:
    blocos: Dict[str, str] = {}
    for correspondencia in _PADRAO_CREATE_TABLE.finditer(esquema_ddl or ""):
        bloco = correspondencia.group(1).strip()
        nome = correspondencia.group(2)
        blocos[nome] = bloco
    return blocos


def _extrair_nomes_colunas(bloco_tabela: str) -> List[str]:
    correspondencia = re.search(r"\((([\s\S]*?))\)\s*;?$", bloco_tabela)
    if not correspondencia:
        return []
    bloco_colunas = correspondencia.group(1)
    colunas: List[str] = []
    for linha in bloco_colunas.splitlines():
        linha = linha.strip().rstrip(',')
        if not linha:
            continue
        m = re.match(r"[`\"\[]?([A-Za-z_][A-Za-z0-9_]*)", linha)
        if m:
            colunas.append(m.group(1))
    return colunas


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

_COLUNAS_PARA_APENAS_DESCREVER = [
    "sk_ticket",
    "sk_cliente",
    "sk_pedido",
    "sk_produto",
    "sk_sessao",
    "sk_dispositivo",
    "sk_avaliacao",
    "sk_evento",
    "id_ticket",
    "id_cliente",
    "id_pedido",
    "id_produto",
    "id_sessao",
    "id_dispositivo",
    "id_avaliacao",
    "id_evento",
    "comentario",
    "nome",
    "sobrenome",
    "nome_produto",
    "cidade",
    "categorias_compradas",
    "fornecedor",
    "dispositivos",
    "idade",
    "receita_bruta_brl",
    "valor_pedido_brl",
    "ticket_medio_brl",
    "tempo_resolucao_horas",
    "total_pedidos",
    "avg_tempo_pagina_seg",
    "preco_brl",
    "peso_kg",
    "estoque_disponivel",
    "nota_produto",
    "nota_nps",
    "quantidade",
    "receita_liquida_brl",
    "avg_nota_suporte",
    "dias_desde_ultimo_pedido",
    "preco_medio_venda_brl",
    "sessoes_com_view",
    "sessoes_com_carrinho",
    "sessoes_com_compra",
    "taxa_conversao_pct",
    "total_unidades_vendidas",
    "receita_total_brl",
    "avg_nota_produto",
    "avg_nps",
    "total_recomendacoes",
    "total_tickets_suporte",
    "qtd_dispositivos",
    "total_eventos",
    "total_sessoes",
    "produtos_visualizados",
    "eventos_compra",
    "eventos_pagamento",
    "eventos_carrinho",
    "eventos_abandono",
    "eventos_visualizacao",
    "taxa_conversao_sessao_pct",
    "pedidos_aprovados",
    "receita_lifetime_brl",
    "receita_bruta_lifetime_brl",
    "total_add_to_cart_lifetime",
    "total_eventos_alto_engajamento",
    "nps_medio_cliente",
    "total_tickets",
    "sk_data_abertura",
    "sk_data_resolucao",
    "gold_timestamp",
    "data_ultimo_pedido",
    "data_ultima_venda",
    "data_cadastro",
    "sk_data_cadastro",
    "data_cadastro_produto",
    "sk_data_avaliacao",
    "sk_data_evento",
    "data_evento",
    "sk_data_pedido",
]


_PALAVRAS_CHAVE_NUMERICAS = (
    "id_",
    "sk_",
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
    "media_",
    "pct",
    "dias",
)


def _tipo_coluna_quebra_linha(definicao_coluna: str) -> str:
    partes = definicao_coluna.split(None, 1)
    if len(partes) < 2:
        return ""
    tipo = partes[1].rstrip(",")
    tipo = re.split(r"\b(?:PRIMARY\s+KEY|NOT\s+NULL|NULL|DEFAULT|UNIQUE|CHECK|REFERENCES|COLLATE)\b", tipo, maxsplit=1, flags=re.IGNORECASE)[0]
    return tipo.strip().upper()


def _extrair_colunas_e_tipos(bloco_tabela: str) -> List[Tuple[str, str]]:
    correspondencia = re.search(r"\((([\s\S]*?))\)\s*;?$", bloco_tabela)
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
        if not m:
            continue
        nome_coluna = m.group(1)
        tipo_coluna = _tipo_coluna_quebra_linha(linha)
        colunas.append((nome_coluna, tipo_coluna))
    return colunas


def _coluna_listar_valores(nome_coluna: str, tipo_coluna: str) -> bool:
    nome_normalizado = nome_coluna.lower()
    tipo_normalizado = tipo_coluna.lower()

    if nome_normalizado in _COLUNAS_PARA_LISTAR_VALORES:
        return True

    if any(palavra in nome_normalizado for palavra in ("genero", "estado", "origem", "categoria", "status", "canal", "segmento", "tipo", "metodo")):
        return True

    if tipo_normalizado and any(palavra in tipo_normalizado for palavra in ("char", "text", "clob", "bool")):
        return True

    return False


def _coluna_apenas_descrever(nome_coluna: str, tipo_coluna: str) -> bool:
    nome_normalizado = nome_coluna.lower()
    tipo_normalizado = tipo_coluna.lower()

    if nome_normalizado in _COLUNAS_PARA_APENAS_DESCREVER:
        return True

    if any(nome_normalizado.startswith(prefixo) for prefixo in ("sk_", "id_")):
        return True

    if any(palavra in nome_normalizado for palavra in ("data", "timestamp", "hora", "idade", "valor", "receita", "preco", "quantidade", "taxa", "total", "nps", "tempo", "peso")):
        return True

    if tipo_normalizado and any(palavra in tipo_normalizado for palavra in ("int", "real", "float", "numeric", "decimal", "date", "time", "timestamp")):
        return True

    return len(nome_normalizado) > 12


def _classificar_colunas(colunas: List[Tuple[str, str]]) -> Tuple[List[str], List[str]]:
    """Retorna duas listas: colunas que podem listar valores e colunas que devem apenas ser descritas."""
    colunas_para_listar: List[str] = []
    colunas_para_descrever: List[str] = []

    for nome_coluna, tipo_coluna in colunas:
        if _coluna_listar_valores(nome_coluna, tipo_coluna):
            colunas_para_listar.append(nome_coluna)
        elif _coluna_apenas_descrever(nome_coluna, tipo_coluna):
            colunas_para_descrever.append(nome_coluna)
        else:
            colunas_para_listar.append(nome_coluna)

    return colunas_para_listar, colunas_para_descrever


def generate_examples_from_schema(esquema_ddl: str) -> List[Dict[str, str]]:
    """Gera exemplos SQL a partir do DDL fornecido.

    Para cada tabela encontrada, gera consultas de exemplo com base em duas regras:
    - colunas que devem listar valores distintos;
    - colunas que devem apenas ser descritas com agregações.

    Retorna uma lista de dicionários com as chaves mantidas em inglês para compatibilidade
    com o template atual: "table", "example_sql" e "description".
    """
    blocos = _extrair_blocos_tabelas(esquema_ddl or "")
    exemplos: List[Dict[str, str]] = []
    for tabela, bloco in blocos.items():
        cols = _extrair_colunas_e_tipos(bloco)
        if not cols:
            continue

        colunas_para_listar, colunas_para_descrever = _classificar_colunas(cols)

        if colunas_para_listar:
            colunas_relevantes = colunas_para_listar[:2]
            for coluna in colunas_relevantes:
                exemplos.append({
                    "table": tabela,
                    "example_sql": f'SELECT DISTINCT {coluna} FROM {tabela} LIMIT 5',
                    "description": (
                        f"Exemplo de valores distintos para a coluna '{coluna}', que serve para separar valores categóricos."
                    ),
                })

        if colunas_para_descrever:
            colunas_relevantes = colunas_para_descrever[:2]
            for coluna in colunas_relevantes:
                exemplos.append({
                    "table": tabela,
                    "example_sql": (
                        f"SELECT MIN({coluna}) AS menor_{coluna}, "
                        f"MAX({coluna}) AS maior_{coluna}, "
                        f"AVG({coluna}) AS media_{coluna} FROM {tabela}"
                    ),
                    "description": (
                        f"Exemplo de resumo para a coluna '{coluna}', que deve ser apenas descrita e não listada com valores distintos."
                    ),
                })

        if not colunas_para_listar and not colunas_para_descrever:
            exemplos.append({
                "table": tabela,
                "example_sql": f"SELECT * FROM {tabela} LIMIT 5",
                "description": "Exemplo genérico de amostra da tabela.",
            })

    return exemplos


def gerar_exemplos_do_esquema(esquema_ddl: str) -> List[Dict[str, str]]:
    """Alias em português para o gerador de exemplos."""
    return generate_examples_from_schema(esquema_ddl)

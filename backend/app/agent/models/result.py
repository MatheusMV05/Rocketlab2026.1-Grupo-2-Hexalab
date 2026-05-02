from __future__ import annotations

"""Modelos de resultado retornados pelos agentes do pipeline.

Este módulo centraliza estruturas simples (dataclasses) usadas para
transportar o resultado entre agentes da pipeline (por exemplo,
SelectorAgent -> DecomposerAgent). Manter estes modelos em um único
arquivo facilita typing, testes e alterações futuras na forma dos
resultados.
"""

from dataclasses import dataclass
from typing import List


@dataclass
class SelectorResult:
    """Resultado retornado por `SelectorAgent`.

    Attributes:
        filtered_schema: DDL contendo apenas os blocos `CREATE TABLE`
            validados pelo agente (ou o `full_schema` em fallback).
        tables_selected: Lista de nomes das tabelas selecionadas pelo
            agente, na ordem em que aparecem no DDL filtrado.
        tokens_used: Inteiro com a soma de tokens de input+output
            reportados pelo cliente LLM para esta chamada.
    """

    filtered_schema: str
    tables_selected: List[str]
    tokens_used: int

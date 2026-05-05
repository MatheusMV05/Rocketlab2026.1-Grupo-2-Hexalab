from __future__ import annotations

"""Modelos de resultado retornados pelos agentes do pipeline.

Este módulo centraliza estruturas simples (dataclasses) usadas para
transportar o resultado entre agentes da pipeline (por exemplo,
AgenteSeletor -> próximo agente da pipeline). Manter estes modelos em um único
arquivo facilita tipagem, testes e alterações futuras na forma dos
resultados.
"""

from dataclasses import dataclass


@dataclass
class ResultadoSeletor:
    """Resultado retornado por `AgenteSeletor`.

    Attributes:
        esquema_filtrado: DDL contendo apenas os blocos `CREATE TABLE`
            validados pelo agente (ou o esquema completo em fallback).
        tabelas_selecionadas: Lista de nomes das tabelas selecionadas
            pelo agente, na ordem em que aparecem no DDL filtrado.
        tokens_usados: Inteiro com a soma de tokens de entrada e saída
            reportados pelo cliente LLM para esta chamada.
    """

    esquema_filtrado: str
    tabelas_selecionadas: list[str]
    tokens_usados: int

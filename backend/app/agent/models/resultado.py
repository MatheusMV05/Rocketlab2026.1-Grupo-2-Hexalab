from __future__ import annotations

"""Modelos de resultado retornados pelos agentes do pipeline.

Este módulo centraliza as estruturas usadas para transportar a resposta do
agente seletor e a saída estruturada validada pelo PydanticAI.
"""

from dataclasses import dataclass

from pydantic import BaseModel, Field


class ResultadoSeletorLLM(BaseModel):
    """Saída estruturada retornada pelo PydanticAI no agente seletor."""
    blocos_ddl: list[str] = Field(
        description="Lista contendo as instruções CREATE TABLE estritamente filtradas e sintaticamente válidas."
    )


@dataclass
class ResultadoSeletor:
    """Resultado retornado por `AgenteSeletor`.

    Attributes:
        esquema_filtrado: DDL com os blocos `CREATE TABLE` validados pelo
            agente, ou o esquema completo em fallback.
        tabelas_selecionadas: Lista de tabelas preservadas no DDL filtrado.
        tokens_usados: Total de tokens reportado pelo cliente LLM para a chamada.
    """

    esquema_filtrado: str
    tabelas_selecionadas: list[str]
    tokens_usados: int

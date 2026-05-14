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


class ResultadoDecompositorLLM(BaseModel):
    """Saída estruturada retornada pelo PydanticAI no agente decompositor."""

    reasoning: str = Field(
        description="Raciocínio passo a passo usado para montar a consulta SQL."
    )
    sql: str = Field(
        description="Consulta SQL somente leitura pronta para execução."
    )

class ResultadoRefinadorLLM(BaseModel):
    """Saída estruturada retornada pelo PydanticAI no agente refinador."""
    reasoning: str = Field(
        description="Explicação do que foi corrigido e por quê."
    )
    sql: str = Field(
        description="Consulta SQL corrigida, somente leitura, pronta para execução."
    )


class ResultadoSugestorLLM(BaseModel):
    """Saida estruturada retornada pelo PydanticAI no agente sugestor."""

    perguntas: list[str] = Field(
        min_length=3,
        max_length=3,
        description="Lista com exatamente 3 perguntas sugeridas de follow-up.",
    )


class ResultadoInterpretadorLLM(BaseModel):
    """Saida estruturada retornada pelo PydanticAI no agente interpretador."""

    resposta: str = Field(
        description="Resposta final em linguagem natural, clara e objetiva para o usuario."
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


@dataclass
class ResultadoDecompositor:
    """Resultado retornado por `AgenteDecompositor`.

    Attributes:
        sql: Consulta SQL final gerada para execução.
        raciocinio: Explicação textual do plano lógico usado para montar o SQL.
        tokens_usados: Total de tokens consumidos na chamada ao LLM.
    """

    sql: str
    raciocinio: str
    tokens_usados: int

@dataclass
class ResultadoRefinador:
    """Resultado retornado por `AgenteRefinador`.

    Attributes:
        sql: SQL final corrigido, ou o candidato se já estava correto.
        raciocinio: Explicação do que foi corrigido.
        sucesso: True se o SQL executou com sucesso dentro das tentativas.
        impossivel: True se o LLM declarou que não consegue responder.
        tentativas: Quantas iterações foram feitas.
        ultimo_erro: Último erro do banco, se houver.
        tokens_usados: Total de tokens consumidos em todas as tentativas.
    """
    sql: str
    raciocinio: str
    sucesso: bool
    impossivel: bool
    tentativas: int
    ultimo_erro: str | None
    tokens_usados: int


@dataclass
class ResultadoSugestor:
    """Resultado retornado por `AgenteSugestor`.

    Attributes:
        sugestoes: Lista com exatamente 3 perguntas sugeridas.
        tabela_principal: Tabela principal inferida da consulta SQL.
        tabelas_adjacentes: Tabelas relacionadas usadas para guiar follow-ups.
        tokens_usados: Total de tokens consumidos na chamada ao LLM.
    """

    sugestoes: list[str]
    tabela_principal: str
    tabelas_adjacentes: list[str]
    tokens_usados: int


@dataclass
class ResultadoInterpretador:
    """Resultado retornado por `AgenteInterpretador`.

    Attributes:
        resposta: Texto final em linguagem natural para o usuario.
        tokens_usados: Total de tokens consumidos na chamada ao LLM.
    """

    resposta: str
    tokens_usados: int

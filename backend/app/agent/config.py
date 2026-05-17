from __future__ import annotations

"""Configurações e carregamento de variáveis de ambiente para agentes.

Este módulo fornece utilitários para ler configurações relevantes ao
cliente LLM e a dataclass `Config` usada pelos agentes para acessar
parâmetros comuns como modelo, limites de tokens, tentativas e caminho
para exemplos few-shot.
"""

import os
from dataclasses import dataclass, field
from pathlib import Path

try:
    from dotenv import load_dotenv
except ImportError:  # pragma: no cover
    load_dotenv = None  # type: ignore[assignment]


_CAMINHO_ENV = Path(__file__).resolve().parents[2] / ".env"
if load_dotenv is not None and _CAMINHO_ENV.exists():
    load_dotenv(_CAMINHO_ENV)


def _ler_chave_api_mistral() -> str:
    """Lê a chave da API do Mistral a partir de variáveis de ambiente.

    A função verifica múltiplos nomes comuns para compatibilidade com
    diferentes ambientes e pipelines de CI:
    - `MISTRAL_API_KEY`
    - `Mistral_API`
    - `MISTRAL_API`

    Retorna string vazia se nenhuma variável estiver definida.
    """
    return (
        os.getenv("MISTRAL_API_KEY", "")
        or os.getenv("Mistral_API", "")
        or os.getenv("MISTRAL_API", "")
    )


def _ler_modelo_mistral() -> str:
    """Retorna o nome do modelo Mistral a partir de `MISTRAL_MODEL`.

    Se a variável não estiver definida, retorna um valor padrão
    (`ministral-8b-latest`). Ajuste a variável de ambiente para usar
    outro modelo em tempo de execução.
    """
    return os.getenv("MISTRAL_MODEL", "mistral-large-latest")


def _ler_float_env(nome: str, padrao: float) -> float:
    try:
        return float(os.getenv(nome, str(padrao)))
    except (TypeError, ValueError):
        return padrao


def _ler_int_env(nome: str, padrao: int) -> int:
    try:
        return int(os.getenv(nome, str(padrao)))
    except (TypeError, ValueError):
        return padrao


@dataclass
class Config:
    """Configuração usada pelos agentes da pipeline.

    Attributes:
        api_key: Chave da API para o provedor LLM (lida do ambiente).
        model: Identificador do modelo a ser usado pelo cliente LLM.
        max_tokens: Máximo de tokens de saída solicitados ao LLM.
        max_retries: Número máximo de tentativas em loops de correção.
        few_shot_path: Caminho para exemplos few-shot usados em prompts.
    """

    api_key: str = field(default_factory=_ler_chave_api_mistral)
    model: str = field(default_factory=_ler_modelo_mistral)
    max_tokens: int = 99999
    max_retries: int = 3
    few_shot_path: str = "few_shots/exemplos.yaml"
    mistral_timeout_seconds: float = field(
        default_factory=lambda: _ler_float_env("MISTRAL_TIMEOUT_SECONDS", 240.0)
    )
    input_history_max_tokens: int = field(
        default_factory=lambda: _ler_int_env("AGENT_INPUT_HISTORY_MAX_TOKENS", 7_000)
    )
    context_capability_mode: str = "summarize"
    context_summarizer_model: str = field(
        default_factory=lambda: os.getenv(
            "AGENT_CONTEXT_SUMMARIZER_MODEL",
            "mistral:ministral-8b-latest",
        )
    )

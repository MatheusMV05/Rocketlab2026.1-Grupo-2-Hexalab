from __future__ import annotations

"""Configurações e carregamento de variáveis de ambiente para agentes.

Este módulo fornece utilitários para ler configurações relevantes ao
cliente LLM (chave de API e modelo) e a dataclass `Config` usada por
os agentes para acessar parâmetros comuns (modelo, limites de tokens,
retries e caminhos para exemplos de few-shot).
"""

import os
from dataclasses import dataclass, field


def _read_mistral_api_key() -> str:
    """Lê a chave da API do Mistral a partir de variáveis de ambiente.

    A função verifica múltiplas chaves comuns para compatibilidade com
    diferentes nomes de variável usados em ambientes/CI:
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


def _read_mistral_model() -> str:
    """Retorna o nome do modelo Mistral a partir de `MISTRAL_MODEL`.

    Se a variável não estiver definida, retorna um valor padrão
    (`ministral-8b-latest`). Ajuste a variável de ambiente para usar
    outro modelo em runtime.
    """
    return os.getenv("MISTRAL_MODEL", "ministral-8b-latest")


@dataclass
class Config:
    """Configuração usada pelos agentes da pipeline.

    Attributes:
        api_key: Chave da API para o provedor LLM (lida de ambiente).
        model: Identificador do modelo a ser usado pelo cliente LLM.
        max_tokens: Máximo de tokens de saída solicitados ao LLM.
        max_retries: Número máximo de tentativas em loops de correção.
        few_shot_path: Caminho para exemplos few-shot usados em prompts.
    """

    api_key: str = field(default_factory=_read_mistral_api_key)
    model: str = field(default_factory=_read_mistral_model)
    max_tokens: int = 1024
    max_retries: int = 3
    few_shot_path: str = "few_shots/examples.yaml"

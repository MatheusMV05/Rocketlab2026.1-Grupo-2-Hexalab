from __future__ import annotations

"""Configurações e carregamento de variáveis de ambiente para agentes.

Este módulo fornece utilitários para ler configurações relevantes ao
cliente LLM e a dataclass `Config` usada pelos agentes para acessar
parâmetros comuns como modelo, limites de tokens, tentativas e caminho
para exemplos few-shot.
"""

import os
from dataclasses import dataclass, field


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
    return os.getenv("MISTRAL_MODEL", "ministral-8b-latest")


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
    max_tokens: int = 1024
    max_retries: int = 3
    few_shot_path: str = "few_shots/examples.yaml"

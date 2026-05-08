from __future__ import annotations

from dataclasses import dataclass

from app.agent.config import Config


@dataclass
class ContextoAgente:
    """Dependências injetadas no agente PydanticAI durante a execução.

    Attributes:
        config: Configuração compartilhada do agente, incluindo modelo e chave.
        sistema: Prompt de sistema renderizado previamente, pronto para envio.
    """
    config: Config
    sistema: str

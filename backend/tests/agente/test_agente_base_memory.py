from __future__ import annotations

from app.agent.agentes.agente_base import AgenteBase
from app.agent.config import Config


class AgenteFake(AgenteBase):
    def run(self, **kwargs: object):
        return None


class ResultadoComHistorico:
    output = "resposta"

    def all_messages(self):
        return ["historico-pydantic"]


class ResultadoSemHistorico:
    output = "resposta"


class AgentComHistorico:
    def run_sync(self, usuario, deps=None, message_history=None):
        return ResultadoComHistorico()


class AgentSemHistorico:
    def run_sync(self, usuario, deps=None, message_history=None):
        return ResultadoSemHistorico()


def test_call_llm_prefere_all_messages_do_resultado():
    agente = AgenteFake(config=Config(api_key=""))
    agente._agent = AgentComHistorico()

    texto, tokens, historico = agente._call_llm("sistema", "usuario")

    assert texto == "resposta"
    assert tokens == 0
    assert historico == ["historico-pydantic"]


def test_call_llm_mantem_fallback_serializavel_sem_all_messages():
    agente = AgenteFake(config=Config(api_key=""))
    agente._agent = AgentSemHistorico()

    texto, tokens, historico = agente._call_llm("sistema", "usuario")

    assert texto == "resposta"
    assert tokens == 0
    assert historico == [
        {"role": "user", "content": "usuario"},
        {"role": "assistant", "content": "resposta"},
    ]

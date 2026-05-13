from __future__ import annotations

import sys
import types

from app.agent.agentes.agente_refinador import AgenteRefinador
from app.agent.config import Config
from app.agent.models.resultado import ResultadoRefinadorLLM


def _mock_parser(monkeypatch):
    """Injeta módulo parser falso para não depender da Pessoa B."""
    fake = types.ModuleType("app.agent.agentes.refinador_parser")
    fake.is_impossivel = lambda r: False
    fake.extract_sql = lambda r: r
    fake.extract_reasoning = lambda r: ""
    monkeypatch.setitem(sys.modules, "app.agent.agentes.refinador_parser", fake)


class _DummyUsage:
    total_tokens = 10


class _DummyResult:
    def __init__(self, sql="SELECT 1", reasoning="corrigido"):
        self.data = ResultadoRefinadorLLM(sql=sql, reasoning=reasoning)

    def usage(self):
        return _DummyUsage()


class _DummyAgent:
    def __init__(self, sql="SELECT 1"):
        self._sql = sql

    def run_sync(self, pergunta, deps):
        return _DummyResult(sql=self._sql)


# TR01 — SQL já correto na 1ª tentativa
def test_sql_correto_na_primeira_tentativa(monkeypatch):
    _mock_parser(monkeypatch)

    agente = AgenteRefinador(config=Config(api_key=""))
    agente._agent = _DummyAgent()

    monkeypatch.setattr(agente, "_executar_sql", lambda sql: {"ok": True, "error": None})

    resultado = agente.run(
        candidate_sql="SELECT 1",
        question="teste",
        filtered_schema="CREATE TABLE t (id INTEGER);",
    )

    assert resultado.sucesso is True
    assert resultado.tentativas == 1
    assert resultado.tokens_usados == 0  


# TR02 — SQL corrigido na 2ª tentativa
def test_sql_corrigido_na_segunda_tentativa(monkeypatch):
    _mock_parser(monkeypatch)

    agente = AgenteRefinador(config=Config(api_key=""))
    agente._agent = _DummyAgent(sql="SELECT 2")

    chamadas = {"n": 0}

    def fake_executar(sql):
        chamadas["n"] += 1
        return {"ok": chamadas["n"] >= 2, "error": "erro simulado" if chamadas["n"] < 2 else None}

    monkeypatch.setattr(agente, "_executar_sql", fake_executar)
    monkeypatch.setattr(agente, "_render", lambda *a, **kw: "prompt")

    resultado = agente.run("SELECT errado", "teste", "CREATE TABLE t (id INTEGER);")

    assert resultado.sucesso is True
    assert resultado.tentativas == 2


# TR03 — Esgota max_retries sem corrigir
def test_esgota_max_retries(monkeypatch):
    _mock_parser(monkeypatch)

    agente = AgenteRefinador(config=Config(api_key="", max_retries=3))
    agente._agent = _DummyAgent()

    monkeypatch.setattr(agente, "_executar_sql", lambda sql: {"ok": False, "error": "erro persistente"})
    monkeypatch.setattr(agente, "_render", lambda *a, **kw: "prompt")

    resultado = agente.run("SELECT errado", "teste", "CREATE TABLE t (id INTEGER);")

    assert resultado.sucesso is False
    assert resultado.tentativas == 3
    assert resultado.ultimo_erro == "erro persistente"


# TR04 — LLM retorna IMPOSSIVEL
def test_llm_retorna_impossivel(monkeypatch):
    fake = types.ModuleType("app.agent.agentes.refinador_parser")
    fake.is_impossivel = lambda r: r == "IMPOSSIVEL"
    fake.extract_sql = lambda r: r
    fake.extract_reasoning = lambda r: ""
    monkeypatch.setitem(sys.modules, "app.agent.agentes.refinador_parser", fake)

    agente = AgenteRefinador(config=Config(api_key=""))
    agente._agent = _DummyAgent(sql="IMPOSSIVEL")

    monkeypatch.setattr(agente, "_executar_sql", lambda sql: {"ok": False, "error": "tabela não existe"})
    monkeypatch.setattr(agente, "_render", lambda *a, **kw: "prompt")

    resultado = agente.run("SELECT errado", "teste", "CREATE TABLE t (id INTEGER);")

    assert resultado.impossivel is True
    assert resultado.sucesso is False


# TR05 — Resultado vazio (0 linhas, sem erro)
def test_resultado_vazio_sem_erro(monkeypatch):
    _mock_parser(monkeypatch)

    agente = AgenteRefinador(config=Config(api_key=""))
    agente._agent = _DummyAgent()

    monkeypatch.setattr(agente, "_executar_sql", lambda sql: {"ok": False, "error": None})
    monkeypatch.setattr(agente, "_render", lambda *a, **kw: "prompt")

    resultado = agente.run("SELECT algo", "teste", "CREATE TABLE t (id INTEGER);")

    assert resultado.ultimo_erro is not None
    assert "0 linhas" in resultado.ultimo_erro


# TR06 — tokens_usados acumulado corretamente
def test_tokens_acumulados(monkeypatch):
    _mock_parser(monkeypatch)

    agente = AgenteRefinador(config=Config(api_key="", max_retries=3))
    agente._agent = _DummyAgent()

    monkeypatch.setattr(agente, "_executar_sql", lambda sql: {"ok": False, "error": "erro"})
    monkeypatch.setattr(agente, "_render", lambda *a, **kw: "prompt")

    resultado = agente.run("SELECT errado", "teste", "CREATE TABLE t (id INTEGER);")

    assert resultado.tokens_usados == 30  
from __future__ import annotations

import sys
import types
from pathlib import Path
from unittest.mock import MagicMock

from app.agent.config import Config
from app.agent.models.resultado import (
    ResultadoDecompositor,
    ResultadoRefinador,
    ResultadoSeletor,
)
from app.agent.orquestrador import Orquestrador


def _make_orquestrador(tmp_path: Path) -> Orquestrador:
    """Cria orquestrador apontando para um banco SQLite temporário."""
    db = tmp_path / "test.db"
    db.write_bytes(b"")  
    return Orquestrador(db_path=db, config=Config(api_key=""))


# TO01 — Pergunta inválida é rejeitada pelo guardrail antes de chamar qualquer agente
def test_pergunta_invalida_rejeitada(tmp_path, monkeypatch):
    orq = _make_orquestrador(tmp_path)

    monkeypatch.setattr(
        "app.agent.orquestrador.validar_pergunta_usuario",
        lambda p: (False, "Pergunta fora do escopo"),
    )

    resultado = orq.responder("DROP TABLE users")

    assert resultado.sucesso is False
    assert resultado.erro is not None
    assert "inválida" in resultado.erro


# TO02 — Banco não encontrado retorna erro sem explodir
def test_banco_nao_encontrado(monkeypatch):
    orq = Orquestrador(db_path="/caminho/que/nao/existe.db", config=Config(api_key=""))

    monkeypatch.setattr(
        "app.agent.orquestrador.validar_pergunta_usuario",
        lambda p: (True, ""),
    )

    resultado = orq.responder("quais produtos tiveram mais vendas")

    assert resultado.sucesso is False
    assert resultado.erro is not None
    assert "não encontrado" in resultado.erro


# TO03 — Decompositor sem SQL retorna erro controlado
def test_decompositor_sem_sql(tmp_path, monkeypatch):
    orq = _make_orquestrador(tmp_path)

    monkeypatch.setattr(
        "app.agent.orquestrador.validar_pergunta_usuario",
        lambda p: (True, ""),
    )
    monkeypatch.setattr(
        "app.agent.orquestrador.ler_esquema",
        lambda path: "CREATE TABLE t (id INTEGER);",
    )

    orq.seletor.run = MagicMock(return_value=ResultadoSeletor(
        esquema_filtrado="CREATE TABLE t (id INTEGER);",
        tabelas_selecionadas=["t"],
        tokens_usados=10,
    ))
    orq.decompositor.run = MagicMock(return_value=ResultadoDecompositor(
        sql="",
        raciocinio="não consegui gerar",
        tokens_usados=5,
    ))

    resultado = orq.responder("quais produtos tiveram mais vendas")

    assert resultado.sucesso is False
    assert "não gerou SQL" in resultado.erro


# TO04 — Refinador retorna impossivel
def test_refinador_impossivel(tmp_path, monkeypatch):
    orq = _make_orquestrador(tmp_path)

    monkeypatch.setattr(
        "app.agent.orquestrador.validar_pergunta_usuario",
        lambda p: (True, ""),
    )
    monkeypatch.setattr(
        "app.agent.orquestrador.ler_esquema",
        lambda path: "CREATE TABLE t (id INTEGER);",
    )

    orq.seletor.run = MagicMock(return_value=ResultadoSeletor(
        esquema_filtrado="CREATE TABLE t (id INTEGER);",
        tabelas_selecionadas=["t"],
        tokens_usados=10,
    ))
    orq.decompositor.run = MagicMock(return_value=ResultadoDecompositor(
        sql="SELECT * FROM t",
        raciocinio="ok",
        tokens_usados=5,
    ))
    orq.refinador.run = MagicMock(return_value=ResultadoRefinador(
        sql="SELECT * FROM t",
        raciocinio="impossível",
        sucesso=False,
        impossivel=True,
        tentativas=1,
        ultimo_erro=None,
        tokens_usados=8,
    ))

    resultado = orq.responder("quais produtos tiveram mais vendas")

    assert resultado.impossivel is True
    assert resultado.sucesso is False


# TO05 — Pipeline completo com sucesso
def test_pipeline_completo_sucesso(tmp_path, monkeypatch):
    import sqlite3

    # Cria banco real com tabela e dado
    db = tmp_path / "test.db"
    with sqlite3.connect(db) as conn:
        conn.execute("CREATE TABLE produtos (nome TEXT, vendas INTEGER)")
        conn.execute("INSERT INTO produtos VALUES ('Camiseta', 100)")

    orq = Orquestrador(db_path=db, config=Config(api_key=""))

    monkeypatch.setattr(
        "app.agent.orquestrador.validar_pergunta_usuario",
        lambda p: (True, ""),
    )
    monkeypatch.setattr(
        "app.agent.orquestrador.ler_esquema",
        lambda path: "CREATE TABLE produtos (nome TEXT, vendas INTEGER);",
    )

    orq.seletor.run = MagicMock(return_value=ResultadoSeletor(
        esquema_filtrado="CREATE TABLE produtos (nome TEXT, vendas INTEGER);",
        tabelas_selecionadas=["produtos"],
        tokens_usados=10,
    ))
    orq.decompositor.run = MagicMock(return_value=ResultadoDecompositor(
        sql="SELECT nome, vendas FROM produtos",
        raciocinio="seleciona todos os produtos",
        tokens_usados=15,
    ))
    orq.refinador.run = MagicMock(return_value=ResultadoRefinador(
        sql="SELECT nome, vendas FROM produtos",
        raciocinio="SQL já estava correto",
        sucesso=True,
        impossivel=False,
        tentativas=1,
        ultimo_erro=None,
        tokens_usados=8,
    ))

    resultado = orq.responder("quais produtos tiveram mais vendas")

    assert resultado.sucesso is True
    assert resultado.dados == [("Camiseta", 100)]
    assert resultado.colunas == ["nome", "vendas"]
    assert resultado.tokens_totais == 33 


# TO06 — tokens_totais é soma dos três agentes
def test_tokens_totais_somados(tmp_path, monkeypatch):
    import sqlite3

    db = tmp_path / "test.db"
    with sqlite3.connect(db) as conn:
        conn.execute("CREATE TABLE t (id INTEGER)")

    orq = Orquestrador(db_path=db, config=Config(api_key=""))

    monkeypatch.setattr(
        "app.agent.orquestrador.validar_pergunta_usuario",
        lambda p: (True, ""),
    )
    monkeypatch.setattr(
        "app.agent.orquestrador.ler_esquema",
        lambda path: "CREATE TABLE t (id INTEGER);",
    )

    orq.seletor.run = MagicMock(return_value=ResultadoSeletor(
        esquema_filtrado="CREATE TABLE t (id INTEGER);",
        tabelas_selecionadas=["t"],
        tokens_usados=100,
    ))
    orq.decompositor.run = MagicMock(return_value=ResultadoDecompositor(
        sql="SELECT id FROM t",
        raciocinio="ok",
        tokens_usados=200,
    ))
    orq.refinador.run = MagicMock(return_value=ResultadoRefinador(
        sql="SELECT id FROM t",
        raciocinio="ok",
        sucesso=True,
        impossivel=False,
        tentativas=1,
        ultimo_erro=None,
        tokens_usados=300,
    ))

    resultado = orq.responder("teste")

    assert resultado.tokens_totais == 600


def test_orquestrador_carrega_atualiza_e_salva_historico_da_sessao(tmp_path, monkeypatch):
    import sqlite3

    db = tmp_path / "test.db"
    with sqlite3.connect(db) as conn:
        conn.execute("CREATE TABLE t (id INTEGER)")
        conn.execute("INSERT INTO t VALUES (1)")

    class StoreFake:
        def __init__(self):
            self.history = ["historico inicial"]
            self.saved = None

        def get_history(self, session_id):
            return list(self.history)

        def save_history(self, session_id, history):
            self.saved = list(history)

    store = StoreFake()
    orq = Orquestrador(db_path=db, config=Config(api_key=""))

    monkeypatch.setattr(
        "app.agent.orquestrador.validar_pergunta_usuario",
        lambda p: (True, ""),
    )
    monkeypatch.setattr(
        "app.agent.orquestrador.ler_esquema",
        lambda path: "CREATE TABLE t (id INTEGER);",
    )

    orq.seletor.run = MagicMock(return_value=ResultadoSeletor(
        esquema_filtrado="CREATE TABLE t (id INTEGER);",
        tabelas_selecionadas=["t"],
        tokens_usados=0,
    ))
    orq.decompositor.run = MagicMock(return_value=ResultadoDecompositor(
        sql="SELECT id FROM t",
        raciocinio="ok",
        tokens_usados=0,
        novo_historico=["historico apos decompositor"],
    ))
    orq.refinador.run = MagicMock(return_value=ResultadoRefinador(
        sql="SELECT id FROM t",
        raciocinio="ok",
        sucesso=True,
        impossivel=False,
        tentativas=1,
        ultimo_erro=None,
        tokens_usados=0,
    ))
    orq.interpretador.run = MagicMock(return_value=types.SimpleNamespace(
        resposta="ok",
        tokens_usados=0,
        novo_historico=["historico final"],
    ))

    resultado = orq.responder("teste", session_id="s1", session_store=store)

    assert resultado.novo_historico == ["historico final"]
    assert store.saved == ["historico final"]
    orq.seletor.run.assert_called_once()
    assert orq.seletor.run.call_args.kwargs["message_history"] == ["historico inicial"]
    assert orq.refinador.run.call_args.kwargs["message_history"] == ["historico apos decompositor"]
    assert orq.interpretador.run.call_args.kwargs["message_history"] == ["historico apos decompositor"]

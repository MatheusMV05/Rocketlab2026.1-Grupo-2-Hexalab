from __future__ import annotations

from pydantic_ai import messages as pai_messages

from app.agent.agentes.memory.sql_store import SessionStoreSQL


def test_session_store_sql_salva_e_recupera_model_messages(tmp_path):
    db_url = f"sqlite:///{tmp_path / 'memory.db'}"
    store = SessionStoreSQL(db_url=db_url)
    historico = [
        pai_messages.ModelRequest(
            parts=[pai_messages.UserPromptPart(content="Quanto vendemos em 2023?")]
        ),
        pai_messages.ModelResponse(
            parts=[pai_messages.TextPart(content="Vendemos 1000.")]
        ),
    ]

    store.save_history("sessao-1", historico)
    recuperado = store.get_history("sessao-1")

    assert len(recuperado) == 2
    assert recuperado[0].parts[0].content == "Quanto vendemos em 2023?"
    assert recuperado[1].parts[0].content == "Vendemos 1000."

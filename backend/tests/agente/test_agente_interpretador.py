from __future__ import annotations

from app.agent.agentes.agente_interpretador import AgenteInterpretador


def criar_agente() -> AgenteInterpretador:
    return AgenteInterpretador()


def test_interpretador_retorna_resposta_json(monkeypatch):
    agente = criar_agente()

    def fake_call_llm(*, sistema: str, usuario: str):
        return '{"resposta": "Aqui esta o resumo pedido."}', 12

    monkeypatch.setattr(agente, "_call_llm", fake_call_llm)

    resultado = agente.run(
        pergunta="Me mostre vendas",
        sql_final="SELECT 1",
        colunas=["total"],
        dados=[(100,)],
        erro=None,
    )

    assert resultado.resposta == "Aqui esta o resumo pedido."
    assert resultado.tokens_usados == 12


def test_interpretador_aceita_answer_e_texto_livre(monkeypatch):
    agente = criar_agente()

    def fake_call_llm1(*, sistema: str, usuario: str):
        return '{"answer": "Resposta alternativa."}', 5

    monkeypatch.setattr(agente, "_call_llm", fake_call_llm1)

    resultado1 = agente.run("p", "SELECT 1", ["c"], [], None)
    assert resultado1.resposta == "Resposta alternativa."
    assert resultado1.tokens_usados == 5

    def fake_call_llm2(*, sistema: str, usuario: str):
        return "Texto livre retornado pelo LLM.", 3

    monkeypatch.setattr(agente, "_call_llm", fake_call_llm2)
    resultado2 = agente.run("p", "SELECT 1", ["c"], [], None)
    assert resultado2.resposta == "Texto livre retornado pelo LLM."
    assert resultado2.tokens_usados == 3


def test_interpretador_retorna_vazio_quando_saida_vazia(monkeypatch):
    agente = criar_agente()

    monkeypatch.setattr(agente, "_call_llm", lambda *, sistema, usuario: ("", 0))

    resultado = agente.run("p", "SELECT 1", ["c"], [], None)
    assert resultado.resposta == ""
    assert resultado.tokens_usados == 0

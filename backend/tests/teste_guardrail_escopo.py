from app.agent.Guardrail.sql_guardrail import validar_input_usuario


def test_validar_input_usuario_rejeita_pergunta_fora_do_escopo():
    valido, motivo = validar_input_usuario("qual e o clima de hoje")

    assert valido is False
    assert "fora do escopo" in motivo.lower()


def test_validar_input_usuario_aceita_pergunta_do_domino_vcommerce():
    valido, motivo = validar_input_usuario("quais clientes compraram no ultimo mes")

    assert valido is True
    assert motivo == ""

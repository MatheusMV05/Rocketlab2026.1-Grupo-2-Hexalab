from unittest.mock import patch
import pytest
from app.agent.agentes.memory.memory_store import InMemoryTTLSessionStore


def test_obter_historico_sessao_inexistente():
    """Garante que consultar uma sessão nova ou inexistente retorna lista vazia."""
    store = InMemoryTTLSessionStore()
    historico = store.get_history("sessao_vazia")
    assert historico == []


def test_salvar_e_obter_historico_com_sucesso():
    """Verifica se o histórico salvo é retornado integralmente para a mesma sessão."""
    store = InMemoryTTLSessionStore()
    mensagens_mock = ["usuario: oi", "agente: ola"]

    store.save_history("sessao_123", mensagens_mock)
    historico_recuperado = store.get_history("sessao_123")

    assert historico_recuperado == mensagens_mock
    assert len(historico_recuperado) == 2


def test_isolamento_entre_sessoes():
    """Garante que o histórico de um usuário/aba não vaza para outro."""
    store = InMemoryTTLSessionStore()

    store.save_history("aba_cliente_A", ["select * from clientes"])
    store.save_history("aba_cliente_B", ["select * from vendas"])

    assert store.get_history("aba_cliente_A") == ["select * from clientes"]
    assert store.get_history("aba_cliente_B") == ["select * from vendas"]


def test_expiracao_automatica_ttl():
    """Simula o avanço do tempo para garantir que sessões inativas sejam limpas."""
    with patch("time.time") as mock_time:
        mock_time.return_value = 1000.0

        # Criamos a store com TTL de 10 segundos
        store = InMemoryTTLSessionStore(ttl_seconds=10)
        store.save_history("sessao_expiravel", ["dados da memoria"])

        # Leitura no tempo 1005.0 renova o last_accessed para 1005.0
        mock_time.return_value = 1005.0
        assert store.get_history("sessao_expiravel") == ["dados da memoria"]

        # Para expirar com certeza, precisamos ir além de 1005.0 + 10s (1015.0).
        # Saltamos para 1016.0.
        mock_time.return_value = 1016.0
        assert store.get_history("sessao_expiravel") == []


def test_acesso_renova_tempo_de_vida():
    """Garante que chamar get_history renova o last_accessed e estende o TTL."""
    with patch("time.time") as mock_time:
        mock_time.return_value = 1000.0

        store = InMemoryTTLSessionStore(ttl_seconds=10)
        store.save_history("sessao_renovavel", ["dados"])

        # No tempo 1008.0 (quase expirando), o usuário manda nova mensagem/consulta
        mock_time.return_value = 1008.0
        assert store.get_history("sessao_renovavel") == ["dados"]

        # Como foi acessado no tempo 1008.0, o novo limite de expiração vira 1018.0.
        # Portanto, no tempo 1015.0 a sessão ainda DEVE estar ativa.
        mock_time.return_value = 1015.0
        assert store.get_history("sessao_renovavel") == ["dados"]

        # Passando do novo limite (1019.0), ela finalmente expira
        mock_time.return_value = 1026.0
        assert store.get_history("sessao_renovavel") == []
"""Testes do AgenteSeletor.

Este módulo documenta os cenários cobertos para o agente de seleção de esquema:
validação do DDL retornado pelo LLM, retorno ao esquema completo, extração de
nomes de tabelas e propagação dos tokens usados.
"""

import pytest

from app.agent.agentes.agente_seletor import AgenteSeletor
from app.agent.config import Config


def criar_agente() -> AgenteSeletor:
    """Cria um AgenteSeletor sem cliente LLM real para testes isolados."""
    return AgenteSeletor(config=Config(api_key=""))


def simular_llm(monkeypatch, agente: AgenteSeletor, texto: str, tokens: int = 100):
    """Substitui a chamada ao LLM por uma resposta controlada pelo teste."""
    capturado = {}

    def chamar_llm(*, sistema: str, usuario: str):
        capturado["sistema"] = sistema
        capturado["usuario"] = usuario
        return texto, tokens

    monkeypatch.setattr(agente, "_call_llm", chamar_llm)
    return capturado


def test_selector_retorna_esquema_filtrado_quando_ddl_valido(monkeypatch):
    esquema_completo = """
    CREATE TABLE customers (
      id INTEGER PRIMARY KEY,
      name TEXT
    );
    CREATE TABLE orders (
      id INTEGER PRIMARY KEY,
      customer_id INTEGER
    );
    """

    ddl_llm = """
    CREATE TABLE customers (
      id INTEGER PRIMARY KEY,
      name TEXT
    );
    """

    agente = criar_agente()
    capturado = simular_llm(monkeypatch, agente, ddl_llm, tokens=42)

    resultado = agente.run(esquema_completo=esquema_completo, pergunta="Liste clientes")

    assert "CREATE TABLE customers" in resultado.esquema_filtrado
    assert "orders" not in resultado.esquema_filtrado
    assert resultado.tabelas_selecionadas == ["customers"]
    assert resultado.tokens_usados == 42
    assert "CREATE TABLE customers" in capturado["sistema"]
    assert capturado["usuario"] == "Liste clientes"


def test_selector_retorna_esquema_completo_quando_esquema_tem_uma_tabela(monkeypatch):
    esquema_completo = "CREATE TABLE customers (\n  id INTEGER PRIMARY KEY,\n  name TEXT\n);"

    agente = criar_agente()
    simular_llm(monkeypatch, agente, esquema_completo, tokens=11)

    resultado = agente.run(esquema_completo=esquema_completo, pergunta="Liste clientes")

    assert resultado.esquema_filtrado == esquema_completo
    assert resultado.tabelas_selecionadas == ["customers"]
    assert resultado.tokens_usados == 11


def test_selector_preserva_tabelas_de_relacionamento_e_chave_estrangeira(monkeypatch):
    esquema_completo = """
    CREATE TABLE customers (
      id INTEGER PRIMARY KEY,
      name TEXT
    );
    CREATE TABLE orders (
      id INTEGER PRIMARY KEY,
      customer_id INTEGER,
      FOREIGN KEY (customer_id) REFERENCES customers(id)
    );
    CREATE TABLE products (
      id INTEGER PRIMARY KEY,
      sku TEXT
    );
    """

    ddl_llm = """
    CREATE TABLE customers (
      id INTEGER PRIMARY KEY,
      name TEXT
    );
    CREATE TABLE orders (
      id INTEGER PRIMARY KEY,
      customer_id INTEGER,
      FOREIGN KEY (customer_id) REFERENCES customers(id)
    );
    """

    agente = criar_agente()
    simular_llm(monkeypatch, agente, ddl_llm, tokens=23)

    resultado = agente.run(esquema_completo=esquema_completo, pergunta="Liste pedidos com clientes")

    assert resultado.tabelas_selecionadas == ["customers", "orders"]
    assert "CREATE TABLE products" not in resultado.esquema_filtrado
    assert "FOREIGN KEY (customer_id) REFERENCES customers(id)" in resultado.esquema_filtrado


@pytest.mark.parametrize(
    ("ddl", "esperado"),
    [
        ("CREATE TABLE `orders` (id INTEGER);", ["orders"]),
        ("CREATE TABLE IF NOT EXISTS orders (id INTEGER);", ["orders"]),
        ("CREATE TABLE \"order_items\" (id INTEGER);", ["order_items"]),
        ("create table Orders (id INTEGER);", ["Orders"]),
        (
            """
            CREATE TABLE first (id INTEGER);
            CREATE TABLE second (id INTEGER);
            CREATE TABLE third (id INTEGER);
            """,
            ["first", "second", "third"],
        ),
    ],
)
def test_extrai_tabelas_lida_com_variantes_de_regex(ddl, esperado):
    assert AgenteSeletor._extrair_tabelas(ddl) == esperado


def test_selector_retorna_esquema_completo_quando_saida_nao_e_ddl(monkeypatch):
    esquema_completo = """
    CREATE TABLE customers (
      id INTEGER PRIMARY KEY,
      name TEXT
    );
    CREATE TABLE orders (
      id INTEGER PRIMARY KEY,
      customer_id INTEGER
    );
    """

    agente = criar_agente()
    simular_llm(monkeypatch, agente, "A tabela relevante é orders.", tokens=7)

    resultado = agente.run(esquema_completo=esquema_completo, pergunta="Liste pedidos")

    assert resultado.esquema_filtrado == esquema_completo
    assert resultado.tabelas_selecionadas == ["customers", "orders"]
    assert resultado.tokens_usados == 7


def test_selector_retorna_esquema_completo_quando_saida_do_llm_esta_vazia(monkeypatch):
    esquema_completo = """
    CREATE TABLE customers (
      id INTEGER PRIMARY KEY,
      name TEXT
    );
    CREATE TABLE orders (
      id INTEGER PRIMARY KEY,
      customer_id INTEGER
    );
    """

    agente = criar_agente()
    simular_llm(monkeypatch, agente, "", tokens=13)

    resultado = agente.run(esquema_completo=esquema_completo, pergunta="Liste pedidos")

    assert resultado.esquema_filtrado == esquema_completo
    assert resultado.tabelas_selecionadas == ["customers", "orders"]
    assert resultado.tokens_usados == 13


def test_selector_retorna_esquema_completo_quando_saida_e_somente_comentario_sql(monkeypatch):
    esquema_completo = """
    CREATE TABLE customers (
      id INTEGER PRIMARY KEY,
      name TEXT
    );
    CREATE TABLE orders (
      id INTEGER PRIMARY KEY,
      customer_id INTEGER
    );
    """

    agente = criar_agente()
    simular_llm(monkeypatch, agente, "-- orders", tokens=5)

    resultado = agente.run(esquema_completo=esquema_completo, pergunta="Liste pedidos")

    assert resultado.esquema_filtrado == esquema_completo
    assert resultado.tabelas_selecionadas == ["customers", "orders"]
    assert resultado.tokens_usados == 5


def test_selector_lida_com_esquema_completo_vazio(monkeypatch):
    agente = criar_agente()
    simular_llm(monkeypatch, agente, "", tokens=0)

    resultado = agente.run(esquema_completo="", pergunta="Qualquer coisa")

    assert resultado.esquema_filtrado == ""
    assert resultado.tabelas_selecionadas == []
    assert resultado.tokens_usados == 0


def test_selector_lida_com_pergunta_vazia(monkeypatch):
    esquema_completo = "CREATE TABLE customers (\n  id INTEGER PRIMARY KEY,\n  name TEXT\n);"

    agente = criar_agente()
    capturado = simular_llm(monkeypatch, agente, esquema_completo, tokens=17)

    resultado = agente.run(esquema_completo=esquema_completo, pergunta="")

    assert resultado.esquema_filtrado == esquema_completo
    assert resultado.tabelas_selecionadas == ["customers"]
    assert resultado.tokens_usados == 17
    assert capturado["usuario"] == ""


def test_selector_ignora_views_na_lista_de_tabelas_selecionadas(monkeypatch):
    esquema_completo = """
    CREATE TABLE customers (
      id INTEGER PRIMARY KEY,
      name TEXT
    );
    CREATE VIEW v_summary AS
    SELECT id, name
    FROM customers;
    CREATE TABLE orders (
      id INTEGER PRIMARY KEY,
      customer_id INTEGER
    );
    """

    ddl_llm = """
    CREATE TABLE customers (
      id INTEGER PRIMARY KEY,
      name TEXT
    );
    CREATE VIEW v_summary AS
    SELECT id, name
    FROM customers;
    """

    agente = criar_agente()
    simular_llm(monkeypatch, agente, ddl_llm, tokens=19)

    resultado = agente.run(esquema_completo=esquema_completo, pergunta="Liste clientes")

    assert resultado.tabelas_selecionadas == ["customers"]
    assert "v_summary" not in resultado.tabelas_selecionadas
    assert "CREATE VIEW v_summary" not in resultado.esquema_filtrado


def test_selector_propaga_tokens_usados(monkeypatch):
    esquema_completo = """
    CREATE TABLE customers (
      id INTEGER PRIMARY KEY,
      name TEXT
    );
    """

    agente = criar_agente()
    simular_llm(monkeypatch, agente, esquema_completo, tokens=2847)

    resultado = agente.run(esquema_completo=esquema_completo, pergunta="Liste clientes")

    assert resultado.tokens_usados == 2847


@pytest.mark.integration
def test_selector_integracao_com_llm_real():
    configuracao = Config()
    if not configuracao.api_key:
        pytest.skip("MISTRAL_API_KEY not configured")

    try:
        agente = AgenteSeletor(config=configuracao)
    except RuntimeError as exc:
        pytest.skip(str(exc))

    esquema_completo = """
    CREATE TABLE customers (
      id INTEGER PRIMARY KEY,
      name TEXT
    );
    CREATE TABLE orders (
      id INTEGER PRIMARY KEY,
      customer_id INTEGER,
      FOREIGN KEY (customer_id) REFERENCES customers(id)
    );
    CREATE TABLE products (
      id INTEGER PRIMARY KEY,
      sku TEXT
    );
    """

    resultado = agente.run(
        esquema_completo=esquema_completo,
        pergunta="Quais tabelas preciso para listar pedidos com clientes?",
    )

    assert resultado.tabelas_selecionadas
    assert resultado.tokens_usados > 0
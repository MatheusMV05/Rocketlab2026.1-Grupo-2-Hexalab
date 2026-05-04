import pytest

from app.agent.agents.selector import SelectorAgent
from app.agent.config import Config


def _make_agent() -> SelectorAgent:
    return SelectorAgent(config=Config(api_key=""))


def _mock_llm(monkeypatch, agent: SelectorAgent, text: str, tokens: int = 100):
    captured = {}

    def _call_llm(system: str, user: str):
        captured["system"] = system
        captured["user"] = user
        return text, tokens

    monkeypatch.setattr(agent, "_call_llm", _call_llm)
    return captured


def test_selector_returns_filtered_schema_when_valid_ddl(monkeypatch):
    full_schema = """
    CREATE TABLE customers (
      id INTEGER PRIMARY KEY,
      name TEXT
    );
    CREATE TABLE orders (
      id INTEGER PRIMARY KEY,
      customer_id INTEGER
    );
    """

    llm_ddl = """
    CREATE TABLE customers (
      id INTEGER PRIMARY KEY,
      name TEXT
    );
    """

    agent = _make_agent()
    captured = _mock_llm(monkeypatch, agent, llm_ddl, tokens=42)

    result = agent.run(full_schema=full_schema, question="Liste clientes")

    assert "CREATE TABLE customers" in result.filtered_schema
    assert "orders" not in result.filtered_schema
    assert result.tables_selected == ["customers"]
    assert result.tokens_used == 42
    assert "CREATE TABLE customers" in captured["system"]
    assert captured["user"] == "Liste clientes"


def test_selector_returns_full_schema_when_schema_has_one_table(monkeypatch):
    full_schema = "CREATE TABLE customers (\n  id INTEGER PRIMARY KEY,\n  name TEXT\n);"

    agent = _make_agent()
    _mock_llm(monkeypatch, agent, full_schema, tokens=11)

    result = agent.run(full_schema=full_schema, question="Liste clientes")

    assert result.filtered_schema == full_schema
    assert result.tables_selected == ["customers"]
    assert result.tokens_used == 11


def test_selector_preserves_join_tables_and_foreign_key(monkeypatch):
    full_schema = """
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

    llm_ddl = """
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

    agent = _make_agent()
    _mock_llm(monkeypatch, agent, llm_ddl, tokens=23)

    result = agent.run(full_schema=full_schema, question="Liste pedidos com clientes")

    assert result.tables_selected == ["customers", "orders"]
    assert "CREATE TABLE products" not in result.filtered_schema
    assert "FOREIGN KEY (customer_id) REFERENCES customers(id)" in result.filtered_schema


@pytest.mark.parametrize(
    ("ddl", "expected"),
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
def test_extract_tables_handles_regex_variants(ddl, expected):
    assert SelectorAgent._extract_tables(ddl) == expected


def test_selector_fallbacks_to_full_schema_when_output_is_not_ddl(monkeypatch):
    full_schema = """
    CREATE TABLE customers (
      id INTEGER PRIMARY KEY,
      name TEXT
    );
    CREATE TABLE orders (
      id INTEGER PRIMARY KEY,
      customer_id INTEGER
    );
    """

    agent = _make_agent()
    _mock_llm(monkeypatch, agent, "The relevant table is orders.", tokens=7)

    result = agent.run(full_schema=full_schema, question="Liste pedidos")

    assert result.filtered_schema == full_schema
    assert result.tables_selected == ["customers", "orders"]
    assert result.tokens_used == 7


def test_selector_fallbacks_on_empty_llm_output(monkeypatch):
    full_schema = """
    CREATE TABLE customers (
      id INTEGER PRIMARY KEY,
      name TEXT
    );
    CREATE TABLE orders (
      id INTEGER PRIMARY KEY,
      customer_id INTEGER
    );
    """

    agent = _make_agent()
    _mock_llm(monkeypatch, agent, "", tokens=13)

    result = agent.run(full_schema=full_schema, question="Liste pedidos")

    assert result.filtered_schema == full_schema
    assert result.tables_selected == ["customers", "orders"]
    assert result.tokens_used == 13


def test_selector_fallbacks_on_sql_comment_only(monkeypatch):
    full_schema = """
    CREATE TABLE customers (
      id INTEGER PRIMARY KEY,
      name TEXT
    );
    CREATE TABLE orders (
      id INTEGER PRIMARY KEY,
      customer_id INTEGER
    );
    """

    agent = _make_agent()
    _mock_llm(monkeypatch, agent, "-- orders", tokens=5)

    result = agent.run(full_schema=full_schema, question="Liste pedidos")

    assert result.filtered_schema == full_schema
    assert result.tables_selected == ["customers", "orders"]
    assert result.tokens_used == 5


def test_selector_handles_empty_full_schema(monkeypatch):
    agent = _make_agent()
    _mock_llm(monkeypatch, agent, "", tokens=0)

    result = agent.run(full_schema="", question="Anything")

    assert result.filtered_schema == ""
    assert result.tables_selected == []
    assert result.tokens_used == 0


def test_selector_handles_empty_question(monkeypatch):
    full_schema = "CREATE TABLE customers (\n  id INTEGER PRIMARY KEY,\n  name TEXT\n);"

    agent = _make_agent()
    captured = _mock_llm(monkeypatch, agent, full_schema, tokens=17)

    result = agent.run(full_schema=full_schema, question="")

    assert result.filtered_schema == full_schema
    assert result.tables_selected == ["customers"]
    assert result.tokens_used == 17
    assert captured["user"] == ""


def test_selector_ignores_views_in_selected_tables(monkeypatch):
    full_schema = """
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

    llm_ddl = """
    CREATE TABLE customers (
      id INTEGER PRIMARY KEY,
      name TEXT
    );
    CREATE VIEW v_summary AS
    SELECT id, name
    FROM customers;
    """

    agent = _make_agent()
    _mock_llm(monkeypatch, agent, llm_ddl, tokens=19)

    result = agent.run(full_schema=full_schema, question="Liste clientes")

    assert result.tables_selected == ["customers"]
    assert "v_summary" not in result.tables_selected
    assert "CREATE VIEW v_summary" not in result.filtered_schema


def test_selector_propagates_tokens_used(monkeypatch):
    full_schema = """
    CREATE TABLE customers (
      id INTEGER PRIMARY KEY,
      name TEXT
    );
    """

    agent = _make_agent()
    _mock_llm(monkeypatch, agent, full_schema, tokens=2847)

    result = agent.run(full_schema=full_schema, question="Liste clientes")

    assert result.tokens_used == 2847


@pytest.mark.integration
def test_selector_integration_real_llm():
    config = Config()
    if not config.api_key:
        pytest.skip("MISTRAL_API_KEY not configured")

    try:
        agent = SelectorAgent(config=config)
    except RuntimeError as exc:
        pytest.skip(str(exc))

    full_schema = """
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

    result = agent.run(full_schema=full_schema, question="Quais tabelas preciso para listar pedidos com clientes?")

    assert result.tables_selected
    assert result.tokens_used > 0

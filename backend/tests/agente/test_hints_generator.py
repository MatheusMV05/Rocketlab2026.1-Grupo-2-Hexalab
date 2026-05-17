import sqlite3

from app.agent.hints.generator import generate_examples_from_schema


def test_generator_lista_valores_reais_apenas_para_colunas_permitidas(tmp_path):
    db_path = tmp_path / "teste.db"
    with sqlite3.connect(db_path) as conn:
        conn.execute(
            "CREATE TABLE pedidos (id INTEGER, status TEXT, receita_total_brl REAL)"
        )
        conn.executemany(
            "INSERT INTO pedidos VALUES (?, ?, ?)",
            [
                (1, "aprovado", 10.5),
                (2, "cancelado", 20.0),
                (3, "aprovado", 30.0),
            ],
        )

    ddl = """
    CREATE TABLE pedidos (
        id INTEGER,
        status TEXT,
        receita_total_brl REAL
    );
    """

    hints = generate_examples_from_schema(ddl, db_path=db_path)
    por_coluna = {hint["column"]: hint for hint in hints}

    assert por_coluna["status"]["list_values"] is True
    assert por_coluna["status"]["values"] == ["aprovado", "cancelado"]

    assert por_coluna["id"]["list_values"] is False
    assert por_coluna["id"]["values"] == []

    assert por_coluna["receita_total_brl"]["list_values"] is False
    assert por_coluna["receita_total_brl"]["values"] == []

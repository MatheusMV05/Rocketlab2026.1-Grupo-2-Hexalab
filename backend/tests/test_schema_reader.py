import sqlite3

from app.agent.db.schema_reader import read_schema


def test_read_schema_returns_sqlite_ddl_with_semicolons(tmp_path):
    db_path = tmp_path / "test.db"
    with sqlite3.connect(db_path) as connection:
        connection.execute(
            """
            CREATE TABLE dim_consumidores (
                id_consumidor TEXT,
                nome_consumidor TEXT
            )
            """
        )
        connection.execute(
            """
            CREATE VIEW vw_consumidores AS
            SELECT id_consumidor, nome_consumidor
            FROM dim_consumidores
            """
        )

    schema = read_schema(db_path)

    assert 'CREATE TABLE dim_consumidores' in schema
    assert 'CREATE VIEW vw_consumidores' in schema
    assert schema.count(";") == 2

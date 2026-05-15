import sqlite3

from app.agent.db.leitor_esquema import ler_esquema


def test_ler_esquema_retorna_ddl_sqlite_com_ponto_e_virgula(tmp_path):
    caminho_banco = tmp_path / "test.db"
    with sqlite3.connect(caminho_banco) as conexao:
        conexao.execute(
            """
            CREATE TABLE dim_consumidores (
                id_consumidor TEXT,
                nome_consumidor TEXT
            )
            """
        )
        conexao.execute(
            """
            CREATE VIEW vw_consumidores AS
            SELECT id_consumidor, nome_consumidor
            FROM dim_consumidores
            """
        )

    esquema = ler_esquema(caminho_banco)

    assert "CREATE TABLE dim_consumidores" in esquema
    assert "CREATE VIEW vw_consumidores" in esquema
    assert esquema.count(";") == 2
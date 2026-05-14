import sqlite3
from pathlib import Path

import pandas as pd


db_path = Path("backend/data/database.db")
output_dir = Path("reports")
output_dir.mkdir(exist_ok=True)

print(f"Conectando ao banco em: {db_path}")


def descrever_tabela(conn: sqlite3.Connection, tabela: str) -> None:
    print("=" * 100)
    print(f"TABELA: {tabela}")
    print("=" * 100)

    df = pd.read_sql_query(f'SELECT * FROM "{tabela}"', conn)
    print(f"Linhas: {len(df)} | Colunas: {len(df.columns)}")
    print("\nColunas e tipos:")
    print(df.dtypes.to_string())

    print("\nAmostra das primeiras linhas:")
    print(df.head(5).to_string(index=False))

    print("\nDescribe completo:")
    descricao = df.describe(include="all").transpose()
    print(descricao.to_string())

    saida = output_dir / f"resumo_{tabela}.txt"
    with saida.open("w", encoding="utf-8") as arquivo:
        arquivo.write(f"TABELA: {tabela}\n")
        arquivo.write(f"Linhas: {len(df)} | Colunas: {len(df.columns)}\n\n")
        arquivo.write("Colunas e tipos:\n")
        arquivo.write(df.dtypes.to_string())
        arquivo.write("\n\nAmostra das primeiras linhas:\n")
        arquivo.write(df.head(5).to_string(index=False))
        arquivo.write("\n\nDescribe completo:\n")
        arquivo.write(descricao.to_string())

    print(f"\nResumo salvo em: {saida}")


try:
    with sqlite3.connect(db_path) as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT name FROM sqlite_master WHERE type='table';")
        tabelas = [row[0] for row in cursor.fetchall() if row[0] != "sqlite_stat1"]

        print(f"Tabelas encontradas: {tabelas}")

        if not tabelas:
            print("Nenhuma tabela encontrada no banco de dados")
        else:
            for tabela in tabelas:
                descrever_tabela(conn, tabela)

except Exception as e:
    print(f"Erro: {e}")
    import traceback

    traceback.print_exc()
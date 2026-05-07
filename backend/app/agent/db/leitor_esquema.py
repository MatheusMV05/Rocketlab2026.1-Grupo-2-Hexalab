from __future__ import annotations

import sqlite3
from pathlib import Path


def ler_esquema(db_path: str | Path) -> str:
    """Lê o DDL de tabelas e views de um banco SQLite.

    A função conecta ao banco SQLite indicado por ``db_path`` e consulta
    ``sqlite_master`` por objetos dos tipos ``table`` e ``view``
    (excluindo objetos internos cujo nome começa com ``sqlite_``).

    Retorna uma única string contendo os blocos DDL encontrados (cada
    bloco terminando em ``;``) separados por duas quebras de linha -
    formato adequado para inclusão em prompts ou para processamento
    por agentes da pipeline.

    Args:
        db_path: Caminho (``str`` ou ``Path``) para o arquivo do banco
            SQLite.

    Returns:
        Uma string com as instruções DDL concatenadas para todas as
        tabelas e views encontradas. Cada instrução termina com ponto e
        vírgula e os blocos são separados por uma linha em branco.

    Raises:
        FileNotFoundError: Se ``db_path`` não existir.

    Observações:
        - Entradas com ``sql IS NULL`` são ignoradas (ex.: algumas
          tabelas virtuais ou metadados sem SQL).
        - A ordenação por ``type`` e ``name`` garante saída estável entre
          execuções.

    Exemplo:
        >>> ler_esquema('data/my.db')
        'CREATE TABLE customers (id INTEGER PRIMARY KEY, name TEXT);\n\nCREATE TABLE orders (id INTEGER, customer_id INTEGER);'
    """
    caminho = Path(db_path)
    if not caminho.exists():
        raise FileNotFoundError(f"Banco SQLite não encontrado: {caminho}")

    with sqlite3.connect(caminho) as conexao:
        linhas = conexao.execute(
            """
            SELECT sql
            FROM sqlite_master
            WHERE type IN ('table', 'view')
              AND name NOT LIKE 'sqlite_%'
              AND sql IS NOT NULL
            ORDER BY type, name
            """
        ).fetchall()

    blocos_ddl = []
    for (sql,) in linhas:
        block = sql.strip()
        if not block.endswith(";"):
            block += ";"
        blocos_ddl.append(block)

    return "\n\n".join(blocos_ddl)

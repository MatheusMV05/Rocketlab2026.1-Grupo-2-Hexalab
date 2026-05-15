from __future__ import annotations

import psycopg2

def ler_esquema(db_connection_string: str) -> str:
    """Lê o DDL das tabelas do schema public de um banco PostgreSQL.

    Como o Postgres não armazena a string original do CREATE TABLE como o SQLite,
    esta função consulta o information_schema e reconstrói blocos CREATE TABLE
    básicos para serem passados ao agente LLM.

    Args:
        db_connection_string: String de conexão do PostgreSQL.

    Returns:
        Uma string com as instruções DDL reconstruídas para todas as
        tabelas encontradas. Cada instrução termina com ponto e vírgula
        e os blocos são separados por duas quebras de linha.
    """
    if not db_connection_string:
        raise ValueError("String de conexão com o banco não fornecida.")

    query = """
    SELECT table_name, column_name, data_type 
    FROM information_schema.columns 
    WHERE table_schema = 'public' 
    ORDER BY table_name, ordinal_position;
    """

    try:
        with psycopg2.connect(db_connection_string) as conexao:
            with conexao.cursor() as cursor:
                cursor.execute(query)
                linhas = cursor.fetchall()
    except Exception as e:
        raise ConnectionError(f"Erro ao conectar no PostgreSQL: {e}")

    tabelas = {}
    for table_name, column_name, data_type in linhas:
        if table_name not in tabelas:
            tabelas[table_name] = []
        # Ex: "id_pedido integer"
        tabelas[table_name].append(f"    {column_name} {data_type}")

    blocos_ddl = []
    for tabela, colunas in tabelas.items():
        colunas_str = ",\n".join(colunas)
        bloco = f"CREATE TABLE {tabela} (\n{colunas_str}\n);"
        blocos_ddl.append(bloco)

    return "\n\n".join(blocos_ddl)
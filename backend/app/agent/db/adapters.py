from abc import ABC, abstractmethod
from typing import List, Tuple, Any, Dict
import psycopg2

class DatabaseAdapter(ABC):
    """Interface abstrata (tomada universal) para desacoplar a pipeline do banco."""
    
    @abstractmethod
    def read_schema(self) -> str:
        """Retorna o esquema do banco em formato de DDL para o prompt."""
        pass

    @abstractmethod
    def execute_readonly(self, sql: str) -> Tuple[List[Tuple[Any, ...]], List[str], str | None]:
        """Executa um SELECT seguro e retorna (dados, colunas, erro)."""
        pass

    @abstractmethod
    def distinct_values(self, tabela: str, coluna: str, limite: int = 60) -> List[str]:
        """Busca valores distintos reais de uma coluna categórica."""
        pass


class PostgresAdapter(DatabaseAdapter):
    """Implementação concreta do adaptador para o banco PostgreSQL."""
    
    def __init__(self, connection_string: str):
        self.connection_string = connection_string

    def read_schema(self) -> str:
        query = """
        SELECT table_name, column_name, data_type 
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
        ORDER BY table_name, ordinal_position;
        """
        try:
            with psycopg2.connect(self.connection_string) as conn:
                with conn.cursor() as cursor:
                    cursor.execute(query)
                    linhas = cursor.fetchall()
        except Exception as e:
            raise ConnectionError(f"Erro ao ler esquema no Postgres: {e}")

        tabelas: Dict[str, List[str]] = {}
        for table_name, column_name, data_type in linhas:
            if table_name not in tabelas:
                tabelas[table_name] = []
            tabelas[table_name].append(f"    {column_name} {data_type}")

        blocos_ddl = []
        for tabela, colunas in tabelas.items():
            colunas_str = ",\n".join(colunas)
            blocos_ddl.append(f"CREATE TABLE {tabela} (\n{colunas_str}\n);")
        
        return "\n\n".join(blocos_ddl)

    def execute_readonly(self, sql: str) -> Tuple[List[Tuple[Any, ...]], List[str], str | None]:
        try:
            with psycopg2.connect(self.connection_string) as conn:
                with conn.cursor() as cursor:
                    cursor.execute(sql)
                    if cursor.description:
                        colunas = [desc[0] for desc in cursor.description]
                        dados = cursor.fetchall()
                    else:
                        colunas, dados = [], []
                    return dados, colunas, None
        except Exception as e:
            return [], [], str(e)

    def distinct_values(self, tabela: str, coluna: str, limite: int = 60) -> List[str]:
        # Sanitização simples para evitar problemas estruturais de identificadores
        tabela_safe = "".join([c for c in tabela if c.isalnum() or c == '_'])
        coluna_safe = "".join([c for c in coluna if c.isalnum() or c == '_'])
        
        sql = (
            f'SELECT DISTINCT "{coluna_safe}" '
            f'FROM "{tabela_safe}" '
            f'WHERE "{coluna_safe}" IS NOT NULL '
            f'ORDER BY "{coluna_safe}" '
            f'LIMIT %s'
        )
        try:
            with psycopg2.connect(self.connection_string) as conn:
                with conn.cursor() as cursor:
                    cursor.execute(sql, (limite,))
                    return [str(linha[0]) for linha in cursor.fetchall()]
        except Exception:
            return []
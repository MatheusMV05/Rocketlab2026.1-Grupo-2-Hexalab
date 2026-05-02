from __future__ import annotations
 
import re
import logging
 
from app.agent.agents.base import BaseAgent
from app.agent.models.result import SelectorResult
 
# Detecta qualquer instrução CREATE TABLE no output do LLM,
# independente de maiúsculas/minúsculas ou espaços extras.
_CREATE_TABLE_PATTERN = re.compile(r"CREATE\s+TABLE", re.IGNORECASE)
 
# Captura o nome da tabela após CREATE TABLE, tolerando:
# - IF NOT EXISTS opcional
# - Identificadores entre backtick, aspas duplas ou colchetes (dialetos SQL)
# - Nomes com letras, números e underscore
_TABLE_NAME_PATTERN = re.compile(
    r"CREATE\s+TABLE\s+(?:IF\s+NOT\s+EXISTS\s+)?[`\"\[]?([A-Za-z_][A-Za-z0-9_]*)",
    re.IGNORECASE,
)
 
logger = logging.getLogger(__name__)

 
class SelectorAgent(BaseAgent):
    """Agente 1 da pipeline MAC-SQL — filtra o schema do banco de dados.
 
    Recebe o schema DDL completo do banco e a pergunta do usuário e pede
    ao LLM que devolva apenas as tabelas e colunas necessárias para
    responder à pergunta. Isso reduz o contexto enviado ao Decompositor,
    diminuindo custo de tokens e ruído que poderia desviar a geração do SQL.
 
    O agente aplica um fallback automático: se o LLM não devolver DDL
    válido (sem nenhum ``CREATE TABLE``), o schema completo é usado no
    lugar, garantindo que a pipeline nunca trave por output inesperado.
 
    Attributes:
        Herda todos os atributos de `BaseAgent`.
 
    Example::
 
        agent = SelectorAgent(config=Config())
        result = agent.run(
            full_schema="CREATE TABLE orders (...); CREATE TABLE customers (...);",
            question="How many orders were placed last month?",
        )
        print(result.tables_selected)   # ["orders"]
        print(result.tokens_used)       # ex: 2847
    """
 
    def run(self, full_schema: str, question: str) -> SelectorResult:
        """Filtra o schema e retorna apenas as tabelas relevantes para a pergunta.
 
        Fluxo:
        1. Renderiza o system prompt ``prompts/selector.j2`` com o schema
           completo.
        2. Envia a pergunta como mensagem do usuário ao LLM.
        3. Valida que o output contém pelo menos um ``CREATE TABLE``.
        4. Em caso de falha na validação, faz fallback para o schema
           completo (sem interromper a pipeline).
        5. Extrai os nomes das tabelas presentes no DDL resultante.
 
        Args:
            full_schema: DDL completo do banco de dados, contendo todos os
                ``CREATE TABLE`` statements. Gerado por
                ``db.schema_reader.read_schema()``.
            question: Pergunta original do usuário em linguagem natural,
                sem pré-processamento.
 
        Returns:
            `SelectorResult` com:
            - ``filtered_schema``: DDL com apenas as tabelas relevantes
              (ou o schema completo se o LLM não retornou DDL válido).
            - ``tables_selected``: lista com os nomes das tabelas
              identificadas no DDL filtrado.
            - ``tokens_used``: total de tokens consumidos nesta chamada.
        """
        logger.debug("SelectorAgent.run: schema length=%d", len(full_schema or ""))
        original_blocks = self._extract_table_blocks(full_schema)
        schema_summary: dict[str, dict[str, object]] = {}
        for name, block in original_blocks.items():
            schema_summary[name] = {
                "cols": self._extract_column_names(block),
                "desc": "",
            }

        try:
            from pathlib import Path
            import json

            desc_path = Path(__file__).resolve().parents[1] / "db" / "table_descriptions.json"
            logger.debug("SelectorAgent.run: desc_path=%s exists=%s", desc_path, desc_path.exists())
            if desc_path.exists():
                with open(desc_path, "r", encoding="utf8") as fh:
                    desc_map = json.load(fh)
                logger.debug("SelectorAgent.run: loaded %d descriptions", len(desc_map))
                for tname, desc in desc_map.items():
                    if tname in schema_summary:
                        schema_summary[tname]["desc"] = desc
                        logger.debug("SelectorAgent.run: set desc for table %s", tname)
        except Exception as e:
            # Non-fatal: if descriptions cannot be read, proceed with empty descriptions
            logger.debug("SelectorAgent.run: failed to load descriptions: %s", e)

        system_prompt = self._render(
            "selector",
            schema=full_schema,
            question=question,
            schema_summary=schema_summary,
        )
        logger.debug("SelectorAgent.run: system prompt preview:\n%s", (system_prompt or "")[:2000])
 
        filtered_schema, tokens_used = self._call_llm(
            system=system_prompt,
            user=question,
        )
        logger.debug("SelectorAgent.run: LLM tokens_used=%s; output length=%d", tokens_used, len(filtered_schema or ""))
        logger.debug("SelectorAgent.run: LLM output preview:\n%s", (filtered_schema or "")[:2000])
        # Fallback: se o LLM devolveu texto livre (sem DDL), usa o schema
        # completo para não bloquear o Decompositor.
        if not _CREATE_TABLE_PATTERN.search(filtered_schema or ""):
            logger.info("SelectorAgent: LLM output contains no CREATE TABLE; using full_schema fallback")
            filtered_schema = full_schema
            tables_selected = self._extract_tables(filtered_schema)
            return SelectorResult(
                filtered_schema=filtered_schema,
                tables_selected=tables_selected,
                tokens_used=tokens_used,
            )

        # Segurança extra: o LLM às vezes inventa nomes/colunas. Garantimos
        # que o DDL final contenha apenas tabelas que já existam no
        # `full_schema`. Para isso, usamos os blocos CREATE TABLE extraídos
        # anteriormente (`original_blocks`) e reconstruímos o DDL filtrado
        # usando apenas os nomes retornados pelo LLM que também estejam no esquema.
        candidate_tables = self._extract_tables(filtered_schema)
        logger.debug("SelectorAgent: candidate_tables from LLM=%s", candidate_tables)

        validated_blocks: list[str] = []
        validated_tables: list[str] = []
        for t in candidate_tables:
            if t in original_blocks:
                validated_blocks.append(original_blocks[t])
                validated_tables.append(t)

        logger.debug("SelectorAgent: validated_tables after cross-check=%s", validated_tables)

        # Se nenhum dos nomes retornados pelo LLM for confiável, faz
        # fallback para o schema completo (modo conservador).
        # Dentro do método run do SelectorAgent, após o _call_llm:
        if not validated_blocks:
            logger.info("SelectorAgent: no validated CREATE TABLE blocks found; falling back to full schema")
            filtered_schema = full_schema
            tables_selected = self._extract_tables(full_schema)
        else:
            filtered_schema = "\n\n".join(validated_blocks)
            tables_selected = validated_tables
            logger.info("SelectorAgent: returning validated filtered_schema with tables=%s", tables_selected)
 
        return SelectorResult(
            filtered_schema=filtered_schema,
            tables_selected=tables_selected,
            tokens_used=tokens_used,
        )

    @staticmethod
    def _extract_column_names(table_block: str) -> list[str]:
        """Extrai os nomes das colunas de um bloco `CREATE TABLE ...`.

        A função busca a primeira abertura de parênteses e captura o
        conteúdo até o fechamento correspondente, então tenta extrair
        identificadores válidos de coluna no início de cada linha.
        Retorna lista vazia se não conseguir localizar colunas.
        """
        # Localiza conteúdo dentro dos parênteses da definição de colunas
        m = re.search(r"\(([\s\S]*?)\)\s*;?$", table_block)
        if not m:
            return []
        cols_block = m.group(1)
        cols: list[str] = []
        for line in cols_block.splitlines():
            line = line.strip().rstrip(',')
            if not line:
                continue
            # Ignora constraints e definições de chave que não começam com identificador
            col_match = re.match(r"[`\"\[]?([A-Za-z_][A-Za-z0-9_]*)", line)
            if col_match:
                cols.append(col_match.group(1))
        return cols

    @staticmethod
    def _extract_table_blocks(schema_ddl: str) -> dict[str, str]:
        """Extrai blocos completos `CREATE TABLE ...;` do DDL.

        Retorna um dicionário mapeando `table_name` -> bloco_DDL (incluindo
        o ponto e vírgula final). Usa DOTALL para capturar quebras de linha
        dentro do parênteses da definição de colunas.
        """
        pattern = re.compile(
            r"(CREATE\s+TABLE\s+(?:IF\s+NOT\s+EXISTS\s+)?[`\"\[]?([A-Za-z_][A-Za-z0-9_]*)[\s\S]*?;)",
            re.IGNORECASE,
        )
        blocks: dict[str, str] = {}
        for m in pattern.finditer(schema_ddl):
            block = m.group(1).strip()
            name = m.group(2)
            blocks[name] = block
        return blocks
 
    @staticmethod
    def _extract_tables(schema_ddl: str) -> list[str]:
        """Extrai os nomes de todas as tabelas definidas em um DDL.
 
        Usa `_TABLE_NAME_PATTERN` para encontrar cada ``CREATE TABLE``
        e capturar o nome que o segue, tolerando modificadores opcionais
        (``IF NOT EXISTS``) e diferentes formas de citação de identificadores
        (backtick, aspas duplas, colchetes) comuns em SQLite, MySQL e
        SQL Server.
 
        Args:
            schema_ddl: String DDL contendo um ou mais ``CREATE TABLE``
                statements.
 
        Returns:
            Lista com os nomes das tabelas na ordem em que aparecem no DDL.
            Retorna lista vazia se nenhum ``CREATE TABLE`` for encontrado.
 
        Example::
 
            ddl = '''
                CREATE TABLE orders (id INTEGER PRIMARY KEY);
                CREATE TABLE IF NOT EXISTS `customers` (id INTEGER);
            '''
            SelectorAgent._extract_tables(ddl)
            # ["orders", "customers"]
        """
        return [match.group(1) for match in _TABLE_NAME_PATTERN.finditer(schema_ddl)]
 
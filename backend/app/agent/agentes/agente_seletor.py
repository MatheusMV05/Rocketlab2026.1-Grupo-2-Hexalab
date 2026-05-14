from __future__ import annotations

import asyncio
import json
import logging
import re

from pydantic_ai.models.mistral import MistralModel
from pydantic_ai import Agent

from app.agent.agentes.agente_base import AgenteBase
from app.agent.contexto import ContextoAgente
from app.agent.models.resultado import ResultadoSeletor, ResultadoSeletorLLM
from app.agent.config import Config

# Detecta qualquer instrução CREATE TABLE na saída do LLM, independente de maiúsculas,
# minúsculas ou espaços extras.
_PADRAO_CREATE_TABLE = re.compile(r"CREATE\s+TABLE", re.IGNORECASE)

# Captura o nome da tabela após CREATE TABLE, tolerando:
# - IF NOT EXISTS opcional
# - identificadores entre crase, aspas duplas ou colchetes
# - nomes com letras, números e underscore
_PADRAO_NOME_TABELA = re.compile(
    r"CREATE\s+TABLE\s+(?:IF\s+NOT\s+EXISTS\s+)?[`\"\[]?([A-Za-z_][A-Za-z0-9_]*)",
    re.IGNORECASE,
)

logger = logging.getLogger(__name__)


class AgenteSeletor(AgenteBase):
    """Agente 1 da pipeline MAC-SQL - filtra o esquema do banco de dados.

    Recebe o esquema DDL completo do banco e a pergunta do usuário e pede ao LLM
    que devolva apenas as tabelas e colunas necessárias para responder à pergunta.
    Isso reduz o contexto enviado ao Decompositor, diminuindo custo de tokens e ruído.

    O agente aplica um fallback automático: se o LLM não devolver DDL válido
    (sem nenhum ``CREATE TABLE``), o esquema completo é usado no lugar, garantindo
    que a pipeline não pare por uma saída inesperada.

    Example::

        agente = AgenteSeletor(config=Config())
        resultado = agente.run(
            esquema_completo="CREATE TABLE orders (...); CREATE TABLE customers (...);",
            pergunta="Quais tabelas preciso para listar pedidos do mês passado?",
        )
        print(resultado.tabelas_selecionadas)  # ["orders"]
        print(resultado.tokens_usados)  # ex: 2847
    """

    def __init__(self, config: Config | None = None) -> None:
        super().__init__(config)

    def run(self, esquema_completo: str, pergunta: str) -> ResultadoSeletor:
        """Filtra o esquema e retorna apenas as tabelas relevantes para a pergunta.

        Fluxo:
        1. Renderiza o prompt de sistema ``prompts/seletor.j2`` com o esquema completo.
        2. Envia a pergunta como mensagem do usuário ao LLM.
        3. Valida se a saída contém pelo menos um ``CREATE TABLE``.
        4. Se a validação falhar, faz fallback para o esquema completo.
        5. Extrai os nomes das tabelas presentes no DDL resultante.

        Args:
            esquema_completo: DDL completo do banco de dados, contendo todos os
                statements ``CREATE TABLE``.
            pergunta: Pergunta original do usuário em linguagem natural.

        Returns:
            ``ResultadoSeletor`` com:
            - ``esquema_filtrado``: DDL com apenas as tabelas relevantes ou o
              esquema completo em fallback.
            - ``tabelas_selecionadas``: lista com os nomes das tabelas
              identificadas no DDL filtrado.
            - ``tokens_usados``: total de tokens consumidos nesta chamada.
        """
        logger.debug("AgenteSeletor.run: tamanho do esquema=%d", len(esquema_completo or ""))
        blocos_originais = self._extrair_blocos_tabelas(esquema_completo)
        
        resumo_esquema: dict[str, dict[str, object]] = {}
        try:
            from pathlib import Path
            import json

            caminho_descricoes = Path(__file__).resolve().parents[1] / "db" / "descricao_tabelas.json"
            if caminho_descricoes.exists():
                with open(caminho_descricoes, "r", encoding="utf8") as arquivo:
                    mapa_descricoes = json.load(arquivo)
                
                # Apenas adiciona tabelas que de fato existem no esquema completo
                for nome_tabela, descricao in mapa_descricoes.items():
                    if nome_tabela in blocos_originais:
                        resumo_esquema[nome_tabela] = {
                            "colunas": self._extrair_nomes_colunas(blocos_originais[nome_tabela]),
                            "descricao": str(descricao),
                        }
        except Exception as erro:
            # Não é fatal: se as descrições não puderem ser lidas, continuamos com o resumo vazio.
            logger.debug("AgenteSeletor.run: falha ao carregar descricoes: %s", erro)

        prompt_sistema = self._render(
            "seletor",
            schema=esquema_completo,
            question=pergunta,
            schema_summary=resumo_esquema,
        )
        logger.debug("AgenteSeletor.run: prévia do prompt de sistema:\n%s", (prompt_sistema or "")[:2000])

        deps = ContextoAgente(config=self.config, sistema=prompt_sistema)
        
        # Configura agent real apenas se houver API key
        if self.config.api_key:
            try:
                asyncio.get_event_loop()
            except RuntimeError:
                asyncio.set_event_loop(asyncio.new_event_loop())

            model = MistralModel(self.config.model, api_key=self.config.api_key)
            agent = Agent(model, deps_type=ContextoAgente, result_type=ResultadoSeletorLLM)

            @agent.system_prompt
            def get_system_prompt(ctx) -> str:
                return ctx.deps.sistema

            self._agent = agent

        # Chama LLM (será mockado em testes ou executará agente real se houver api_key)
        texto_llm, tokens_usados = self._call_llm(sistema=prompt_sistema, usuario=pergunta)
        
        esquema_filtrado = ""
        tabelas_selecionadas: list[str] = []
        
        if texto_llm and _PADRAO_CREATE_TABLE.search(texto_llm):
            tabelas_candidatas = self._extrair_tabelas(texto_llm)
            blocos_validados: list[str] = []
            for tabela in tabelas_candidatas:
                if tabela in blocos_originais:
                    blocos_validados.append(blocos_originais[tabela])
                    tabelas_selecionadas.append(tabela)
            if blocos_validados:
                esquema_filtrado = "\n\n".join(blocos_validados)
        
        if not esquema_filtrado:
            logger.info("AgenteSeletor: saída vazia ou inválida; usando esquema completo")
            return ResultadoSeletor(
                esquema_filtrado=esquema_completo,
                tabelas_selecionadas=self._extrair_tabelas(esquema_completo),
                tokens_usados=tokens_usados,
            )

        logger.info("AgenteSeletor: retornando esquema filtrado validado com tabelas=%s", tabelas_selecionadas)
        return ResultadoSeletor(
            esquema_filtrado=esquema_filtrado,
            tabelas_selecionadas=tabelas_selecionadas,
            tokens_usados=tokens_usados,
        )

    @staticmethod
    def _extrair_nomes_colunas(bloco_tabela: str) -> list[str]:
        """Extrai os nomes das colunas de um bloco ``CREATE TABLE``.

        A função procura o primeiro par de parênteses e captura o conteúdo até o
        fechamento correspondente, tentando extrair identificadores válidos de
        coluna no início de cada linha. Retorna lista vazia se não conseguir
        localizar colunas.
        """
        correspondencia = re.search(r"\(([\s\S]*?)\)\s*;?$", bloco_tabela)
        if not correspondencia:
            return []
        bloco_colunas = correspondencia.group(1)
        colunas: list[str] = []
        for linha in bloco_colunas.splitlines():
            linha = linha.strip().rstrip(",")
            if not linha:
                continue
            # Ignora constraints e definições de chave que não começam com identificador.
            correspondencia_coluna = re.match(r"[`\"\[]?([A-Za-z_][A-Za-z0-9_]*)", linha)
            if correspondencia_coluna:
                colunas.append(correspondencia_coluna.group(1))
        return colunas

    @staticmethod
    def _extrair_blocos_tabelas(esquema_ddl: str) -> dict[str, str]:
        """Extrai blocos completos ``CREATE TABLE ...;`` do DDL.

        Retorna um dicionário mapeando ``nome_tabela`` -> bloco DDL (incluindo o
        ponto e vírgula final). Usa ``DOTALL`` para capturar quebras de linha dentro
        do conteúdo dos parênteses da definição de colunas.
        """
        padrao = re.compile(
            r"(CREATE\s+TABLE\s+(?:IF\s+NOT\s+EXISTS\s+)?[`\"\[]?([A-Za-z_][A-Za-z0-9_]*)[\s\S]*?;)",
            re.IGNORECASE,
        )
        blocos: dict[str, str] = {}
        for correspondencia in padrao.finditer(esquema_ddl):
            bloco = correspondencia.group(1).strip()
            nome_tabela = correspondencia.group(2)
            blocos[nome_tabela] = bloco
        return blocos

    @staticmethod
    def _extrair_tabelas(esquema_ddl: str) -> list[str]:
        """Extrai os nomes de todas as tabelas definidas em um DDL.

        Usa ``_PADRAO_NOME_TABELA`` para encontrar cada ``CREATE TABLE`` e
        capturar o nome que o segue, tolerando modificadores opcionais como
        ``IF NOT EXISTS`` e diferentes formas de citação de identificadores.

        Args:
            esquema_ddl: String DDL contendo um ou mais statements ``CREATE TABLE``.

        Returns:
            Lista com os nomes das tabelas na ordem em que aparecem no DDL.
            Retorna lista vazia se nenhum ``CREATE TABLE`` for encontrado.

        Example::

            ddl = '''
                CREATE TABLE orders (id INTEGER PRIMARY KEY);
                CREATE TABLE IF NOT EXISTS `customers` (id INTEGER);
            '''
            AgenteSeletor._extrair_tabelas(ddl)
            # ["orders", "customers"]
        """
        return [correspondencia.group(1) for correspondencia in _PADRAO_NOME_TABELA.finditer(esquema_ddl)]
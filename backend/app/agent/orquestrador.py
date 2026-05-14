from __future__ import annotations

import logging
import sqlite3
from dataclasses import dataclass
from pathlib import Path

from app.agent.agentes.agente_decompositor import AgenteDecompositor
from app.agent.agentes.agente_interpretador import AgenteInterpretador
from app.agent.agentes.agente_refinador import AgenteRefinador
from app.agent.agentes.agente_seletor import AgenteSeletor
from app.agent.config import Config
from app.agent.db.leitor_esquema import ler_esquema
from app.agent.Guardrail.guardrail import validar_pergunta_usuario

logger = logging.getLogger(__name__)


@dataclass
class ResultadoOrquestrador:
    """Resultado final retornado pelo orquestrador para a aplicação.

    Attributes:
        pergunta: Pergunta original do usuário.
        sql_final: SQL validado e pronto para execução.
        raciocinio: Explicação do raciocínio usado para montar o SQL.
        dados: Linhas retornadas pela execução do SQL no banco.
        colunas: Nomes das colunas do resultado.
        sucesso: True se o pipeline concluiu com SQL executável.
        impossivel: True se o LLM declarou que não consegue responder.
        erro: Mensagem de erro se algo falhou, None caso contrário.
        tokens_totais: Soma de tokens consumidos por todos os agentes.
        resposta_natural: Resumo em linguagem natural da resposta final.
    """
    pergunta: str
    sql_final: str
    raciocinio: str
    dados: list[tuple]
    colunas: list[str]
    sucesso: bool
    impossivel: bool
    erro: str | None
    tokens_totais: int
    resposta_natural: str = ""


class Orquestrador:
    """Coordena os três agentes da pipeline MAC-SQL.

    Fluxo:
        1. Valida a pergunta do usuário (guardrail).
        2. Lê o esquema do banco SQLite.
        3. AgenteSeletor filtra as tabelas relevantes.
        4. AgenteDecompositor gera o SQL candidato.
        5. AgenteRefinador valida e corrige o SQL.
        6. Executa o SQL final no banco e retorna os dados.
    """

    def __init__(
        self,
        db_path: str | Path,
        config: Config | None = None,
    ) -> None:
        """Inicializa o orquestrador com o caminho do banco e configurações.

        Args:
            db_path: Caminho para o arquivo SQLite.
            config: Configurações dos agentes. Se None, usa Config() padrão.
        """
        self.db_path = Path(db_path)
        self.config = config or Config()
        self.seletor = AgenteSeletor(config=self.config)
        self.decompositor = AgenteDecompositor(config=self.config)
        self.refinador = AgenteRefinador(config=self.config)
        self.interpretador = AgenteInterpretador(config=self.config)

    def responder(self, pergunta: str) -> ResultadoOrquestrador:
        """Executa o pipeline completo para uma pergunta em linguagem natural.

        Args:
            pergunta: Pergunta do usuário em português.

        Returns:
            ResultadoOrquestrador com os dados finais ou informação de erro.
        """
        if not isinstance(pergunta, str):
            return ResultadoOrquestrador(
                pergunta=str(pergunta),
                sql_final="",
                raciocinio="",
                dados=[],
                colunas=[],
                sucesso=False,
                impossivel=False,
                erro="Pergunta inválida: esperado texto (str).",
                tokens_totais=0,
            )

        # Validação de segurança da entrada.
        # Compatibilidade: o guardrail atual retorna string ("" se válido),
        # mas versões anteriores podem retornar tupla (valido, motivo).
        validacao = validar_pergunta_usuario(pergunta)
        if isinstance(validacao, tuple):
            valido, motivo = validacao
        else:
            motivo = validacao
            valido = not bool(motivo)

        if not valido:
            logger.warning("Orquestrador: pergunta rejeitada pelo guardrail: %s", motivo)
            return ResultadoOrquestrador(
                pergunta=pergunta,
                sql_final="",
                raciocinio="",
                dados=[],
                colunas=[],
                sucesso=False,
                impossivel=False,
                erro=f"Pergunta inválida: {motivo}",
                tokens_totais=0,
            )

        # Lê o esquema do banco
        try:
            esquema_completo = ler_esquema(self.db_path)
        except FileNotFoundError:
            return ResultadoOrquestrador(
                pergunta=pergunta,
                sql_final="",
                raciocinio="",
                dados=[],
                colunas=[],
                sucesso=False,
                impossivel=False,
                erro=f"Banco de dados não encontrado: {self.db_path}",
                tokens_totais=0,
            )

        tokens_totais = 0

        # Seletor filtra as tabelas relevantes
        logger.info("Orquestrador: iniciando AgenteSeletor")
        resultado_seletor = self.seletor.run(
            esquema_completo=esquema_completo,
            pergunta=pergunta,
        )
        tokens_totais += resultado_seletor.tokens_usados

        # Decompositor gera o SQL candidato
        logger.info("Orquestrador: iniciando AgenteDecompositor")
        resultado_decompositor = self.decompositor.run(
            esquema_filtrado=resultado_seletor.esquema_filtrado,
            pergunta=pergunta,
        )
        tokens_totais += resultado_decompositor.tokens_usados

        if not resultado_decompositor.sql:
            return ResultadoOrquestrador(
                pergunta=pergunta,
                sql_final="",
                raciocinio=resultado_decompositor.raciocinio,
                dados=[],
                colunas=[],
                sucesso=False,
                impossivel=False,
                erro="Decompositor não gerou SQL.",
                tokens_totais=tokens_totais,
            )

        # Refinador valida e corrige o SQL
        logger.info("Orquestrador: iniciando AgenteRefinador")
        resultado_refinador = self.refinador.run(
            candidate_sql=resultado_decompositor.sql,
            question=pergunta,
            filtered_schema=resultado_seletor.esquema_filtrado,
            db_path=self.db_path,
        )
        tokens_totais += resultado_refinador.tokens_usados

        if resultado_refinador.impossivel:
            return ResultadoOrquestrador(
                pergunta=pergunta,
                sql_final=resultado_refinador.sql,
                raciocinio=resultado_refinador.raciocinio,
                dados=[],
                colunas=[],
                sucesso=False,
                impossivel=True,
                erro="O modelo declarou que não é possível responder com o esquema disponível.",
                tokens_totais=tokens_totais,
            )

        if not resultado_refinador.sucesso:
            return ResultadoOrquestrador(
                pergunta=pergunta,
                sql_final=resultado_refinador.sql,
                raciocinio=resultado_refinador.raciocinio,
                dados=[],
                colunas=[],
                sucesso=False,
                impossivel=False,
                erro=resultado_refinador.ultimo_erro,
                tokens_totais=tokens_totais,
            )

        # Executa o SQL final no banco
        dados, colunas, erro_execucao = self._executar_sql(resultado_refinador.sql)

        resultado_interpretador = self.interpretador.run(
            pergunta=pergunta,
            sql_final=resultado_refinador.sql,
            colunas=colunas,
            dados=dados,
            erro=erro_execucao,
        )
        tokens_totais += resultado_interpretador.tokens_usados

        return ResultadoOrquestrador(
            pergunta=pergunta,
            sql_final=resultado_refinador.sql,
            raciocinio=resultado_refinador.raciocinio,
            dados=dados,
            colunas=colunas,
            sucesso=erro_execucao is None,
            impossivel=False,
            erro=erro_execucao,
            tokens_totais=tokens_totais,
            resposta_natural=resultado_interpretador.resposta,
        )


    def _executar_sql(
        self, sql: str
    ) -> tuple[list[tuple], list[str], str | None]:
        """Executa o SQL no banco SQLite e retorna dados, colunas e erro.

        Nunca propaga exceção — erros são retornados como string no terceiro
        elemento da tupla.

        Returns:
            Tupla (dados, colunas, erro). Se ok, erro é None.
        """
        try:
            with sqlite3.connect(self.db_path) as conn:
                cursor = conn.execute(sql)
                colunas = [desc[0] for desc in cursor.description or []]
                dados = cursor.fetchall()
                return dados, colunas, None
        except Exception as e:
            logger.warning("Orquestrador._executar_sql: erro ao executar SQL: %s", e)
            return [], [], str(e)
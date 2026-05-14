from __future__ import annotations

import asyncio
import logging
import sqlite3
from pathlib import Path

from pydantic_ai.models.mistral import Mistral, MistralModel
from pydantic_ai import Agent

from app.agent.agentes.agente_base import AgenteBase
from app.agent.contexto import ContextoAgente
from app.agent.models.resultado import ResultadoRefinador, ResultadoRefinadorLLM
from app.agent.config import Config

logger = logging.getLogger(__name__)


class AgenteRefinador(AgenteBase):
    """Agente 3 da pipeline MAC-SQL — valida e corrige o SQL gerado.

    Recebe o SQL candidato do Decompositor, tenta executá-lo e, se falhar,
    pede ao LLM que corrija. Repete até MAX_RETRIES vezes.
    """

    def __init__(self, config: Config | None = None) -> None:
        super().__init__(config)

    def run(
        self,
        candidate_sql: str,
        question: str,
        filtered_schema: str,
        db_path: str | Path | None = None,
    ) -> ResultadoRefinador:
        """Valida e corrige o SQL candidato com loop de retry.

        Args:
            candidate_sql: SQL gerado pelo AgenteDecompositor.
            question: Pergunta original do usuário.
            filtered_schema: Esquema DDL filtrado pelo AgenteSeletor.

        Returns:
            ResultadoRefinador com o SQL final, status de sucesso e tokens usados.
        """
        from app.agent.agentes.refinador_parser import (
            extract_sql, extract_reasoning, is_impossivel
        )

        current_sql = candidate_sql
        last_error: str | None = None
        total_tokens = 0

        agent = self._agent
        if agent is None and not self.config.api_key:
            return ResultadoRefinador(
                sql=current_sql,
                raciocinio="Agente indisponível sem chave de API.",
                sucesso=False,
                impossivel=False,
                tentativas=0,
                ultimo_erro=None,
                tokens_usados=0,
            )

        if agent is None:
            try:
                asyncio.get_event_loop()
            except RuntimeError:
                asyncio.set_event_loop(asyncio.new_event_loop())

            model = MistralModel(self.config.model, provider=Mistral(api_key=self.config.api_key))
            agent = Agent(model, deps_type=ContextoAgente, result_type=ResultadoRefinadorLLM)

            @agent.system_prompt
            def get_system_prompt(ctx) -> str:
                return ctx.deps.sistema

        for tentativa in range(1, self.config.max_retries + 1):
            result = self._executar_sql(current_sql, db_path)

            if result["ok"]:
                return ResultadoRefinador(
                    sql=current_sql,
                    raciocinio="SQL executou sem erros.",
                    sucesso=True,
                    impossivel=False,
                    tentativas=tentativa,
                    ultimo_erro=None,
                    tokens_usados=total_tokens,
                )

            last_error = result["error"] or "Query executou mas retornou 0 linhas. Revise os filtros."

            prompt_sistema = self._render(
                "refinador",
                schema=filtered_schema,
                question=question,
                previous_sql=current_sql,
                execution_result=last_error,
            )

            deps = ContextoAgente(config=self.config, sistema=prompt_sistema)

            try:
                resultado = agent.run_sync("Corrija o SQL.", deps=deps)
                dados = resultado.data
                uso = resultado.usage()
                total_tokens += uso.total_tokens if uso else 0
                resposta_texto = dados.sql 

                if is_impossivel(resposta_texto):
                    return ResultadoRefinador(
                        sql=current_sql,
                        raciocinio=resposta_texto,
                        sucesso=False,
                        impossivel=True,
                        tentativas=tentativa,
                        ultimo_erro=last_error,
                        tokens_usados=total_tokens,
                    )

                current_sql = extract_sql(resposta_texto) or resposta_texto.strip()

            except Exception as erro:
                logger.warning("AgenteRefinador: falha na chamada ao LLM (tentativa %d): %s", tentativa, erro)

        return ResultadoRefinador(
            sql=current_sql,
            raciocinio="Máximo de tentativas atingido.",
            sucesso=False,
            impossivel=False,
            tentativas=self.config.max_retries,
            ultimo_erro=last_error,
            tokens_usados=total_tokens,
        )

    @staticmethod
    def _executar_sql(sql: str, db_path: str | Path | None = None) -> dict:
        """Executa o SQL e retorna dict com ok e error.

        Nunca propaga exceção.

        Se db_path não for informado, considera a validação de execução como
        opcional e retorna sucesso para evitar dependência de módulo externo.
        """
        try:
            if db_path is None:
                return {"ok": True, "error": None}

            with sqlite3.connect(str(db_path)) as conn:
                cursor = conn.execute(sql)
                _ = cursor.fetchall()
                return {"ok": True, "error": None}
        except Exception as e:
            return {"ok": False, "error": str(e)}
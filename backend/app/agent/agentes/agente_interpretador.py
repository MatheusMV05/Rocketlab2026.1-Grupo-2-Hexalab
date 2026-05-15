from __future__ import annotations

import json
from typing import Any

from pydantic_ai import Agent

from app.agent.agentes.agente_base import AgenteBase
from app.agent.config import Config
from app.agent.contexto import ContextoAgente
from app.agent.models.resultado import ResultadoInterpretador, ResultadoInterpretadorLLM


class AgenteInterpretador(AgenteBase):
    """Converte o resultado do SQL em uma resposta curta e natural para o usuario."""

    def __init__(self, config: Config | None = None) -> None:
        super().__init__(config)

    def run(
        self,
        pergunta: str,
        sql_final: str,
        colunas: list[str],
        dados: list[tuple],
        erro: str | None,
        message_history: list[Any] | None = None,
    ) -> ResultadoInterpretador:
        prompt_sistema = self._render(
            "interpretador",
            pergunta=pergunta,
            sql_final=sql_final,
            colunas=colunas,
            dados=dados,
            erro=erro or "",
        )

        if self.config.api_key:
            self._garantir_event_loop()

            model = self._criar_modelo_mistral()
            agent = Agent(model, deps_type=ContextoAgente, output_type=ResultadoInterpretadorLLM)

            @agent.system_prompt
            def get_system_prompt(ctx) -> str:
                return ctx.deps.sistema

            self._agent = agent

        chamada_llm = (
            self._call_llm(
                sistema=prompt_sistema,
                usuario="Gere a resposta final para o usuario.",
                message_history=message_history,
            )
            if message_history
            else self._call_llm(
                sistema=prompt_sistema,
                usuario="Gere a resposta final para o usuario.",
            )
        )
        texto_llm, tokens_usados, novo_historico = self._desempacotar_call_llm(chamada_llm)

        return ResultadoInterpretador(
            resposta=self._interpretar_saida_llm(texto_llm),
            tokens_usados=tokens_usados,
            novo_historico=novo_historico,
        )

    @staticmethod
    def _interpretar_saida_llm(texto_llm: str) -> str:
        texto_llm = (texto_llm or "").strip()
        if not texto_llm:
            return ""

        try:
            dados = ResultadoInterpretadorLLM.model_validate_json(texto_llm)
            return dados.resposta.strip()
        except Exception:
            pass

        try:
            dados_dict = json.loads(texto_llm)
            if isinstance(dados_dict, dict):
                resposta = dados_dict.get("resposta") or dados_dict.get("answer") or ""
                return str(resposta).strip()
        except Exception:
            pass

        return texto_llm

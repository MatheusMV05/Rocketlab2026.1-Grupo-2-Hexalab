from __future__ import annotations

import asyncio
import json

from pydantic_ai import Agent
from pydantic_ai.models.mistral import MistralModel

from app.agent.agentes.agente_base import AgenteBase
from app.agent.config import Config
from app.agent.contexto import ContextoAgente
from app.agent.models.resultado import ResultadoInterpretador, ResultadoInterpretadorLLM


class AgenteInterpretador(AgenteBase):
    """Agente responsavel por gerar resposta final em linguagem natural."""

    def __init__(self, config: Config | None = None) -> None:
        super().__init__(config)

    def run(
        self,
        pergunta: str,
        sql_final: str,
        colunas: list[str],
        dados: list[tuple],
        erro: str | None,
    ) -> ResultadoInterpretador:
        """Interpreta o resultado final da consulta e gera texto para o usuario."""
        prompt_sistema = self._render(
            "interpretador",
            pergunta=pergunta,
            sql_final=sql_final,
            colunas=colunas,
            dados=dados,
            erro=erro or "",
        )

        if self.config.api_key:
            try:
                asyncio.get_event_loop()
            except RuntimeError:
                asyncio.set_event_loop(asyncio.new_event_loop())

            model = MistralModel(self.config.model, api_key=self.config.api_key)
            agent = Agent(model, deps_type=ContextoAgente, result_type=ResultadoInterpretadorLLM)

            @agent.system_prompt
            def get_system_prompt(ctx) -> str:
                return ctx.deps.sistema

            self._agent = agent

        texto_llm, tokens_usados = self._call_llm(
            sistema=prompt_sistema,
            usuario="Gere a resposta final para o usuario.",
        )

        resposta = self._interpretar_saida_llm(texto_llm)

        return ResultadoInterpretador(
            resposta=resposta,
            tokens_usados=tokens_usados,
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
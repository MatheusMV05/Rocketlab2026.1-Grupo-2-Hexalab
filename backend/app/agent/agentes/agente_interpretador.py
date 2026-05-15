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
    """Converte o resultado do SQL em uma resposta curta e natural para o usuario.

    O agente recebe a pergunta original, o SQL executado, as colunas retornadas
    e os dados obtidos no banco. A partir desse contexto, ele produz uma
    resposta em portugues que resume o resultado sem expor detalhes tecnicos.
    """

    def __init__(self, config: Config | None = None) -> None:
        """Inicializa o agente com a configuracao compartilhada do projeto."""
        super().__init__(config)

    def run(
        self,
        pergunta: str,
        sql_final: str,
        colunas: list[str],
        dados: list[tuple],
        erro: str | None,
    ) -> ResultadoInterpretador:
        """Executa a interpretacao final e devolve a resposta de negocio.

        Args:
            pergunta: Pergunta original feita pelo usuario.
            sql_final: Consulta SQL que foi executada.
            colunas: Nomes das colunas retornadas pela consulta.
            dados: Linhas retornadas pelo banco de dados.
            erro: Mensagem de erro da execucao, quando houver.

        Returns:
            ResultadoInterpretador com o texto final e o total de tokens usados.
        """
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

        texto_llm, tokens_usados, _ = self._call_llm(
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
        """Normaliza a saida do LLM aceitando JSON valido ou texto puro.

        O interpretador tenta primeiro validar o payload estruturado esperado.
        Se a resposta vier como JSON com a chave ``resposta``, esse valor e
        extraido. Caso a resposta venha em formato livre, o texto e retornado
        como fallback para nao perder informacao.
        """
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
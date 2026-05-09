from __future__ import annotations

import asyncio
import logging
import re
from typing import Any
from pydantic_ai.models.mistral import MistralModel
from pydantic_ai import Agent

from app.agent.Guardrail.guardrail import validar_sql_somente_leitura
from app.agent.agentes.agente_base import AgenteBase
from app.agent.contexto import ContextoAgente
from app.agent.few_shots.fewshot_retriever import FewShotRetriever
from app.agent.few_shots.modelos import ExemploFewShot
from app.agent.models.resultado import ResultadoDecompositor, ResultadoDecompositorLLM
from app.agent.config import Config

logger = logging.getLogger(__name__)


class AgenteDecompositor(AgenteBase):
	"""Agente responsável por decompor pergunta complexa e gerar SQL final.

	O agente delega a geração ao LLM usando o template `decompositor.j2` e
	aplica saída estruturada (PydanticAI) para obter o raciocínio e o SQL.
	A saída SQL é sanitizada e validada para manter o contrato de consulta
	somente leitura.
	"""

	def __init__(self, config: Config | None = None) -> None:
		super().__init__(config)

	def run(
		self,
		esquema_filtrado: str,
		pergunta: str,
	) -> ResultadoDecompositor:
		"""Executa o decomposer e retorna SQL + raciocínio com tipagem forte.

		Args:
			esquema_filtrado: DDL filtrado pelo agente seletor.
			pergunta: Pergunta do usuário em linguagem natural.

		Returns:
			ResultadoDecompositor com SQL sanitizado, raciocínio extraído e
			tokens usados na chamada do LLM.
		"""
		exemplos_brutos = self._buscar_exemplos_few_shot(pergunta)
		exemplos_normalizados = self._normalizar_exemplos(exemplos_brutos)

		prompt_sistema = self._render(
			"decompositor",
			schema=esquema_filtrado,
			question=pergunta,
			examples=exemplos_normalizados,
		)

		if not self.config.api_key:
			return ResultadoDecompositor(
				sql="",
				raciocinio="Raciocínio não informado pelo modelo.",
				tokens_usados=0,
			)

		deps = ContextoAgente(config=self.config, sistema=prompt_sistema)

		try:
			asyncio.get_event_loop()
		except RuntimeError:
			asyncio.set_event_loop(asyncio.new_event_loop())

		model = MistralModel(self.config.model, api_key=self.config.api_key)
		agent = Agent(model, deps_type=ContextoAgente, result_type=ResultadoDecompositorLLM)
		
		@agent.system_prompt
		def get_system_prompt(ctx) -> str:
			return ctx.deps.sistema

		try:
			resultado = agent.run_sync(pergunta, deps=deps)
			dados = resultado.data
			uso = resultado.usage()
			tokens_usados = uso.total_tokens if uso else 0
			raciocinio = str(dados.reasoning).strip()
			sql_limpo = self._sanitizar_sql(str(dados.sql))
		except Exception as erro:
			logger.warning(
				"AgenteDecompositor.run: falha na saída estruturada do PydanticAI (%s).",
				erro,
			)
			return ResultadoDecompositor(
				sql="",
				raciocinio="Raciocínio não informado pelo modelo.",
				tokens_usados=0,
			)

		if not validar_sql_somente_leitura(sql_limpo):
			logger.warning(
				"AgenteDecompositor: SQL inválido ou inseguro detectado; retornando SQL vazio."
			)
			sql_limpo = ""

		if not raciocinio:
			raciocinio = "Raciocínio não informado pelo modelo."

		return ResultadoDecompositor(
			sql=sql_limpo,
			raciocinio=raciocinio,
			tokens_usados=tokens_usados,
		)

	@staticmethod
	def _normalizar_exemplos(
		exemplos: list[ExemploFewShot | dict[str, Any]] | None,
	) -> list[dict[str, str]]:
		"""Normaliza exemplos few-shot para formato esperado pelo template Jinja2.

		Garante que cada exemplo tenha as chaves obrigatórias `question` e `sql`,
		além da chave opcional `reasoning`. Descarta exemplos inválidos (sem pergunta
		ou SQL vazios) para evitar poluição no prompt do LLM.

		Args:
			exemplos: Lista de dicionários com exemplos ou None.

		Returns:
			Lista de dicionários com chaves 'question', 'sql' e 'reasoning'
			(todas as strings), filtrada de itens inválidos. Retorna lista vazia
			se exemplos for None ou vazio.
		"""
		if not exemplos:
			return []

		normalizados: list[dict[str, str]] = []
		for item in exemplos:
			if isinstance(item, ExemploFewShot):
				pergunta = item.question.strip()
				sql = item.sql.strip()
				raciocinio = item.reasoning.strip()
			elif isinstance(item, dict):
				pergunta = str(item.get("question") or item.get("input") or "").strip()
				sql = str(item.get("sql") or item.get("output") or "").strip()
				raciocinio = str(item.get("reasoning") or item.get("explanation") or "").strip()
			else:
				continue
			if not pergunta or not sql:
				continue
			normalizados.append(
				{
					"question": pergunta,
					"sql": sql,
					"reasoning": raciocinio,
				}
			)
		return normalizados

	def _buscar_exemplos_few_shot(self, pergunta: str) -> list[dict[str, Any]]:
		"""Recupera exemplos few-shot ranqueados por similaridade sintática.

		Instancia um retriever para carregar exemplos do arquivo YAML configurado
		e ranqueia-os com base em sobreposição de tokens e bigramas em relação
		à pergunta do usuário. Se o arquivo ou retriever não estiver disponível,
		retorna lista vazia sem falha.

		Args:
			pergunta: Pergunta do usuário em linguagem natural.

		Returns:
			Lista dos top-3 exemplos mais próximos sintaticamente, ordenada por
			relevância decrescente. Retorna lista vazia se exemplos não estiverem
			disponíveis ou houver erro na recuperação.
		"""
		try:
			retriever = FewShotRetriever(caminho_exemplos=self.config.few_shot_path)
			exemplos = retriever.retrieve(pergunta, k=3)
			if isinstance(exemplos, list):
				return exemplos
		except Exception as erro:
			logger.debug("AgenteDecompositor: few-shot retriever indisponível (%s)", erro)

		return []

	@staticmethod
	def _sanitizar_sql(sql: str) -> str:
		"""Remove marcações supérfluas e formata SQL para execução segura.

		Remove fences de markdown (```sql), tags XML `<sql>...</sql>` residuais
		e espaços em branco desnecessários. O objetivo é deixar uma string SQL
		pura, sem decoração, pronta para ser passada ao executor.

		Args:
			sql: String com SQL potencialmente decorado.

		Returns:
			String SQL limpa e pronta para execução. Retorna string vazia se
			entrada for vazia ou None.
		"""
		sql_limpo = (sql or "").strip()
		if not sql_limpo:
			return ""

		sql_limpo = re.sub(r"^```(?:sql)?\s*", "", sql_limpo, flags=re.IGNORECASE)
		sql_limpo = re.sub(r"\s*```$", "", sql_limpo)
		sql_limpo = re.sub(r"</?sql>", "", sql_limpo, flags=re.IGNORECASE)
		return sql_limpo.strip()

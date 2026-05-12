from __future__ import annotations

import asyncio
import json
import logging
import re
from pathlib import Path

from pydantic_ai import Agent
from pydantic_ai.models.mistral import MistralModel

from app.agent.agentes.agente_base import AgenteBase
from app.agent.config import Config
from app.agent.contexto import ContextoAgente
from app.agent.models.resultado import ResultadoSugestor, ResultadoSugestorLLM


logger = logging.getLogger(__name__)

class AgenteSugestor(AgenteBase):
	"""Agente responsavel por sugerir proximas 3 perguntas analiticas."""

	def __init__(self, config: Config | None = None) -> None:
		super().__init__(config)
		self._descricao_tabelas = self._carregar_descricao_tabelas()

	def run(
		self,
		pergunta: str,
		sql_gerado: str,
		schema: str | None = None,
		amostra_resultado: str = "",
	) -> ResultadoSugestor:
		"""Gera exatamente 3 sugestoes com base em pergunta, SQL, amostra e topologia."""
		tabelas_sql = self._extrair_tabelas_do_sql(sql_gerado)

		tabela_principal = ""
		if tabelas_sql:
			tabela_principal = tabelas_sql[0]
		elif self._descricao_tabelas:
			tabela_principal = next(iter(self._descricao_tabelas))

		tabelas_adjacentes = tabelas_sql[1:6]
		resumo_tabelas = self._montar_resumo_tabelas(
			tabela_principal=tabela_principal,
			tabelas_adjacentes=tabelas_adjacentes,
		)

		prompt_sistema = self._render(
			"sugestor",
			question=pergunta,
			sql_gerado=sql_gerado,
			tabela_principal=tabela_principal,
			tabelas_adjacentes=tabelas_adjacentes,
			resumo_tabelas=resumo_tabelas,
			amostra_resultado=amostra_resultado,
			
		)

		if self.config.api_key:
			try:
				asyncio.get_event_loop()
			except RuntimeError:
				asyncio.set_event_loop(asyncio.new_event_loop())

			model = MistralModel(self.config.model, api_key=self.config.api_key)
			agent = Agent(model, deps_type=ContextoAgente, result_type=ResultadoSugestorLLM)

			@agent.system_prompt
			def get_system_prompt(ctx) -> str:
				return ctx.deps.sistema

			self._agent = agent

		texto_llm, tokens_usados = self._call_llm(sistema=prompt_sistema, usuario=pergunta)
		sugestoes = self._interpretar_saida_llm(texto_llm)

		return ResultadoSugestor(
			sugestoes=sugestoes,
			tabela_principal=tabela_principal,
			tabelas_adjacentes=tabelas_adjacentes,
			tokens_usados=tokens_usados,
		)

	def _interpretar_saida_llm(self, texto_llm: str) -> list[str]:
		texto_llm = (texto_llm or "").strip()
		if not texto_llm:
			return []

		try:
			dados = ResultadoSugestorLLM.model_validate_json(texto_llm)
			return self._normalizar_lista_sugestoes(dados.perguntas)
		except Exception:
			pass

		try:
			dados_dict = json.loads(texto_llm)
			if isinstance(dados_dict, dict):
				perguntas = dados_dict.get("perguntas") or dados_dict.get("sugestoes") or []
				if isinstance(perguntas, list):
					return self._normalizar_lista_sugestoes(perguntas)
		except Exception:
			pass

		linhas = [linha.strip(" -\t") for linha in texto_llm.splitlines() if linha.strip()]
		return self._normalizar_lista_sugestoes(linhas)

	@staticmethod
	def _normalizar_lista_sugestoes(sugestoes: list[object]) -> list[str]:
		normalizadas: list[str] = []
		vistos: set[str] = set()
		for item in sugestoes:
			texto = str(item).strip()
			if not texto:
				continue
			chave = texto.lower()
			if chave in vistos:
				continue
			vistos.add(chave)
			normalizadas.append(texto)
			if len(normalizadas) == 3:
				break
		return normalizadas

	@staticmethod
	def _extrair_tabelas_do_sql(sql: str) -> list[str]:
		tabelas: list[str] = []
		# Parse com sqlglot para evitar heuristicas regex em SQL complexo.
		try:
			import sqlglot  # type: ignore[import-not-found]
			from sqlglot import expressions as exp  # type: ignore[import-not-found]

			arvore = sqlglot.parse_one(sql)
			tabelas = [AgenteSugestor._normalizar_nome_tabela(str(table.name or "")) for table in arvore.find_all(exp.Table)]
			tabelas = [t for t in tabelas if t]
			if tabelas:
				return tabelas
		except Exception:
			pass
		return tabelas

	@staticmethod
	def _normalizar_nome_tabela(nome: str) -> str:
		nome_limpo = (nome or "").strip().strip("`\"[]")
		if not nome_limpo:
			return ""
		if "." in nome_limpo:
			nome_limpo = nome_limpo.split(".")[-1]
		return nome_limpo.lower()

	def _carregar_descricao_tabelas(self) -> dict[str, str]:
		candidatos = [
			Path(__file__).resolve().parents[1] / "db" / "descricao_tabelas.json",
			Path.cwd() / "backend" / "app" / "agent" / "db" / "descricao_tabelas.json",
			Path.cwd() / "app" / "agent" / "db" / "descricao_tabelas.json",
		]

		for caminho in candidatos:
			try:
				if not caminho.exists():
					continue
				with open(caminho, "r", encoding="utf-8") as arquivo:
					dados = json.load(arquivo)
				if isinstance(dados, dict):
					resultado = {
						self._normalizar_nome_tabela(str(chave)): str(valor)
						for chave, valor in dados.items()
						if self._normalizar_nome_tabela(str(chave))
					}
					if resultado:
						return resultado
			except Exception as erro:
				logger.debug("Falha ao carregar descricao_tabelas em %s: %s", caminho, erro)

		logger.warning("descricao_tabelas.json nao foi carregado em nenhum caminho candidato.")
		return {}

	def _montar_resumo_tabelas(
		self,
		tabela_principal: str,
		tabelas_adjacentes: list[str],
	) -> str:
		tabelas_usadas = {
			self._normalizar_nome_tabela(nome)
			for nome in [tabela_principal, *tabelas_adjacentes]
			if self._normalizar_nome_tabela(nome)
		}

		resumo = {
			tabela: descricao
			for tabela, descricao in self._descricao_tabelas.items()
			if tabela in tabelas_usadas
		}

		if resumo:
			return json.dumps(resumo, ensure_ascii=False)

		return json.dumps(self._descricao_tabelas, ensure_ascii=False)

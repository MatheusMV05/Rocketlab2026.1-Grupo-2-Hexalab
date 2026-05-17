from __future__ import annotations

import json
import logging
from pathlib import Path

from pydantic_ai import Agent

from app.agent.agentes.agente_base import AgenteBase
from app.agent.config import Config
from app.agent.contexto import ContextoAgente
from app.agent.models.resultado import ResultadoSugestor, ResultadoSugestorLLM


logger = logging.getLogger(__name__)

class AgenteSugestor(AgenteBase):
	"""Gera tres perguntas de follow-up com base na consulta executada.

	O agente analisa a pergunta original, o SQL gerado, as tabelas envolvidas
	e uma amostra do resultado para propor novas perguntas que facam sentido
	no mesmo contexto analitico. Ele tambem tenta identificar a tabela principal
	e as tabelas adjacentes para orientar sugestoes mais relevantes.
	"""

	def __init__(self, config: Config | None = None) -> None:
		"""Inicializa o agente e carrega o dicionario de descricoes das tabelas."""
		super().__init__(config)
		self._descricao_tabelas = self._carregar_descricao_tabelas()

	def run(
		self,
		pergunta: str,
		sql_gerado: str,
		schema: str | None = None,
		amostra_resultado: str = "",
	) -> ResultadoSugestor:
		"""Gera exatamente tres sugestoes contextualizadas para o usuario.

		Args:
			pergunta: Pergunta original que iniciou a analise.
			sql_gerado: SQL executado com sucesso no fluxo anterior.
			schema: Schema filtrado opcional, usado como contexto adicional.
			amostra_resultado: Texto compacto com uma amostra das linhas retornadas.

		Returns:
			ResultadoSugestor com as perguntas sugeridas e metadados de contexto.
		"""
		tabelas_sql = self._extrair_tabelas_do_sql(sql_gerado)

		tabela_principal = ""
		if tabelas_sql:
			tabela_principal = tabelas_sql[0]
		elif self._descricao_tabelas:
			tabela_principal = next(iter(self._descricao_tabelas))

		tabelas_adjacentes = tabelas_sql[1:]
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
			self._garantir_event_loop()

			model = self._criar_modelo_mistral()
			agent = Agent(model, deps_type=ContextoAgente, output_type=ResultadoSugestorLLM)

			@agent.system_prompt
			def get_system_prompt(ctx) -> str:
				return ctx.deps.sistema

			self._agent = agent

		texto_llm, tokens_usados, _ = self._desempacotar_call_llm(
			self._call_llm(sistema=prompt_sistema, usuario=pergunta)
		)
		sugestoes = self._interpretar_saida_llm(texto_llm)

		return ResultadoSugestor(
			sugestoes=sugestoes,
			tabela_principal=tabela_principal,
			tabelas_adjacentes=tabelas_adjacentes,
			tokens_usados=tokens_usados,
		)

	def _interpretar_saida_llm(self, texto_llm: str) -> list[str]:
		"""Converte a resposta do LLM em uma lista limpa de tres sugestoes.

		O metodo aceita tres formatos:
		1. JSON estruturado com a chave ``perguntas``.
		2. JSON simples com ``sugestoes`` ou ``perguntas``.
		3. Texto livre com uma sugestao por linha.
		"""
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
		"""Remove duplicatas, limpa espacos e limita a saida a tres itens."""
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
		"""Extrai nomes de tabelas usados no SQL, preferindo o parser sqlglot.

		Se o parser falhar, retorna uma lista vazia para nao quebrar o fluxo.
		"""
		tabelas: list[str] = []
		try:
			import sqlglot  # type: ignore[import-not-found]
			from sqlglot import expressions as exp  # type: ignore[import-not-found]

			arvore = sqlglot.parse_one(sql, read="postgres")
			tabelas = [AgenteSugestor._normalizar_nome_tabela(str(table.name or "")) for table in arvore.find_all(exp.Table)]
			tabelas = [t for t in tabelas if t]
			if tabelas:
				return tabelas
		except Exception:
			pass
		return tabelas

	@staticmethod
	def _normalizar_nome_tabela(nome: str) -> str:
		"""Normaliza nomes de tabela removendo aspas, schema e caixa alta."""
		nome_limpo = (nome or "").strip().strip("`\"[]")
		if not nome_limpo:
			return ""
		if "." in nome_limpo:
			nome_limpo = nome_limpo.split(".")[-1]
		return nome_limpo.lower()

	def _carregar_descricao_tabelas(self) -> dict[str, str]:
		"""Carrega o mapa de descricoes das tabelas a partir do JSON local.

		O metodo tenta caminhos alternativos para funcionar tanto no backend
		executado localmente quanto em ambientes de teste com diretorios distintos.
		"""
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
		"""Monta um resumo JSON com descricoes das tabelas relevantes."""
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

		return json.dumps(resumo, ensure_ascii=False)

from __future__ import annotations

import logging
import re
from typing import Any

from app.agent.Guardrail.sql_guardrail import validar_sql_somente_leitura
from app.agent.agentes.agente_base import AgenteBase
from app.agent.few_shots.fewshot_retriever import FewShotRetriever
from app.agent.models.resultado import ResultadoDecompositor

logger = logging.getLogger(__name__)
# Esses blocos existem para conseguir capturar na resposta do agente as partes de raciocinio, sql e validação de sql, esses regex serão usados APENAS na saida do LLM
_PADRAO_BLOCO_REASONING = re.compile(
	r"<reasoning>\s*(.*?)\s*</reasoning>",
	re.IGNORECASE | re.DOTALL,
)
_PADRAO_BLOCO_SQL = re.compile(
	r"<sql>\s*(.*?)\s*</sql>",
	re.IGNORECASE | re.DOTALL,
)
_PADRAO_SQL_FALLBACK = re.compile(
	r"\b(?:WITH|SELECT)\b[\s\S]*",
	re.IGNORECASE,
)


class AgenteDecompositor(AgenteBase):
	"""Agente responsável por decompor pergunta complexa e gerar SQL final.

	O agente delega a geração ao LLM usando o template `decompositor.j2` e
	aplica parsing robusto na resposta para extrair os blocos `<reasoning>` e
	`<sql>`. A saída SQL é sanitizada e validada para manter o contrato de
	consulta somente leitura.
	"""

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

		resposta, tokens_usados = self._call_llm(
			sistema=prompt_sistema,
			usuario=pergunta,
		)

		raciocinio, sql = self._extrair_blocos_resposta(resposta)
		sql_limpo = self._sanitizar_sql(sql)

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
	def _normalizar_exemplos(exemplos: list[dict[str, Any]] | None) -> list[dict[str, str]]:
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
			if not isinstance(item, dict):
				continue
			pergunta = str(item.get("question", "")).strip()
			sql = str(item.get("sql", "")).strip()
			raciocinio = str(item.get("reasoning", "")).strip()
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
	def _extrair_blocos_resposta(resposta: str) -> tuple[str, str]:
		"""Extrai blocos `<reasoning>` e `<sql>` da resposta do LLM.

		Tenta localizar tags XML estruturadas `<reasoning>...</reasoning>` e
		`<sql>...</sql>`. Se a tag SQL não existir, aplica fallback com regex
		para detectar SQL por início com SELECT ou WITH. Se nenhum bloco for
		encontrado, retorna tupla vazia.

		Args:
			resposta: String retornada pelo LLM (pode estar vazia ou malformada).

		Returns:
			Tupla `(raciocinio, sql)` com strings extraídas e limpas. Ambas
			podem ser vazias se parsing falhar.
		"""
		texto = (resposta or "").strip()
		if not texto:
			return "", ""

		correspondencia_reasoning = _PADRAO_BLOCO_REASONING.search(texto)
		correspondencia_sql = _PADRAO_BLOCO_SQL.search(texto)

		raciocinio = (
			correspondencia_reasoning.group(1).strip() if correspondencia_reasoning else ""
		)
		sql = correspondencia_sql.group(1).strip() if correspondencia_sql else ""

		if sql:
			return raciocinio, sql

		fallback_sql = _PADRAO_SQL_FALLBACK.search(texto)
		if fallback_sql:
			return raciocinio, fallback_sql.group(0).strip()

		return raciocinio, ""

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

from __future__ import annotations

import re
from pathlib import Path

import yaml

from app.agent.few_shots.modelos import ExemploFewShot


class FewShotRetriever:
	"""Carrega e ranqueia exemplos few-shot a partir de um arquivo YAML."""

	def __init__(self, caminho_exemplos: str | Path) -> None:
		self.caminho_exemplos = Path(caminho_exemplos)

	def retrieve(self, pergunta: str, k: int = 3) -> list[ExemploFewShot]:
		"""Retorna os `k` exemplos mais relevantes para a pergunta.

		A seleção usa sobreposição de tokens e bigramas para manter a lógica
		leve e determinística, sem depender de embeddings externos.
		"""
		exemplos = self._carregar_exemplos()
		if not exemplos or k <= 0:
			return []

		pergunta_tokens = self._tokenizar(pergunta)
		pergunta_token_set = set(pergunta_tokens)
		pergunta_bigrama = self._bigramas(pergunta_tokens)

		ranqueados = []
		for indice, exemplo in enumerate(exemplos):
			score = self._pontuar(
				pergunta_tokens=pergunta_token_set,
				pergunta_bigrama=pergunta_bigrama,
				texto=exemplo.question,
			)
			ranqueados.append((score, indice, exemplo))

		ranqueados.sort(key=lambda item: (-item[0], item[1]))
		return [item[2] for item in ranqueados[:k]]

	def _carregar_exemplos(self) -> list[ExemploFewShot]:
		if not self.caminho_exemplos.exists():
			return []

		try:
			with self.caminho_exemplos.open("r", encoding="utf-8") as arquivo:
				dados = yaml.safe_load(arquivo)
		except Exception:
			return []

		if not isinstance(dados, list):
			return []

		exemplos: list[ExemploFewShot] = []
		for item in dados:
			exemplo = ExemploFewShot.from_raw(item)
			if exemplo is not None:
				exemplos.append(exemplo)

		return exemplos

	@staticmethod
	def _tokenizar(texto: str) -> list[str]:
		return re.findall(r"[\wà-ÿ]+", (texto or "").lower())

	@staticmethod
	def _bigramas(tokens: list[str]) -> set[str]:
		return {
			f"{tokens[indice]} {tokens[indice + 1]}"
			for indice in range(len(tokens) - 1)
		}

	def _pontuar(self, pergunta_tokens: set[str], pergunta_bigrama: set[str], texto: str) -> float:
		tokens_texto_lista = self._tokenizar(texto)
		tokens_texto = set(tokens_texto_lista)
		bigramas_texto = self._bigramas(tokens_texto_lista)
		return float(len(pergunta_tokens & tokens_texto)) + (0.5 * len(pergunta_bigrama & bigramas_texto))

"""Pacote de utilitários few-shot para recuperação de exemplos."""

from .fewshot_retriever import FewShotRetriever, get_cached_fewshot_retriever
from .modelos import ExemploFewShot

__all__ = ["FewShotRetriever", "ExemploFewShot", "get_cached_fewshot_retriever"]

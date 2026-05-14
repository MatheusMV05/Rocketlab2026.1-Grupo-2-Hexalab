from __future__ import annotations

from pydantic import BaseModel, Field


class ExemploFewShot(BaseModel):
    """Exemplo estruturado usado pelo decompositor em prompts few-shot."""

    question: str = Field(default="")
    sql: str = Field(default="")
    reasoning: str = Field(default="")

    @classmethod
    def from_raw(cls, item: object) -> "ExemploFewShot | None":
        """Converte entradas do YAML em um exemplo tipado.

        Aceita formatos antigos e novos, mapeando automaticamente:
        - `input` ou `question` -> `question`
        - `output` ou `sql` -> `sql`
        - `reasoning` ou `explanation` -> `reasoning`
        """
        if isinstance(item, cls):
            return item

        if not isinstance(item, dict):
            return None

        question = str(item.get("question") or item.get("input") or "").strip()
        sql = str(item.get("sql") or item.get("output") or "").strip()
        reasoning = str(
            item.get("reasoning") or item.get("explanation") or item.get("raciocinio") or ""
        ).strip()

        if not question or not sql:
            return None

        return cls(question=question, sql=sql, reasoning=reasoning)
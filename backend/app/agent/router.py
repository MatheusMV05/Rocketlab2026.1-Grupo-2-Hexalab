"""Rotas REST do agente IA (text-to-SQL)."""

from __future__ import annotations

import re
from pathlib import Path

from fastapi import APIRouter
from pydantic import BaseModel, Field

from app.agent import AgenteSugestor, Config, Orquestrador
from app.agent.agentes.memory.dependencies import get_session_store
from app.config import settings

router = APIRouter(prefix="/agent", tags=["agent"])

_BACKEND_DIR = Path(__file__).resolve().parents[2]


class ChatRequest(BaseModel):
    message: str = Field(..., min_length=1)
    session_id: str = Field(..., min_length=1)


class ChatResponse(BaseModel):
    answer: str
    sql_used: str | None
    data: list[dict]
    out_of_scope: bool
    suggestions: list[str] = Field(default_factory=list)


def _caminho_sqlite_fisico() -> Path:
    """Extrai caminho de arquivo SQLite a partir de DATABASE_URL do Settings."""
    bruto = re.sub(r"^sqlite\+aiosqlite:/+", "", settings.DATABASE_URL)
    caminho = Path(bruto)
    if not caminho.is_absolute():
        caminho = (_BACKEND_DIR / caminho).resolve()
    else:
        caminho = caminho.resolve()
    return caminho


_config = Config()
_orquestrador = Orquestrador(db_path=_caminho_sqlite_fisico(), config=_config)
_sugestor = AgenteSugestor(config=_config)


def _amostra_resultado(colunas: list[str], dados: list[tuple]) -> str:
    if not (colunas and dados):
        return ""
    linhas: list[str] = []
    for linha in dados[:2]:
        linhas.append(", ".join(f"{c}: {v}" for c, v in zip(colunas, linha)))
    return "\n".join(linhas)


@router.post("/chat", response_model=ChatResponse)
def chat(req: ChatRequest) -> ChatResponse:
    resultado = _orquestrador.responder(
        req.message,
        session_id=req.session_id,
        session_store=get_session_store(),
    )

    answer = (
        resultado.resposta_natural
        or resultado.raciocinio
        or resultado.erro
        or "Não consegui responder."
    )
    data = [dict(zip(resultado.colunas, linha)) for linha in resultado.dados]
    erro = (resultado.erro or "").lower()
    out_of_scope = bool(resultado.impossivel or "inválida" in erro)

    sugestoes: list[str] = []
    if resultado.sucesso and resultado.sql_final:
        sugestoes = _sugestor.run(
            pergunta=req.message,
            sql_gerado=resultado.sql_final,
            schema=None,
            amostra_resultado=_amostra_resultado(resultado.colunas, resultado.dados),
        ).sugestoes

    return ChatResponse(
        answer=answer,
        sql_used=resultado.sql_final or None,
        data=data,
        out_of_scope=out_of_scope,
        suggestions=sugestoes,
    )

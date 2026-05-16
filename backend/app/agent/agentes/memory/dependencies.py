from __future__ import annotations

from functools import lru_cache
from pathlib import Path

from fastapi import Header, HTTPException

from app.agent.agentes.memory.memory_store import SessionStoreProtocol
from app.agent.agentes.memory.sql_store import SessionStoreSQL
from app.agent.orquestrador import Orquestrador


@lru_cache(maxsize=1)
def get_session_store() -> SessionStoreProtocol:
    """Injeta o gerenciador de memória ativo."""
    return SessionStoreSQL()


@lru_cache(maxsize=1)
def get_orquestrador() -> Orquestrador:
    """Injeta a instância do pipeline MAC-SQL."""
    db_path = Path(__file__).resolve().parents[4] / "data" / "database.db"
    return Orquestrador(db_path=db_path)


def get_session_id(x_session_id: str | None = Header(None)) -> str:
    """Extrai e valida o ID da sessão enviado pelo front-end no cabeçalho HTTP."""
    if not x_session_id:
        raise HTTPException(
            status_code=400,
            detail="O cabeçalho 'X-Session-ID' é obrigatório para manter o contexto.",
        )
    return x_session_id

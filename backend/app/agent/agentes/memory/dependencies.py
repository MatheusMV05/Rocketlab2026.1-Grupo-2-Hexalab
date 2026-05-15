# NOTE: now the project uses a persistent SQL-backed session store by default.
from fastapi import Header, HTTPException
from app.agent.agentes.memory.memory_store import SessionStoreProtocol
from app.agent.agentes.memory.sql_store import SessionStoreSQL
from app.agent.orquestrador import Orquestrador

# Instância global única (Singleton) do gerenciador de memória para o ciclo de vida do app
# Uses the configured DATABASE_URL from app.config.Settings
_session_store = SessionStoreSQL()

# Instância do Orquestrador
_orquestrador = Orquestrador(db_path="banco.db")


def get_session_store() -> SessionStoreProtocol:
    """Injeta o gerenciador de memória ativo."""
    return _session_store


def get_orquestrador() -> Orquestrador:
    """Injeta a instância do pipeline MAC-SQL."""
    return _orquestrador


def get_session_id(x_session_id: str | None = Header(None)) -> str:
    """Extrai e valida o ID da sessão enviado pelo front-end no cabeçalho HTTP."""
    if not x_session_id:
        raise HTTPException(
            status_code=400,
            detail="O cabeçalho 'X-Session-ID' é obrigatório para manter o contexto.",
        )
    return x_session_id
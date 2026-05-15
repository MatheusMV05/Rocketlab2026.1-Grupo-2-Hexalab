from __future__ import annotations

import time
from typing import Any, Protocol


class SessionStoreProtocol(Protocol):
    """Contrato simples para stores de historico por sessao."""

    def get_history(self, session_id: str) -> list[Any]:
        ...

    def save_history(self, session_id: str, history: list[Any]) -> None:
        ...


class InMemoryTTLSessionStore:
    """Store em memoria com TTL renovado a cada leitura."""

    def __init__(self, ttl_seconds: int = 1800) -> None:
        self.ttl_seconds = ttl_seconds
        self._sessions: dict[str, tuple[float, list[Any]]] = {}

    def get_history(self, session_id: str) -> list[Any]:
        item = self._sessions.get(session_id)
        if item is None:
            return []

        last_accessed, history = item
        now = time.time()
        if now - last_accessed > self.ttl_seconds:
            self._sessions.pop(session_id, None)
            return []

        self._sessions[session_id] = (now, list(history))
        return list(history)

    def save_history(self, session_id: str, history: list[Any]) -> None:
        self._sessions[session_id] = (time.time(), list(history or []))

import time
from threading import Lock
from typing import Any, Protocol


class SessionStoreProtocol(Protocol):
    """Contrato abstrato para armazenamento de histórico de sessões.

    Define a interface obrigatória. Qualquer classe que gerencie a memória
    do agente (seja em RAM, Redis ou Banco de Dados) deve seguir esta assinatura.
    """

    def get_history(self, session_id: str) -> list[Any]:
        """Retorna o histórico de mensagens para o ID da sessão fornecido.

        Args:
            session_id: Identificador único da aba/sessão do usuário.

        Returns:
            Lista de mensagens mantida pelo PydanticAI. Retorna lista vazia
            se a sessão não existir ou tiver expirado.
        """
        pass

    def save_history(self, session_id: str, history: list[Any]) -> None:
        """Salva ou atualiza o histórico de mensagens associado ao ID da sessão.

        Args:
            session_id: Identificador único da aba/sessão do usuário.
            history: Lista atualizada de mensagens retornada pelo agente.
        """
        pass


class InMemoryTTLSessionStore:
    """Armazenamento em RAM thread-safe com expiração automática (TTL).

    Implementa rigorosamente o SessionStoreProtocol. Evita vazamento de memória
    (memory leak) no servidor ejetando automaticamente sessões inativas.
    """

    def __init__(self, ttl_seconds: int = 1800) -> None:
        """Inicializa o gerenciador de sessões em memória.

        Args:
            ttl_seconds: Tempo de vida de uma sessão inativa em segundos.
                         O padrão é 1800 segundos (30 minutos).
        """
        self._store: dict[str, dict[str, Any]] = {}
        self._lock = Lock()
        self._ttl = ttl_seconds

    def get_history(self, session_id: str) -> list[Any]:
        """Obtém o histórico ativo e renova o tempo de vida da sessão."""
        with self._lock:
            # 1. Antes de ler, faz a coleta de lixo das sessões expiradas
            self._evict_expired()

            # 2. Busca a sessão solicitada
            session = self._store.get(session_id)
            if session:
                # 3. Como o usuário fez uma nova requisição, renovamos o
                # timestamp de último acesso (estende a vida da aba na RAM)
                session["last_accessed"] = time.time()
                return session["history"]

            return []

    def save_history(self, session_id: str, history: list[Any]) -> None:
        """Salva o histórico e reseta o temporizador de inatividade da sessão."""
        with self._lock:
            # 1. Coleta o lixo antes de alocar nova memória
            self._evict_expired()

            # 2. Grava o histórico atualizado com o timestamp de agora
            self._store[session_id] = {
                "history": history,
                "last_accessed": time.time(),
            }

    def _evict_expired(self) -> None:
        """Método interno de coleta de lixo (Garbage Collection).

        Varre o dicionário e deleta chaves cujo tempo sem acesso ultrapassou o TTL.
        """
        now = time.time()
        expired_keys = [
            sid
            for sid, data in self._store.items()
            if (now - data["last_accessed"]) > self._ttl
        ]

        for sid in expired_keys:
            del self._store[sid]
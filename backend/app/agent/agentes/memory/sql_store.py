from __future__ import annotations

import datetime
import json
import logging
import re
from typing import Any, List

from pydantic_ai import ModelMessagesTypeAdapter
from pydantic_core import to_jsonable_python
from sqlalchemy import Column, DateTime, ForeignKey, Integer, String, Text, create_engine, func
from sqlalchemy.orm import declarative_base, sessionmaker

from app.agent.agentes.memory.memory_store import SessionStoreProtocol
from app.config import settings

logger = logging.getLogger(__name__)

Base = declarative_base()


class SessionModel(Base):
    __tablename__ = "sessions"
    session_id = Column(String, primary_key=True)
    last_accessed = Column(DateTime, nullable=False)
    summary = Column(Text, nullable=True)
    metadata_json = Column(Text, nullable=True)


class MessageModel(Base):
    __tablename__ = "messages"
    id = Column(Integer, primary_key=True, autoincrement=True)
    session_id = Column(String, ForeignKey("sessions.session_id", ondelete="CASCADE"), index=True)
    role = Column(String(32), nullable=False)
    content = Column(Text, nullable=False)
    created_at = Column(DateTime, server_default=func.now())


class SessionStoreSQL(SessionStoreProtocol):
    """Store persistente de histórico por sessão.

    A compressão não acontece aqui: o histórico salvo já vem processado pelas
    capabilities do PydanticAI nos agentes editores.
    """

    def __init__(self, db_url: str | None = None, ttl_seconds: int = 1800, compress_threshold: int = 100):
        self.db_url = db_url or settings.DATABASE_URL
        self.ttl = ttl_seconds
        self.compress_threshold = compress_threshold
        sync_url = re.sub(r"\+[^:]+(?=://)", "", self.db_url)
        self.engine = create_engine(sync_url, future=True)
        Base.metadata.create_all(self.engine)
        self.SessionLocal = sessionmaker(bind=self.engine, expire_on_commit=False)

    def get_history(self, session_id: str) -> List[Any]:
        with self.SessionLocal() as db:
            session = db.get(SessionModel, session_id)
            if not session:
                return []

            session.last_accessed = datetime.datetime.utcnow()
            db.add(session)
            db.commit()

            messages = (
                db.query(MessageModel)
                .filter(MessageModel.session_id == session_id)
                .order_by(MessageModel.created_at, MessageModel.id)
                .all()
            )
            return self._desserializar_historico(messages)

    def save_history(self, session_id: str, history: List[Any]) -> None:
        with self.SessionLocal() as db:
            session = db.get(SessionModel, session_id)
            if not session:
                session = SessionModel(session_id=session_id, last_accessed=datetime.datetime.utcnow())
            else:
                session.last_accessed = datetime.datetime.utcnow()
                session.summary = None

            db.add(session)
            db.flush()
            db.query(MessageModel).filter(MessageModel.session_id == session_id).delete()

            for item in self._serializar_historico(history):
                db.add(MessageModel(session_id=session_id, role=item["role"], content=item["content"]))

            db.commit()

    @staticmethod
    def _serializar_historico(history: List[Any]) -> list[dict[str, str]]:
        try:
            mensagens = ModelMessagesTypeAdapter.validate_python(list(history or []))
            return [
                {"role": "pydantic", "content": json.dumps(item, ensure_ascii=False)}
                for item in to_jsonable_python(mensagens)
            ]
        except Exception:
            serializado: list[dict[str, str]] = []
            for item in history or []:
                if isinstance(item, dict):
                    role = str(item.get("role") or item.get("from") or "user")
                    content = str(item.get("content") or item)
                else:
                    role = str(getattr(item, "role", "user"))
                    content = str(getattr(item, "content", item))
                if content.strip():
                    serializado.append({"role": role, "content": content})
            return serializado

    @staticmethod
    def _desserializar_historico(messages: list[MessageModel]) -> List[Any]:
        if messages and all(m.role == "pydantic" for m in messages):
            try:
                payload = [json.loads(m.content) for m in messages]
                return list(ModelMessagesTypeAdapter.validate_python(payload))
            except Exception:
                logger.exception("Falha ao desserializar histórico PydanticAI")

        result: List[dict[str, str]] = []
        for message in messages:
            result.append({"role": message.role, "content": message.content})
        return result

from __future__ import annotations

import datetime
import logging
import re
from typing import Any, List

from sqlalchemy import (
    create_engine,
    Column,
    String,
    Text,
    Integer,
    DateTime,
    ForeignKey,
    func,
)
from sqlalchemy.orm import declarative_base, sessionmaker

from app.agent.agentes.memory.memory_store import SessionStoreProtocol
from app.agent.config import Config
from app.config import settings

logger = logging.getLogger(__name__)

Base = declarative_base()


class SessionModel(Base):
    __tablename__ = "sessions"
    session_id = Column(String, primary_key=True)
    last_accessed = Column(DateTime, nullable=False)
    summary = Column(Text, nullable=True)
    metadata = Column(Text, nullable=True)


class MessageModel(Base):
    __tablename__ = "messages"
    id = Column(Integer, primary_key=True, autoincrement=True)
    session_id = Column(String, ForeignKey("sessions.session_id", ondelete="CASCADE"), index=True)
    role = Column(String(32), nullable=False)
    content = Column(Text, nullable=False)
    created_at = Column(DateTime, server_default=func.now())


class SessionStoreSQL(SessionStoreProtocol):
    """Store persistente usando SQLAlchemy (sync).

    Esta implementação usa a `settings.DATABASE_URL` existente, removendo o
    sufixo de driver assíncrono caso presente (ex: `+aiosqlite`, `+asyncpg`) e
    criando um engine síncrono para operações de histórico.

    Observação: para ambientes com drivers específicos (Cloud SQL, async)
    prefira fornecer uma `DATABASE_URL` compatível com driver sync ou ajustar
    o código para usar o conector específico.
    """

    def __init__(self, db_url: str | None = None, ttl_seconds: int = 1800, compress_threshold: int = 100):
        self.db_url = db_url or settings.DATABASE_URL
        self.ttl = ttl_seconds
        # Remove o sufixo +driver assíncrono para criar um engine sync compatível
        sync_url = re.sub(r"\+[^:]+(?=://)", "", self.db_url)
        self.engine = create_engine(sync_url, future=True)
        Base.metadata.create_all(self.engine)
        self.SessionLocal = sessionmaker(bind=self.engine, expire_on_commit=False)
        self.compress_threshold = compress_threshold
        self._agent = None

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
                .order_by(MessageModel.created_at)
                .all()
            )

            result: List[dict[str, str]] = []
            if session.summary:
                result.append({"role": "system", "content": session.summary})

            for m in messages:
                result.append({"role": m.role, "content": m.content})

            return result

    def save_history(self, session_id: str, history: List[Any]) -> None:
        with self.SessionLocal() as db:
            session = db.get(SessionModel, session_id)
            if not session:
                session = SessionModel(session_id=session_id, last_accessed=datetime.datetime.utcnow())
            else:
                session.last_accessed = datetime.datetime.utcnow()

            db.add(session)
            db.flush()

            # Simples: remove mensagens existentes e regrava o histórico recebido.
            db.query(MessageModel).filter(MessageModel.session_id == session_id).delete()

            for item in history:
                if isinstance(item, dict):
                    role = item.get("role") or item.get("from") or "user"
                    content = item.get("content") or str(item)
                else:
                    role = getattr(item, "role", "user")
                    content = getattr(item, "content", str(item))

                msg = MessageModel(session_id=session_id, role=role, content=content)
                db.add(msg)

            db.commit()

            total = db.query(MessageModel).filter(MessageModel.session_id == session_id).count()
            if total > self.compress_threshold:
                try:
                    self._compress_session(db, session)
                except Exception:
                    logger.exception("Falha ao comprimir sessão %s", session_id)

    def _compress_session(self, db, session: SessionModel) -> None:
        messages = (
            db.query(MessageModel)
            .filter(MessageModel.session_id == session.session_id)
            .order_by(MessageModel.created_at)
            .all()
        )

        text = "\n".join([f"{m.role}: {m.content}" for m in messages])
        summary = self._summarize_text(text)
        session.summary = summary

        # Keep only the last 30 messages to bound storage per session
        recent = (
            db.query(MessageModel)
            .filter(MessageModel.session_id == session.session_id)
            .order_by(MessageModel.created_at.desc())
            .limit(30)
            .all()
        )

        if recent:
            cutoff = recent[-1].created_at
            db.query(MessageModel).filter(MessageModel.session_id == session.session_id, MessageModel.created_at < cutoff).delete()

        db.add(session)
        db.commit()

    def _summarize_text(self, text: str) -> str:
        """Usa Mistral via PydanticAI (quando configurado) para gerar um resumo."""
        cfg = Config()
        if not cfg.api_key:
            # sem chave, retorna truncamento simples
            return text[:4000]

        try:
            # import local to avoid hard dependency if not usado
            from pydantic_ai import Agent, RunContext
            from pydantic_ai.models.mistral import MistralModel
            from pydantic_ai.providers.mistral import MistralProvider
            import os

            # Set the API key as environment variable for MistralModel
            os.environ["MISTRAL_API_KEY"] = cfg.api_key
            model = MistralModel(cfg.model, provider=MistralProvider(api_key=cfg.api_key))
            agent = Agent(model)

            @agent.system_prompt
            def sys(ctx: RunContext):
                return "Resuma o histórico de conversa preservando intenções, entidades e resultados relevantes. Seja conciso e preserve fatos numéricos."

            resultado = agent.run_sync(text)
            texto = str(getattr(resultado, "output", getattr(resultado, "data", "")))
            return texto
        except Exception:
            logger.exception("Erro ao gerar resumo via LLM")
            return text[:4000]

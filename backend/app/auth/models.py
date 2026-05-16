import uuid
from datetime import datetime
from typing import Optional
from sqlalchemy import String, Boolean, DateTime
from sqlalchemy.orm import Mapped, mapped_column
from app.database import Base


class Usuario(Base):
    __tablename__ = "usuarios"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    nome: Mapped[str] = mapped_column(String(255), nullable=False)
    email: Mapped[str] = mapped_column(String(255), unique=True, nullable=False, index=True)
    senha_hash: Mapped[str | None] = mapped_column(String(255), nullable=True)
    perfil: Mapped[str] = mapped_column(String(50), nullable=False)
    ativo: Mapped[bool] = mapped_column(Boolean, default=True)
    primeiro_acesso: Mapped[bool] = mapped_column(Boolean, default=True)
    genero: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    pais: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    area_empresa: Mapped[Optional[str]] = mapped_column(String(200), nullable=True)
    filial: Mapped[Optional[str]] = mapped_column(String(200), nullable=True)
    criado_em: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    atualizado_em: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

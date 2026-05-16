from datetime import datetime, timedelta, timezone
from typing import Any
import jwt
from passlib.context import CryptContext
from app.config import settings

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

ALGORITHM = "HS256"


def hash_senha(senha: str) -> str:
    return pwd_context.hash(senha)


def verificar_senha(senha: str, hash: str) -> bool:
    return pwd_context.verify(senha, hash)


def criar_access_token(payload: dict[str, Any]) -> str:
    dados = payload.copy()
    dados["exp"] = datetime.now(timezone.utc) + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    dados["type"] = "access"
    return jwt.encode(dados, settings.SECRET_KEY, algorithm=ALGORITHM)


def criar_refresh_token(payload: dict[str, Any]) -> str:
    dados = payload.copy()
    dados["exp"] = datetime.now(timezone.utc) + timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS)
    dados["type"] = "refresh"
    return jwt.encode(dados, settings.SECRET_KEY, algorithm=ALGORITHM)


def verificar_token(token: str, tipo: str = "access") -> dict[str, Any]:
    try:
        dados = jwt.decode(token, settings.SECRET_KEY, algorithms=[ALGORITHM])
        if dados.get("type") != tipo:
            raise ValueError("Tipo de token inválido")
        return dados
    except jwt.ExpiredSignatureError:
        raise ValueError("Token expirado")
    except jwt.InvalidTokenError:
        raise ValueError("Token inválido")

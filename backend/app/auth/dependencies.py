from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.database import get_db
from app.auth.models import Usuario
from app.auth.security import verificar_token

bearer_scheme = HTTPBearer()


async def get_usuario_atual(
    credentials: HTTPAuthorizationCredentials = Depends(bearer_scheme),
    db: AsyncSession = Depends(get_db),
) -> Usuario:
    token = credentials.credentials
    try:
        payload = verificar_token(token, tipo="access")
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail=str(e))

    resultado = await db.execute(select(Usuario).where(Usuario.id == payload["user_id"]))
    usuario = resultado.scalar_one_or_none()

    if not usuario or not usuario.ativo:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Usuário inativo ou não encontrado"
        )

    return usuario

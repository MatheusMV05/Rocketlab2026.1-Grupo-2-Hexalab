from fastapi import APIRouter, Depends, Response, Request, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.database import get_db
from app.auth.schemas import LoginRequest, GoogleLoginRequest, DefinirSenhaRequest, TokenResponse, UsuarioResponse
from app.auth.service import login_email_senha, login_google, definir_senha, _payload_usuario, _token_response
from app.auth.dependencies import get_usuario_atual
from app.auth.models import Usuario
from app.auth.security import verificar_token, criar_refresh_token
from app.config import settings

router = APIRouter(prefix="/auth", tags=["Autenticação"])

COOKIE_NAME = "refresh_token"
COOKIE_OPTS = {
    "httponly": True,
    "secure": settings.ENVIRONMENT == "production",
    "samesite": "lax",
    "max_age": settings.REFRESH_TOKEN_EXPIRE_DAYS * 24 * 60 * 60,
}


def _set_refresh_cookie(response: Response, token: str) -> None:
    response.set_cookie(COOKIE_NAME, token, **COOKIE_OPTS)


@router.post("/login", response_model=TokenResponse)
async def login(dados: LoginRequest, response: Response, db: AsyncSession = Depends(get_db)):
    token_response, refresh = await login_email_senha(db, dados)
    _set_refresh_cookie(response, refresh)
    return token_response


@router.post("/google", response_model=TokenResponse)
async def login_com_google(dados: GoogleLoginRequest, response: Response, db: AsyncSession = Depends(get_db)):
    token_response, refresh = await login_google(db, dados)
    _set_refresh_cookie(response, refresh)
    return token_response


@router.post("/refresh", response_model=TokenResponse)
async def refresh_token(request: Request, response: Response, db: AsyncSession = Depends(get_db)):
    token = request.cookies.get(COOKIE_NAME)
    if not token:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Refresh token ausente")

    try:
        payload = verificar_token(token, tipo="refresh")
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail=str(e))

    resultado = await db.execute(select(Usuario).where(Usuario.id == payload["user_id"]))
    usuario = resultado.scalar_one_or_none()

    if not usuario or not usuario.ativo:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Usuário inativo")

    novo_refresh = criar_refresh_token(_payload_usuario(usuario))
    _set_refresh_cookie(response, novo_refresh)
    return _token_response(usuario)


@router.post("/logout")
async def logout(response: Response):
    response.delete_cookie(COOKIE_NAME)
    return {"ok": True}


@router.get("/me", response_model=UsuarioResponse)
async def me(usuario: Usuario = Depends(get_usuario_atual)):
    return UsuarioResponse(
        id=usuario.id,
        nome=usuario.nome,
        email=usuario.email,
        perfil=usuario.perfil,
        primeiro_acesso=usuario.primeiro_acesso,
    )


@router.post("/definir-senha", response_model=TokenResponse)
async def definir_senha_endpoint(
    dados: DefinirSenhaRequest,
    db: AsyncSession = Depends(get_db),
    usuario: Usuario = Depends(get_usuario_atual),
):
    return await definir_senha(db, usuario.id, dados)

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.auth.models import Usuario
from app.auth.schemas import LoginRequest, GoogleLoginRequest, DefinirSenhaRequest, AtualizarPerfilRequest, TokenResponse, UsuarioResponse
from app.auth.security import verificar_senha, hash_senha, criar_access_token, criar_refresh_token
from app.config import settings
from fastapi import HTTPException, status


def _payload_usuario(usuario: Usuario) -> dict:
    return {
        "user_id": usuario.id,
        "email": usuario.email,
        "perfil": usuario.perfil,
        "primeiro_acesso": usuario.primeiro_acesso,
    }


def _token_response(usuario: Usuario) -> TokenResponse:
    payload = _payload_usuario(usuario)
    return TokenResponse(
        access_token=criar_access_token(payload),
        perfil=usuario.perfil,
        nome=usuario.nome,
        email=usuario.email,
        primeiro_acesso=usuario.primeiro_acesso,
    )


async def login_email_senha(db: AsyncSession, dados: LoginRequest) -> tuple[TokenResponse, str]:
    resultado = await db.execute(select(Usuario).where(Usuario.email == dados.email))
    usuario = resultado.scalar_one_or_none()

    if not usuario or not usuario.senha_hash or not verificar_senha(dados.senha, usuario.senha_hash):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Credenciais inválidas")

    if not usuario.ativo:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Conta desativada")

    refresh = criar_refresh_token(_payload_usuario(usuario))
    return _token_response(usuario), refresh


async def login_google(db: AsyncSession, dados: GoogleLoginRequest) -> tuple[TokenResponse, str]:
    try:
        from google.oauth2 import id_token
        from google.auth.transport import requests as google_requests
        info = id_token.verify_oauth2_token(
            dados.credential,
            google_requests.Request(),
            settings.GOOGLE_CLIENT_ID,
        )
        email = info["email"]
    except Exception:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Token Google inválido")

    resultado = await db.execute(select(Usuario).where(Usuario.email == email))
    usuario = resultado.scalar_one_or_none()

    if not usuario:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Acesso não autorizado. Solicite ao administrador."
        )

    if not usuario.ativo:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Conta desativada")

    refresh = criar_refresh_token(_payload_usuario(usuario))
    return _token_response(usuario), refresh


async def definir_senha(db: AsyncSession, usuario_id: str, dados: DefinirSenhaRequest) -> TokenResponse:
    if dados.nova_senha != dados.confirmar_senha:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="As senhas não conferem")

    if len(dados.nova_senha) < 6:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Senha deve ter no mínimo 6 caracteres")

    resultado = await db.execute(select(Usuario).where(Usuario.id == usuario_id))
    usuario = resultado.scalar_one_or_none()

    if not usuario:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Usuário não encontrado")

    usuario.senha_hash = hash_senha(dados.nova_senha)
    usuario.primeiro_acesso = False
    await db.commit()
    await db.refresh(usuario)

    return _token_response(usuario)


async def atualizar_perfil(db: AsyncSession, usuario_id: str, dados: AtualizarPerfilRequest) -> UsuarioResponse:
    resultado = await db.execute(select(Usuario).where(Usuario.id == usuario_id))
    usuario = resultado.scalar_one_or_none()

    if not usuario:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Usuário não encontrado")

    usuario.nome = dados.nome
    usuario.genero = dados.genero
    usuario.pais = dados.pais
    usuario.area_empresa = dados.area_empresa
    usuario.filial = dados.filial
    await db.commit()
    await db.refresh(usuario)

    return UsuarioResponse(
        id=usuario.id,
        nome=usuario.nome,
        email=usuario.email,
        perfil=usuario.perfil,
        primeiro_acesso=usuario.primeiro_acesso,
        genero=usuario.genero,
        pais=usuario.pais,
        area_empresa=usuario.area_empresa,
        filial=usuario.filial,
    )

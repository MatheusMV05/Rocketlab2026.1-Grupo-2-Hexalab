from typing import Optional
from pydantic import BaseModel


class LoginRequest(BaseModel):
    email: str
    senha: str


class GoogleLoginRequest(BaseModel):
    credential: str


class DefinirSenhaRequest(BaseModel):
    nova_senha: str
    confirmar_senha: str


class AtualizarPerfilRequest(BaseModel):
    nome: str
    genero: Optional[str] = None
    pais: Optional[str] = None
    area_empresa: Optional[str] = None
    filial: Optional[str] = None


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    perfil: str
    nome: str
    email: str
    primeiro_acesso: bool


class UsuarioResponse(BaseModel):
    id: str
    nome: str
    email: str
    perfil: str
    primeiro_acesso: bool
    genero: Optional[str] = None
    pais: Optional[str] = None
    area_empresa: Optional[str] = None
    filial: Optional[str] = None

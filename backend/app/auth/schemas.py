from pydantic import BaseModel


class LoginRequest(BaseModel):
    email: str
    senha: str


class GoogleLoginRequest(BaseModel):
    credential: str  # id_token retornado pelo SDK Google


class DefinirSenhaRequest(BaseModel):
    nova_senha: str
    confirmar_senha: str


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

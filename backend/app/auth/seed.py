import uuid
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.auth.models import Usuario
from app.auth.security import hash_senha


ADMIN_EMAIL = "admin@vcommerce.com"
ADMIN_SENHA_TEMP = "Admin@123"


async def seed_admin(db: AsyncSession) -> None:
    resultado = await db.execute(select(Usuario).where(Usuario.email == ADMIN_EMAIL))
    if resultado.scalar_one_or_none():
        return  # já existe

    admin = Usuario(
        id=str(uuid.uuid4()),
        nome="Administrador",
        email=ADMIN_EMAIL,
        senha_hash=hash_senha(ADMIN_SENHA_TEMP),
        perfil="admin",
        ativo=True,
        primeiro_acesso=False,
    )
    db.add(admin)
    await db.commit()
    print(f"[seed] Admin criado: {ADMIN_EMAIL} / {ADMIN_SENHA_TEMP}")

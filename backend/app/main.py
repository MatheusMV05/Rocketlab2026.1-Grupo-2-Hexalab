from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.database import engine, Base
from app.auth.models import Usuario  # registra metadata na Base
from app.auth.router import router as auth_router
from app.dashboard.router import router as dashboard_router
from app.clientes.router import router as clientes_router
from app.pedidos.router import router as pedidos_router
from app.produtos.router import router as produtos_router
# from app.agent.router import router as agent_router  # TODO: reativar quando pydantic_ai_summarization estiver disponível
from app.tickets.router import router as tickets_router


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Cria tabela de usuários se não existir (banco analítico já existe)
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all, checkfirst=True)

    # Seed do admin inicial
    from app.database import AsyncSessionLocal
    from app.auth.seed import seed_admin
    async with AsyncSessionLocal() as db:
        await seed_admin(db)

    yield


app = FastAPI(
    title="V-Commerce CRM 360",
    version="1.0.0",
    description="API do CRM analítico V-Commerce",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router, prefix="/api")
app.include_router(dashboard_router, prefix="/api/dashboard", tags=["dashboard"])
app.include_router(clientes_router, prefix="/api")
app.include_router(produtos_router, prefix="/api")
app.include_router(pedidos_router, prefix="/api")
# app.include_router(agent_router, prefix="/api")
app.include_router(tickets_router, prefix="/api")


@app.get("/health", tags=["health"])
async def health():
    return {"status": "ok"}

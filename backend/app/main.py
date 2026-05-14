from contextlib import asynccontextmanager
from app.produtos.router import router as produtos_router
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.database import engine, Base
from app.dashboard.router import router as dashboard_router


@asynccontextmanager
async def lifespan(app: FastAPI):
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    yield

app = FastAPI(
    title="V-Commerce CRM 360",
    version="1.0.0",
    description="API do CRM analítico V-Commerce",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Registrar routers aqui conforme as features forem implementadas
# Exemplo: app.include_router(dashboard_router)
from app.clientes.router import router as clientes_router
from app.pedidos.router import router as pedidos_router
from app.tickets.router import router as tickets_router

app.include_router(dashboard_router, prefix="/api/dashboard", tags=["dashboard"])
app.include_router(clientes_router, prefix="/api")
app.include_router(produtos_router, prefix="/api")
app.include_router(pedidos_router, prefix="/api")
app.include_router(tickets_router, prefix="/api")

@app.get("/health", tags=["health"])
async def health():
    return {"status": "ok"}

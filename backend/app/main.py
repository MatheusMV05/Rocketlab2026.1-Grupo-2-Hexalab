from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.database import engine, Base


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
from app.tickets.router import roteador as tickets_router
app.include_router(tickets_router, prefix="/api")


@app.get("/health", tags=["health"])
async def health():
    return {"status": "ok"}

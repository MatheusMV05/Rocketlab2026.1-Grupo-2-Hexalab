from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.produtos.models import Produto

async def obter_produtos(db: AsyncSession, categoria: str | None, ativo: bool | None, limite: int, salto: int):
    query = select(Produto)
    
    if categoria is not None:
        query = query.where(Produto.categoria == categoria)
    if ativo is not None:
        query = query.where(Produto.ativo == ativo)
        
    query = query.limit(limite).offset(salto)
    resultado = await db.execute(query)
    return resultado.scalars().all()


async def obter_produto_por_id(db: AsyncSession, produto_id: int):
    return await db.get(Produto, produto_id)


async def criar_produto(db: AsyncSession, dados_produto: dict):
    produto_db = Produto(**dados_produto)
    db.add(produto_db)
    await db.commit()
    await db.refresh(produto_db)
    return produto_db


async def atualizar_produto(db: AsyncSession, produto_db: Produto, dados_atualizacao: dict):
    for campo, valor in dados_atualizacao.items():
        setattr(produto_db, campo, valor)
    await db.commit()
    await db.refresh(produto_db)
    return produto_db


async def deletar_produto(db: AsyncSession, produto_db: Produto):
    await db.delete(produto_db)
    await db.commit()
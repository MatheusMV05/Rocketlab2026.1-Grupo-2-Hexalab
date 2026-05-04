from sqlalchemy.ext.asyncio import AsyncSession

from app.produtos import repository
from app.produtos.schemas import ProdutoCriar, ProdutoAtualizar

async def listar_produtos(db: AsyncSession, categoria: str | None, ativo: bool | None, limite: int, salto: int):
    return await repository.obter_produtos(db, categoria, ativo, limite, salto)


async def criar_produto(db: AsyncSession, produto_in: ProdutoCriar):
    return await repository.criar_produto(db, produto_in.model_dump())


async def atualizar_produto(db: AsyncSession, produto_id: int, produto_in: ProdutoAtualizar):
    produto_db = await repository.obter_produto_por_id(db, produto_id)
    if not produto_db:
        return None
    
    dados_atualizacao = produto_in.model_dump(exclude_unset=True)
    return await repository.atualizar_produto(db, produto_db, dados_atualizacao)


async def deletar_produto(db: AsyncSession, produto_id: int):
    produto_db = await repository.obter_produto_por_id(db, produto_id)
    if not produto_db:
        return False
        
    await repository.deletar_produto(db, produto_db)
    return True
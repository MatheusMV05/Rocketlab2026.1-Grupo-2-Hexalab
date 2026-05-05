import random
from sqlalchemy.ext.asyncio import AsyncSession

from app.produtos import repository
from app.produtos.schemas import ProdutoCriar, ProdutoAtualizar, ProdutoMetricasResponse, ProdutoPaginaResponse

async def listar_produtos(db: AsyncSession, categoria: str | None, ativo: bool | None, page: int, size: int):
    produtos_db, total = await repository.obter_produtos_paginados(db, categoria, ativo, page, size)
    
    items = []
    for produto in produtos_db:
        produto_dict = {
            "id": produto.id,
            "nome_produto": produto.nome_produto,
            "categoria": produto.categoria,
            "preco": produto.preco,
            "estoque_disponivel": produto.estoque_disponivel,
            "ativo": produto.ativo,
            "receita_total": round(produto.preco * random.randint(5, 50), 2),
            "total_vendas": random.randint(10, 100),
            "avaliacao_media": round(random.uniform(3.5, 5.0), 1),
            "total_tickets": random.randint(0, 3)
        }
        items.append(ProdutoMetricasResponse(**produto_dict))
        
    return ProdutoPaginaResponse(
        items=items,
        total=total,
        page=page,
        size=size
    )


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
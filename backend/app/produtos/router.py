from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.produtos import service
from app.produtos.schemas import ProdutoCriar, ProdutoAtualizar, ProdutoResponse, ProdutoPaginaResponse
from app.database import get_db

router = APIRouter(prefix="/produtos", tags=["Gestão de Produtos"])

@router.get("/", response_model=ProdutoPaginaResponse)
async def listar_produtos(
    categoria: str | None = None,
    ativo: bool | None = None,
    pagina: int = Query(1, ge=1),   
    tamanho: int = Query(10, ge=1), 
    db: AsyncSession = Depends(get_db)
):
    return await service.listar_produtos(db, categoria, ativo, pagina, tamanho)


@router.post("/", response_model=ProdutoResponse, status_code=status.HTTP_201_CREATED)
async def criar_produto(produto_in: ProdutoCriar, db: AsyncSession = Depends(get_db)):
    return await service.criar_produto(db, produto_in)


@router.put("/{produto_id}", response_model=ProdutoResponse)
async def atualizar_produto(produto_id: int, produto_in: ProdutoAtualizar, db: AsyncSession = Depends(get_db)):
    produto = await service.atualizar_produto(db, produto_id, produto_in)
    
    if not produto:
        raise HTTPException(status_code=404, detail="Produto não encontrado.")
        
    return produto


@router.delete("/{produto_id}", status_code=status.HTTP_204_NO_CONTENT)
async def deletar_produto(produto_id: int, db: AsyncSession = Depends(get_db)):
    sucesso = await service.deletar_produto(db, produto_id)
    
    if not sucesso:
        raise HTTPException(status_code=404, detail="Produto não encontrado.")
        
    return None
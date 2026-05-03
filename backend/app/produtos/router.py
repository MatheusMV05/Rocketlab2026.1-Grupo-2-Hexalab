from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import List, Optional

from app.produtos.models import Product
from app.produtos.schemas import ProductCreate, ProductUpdate, ProductResponse, ProductMetricsResponse
from app.database import get_db

router = APIRouter(prefix="/produtos", tags=["Gestão de Produtos"])

@router.get("/", response_model=List[ProductMetricsResponse])
async def list_products(
    category: Optional[str] = None,
    is_active: Optional[bool] = None,
    limit: int = Query(10, ge=1),
    offset: int = Query(0, ge=0),
    db: AsyncSession = Depends(get_db)
):
    # Busca produtos no banco aplicando paginação e filtros opcionais
    query = select(Product)
    
    if category is not None:
        query = query.where(Product.category == category)
    if is_active is not None:
        query = query.where(Product.is_active == is_active)
        
    query = query.limit(limit).offset(offset)
    
    resultado = await db.execute(query)
    return resultado.scalars().all()


@router.post("/", response_model=ProductResponse, status_code=status.HTTP_201_CREATED)
async def create_product(product_in: ProductCreate, db: AsyncSession = Depends(get_db)):
    # Recebe os dados, salva um novo produto no banco e retorna o item criado com seu ID
    novo_produto = Product(**product_in.model_dump())
    
    db.add(novo_produto)
    await db.commit()
    await db.refresh(novo_produto)
    
    return novo_produto


@router.put("/{product_id}", response_model=ProductResponse)
async def update_product(product_id: int, product_in: ProductUpdate, db: AsyncSession = Depends(get_db)):
    # Localiza o produto pelo ID e atualiza apenas os campos que foram enviados na requisição
    produto = await db.get(Product, product_id)
    
    if produto is None:
        raise HTTPException(status_code=404, detail="Produto não encontrado.")

    dados_para_atualizar = product_in.model_dump(exclude_unset=True)
    for campo, valor in dados_para_atualizar.items():
        setattr(produto, campo, valor)
        
    await db.commit()
    await db.refresh(produto)
    
    return produto


@router.delete("/{product_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_product(product_id: int, db: AsyncSession = Depends(get_db)):
    # Localiza o produto pelo ID e o remove permanentemente do banco de dados
    produto = await db.get(Product, product_id)
    
    if produto is None:
        raise HTTPException(status_code=404, detail="Produto não encontrado.")

    await db.delete(produto)
    await db.commit()
    
    return None
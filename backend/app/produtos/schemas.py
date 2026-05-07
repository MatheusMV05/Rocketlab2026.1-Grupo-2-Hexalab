from pydantic import BaseModel, ConfigDict, Field

class ProdutoBase(BaseModel):
    nome_produto: str = Field(min_length=1)
    categoria: str = Field(min_length=1)
    preco: float = Field(gt=0)
    estoque_disponivel: int = Field(ge=0)
    ativo: bool = True

class ProdutoCriar(ProdutoBase): 
    pass

class ProdutoAtualizar(BaseModel):
    nome_produto: str | None = Field(None, min_length=1)
    categoria: str | None = None
    preco: float | None = Field(None, gt=0)
    estoque_disponivel: int | None = Field(None, ge=0)
    ativo: bool | None = None

class ProdutoResponse(ProdutoBase):
    id: int
    model_config = ConfigDict(from_attributes=True)

class ProdutoMetricasResponse(ProdutoResponse):
    receita_total: float
    total_vendas: int
    avaliacao_media: float
    total_tickets: int

class ProdutoPaginaResponse(BaseModel):
    itens: list[ProdutoMetricasResponse] 
    total: int
    pagina: int    
    tamanho: int 
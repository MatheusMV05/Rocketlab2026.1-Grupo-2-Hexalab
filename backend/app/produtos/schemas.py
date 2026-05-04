from pydantic import BaseModel, ConfigDict, Field

class ProdutoBase(BaseModel):
    nome: str = Field(min_length=1)
    categoria: str = Field(min_length=1)
    preco: float = Field(gt=0)
    estoque: int = Field(ge=0)
    ativo: bool = True

class ProdutoCriar(ProdutoBase): 
    pass

class ProdutoAtualizar(BaseModel):
    nome: str | None = Field(None, min_length=1)
    categoria: str | None = None
    preco: float | None = Field(None, gt=0)
    estoque: int | None = Field(None, ge=0)
    ativo: bool | None = None

class ProdutoResponse(ProdutoBase):
    id: int
    model_config = ConfigDict(from_attributes=True)

class ProdutoMetricasResponse(ProdutoResponse):
    receita_total: float = 0.0
    total_vendas: int = 0
    avaliacao_media: float = 5.0
    total_tickets: int = 0
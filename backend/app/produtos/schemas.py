from pydantic import BaseModel, ConfigDict, Field

class ProductBase(BaseModel):
    name: str = Field(min_length=1)
    category: str = Field(min_length=1)
    price: float = Field(gt=0)
    stock: int = Field(ge=0)
    is_active: bool = True

class ProductCreate(ProductBase): 
    pass

class ProductUpdate(ProductBase):
    name: str | None = Field(None, min_length=1)
    category: str | None = None
    price: float | None = Field(None, gt=0)
    stock: int | None = Field(None, ge=0)
    is_active: bool | None = None

class ProductResponse(ProductBase):
    id: int
    model_config = ConfigDict(from_attributes=True)

class ProductMetricsResponse(ProductResponse):
    total_revenue: float = 0.0
    sales_count: int = 0
    average_rating: float = 5.0
    ticket_count: int = 0
from sqlalchemy.orm import Mapped, mapped_column
from app.database import Base

class Product(Base):
    __tablename__ = "products"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    name: Mapped[str] = mapped_column(index=True)
    category: Mapped[str] = mapped_column(index=True)
    price: Mapped[float]
    stock: Mapped[int]
    is_active: Mapped[bool] = mapped_column(default=True)
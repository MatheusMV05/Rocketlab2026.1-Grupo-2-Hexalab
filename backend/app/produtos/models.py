from sqlalchemy.orm import Mapped, mapped_column
from app.database import Base

class Produto(Base):
    __tablename__ = "produtos"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    nome_produto: Mapped[str] = mapped_column(index=True)
    categoria: Mapped[str] = mapped_column(index=True)
    preco: Mapped[float]
    estoque_disponivel: Mapped[int]
    ativo: Mapped[bool] = mapped_column(default=True)
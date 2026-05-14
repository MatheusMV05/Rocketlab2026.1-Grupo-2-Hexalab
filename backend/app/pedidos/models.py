from datetime import date
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy import String, Float, Integer, Date, ForeignKey
from app.database import Base

class Pedido(Base):
    __tablename__ = "fat_pedidos"

    sk_pedido: Mapped[str] = mapped_column(String, primary_key=True)
    id_pedido: Mapped[str] = mapped_column(String, nullable=False)
    sk_cliente: Mapped[str] = mapped_column(String)
    sk_produto: Mapped[str] = mapped_column(String)
    sk_data_pedido: Mapped[int] = mapped_column(Integer)
    metodo_pagamento: Mapped[str] = mapped_column(String)
    status: Mapped[str] = mapped_column(String)
    valor_pedido_brl: Mapped[float] = mapped_column(Float)
    quantidade: Mapped[int] = mapped_column(Integer)
    id_cliente: Mapped[str] = mapped_column(String)
    id_produto: Mapped[str] = mapped_column(String)

class ClienteDim(Base):
    __tablename__ = "dim_clientes"
    sk_cliente: Mapped[str] = mapped_column(String, primary_key=True)
    nome: Mapped[str] = mapped_column(String)
    sobrenome: Mapped[str] = mapped_column(String)

class ProdutoDim(Base):
    __tablename__ = "dim_produtos"
    sk_produto: Mapped[str] = mapped_column(String, primary_key=True)
    nome_produto: Mapped[str] = mapped_column(String)
    categoria: Mapped[str] = mapped_column(String)

class DataDim(Base):
    __tablename__ = "dim_data"
    sk_data: Mapped[int] = mapped_column(Integer, primary_key=True)
    data_completa: Mapped[str] = mapped_column(String)

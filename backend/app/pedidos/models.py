from datetime import date
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy import String, Float, Integer, Date
from app.database import Base

class Pedido(Base):
    __tablename__ = "gold_pedidos"

    id_pedido: Mapped[int] = mapped_column(Integer, primary_key=True)
    id_cliente: Mapped[int] = mapped_column(Integer)
    nome_cliente: Mapped[str] = mapped_column(String(255))
    id_produto: Mapped[int] = mapped_column(Integer)
    nome_produto: Mapped[str] = mapped_column(String(255))
    categoria: Mapped[str] = mapped_column(String(100))
    valor_pedido: Mapped[float] = mapped_column(Float)
    quantidade: Mapped[int] = mapped_column(Integer)
    data_pedido: Mapped[date] = mapped_column(Date)
    metodo_pagamento: Mapped[str] = mapped_column(String(50))
    status: Mapped[str] = mapped_column(String(50))

# MOCK DATA (Mantido para compatibilidade enquanto o banco não é populado)
MOCK_PEDIDOS = [
    {
        "id_pedido": 101,
        "id_cliente": 1,
        "nome_cliente": "João Silva",
        "id_produto": 1001,
        "nome_produto": "Smartphone Samsung S23",
        "categoria": "Eletrônicos",
        "valor_pedido": 4500.00,
        "quantidade": 1,
        "data_pedido": date(2024, 1, 15),
        "metodo_pagamento": "Cartão de Crédito",
        "status": "Aprovado"
    },
    {
        "id_pedido": 102,
        "id_cliente": 2,
        "nome_cliente": "Maria Oliveira",
        "id_produto": 1002,
        "nome_produto": "Monitor Dell 27",
        "categoria": "Eletrônicos",
        "valor_pedido": 1500.00,
        "quantidade": 1,
        "data_pedido": date(2024, 2, 20),
        "metodo_pagamento": "Boleto",
        "status": "Pendente"
    },
    {
        "id_pedido": 103,
        "id_cliente": 1,
        "nome_cliente": "João Silva",
        "id_produto": 2001,
        "nome_produto": "Cadeira Ergonômica",
        "categoria": "Móveis",
        "valor_pedido": 850.00,
        "quantidade": 2,
        "data_pedido": date(2024, 3, 10),
        "metodo_pagamento": "PIX",
        "status": "Cancelado"
    }
]

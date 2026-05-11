from datetime import date
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy import String, Float, Integer, Date
from app.database import Base

class Cliente(Base):
    __tablename__ = "gold_clientes_360"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    nome_completo: Mapped[str] = mapped_column(String(255))
    email: Mapped[str] = mapped_column(String(255), unique=True)
    cidade: Mapped[str] = mapped_column(String(100))
    estado: Mapped[str] = mapped_column(String(2))
    genero: Mapped[str] = mapped_column(String(20))
    idade: Mapped[int] = mapped_column(Integer)
    data_cadastro: Mapped[date] = mapped_column(Date)
    origem: Mapped[str] = mapped_column(String(100))
    total_pedidos: Mapped[int] = mapped_column(Integer, default=0)
    total_gasto: Mapped[float] = mapped_column(Float, default=0.0)
    ticket_medio: Mapped[float] = mapped_column(Float, default=0.0)
    ultimo_pedido: Mapped[date] = mapped_column(Date, nullable=True)
    nps_medio: Mapped[float] = mapped_column(Float, default=0.0)
    tickets_abertos: Mapped[int] = mapped_column(Integer, default=0)
    segmento_rfm: Mapped[str] = mapped_column(String(50))

# MOCK DATA (Mantido para compatibilidade enquanto o banco não é populado)
MOCK_CLIENTES = [
    {
        "id": 1,
        "nome_completo": "João Silva",
        "email": "joao.silva@email.com",
        "cidade": "São Paulo",
        "estado": "SP",
        "genero": "Masculino",
        "idade": 35,
        "data_cadastro": date(2023, 1, 15),
        "origem": "Google",
        "total_gasto": 1500.50,
        "total_pedidos": 5,
        "ticket_medio": 300.10,
        "ultimo_pedido": date(2024, 4, 10),
        "nps_medio": 9.0,
        "tickets_abertos": 0,
        "segmento_rfm": "Campeão"
    },
    {
        "id": 2,
        "nome_completo": "Maria Oliveira",
        "email": "maria.oliveira@email.com",
        "cidade": "Rio de Janeiro",
        "estado": "RJ",
        "genero": "Feminino",
        "idade": 28,
        "data_cadastro": date(2023, 5, 20),
        "origem": "Instagram",
        "total_gasto": 450.00,
        "total_pedidos": 2,
        "ticket_medio": 225.00,
        "ultimo_pedido": date(2024, 1, 5),
        "nps_medio": 7.5,
        "tickets_abertos": 1,
        "segmento_rfm": "Em Risco"
    }
]

MOCK_PEDIDOS = [
    {"id": 101, "cliente_id": 1, "nome_produto": "Smartphone", "categoria": "Eletrônicos", "valor": 1200.00, "data": date(2023, 2, 10), "status": "Entregue"},
    {"id": 102, "cliente_id": 1, "nome_produto": "Fone de Ouvido", "categoria": "Acessórios", "valor": 300.50, "data": date(2024, 4, 10), "status": "Entregue"}
]

MOCK_AVALIACOES = [
    {"id_pedido": 101, "cliente_id": 1, "nota_produto": 5, "nps": 10, "comentario": "Excelente produto!"},
    {"id_pedido": 102, "cliente_id": 1, "nota_produto": 4, "nps": 8, "comentario": "Muito bom, mas a entrega demorou um pouco."}
]

MOCK_TICKETS = [
    {"id": 501, "cliente_id": 2, "tipo_problema": "Atraso na Entrega", "data_abertura": date(2024, 1, 10), "tempo_resolucao": "2 dias", "nota_avaliacao": 4}
]

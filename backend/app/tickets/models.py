from datetime import date
from typing import Optional

from sqlalchemy import Date, Integer, String
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base


# MOCK: tabela gold_tickets ainda não existe — substituir pelo schema real quando o time de dados entregar as tabelas Gold
class GoldTickets(Base):
    __tablename__ = "gold_tickets"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    id_cliente: Mapped[int] = mapped_column(Integer, nullable=False)
    id_pedido: Mapped[int] = mapped_column(Integer, nullable=False)
    tipo_problema: Mapped[str] = mapped_column(String, nullable=False)
    status: Mapped[str] = mapped_column(String, nullable=False)
    data_abertura: Mapped[date] = mapped_column(Date, nullable=False)

    # nulos para tickets ainda em aberto
    data_resolucao: Mapped[Optional[date]] = mapped_column(Date, nullable=True)
    tempo_resolucao_horas: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)

    agente_suporte: Mapped[str] = mapped_column(String, nullable=False)

    # nota dada pelo cliente após resolução; nulo se ticket aberto
    nota_avaliacao: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)


# Dados mock para seed enquanto as tabelas Gold não estão disponíveis.
# Cobre os três níveis de prioridade, os três status e os três agentes.
DADOS_MOCK = [
    # --- tickets abertos (prioridade Alta — sem tempo_resolucao_horas) ---
    {
        "id": 1,
        "id_cliente": 101,
        "id_pedido": 201,
        "tipo_problema": "Entrega",
        "status": "Aberto",
        "data_abertura": date(2024, 11, 5),
        "data_resolucao": None,
        "tempo_resolucao_horas": None,
        "agente_suporte": "Ana Silva",
        "nota_avaliacao": None,
    },
    {
        "id": 2,
        "id_cliente": 102,
        "id_pedido": 202,
        "tipo_problema": "Pagamento",
        "status": "Aberto",
        "data_abertura": date(2024, 11, 10),
        "data_resolucao": None,
        "tempo_resolucao_horas": None,
        "agente_suporte": "Bruno Costa",
        "nota_avaliacao": None,
    },
    {
        "id": 10,
        "id_cliente": 110,
        "id_pedido": 210,
        "tipo_problema": "Cancelamento",
        "status": "Aberto",
        "data_abertura": date(2024, 9, 20),
        "data_resolucao": None,
        "tempo_resolucao_horas": None,
        "agente_suporte": "Ana Silva",
        "nota_avaliacao": None,
    },
    {
        "id": 15,
        "id_cliente": 115,
        "id_pedido": 215,
        "tipo_problema": "Outros",
        "status": "Aberto",
        "data_abertura": date(2024, 6, 10),
        "data_resolucao": None,
        "tempo_resolucao_horas": None,
        "agente_suporte": "Carla Mendes",
        "nota_avaliacao": None,
    },
    # --- tickets em andamento (prioridade Alta — sem tempo_resolucao_horas) ---
    {
        "id": 8,
        "id_cliente": 108,
        "id_pedido": 208,
        "tipo_problema": "Produto com defeito",
        "status": "Em andamento",
        "data_abertura": date(2024, 11, 12),
        "data_resolucao": None,
        "tempo_resolucao_horas": None,
        "agente_suporte": "Bruno Costa",
        "nota_avaliacao": None,
    },
    {
        "id": 16,
        "id_cliente": 116,
        "id_pedido": 216,
        "tipo_problema": "Entrega",
        "status": "Em andamento",
        "data_abertura": date(2024, 6, 25),
        "data_resolucao": None,
        "tempo_resolucao_horas": None,
        "agente_suporte": "Ana Silva",
        "nota_avaliacao": None,
    },
    # --- tickets fechados com prioridade Alta (tempo_resolucao_horas > 72) ---
    {
        "id": 3,
        "id_cliente": 103,
        "id_pedido": 203,
        "tipo_problema": "Produto com defeito",
        "status": "Fechado",
        "data_abertura": date(2024, 10, 1),
        "data_resolucao": date(2024, 10, 5),
        "tempo_resolucao_horas": 96,
        "agente_suporte": "Carla Mendes",
        "nota_avaliacao": 3,
    },
    {
        "id": 9,
        "id_cliente": 109,
        "id_pedido": 209,
        "tipo_problema": "Entrega",
        "status": "Fechado",
        "data_abertura": date(2024, 9, 5),
        "data_resolucao": date(2024, 9, 9),
        "tempo_resolucao_horas": 80,
        "agente_suporte": "Carla Mendes",
        "nota_avaliacao": 2,
    },
    {
        "id": 13,
        "id_cliente": 113,
        "id_pedido": 213,
        "tipo_problema": "Produto com defeito",
        "status": "Fechado",
        "data_abertura": date(2024, 7, 3),
        "data_resolucao": date(2024, 7, 7),
        "tempo_resolucao_horas": 100,
        "agente_suporte": "Ana Silva",
        "nota_avaliacao": 1,
    },
    {
        "id": 18,
        "id_cliente": 118,
        "id_pedido": 218,
        "tipo_problema": "Produto com defeito",
        "status": "Fechado",
        "data_abertura": date(2024, 5, 20),
        "data_resolucao": date(2024, 5, 24),
        "tempo_resolucao_horas": 88,
        "agente_suporte": "Carla Mendes",
        "nota_avaliacao": 2,
    },
    # --- tickets fechados com prioridade Media (24 <= tempo <= 72) ---
    {
        "id": 4,
        "id_cliente": 104,
        "id_pedido": 204,
        "tipo_problema": "Cancelamento",
        "status": "Fechado",
        "data_abertura": date(2024, 10, 15),
        "data_resolucao": date(2024, 10, 17),
        "tempo_resolucao_horas": 48,
        "agente_suporte": "Ana Silva",
        "nota_avaliacao": 4,
    },
    {
        "id": 5,
        "id_cliente": 105,
        "id_pedido": 205,
        "tipo_problema": "Entrega",
        "status": "Fechado",
        "data_abertura": date(2024, 10, 20),
        "data_resolucao": date(2024, 10, 22),
        "tempo_resolucao_horas": 24,
        "agente_suporte": "Bruno Costa",
        "nota_avaliacao": 5,
    },
    {
        "id": 11,
        "id_cliente": 111,
        "id_pedido": 211,
        "tipo_problema": "Pagamento",
        "status": "Fechado",
        "data_abertura": date(2024, 8, 14),
        "data_resolucao": date(2024, 8, 16),
        "tempo_resolucao_horas": 36,
        "agente_suporte": "Bruno Costa",
        "nota_avaliacao": 3,
    },
    {
        "id": 14,
        "id_cliente": 114,
        "id_pedido": 214,
        "tipo_problema": "Cancelamento",
        "status": "Fechado",
        "data_abertura": date(2024, 7, 15),
        "data_resolucao": date(2024, 7, 16),
        "tempo_resolucao_horas": 30,
        "agente_suporte": "Bruno Costa",
        "nota_avaliacao": 4,
    },
    {
        "id": 19,
        "id_cliente": 119,
        "id_pedido": 219,
        "tipo_problema": "Cancelamento",
        "status": "Fechado",
        "data_abertura": date(2024, 4, 7),
        "data_resolucao": date(2024, 4, 9),
        "tempo_resolucao_horas": 55,
        "agente_suporte": "Ana Silva",
        "nota_avaliacao": 3,
    },
    # --- tickets fechados com prioridade Baixa (< 24h) ---
    {
        "id": 6,
        "id_cliente": 106,
        "id_pedido": 206,
        "tipo_problema": "Outros",
        "status": "Fechado",
        "data_abertura": date(2024, 11, 1),
        "data_resolucao": date(2024, 11, 1),
        "tempo_resolucao_horas": 2,
        "agente_suporte": "Carla Mendes",
        "nota_avaliacao": 5,
    },
    {
        "id": 7,
        "id_cliente": 107,
        "id_pedido": 207,
        "tipo_problema": "Pagamento",
        "status": "Fechado",
        "data_abertura": date(2024, 11, 2),
        "data_resolucao": date(2024, 11, 2),
        "tempo_resolucao_horas": 12,
        "agente_suporte": "Ana Silva",
        "nota_avaliacao": 4,
    },
    {
        "id": 12,
        "id_cliente": 112,
        "id_pedido": 212,
        "tipo_problema": "Entrega",
        "status": "Fechado",
        "data_abertura": date(2024, 8, 20),
        "data_resolucao": date(2024, 8, 20),
        "tempo_resolucao_horas": 8,
        "agente_suporte": "Carla Mendes",
        "nota_avaliacao": 5,
    },
    {
        "id": 17,
        "id_cliente": 117,
        "id_pedido": 217,
        "tipo_problema": "Pagamento",
        "status": "Fechado",
        "data_abertura": date(2024, 5, 18),
        "data_resolucao": date(2024, 5, 18),
        "tempo_resolucao_horas": 5,
        "agente_suporte": "Bruno Costa",
        "nota_avaliacao": 5,
    },
    {
        "id": 20,
        "id_cliente": 120,
        "id_pedido": 220,
        "tipo_problema": "Entrega",
        "status": "Fechado",
        "data_abertura": date(2024, 4, 15),
        "data_resolucao": date(2024, 4, 15),
        "tempo_resolucao_horas": 18,
        "agente_suporte": "Bruno Costa",
        "nota_avaliacao": 4,
    },
]

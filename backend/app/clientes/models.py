from typing import Optional
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy import String, Float, Integer, Text, ForeignKey
from app.database import Base

class ClienteMart(Base):
    """Mapeamento da tabela consolidada de clientes (Silver/Gold)"""
    __tablename__ = "mart_cliente_360"

    id_cliente: Mapped[str] = mapped_column(String, primary_key=True)
    nome: Mapped[Optional[str]] = mapped_column(String)
    sobrenome: Mapped[Optional[str]] = mapped_column(String)
    idade: Mapped[Optional[int]] = mapped_column(Integer)
    genero: Mapped[Optional[str]] = mapped_column(String)
    cidade: Mapped[Optional[str]] = mapped_column(String)
    estado: Mapped[Optional[str]] = mapped_column(String)
    segmento_valor: Mapped[Optional[str]] = mapped_column(String)
    total_pedidos: Mapped[Optional[int]] = mapped_column(Integer)
    pedidos_aprovados: Mapped[Optional[int]] = mapped_column(Integer)
    receita_lifetime_brl: Mapped[Optional[float]] = mapped_column(Float)
    receita_bruta_lifetime_brl: Mapped[Optional[float]] = mapped_column(Float)
    ticket_medio_brl: Mapped[Optional[float]] = mapped_column(Float)
    total_sessoes: Mapped[Optional[int]] = mapped_column(Integer)
    total_add_to_cart_lifetime: Mapped[Optional[int]] = mapped_column(Integer)
    total_eventos_alto_engajamento: Mapped[Optional[int]] = mapped_column(Integer)
    nps_medio_cliente: Mapped[Optional[float]] = mapped_column(Float)
    total_tickets: Mapped[Optional[int]] = mapped_column(Integer)
    avg_nota_suporte: Mapped[Optional[float]] = mapped_column(Float)
    data_ultimo_pedido: Mapped[Optional[str]] = mapped_column(String)
    dias_desde_ultimo_pedido: Mapped[Optional[int]] = mapped_column(Integer)
    categoria_top: Mapped[Optional[str]] = mapped_column(String)
    categorias_compradas: Mapped[Optional[str]] = mapped_column(Text)
    gold_timestamp: Mapped[Optional[str]] = mapped_column(String)

class ClienteDim(Base):
    """Mapeamento da dimensão de clientes para dados cadastrais extras"""
    __tablename__ = "dim_clientes"

    sk_cliente: Mapped[str] = mapped_column(String, primary_key=True)
    id_cliente: Mapped[str] = mapped_column(String)
    nome: Mapped[Optional[str]] = mapped_column(String)
    sobrenome: Mapped[Optional[str]] = mapped_column(String)
    genero: Mapped[Optional[str]] = mapped_column(String)
    idade: Mapped[Optional[int]] = mapped_column(Integer)
    data_cadastro: Mapped[Optional[str]] = mapped_column(String)
    sk_data_cadastro: Mapped[Optional[int]] = mapped_column(Integer)
    antiguidade_cadastro: Mapped[Optional[str]] = mapped_column(String)
    cidade: Mapped[Optional[str]] = mapped_column(String)
    estado: Mapped[Optional[str]] = mapped_column(String)
    pais: Mapped[Optional[str]] = mapped_column(String)
    dispositivos: Mapped[Optional[str]] = mapped_column(Text)
    qtd_dispositivos: Mapped[Optional[int]] = mapped_column(Integer)
    origem: Mapped[Optional[str]] = mapped_column(String)
    telefone: Mapped[Optional[str]] = mapped_column(String)
    gold_timestamp: Mapped[Optional[str]] = mapped_column(String)

class PedidoFato(Base):
    __tablename__ = "fat_pedidos"
    sk_pedido: Mapped[str] = mapped_column(String, primary_key=True)
    id_pedido: Mapped[str] = mapped_column(String)
    id_cliente: Mapped[str] = mapped_column(String)
    sk_produto: Mapped[str] = mapped_column(String)
    sk_data_pedido: Mapped[int] = mapped_column(Integer)
    metodo_pagamento: Mapped[Optional[str]] = mapped_column(String)
    status: Mapped[Optional[str]] = mapped_column(String)
    valor_pedido_brl: Mapped[Optional[float]] = mapped_column(Float)
    quantidade: Mapped[Optional[int]] = mapped_column(Integer)

class AvaliacaoFato(Base):
    __tablename__ = "fat_avaliacoes"
    sk_avaliacao: Mapped[str] = mapped_column(String, primary_key=True)
    id_pedido: Mapped[str] = mapped_column(String)
    id_cliente: Mapped[str] = mapped_column(String)
    nota_produto: Mapped[Optional[int]] = mapped_column(Integer)
    nota_nps: Mapped[Optional[int]] = mapped_column(Integer)
    comentario: Mapped[Optional[str]] = mapped_column(Text)

class TicketFato(Base):
    __tablename__ = "fat_tickets"
    sk_ticket: Mapped[str] = mapped_column(String, primary_key=True)
    id_ticket: Mapped[str] = mapped_column(String)
    id_cliente: Mapped[str] = mapped_column(String)
    sk_cliente: Mapped[Optional[str]] = mapped_column(String)
    sk_pedido: Mapped[Optional[str]] = mapped_column(String)
    tipo_problema: Mapped[Optional[str]] = mapped_column(String)
    sk_data_abertura: Mapped[int] = mapped_column(Integer)
    sk_data_resolucao: Mapped[Optional[int]] = mapped_column(Integer)
    tempo_resolucao_horas: Mapped[Optional[float]] = mapped_column(Float)
    nota_avaliacao: Mapped[Optional[int]] = mapped_column(Integer)
    agente_suporte: Mapped[Optional[str]] = mapped_column(String)
    sla_status: Mapped[Optional[str]] = mapped_column(String)
    fl_resolvido: Mapped[Optional[int]] = mapped_column(Integer)

class ProdutoDim(Base):
    __tablename__ = "dim_produtos"
    sk_produto: Mapped[str] = mapped_column(String, primary_key=True)
    nome_produto: Mapped[Optional[str]] = mapped_column(String)
    categoria: Mapped[Optional[str]] = mapped_column(String)

class DataDim(Base):
    __tablename__ = "dim_data"
    sk_data: Mapped[int] = mapped_column(Integer, primary_key=True)
    data_completa: Mapped[Optional[str]] = mapped_column(String)

from typing import Optional, List
import logging
import os
from sqlalchemy.ext.asyncio import AsyncSession
from datetime import date
from fastapi import HTTPException
from app.pedidos.schemas import ListaPedidoPaginada, PedidoItem
from app.pedidos.repository import PedidoRepository

# Configuração de um log temporário para capturar erros do banco
LOG_FILE = "/Users/rodrigotorres/Rocketlab2026.1-Grupo-2-Hexalab/backend/app/pedidos_error.log"

class PedidoService:
    @staticmethod
    def _map_to_pedido_item(p: any) -> PedidoItem:
        # p é um Row do SQLAlchemy. Usamos _mapping para acesso seguro.
        data = p._mapping
        return PedidoItem(
            id=str(data.get("id_pedido", "")),
            cod_pedido=str(data.get("id_pedido", "")),
            nome_cliente=f"{data.get('nome_cliente') or ''} {data.get('sobrenome_cliente') or ''}".strip() or "Cliente Desconhecido",
            cod_produto=str(data.get("id_produto", "")),
            nome_produto=data.get("nome_produto") or "Produto Desconhecido",
            categoria=data.get("categoria") or "Geral",
            valor=float(data.get("valor_pedido_brl") or 0.0),
            quantidade=int(data.get("quantidade") or 0),
            data=data.get("data_pedido_txt") or "",
            metodo_pagamento=data.get("metodo_pagamento") or "N/A",
            status=data.get("status") or "Pendente",
            risco="Dentro do SLA"
        )

    @staticmethod
    async def listar_pedidos(
        db: AsyncSession,
        query: Optional[str] = None,
        status: Optional[str] = None,
        data_inicio: Optional[date] = None,
        data_fim: Optional[date] = None,
        ano: Optional[int] = None,
        mes: Optional[int] = None,
        categoria: Optional[str] = None,
        pagina: int = 1,
        tamanho: int = 20
    ) -> ListaPedidoPaginada:
        try:
            if data_inicio and data_fim and data_fim < data_inicio:
                raise HTTPException(status_code=422, detail="data_fim não pode ser anterior a data_inicio")

            total, resultados = await PedidoRepository.listar_pedidos(
                db=db,
                query=query,
                status=status,
                data_inicio=data_inicio,
                data_fim=data_fim,
                ano=ano,
                mes=mes,
                categoria=categoria,
                pagina=pagina,
                tamanho=tamanho
            )
            
            itens = [PedidoService._map_to_pedido_item(p) for p in resultados]
            paginas = (total + tamanho - 1) // tamanho if tamanho > 0 else 0
            
            return ListaPedidoPaginada(
                itens=itens,
                total=total,
                pagina=pagina,
                tamanho=tamanho,
                paginas=paginas
            )
        except Exception as e:
            # Escreve o erro no arquivo de log para debug
            with open(LOG_FILE, "a") as f:
                f.write(f"Erro em listar_pedidos: {str(e)}\n")
            raise HTTPException(status_code=500, detail=f"Erro interno ao processar pedidos: {str(e)}")

    @staticmethod
    async def obter_pedido_por_id(db: AsyncSession, pedido_id: str) -> Optional[PedidoItem]:
        try:
            pedido = await PedidoRepository.obter_pedido_por_id(db=db, pedido_id=pedido_id)
            if pedido:
                return PedidoService._map_to_pedido_item(pedido)
            return None
        except Exception as e:
            with open(LOG_FILE, "a") as f:
                f.write(f"Erro em obter_pedido_por_id: {str(e)}\n")
            raise HTTPException(status_code=500, detail="Erro ao obter detalhes do pedido")

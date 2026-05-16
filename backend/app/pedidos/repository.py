from typing import List, Optional, Tuple, Any
from datetime import date, datetime
from sqlalchemy import select, func, or_
from sqlalchemy.ext.asyncio import AsyncSession
from app.pedidos.models import Pedido, ClienteDim, ProdutoDim, DataDim

class PedidoRepository:
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
    ) -> Tuple[int, List[Any]]:
        # Construção da query base com Joins (Outer Join para evitar perder linhas se houver dados incompletos)
        stmt = select(
            Pedido.id_pedido,
            ClienteDim.nome.label("nome_cliente"),
            ClienteDim.sobrenome.label("sobrenome_cliente"),
            Pedido.id_produto,
            ProdutoDim.nome_produto,
            ProdutoDim.categoria,
            Pedido.valor_pedido_brl,
            Pedido.quantidade,
            DataDim.data_completa.label("data_pedido_txt"),
            Pedido.metodo_pagamento,
            Pedido.status
        ).outerjoin(
            ClienteDim, Pedido.sk_cliente == ClienteDim.sk_cliente
        ).outerjoin(
            ProdutoDim, Pedido.sk_produto == ProdutoDim.sk_produto
        ).outerjoin(
            DataDim, Pedido.sk_data_pedido == DataDim.sk_data
        )

        # Filtros
        if query:
            q = f"%{query}%"
            stmt = stmt.where(or_(
                ClienteDim.nome.ilike(q),
                ClienteDim.sobrenome.ilike(q),
                ProdutoDim.nome_produto.ilike(q),
                Pedido.id_pedido.ilike(q)
            ))

        if status:
            if status == "Aberto":
                stmt = stmt.where(Pedido.status.ilike("processando"))
            elif status == "Finalizado":
                stmt = stmt.where(Pedido.status.ilike("aprovado"))
            else:
                stmt = stmt.where(Pedido.status.ilike(status))

        if categoria:
            stmt = stmt.where(ProdutoDim.categoria.ilike(categoria))

        if ano:
            stmt = stmt.where(DataDim.ano == ano)
        if mes:
            stmt = stmt.where(DataDim.mes == mes)

        if data_inicio:
            sk_inicio = int(data_inicio.strftime("%Y%m%d"))
            stmt = stmt.where(Pedido.sk_data_pedido >= sk_inicio)
        
        if data_fim:
            sk_fim = int(data_fim.strftime("%Y%m%d"))
            stmt = stmt.where(Pedido.sk_data_pedido <= sk_fim)

        # Contagem total
        count_stmt = select(func.count()).select_from(stmt.subquery())
        total_result = await db.execute(count_stmt)
        total = total_result.scalar() or 0

        # Paginação e Ordenação
        # Ordenamos por data (sk_data_pedido) e ID para garantir ordem estável na paginação
        stmt = stmt.order_by(Pedido.sk_data_pedido.desc(), Pedido.id_pedido.desc())
        stmt = stmt.offset((pagina - 1) * tamanho).limit(tamanho)

        result = await db.execute(stmt)
        return total, result.all()

    @staticmethod
    async def obter_pedido_por_id(db: AsyncSession, pedido_id: str) -> List[Any]:
        stmt = select(
            Pedido.id_pedido,
            ClienteDim.nome.label("nome_cliente"),
            ClienteDim.sobrenome.label("sobrenome_cliente"),
            Pedido.id_produto,
            ProdutoDim.nome_produto,
            ProdutoDim.categoria,
            Pedido.valor_pedido_brl,
            Pedido.quantidade,
            DataDim.data_completa.label("data_pedido_txt"),
            Pedido.metodo_pagamento,
            Pedido.status,
            Pedido.id_cliente
        ).outerjoin(
            ClienteDim, Pedido.sk_cliente == ClienteDim.sk_cliente
        ).outerjoin(
            ProdutoDim, Pedido.sk_produto == ProdutoDim.sk_produto
        ).outerjoin(
            DataDim, Pedido.sk_data_pedido == DataDim.sk_data
        ).where(Pedido.id_pedido == pedido_id)

        result = await db.execute(stmt)
        return result.all()

    @staticmethod
    async def obter_kpis(db: AsyncSession) -> dict:
        """Conta pedidos e soma valores por status para os KPIs."""
        stmt = select(
            Pedido.status,
            func.count(Pedido.sk_pedido).label("total"),
            func.sum(Pedido.valor_pedido_brl).label("valor_total")
        ).group_by(Pedido.status)
        
        result = await db.execute(stmt)
        rows = result.all()
        
        # Estrutura inicial
        stats = {
            "processando": {"qtd": 0, "valor": 0.0},
            "aprovado": {"qtd": 0, "valor": 0.0},
            "recusado": {"qtd": 0, "valor": 0.0},
            "reembolsado": {"qtd": 0, "valor": 0.0}
        }
        
        total_qtd = 0
        total_valor = 0.0
        
        for row in rows:
            status = (row[0] or "").lower().strip()
            qtd = row[1] or 0
            valor = row[2] or 0.0
            
            total_qtd += qtd
            total_valor += valor
            
            if status in stats:
                stats[status]["qtd"] = qtd
                stats[status]["valor"] = valor
        
        return {
            "processando": stats["processando"]["qtd"],
            "processando_valor": stats["processando"]["valor"],
            "aprovados": stats["aprovado"]["qtd"],
            "aprovados_valor": stats["aprovado"]["valor"],
            "recusados": stats["recusado"]["qtd"],
            "recusados_valor": stats["recusado"]["valor"],
            "reembolsados": stats["reembolsado"]["qtd"],
            "reembolsados_valor": stats["reembolsado"]["valor"],
            "total": total_qtd,
            "total_valor": total_valor
        }

    @staticmethod
    async def obter_contagem_por_categoria(db: AsyncSession) -> list:
        """Conta pedidos por categoria de produto para análise de fluxo."""
        stmt = select(
            ProdutoDim.categoria,
            func.count(Pedido.sk_pedido).label("total"),
            Pedido.status
        ).outerjoin(
            ProdutoDim, Pedido.sk_produto == ProdutoDim.sk_produto
        ).group_by(ProdutoDim.categoria, Pedido.status)
        
        result = await db.execute(stmt)
        return result.all()

    @staticmethod
    async def criar_pedido(db: AsyncSession, pedido_data: dict) -> Pedido:
        # Tenta converter a data para sk_data_pedido (YYYYMMDD)
        dt_str = pedido_data.get("data", "")
        try:
            dt_obj = datetime.strptime(dt_str, "%d-%m-%Y")
            sk_data = int(dt_obj.strftime("%Y%m%d"))
        except:
            sk_data = int(datetime.now().strftime("%Y%m%d"))

        novo_pedido = Pedido(
            sk_pedido=pedido_data["id_pedido"],
            id_pedido=pedido_data["id_pedido"],
            id_cliente=pedido_data["id_cliente"],
            id_produto=pedido_data["id_produto"],
            sk_cliente=pedido_data["id_cliente"],
            sk_produto=pedido_data["id_produto"],
            sk_data_pedido=sk_data,
            valor_pedido_brl=pedido_data["valor"],
            quantidade=pedido_data["quantidade"],
            metodo_pagamento=pedido_data["metodo_pagamento"],
            status=pedido_data["status"]
        )
        db.add(novo_pedido)
        await db.commit()
        await db.refresh(novo_pedido)
        return novo_pedido

    @staticmethod
    async def atualizar_pedido(db: AsyncSession, pedido_id: str, update_data: dict) -> Optional[Pedido]:
        stmt = select(Pedido).where(Pedido.id_pedido == pedido_id)
        result = await db.execute(stmt)
        pedido = result.scalar_one_or_none()
        
        if not pedido:
            return None
        
        if "data" in update_data and update_data["data"]:
            try:
                dt_obj = datetime.strptime(update_data["data"], "%d-%m-%Y")
                pedido.sk_data_pedido = int(dt_obj.strftime("%Y%m%d"))
            except:
                pass

        if "valor" in update_data and update_data["valor"] is not None:
            pedido.valor_pedido_brl = update_data["valor"]
        if "quantidade" in update_data and update_data["quantidade"] is not None:
            pedido.quantidade = update_data["quantidade"]
        if "metodo_pagamento" in update_data and update_data["metodo_pagamento"]:
            pedido.metodo_pagamento = update_data["metodo_pagamento"]
        if "status" in update_data and update_data["status"]:
            pedido.status = update_data["status"]
            
        await db.commit()
        await db.refresh(pedido)
        return pedido

    @staticmethod
    async def deletar_pedido(db: AsyncSession, pedido_id: str) -> bool:
        stmt = select(Pedido).where(Pedido.id_pedido == pedido_id)
        result = await db.execute(stmt)
        pedido = result.scalar_one_or_none()
        
        if not pedido:
            return False
        
        await db.delete(pedido)
        await db.commit()
        return True

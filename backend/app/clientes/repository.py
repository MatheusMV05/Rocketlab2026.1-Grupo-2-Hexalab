from typing import List, Optional, Dict, Any
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, or_
from app.clientes.models import ClienteMart, ClienteDim, PedidoFato, AvaliacaoFato, TicketFato, ProdutoDim, DataDim

class ClienteRepository:
    @staticmethod
    async def listar_clientes(
        db: AsyncSession, 
        query: Optional[str] = None, 
        estado: Optional[str] = None,
        offset: int = 0,
        limit: int = 20
    ) -> List[Dict[str, Any]]:
        # JOIN entre Mart (dados 360) e Dim (dados cadastrais como origem/data_cadastro)
        stmt = select(
            ClienteMart, 
            ClienteDim.origem, 
            ClienteDim.data_cadastro,
            ClienteDim.telefone
        ).join(
            ClienteDim, ClienteMart.id_cliente == ClienteDim.id_cliente
        )

        if query:
            q = f"%{query}%"
            stmt = stmt.where(or_(
                ClienteMart.nome.ilike(q),
                ClienteMart.sobrenome.ilike(q),
                (ClienteMart.nome + " " + ClienteMart.sobrenome).ilike(q),
                ClienteMart.id_cliente.ilike(q)
            ))

        if estado:
            if " - " in estado:
                cidade, uf = estado.split(" - ", 1)
                stmt = stmt.where(
                    ClienteMart.cidade.ilike(f"%{cidade.strip()}%"),
                    ClienteMart.estado.ilike(f"%{uf.strip()}%")
                )
            else:
                loc = f"%{estado}%"
                stmt = stmt.where(or_(
                    ClienteMart.cidade.ilike(loc),
                    ClienteMart.estado.ilike(loc)
                ))

        # Paginação e Ordenação
        stmt = stmt.order_by(ClienteMart.nome).offset(offset).limit(limit)
        
        result = await db.execute(stmt)
        rows = result.all()
        
        clientes = []
        for row in rows:
            cliente_dict = row[0].__dict__.copy()
            cliente_dict["origem"] = row[1]
            cliente_dict["data_cadastro"] = row[2]
            cliente_dict["telefone"] = row[3]
            # Limpa metadados do SQLAlchemy
            cliente_dict.pop('_sa_instance_state', None)
            clientes.append(cliente_dict)
            
        return clientes

    @staticmethod
    async def contar_total_clientes(db: AsyncSession, query: Optional[str] = None, estado: Optional[str] = None) -> int:
        stmt = select(func.count(ClienteMart.id_cliente))
        
        if query:
            q = f"%{query}%"
            stmt = stmt.where(or_(
                ClienteMart.nome.ilike(q),
                ClienteMart.sobrenome.ilike(q),
                (ClienteMart.nome + " " + ClienteMart.sobrenome).ilike(q),
                ClienteMart.id_cliente.ilike(q)
            ))
            
        if estado:
            if " - " in estado:
                cidade, uf = estado.split(" - ", 1)
                stmt = stmt.where(
                    ClienteMart.cidade.ilike(f"%{cidade.strip()}%"),
                    ClienteMart.estado.ilike(f"%{uf.strip()}%")
                )
            else:
                loc = f"%{estado}%"
                stmt = stmt.where(or_(
                    ClienteMart.cidade.ilike(loc),
                    ClienteMart.estado.ilike(loc)
                ))
            
        result = await db.execute(stmt)
        return result.scalar() or 0

    @staticmethod
    async def obter_cliente_por_id(db: AsyncSession, cliente_id: str) -> Optional[Dict[str, Any]]:
        stmt = select(
            ClienteMart, 
            ClienteDim.origem, 
            ClienteDim.data_cadastro,
            ClienteDim.telefone
        ).join(
            ClienteDim, ClienteMart.id_cliente == ClienteDim.id_cliente
        ).where(ClienteMart.id_cliente == cliente_id)
        
        result = await db.execute(stmt)
        row = result.first()
        
        if row:
            cliente_dict = row[0].__dict__.copy()
            cliente_dict["origem"] = row[1]
            cliente_dict["data_cadastro"] = row[2]
            cliente_dict["telefone"] = row[3]
            cliente_dict.pop('_sa_instance_state', None)
            return cliente_dict
        return None

    @staticmethod
    async def obter_pedidos_cliente(db: AsyncSession, cliente_id: str) -> List[Dict[str, Any]]:
        stmt = select(
            PedidoFato, 
            ProdutoDim.nome_produto, 
            ProdutoDim.categoria,
            DataDim.data_completa
        ).join(
            ProdutoDim, PedidoFato.sk_produto == ProdutoDim.sk_produto
        ).join(
            DataDim, PedidoFato.sk_data_pedido == DataDim.sk_data
        ).where(PedidoFato.id_cliente == cliente_id).order_by(PedidoFato.sk_data_pedido.desc())
        
        result = await db.execute(stmt)
        rows = result.all()
        
        pedidos = []
        for row in rows:
            p_dict = row[0].__dict__.copy()
            p_dict["nome_produto"] = row[1]
            p_dict["categoria"] = row[2]
            p_dict["data"] = row[3]
            p_dict.pop('_sa_instance_state', None)
            pedidos.append(p_dict)
        return pedidos

    @staticmethod
    async def obter_avaliacoes_cliente(db: AsyncSession, cliente_id: str) -> List[Dict[str, Any]]:
        stmt = select(AvaliacaoFato).where(AvaliacaoFato.id_cliente == cliente_id)
        result = await db.execute(stmt)
        rows = result.scalars().all()
        return [row.__dict__ for row in rows]

    @staticmethod
    async def obter_tickets_cliente(db: AsyncSession, cliente_id: str) -> List[Dict[str, Any]]:
        stmt = select(
            TicketFato, 
            DataDim.data_completa
        ).join(
            DataDim, TicketFato.sk_data_abertura == DataDim.sk_data
        ).where(TicketFato.id_cliente == cliente_id).order_by(TicketFato.sk_data_abertura.desc())
        
        result = await db.execute(stmt)
        rows = result.all()
        
        tickets = []
        for row in rows:
            t_dict = row[0].__dict__.copy()
            t_dict["data_abertura"] = row[1]
            t_dict.pop('_sa_instance_state', None)
            tickets.append(t_dict)
        return tickets

    @staticmethod
    async def obter_kpis_gerais(db: AsyncSession) -> Dict[str, Any]:
        stmt = select(
            func.count(ClienteMart.id_cliente).label("total_clientes"),
            func.avg(ClienteMart.receita_lifetime_brl).label("media_receita"),
            func.avg(ClienteMart.nps_medio_cliente).label("taxa_satisfacao"),
            func.avg(ClienteMart.total_pedidos).label("media_compra")
        )
        result = await db.execute(stmt)
        row = result.first()
        return {
            "total_clientes": row[0] or 0,
            "media_receita": row[1] or 0.0,
            "taxa_satisfacao": (row[2] or 0.0) * 10,
            "media_compra": row[3] or 0.0
        }

    @staticmethod
    async def obter_sugestoes_localizacao(db: AsyncSession, termo: str) -> List[str]:
        q = f"%{termo}%"
        stmt = select(
            ClienteMart.cidade, 
            ClienteMart.estado
        ).where(or_(
            ClienteMart.cidade.ilike(q),
            ClienteMart.estado.ilike(q)
        )).distinct().limit(10)
        
        result = await db.execute(stmt)
        rows = result.all()
        return [f"{row[0]} - {row[1]}" for row in rows if row[0] and row[1]]

    @staticmethod
    async def criar_cliente(db: AsyncSession, dados: Dict[str, Any]) -> ClienteMart:
        import hashlib
        from datetime import datetime
        
        id_cliente = dados["id_cliente"]
        
        # Verificar se já existe
        check_stmt = select(ClienteMart).where(ClienteMart.id_cliente == id_cliente)
        check_res = await db.execute(check_stmt)
        if check_res.scalar_one_or_none():
            from fastapi import HTTPException
            raise HTTPException(status_code=400, detail="Cliente com este ID já existe.")

        sk_cliente = hashlib.sha256(id_cliente.encode()).hexdigest()
        
        # Criar registro na Mart
        novo_cliente_mart = ClienteMart(
            id_cliente=id_cliente,
            nome=dados["nome"],
            sobrenome=dados["sobrenome"],
            idade=dados.get("idade"),
            genero=dados.get("genero"),
            cidade=dados.get("cidade"),
            estado=dados.get("estado"),
            total_pedidos=0,
            receita_lifetime_brl=0.0,
            gold_timestamp=datetime.now().isoformat()
        )
        
        # Criar registro na Dim
        novo_cliente_dim = ClienteDim(
            sk_cliente=sk_cliente,
            id_cliente=id_cliente,
            nome=dados["nome"],
            sobrenome=dados["sobrenome"],
            genero=dados.get("genero"),
            idade=dados.get("idade"),
            cidade=dados.get("cidade"),
            estado=dados.get("estado"),
            origem=dados.get("origem", "Direto"),
            telefone=dados.get("telefone"),
            data_cadastro=datetime.now().strftime("%Y-%m-%d"),
            gold_timestamp=datetime.now().isoformat()
        )
        
        db.add(novo_cliente_mart)
        db.add(novo_cliente_dim)
        await db.commit()
        await db.refresh(novo_cliente_mart)
        return novo_cliente_mart

    @staticmethod
    async def atualizar_cliente(db: AsyncSession, cliente_id: str, dados: Dict[str, Any]) -> Optional[ClienteMart]:
        stmt_mart = select(ClienteMart).where(ClienteMart.id_cliente == cliente_id)
        result_mart = await db.execute(stmt_mart)
        cliente_mart = result_mart.scalar_one_or_none()
        
        stmt_dim = select(ClienteDim).where(ClienteDim.id_cliente == cliente_id)
        result_dim = await db.execute(stmt_dim)
        cliente_dim = result_dim.scalar_one_or_none()
        
        if not cliente_mart:
            return None
            
        for key, value in dados.items():
            if value is not None:
                if hasattr(cliente_mart, key):
                    setattr(cliente_mart, key, value)
                if cliente_dim and hasattr(cliente_dim, key):
                    setattr(cliente_dim, key, value)
        
        await db.commit()
        await db.refresh(cliente_mart)
        return cliente_mart

    @staticmethod
    async def deletar_cliente(db: AsyncSession, cliente_id: str) -> bool:
        stmt_mart = select(ClienteMart).where(ClienteMart.id_cliente == cliente_id)
        result_mart = await db.execute(stmt_mart)
        cliente_mart = result_mart.scalar_one_or_none()
        
        stmt_dim = select(ClienteDim).where(ClienteDim.id_cliente == cliente_id)
        result_dim = await db.execute(stmt_dim)
        cliente_dim = result_dim.scalar_one_or_none()
        
        if not cliente_mart:
            return False
            
        await db.delete(cliente_mart)
        if cliente_dim:
            await db.delete(cliente_dim)
            
        await db.commit()
        return True

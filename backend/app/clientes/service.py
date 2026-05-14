from typing import List, Optional
from sqlalchemy.ext.asyncio import AsyncSession
from app.clientes.schemas import (
    ClienteListagem, ClientePerfil, ListaClientePaginada, 
    PedidoAba, AvaliacaoAba, TicketAba, KpisClientes
)
from app.clientes.repository import ClienteRepository

class ClienteService:
    @staticmethod
    async def listar_clientes(
        db: AsyncSession, 
        query: Optional[str] = None, 
        estado: Optional[str] = None, 
        pagina: int = 1, 
        tamanho: int = 20
    ) -> ListaClientePaginada:
        offset = (pagina - 1) * tamanho
        
        resultados = await ClienteRepository.listar_clientes(
            db, query=query, estado=estado, offset=offset, limit=tamanho
        )
        total = await ClienteRepository.contar_total_clientes(db, query=query, estado=estado)
        
        itens = []
        for c in resultados:
            itens.append(ClienteListagem(
                id=c["id_cliente"],
                nome_completo=f"{c.get('nome', '')} {c.get('sobrenome', '')}".strip(),
                cidade=c.get("cidade", "—"),
                estado=c.get("estado", "—"),
                total_gasto=c.get("receita_lifetime_brl", 0.0),
                total_pedidos=c.get("total_pedidos", 0),
                segmento_rfm=c.get("segmento_valor", "—"),
                origem=c.get("origem", "—"),
                data_cadastro=c.get("data_cadastro", "—")
            ))
            
        paginas = (total + tamanho - 1) // tamanho if tamanho > 0 else 0
        
        return ListaClientePaginada(
            itens=itens,
            total=total,
            pagina=pagina,
            tamanho=tamanho,
            paginas=paginas
        )

    @staticmethod
    async def obter_perfil_cliente(db: AsyncSession, cliente_id: str) -> Optional[ClientePerfil]:
        cliente = await ClienteRepository.obter_cliente_por_id(db, cliente_id)
        if cliente:
            return ClientePerfil(
                id=cliente["id_cliente"],
                nome_completo=f"{cliente.get('nome', '')} {cliente.get('sobrenome', '')}".strip(),
                cidade=cliente.get("cidade", "—"),
                estado=cliente.get("estado", "—"),
                genero=cliente.get("genero", "—"),
                idade=cliente.get("idade", 0),
                data_cadastro=cliente.get("data_cadastro", "—"),
                origem=cliente.get("origem", "—"),
                total_gasto=cliente.get("receita_lifetime_brl", 0.0),
                total_pedidos=cliente.get("total_pedidos", 0),
                ticket_medio=cliente.get("ticket_medio_brl", 0.0),
                ultimo_pedido=cliente.get("data_ultimo_pedido"),
                nps_medio=cliente.get("nps_medio_cliente"),
                tickets_abertos=cliente.get("total_tickets", 0),
                segmento_rfm=cliente.get("segmento_valor", "—")
            )
        return None

    @staticmethod
    async def obter_pedidos_cliente(db: AsyncSession, cliente_id: str) -> List[PedidoAba]:
        pedidos = await ClienteRepository.obter_pedidos_cliente(db, cliente_id)
        return [
            PedidoAba(
                id=p["id_pedido"],
                nome_produto=p["nome_produto"],
                categoria=p["categoria"],
                valor=p["valor_pedido_brl"],
                data=p["data"],
                status=p["status"],
                metodo_pagamento=p.get("metodo_pagamento"),
                quantidade=p.get("quantidade", 1)
            ) for p in pedidos
        ]

    @staticmethod
    async def obter_avaliacoes_cliente(db: AsyncSession, cliente_id: str) -> List[AvaliacaoAba]:
        avaliacoes = await ClienteRepository.obter_avaliacoes_cliente(db, cliente_id)
        return [
            AvaliacaoAba(
                id_pedido=a["id_pedido"],
                nota_produto=a["nota_produto"],
                nps=a["nota_nps"],
                comentario=a.get("comentario")
            ) for a in avaliacoes
        ]

    @staticmethod
    async def obter_tickets_cliente(db: AsyncSession, cliente_id: str) -> List[TicketAba]:
        tickets = await ClienteRepository.obter_tickets_cliente(db, cliente_id)
        return [
            TicketAba(
                id=t["id_ticket"],
                tipo_problema=t["tipo_problema"],
                data_abertura=t["data_abertura"],
                tempo_resolucao_horas=t.get("tempo_resolucao_horas"),
                nota_avaliacao=t.get("nota_avaliacao")
            ) for t in tickets
        ]

    @staticmethod
    async def obter_kpis_clientes(db: AsyncSession) -> KpisClientes:
        kpis = await ClienteRepository.obter_kpis_gerais(db)
        return KpisClientes(**kpis)

    @staticmethod
    async def obter_sugestoes_localizacao(db: AsyncSession, termo: str) -> List[str]:
        return await ClienteRepository.obter_sugestoes_localizacao(db, termo)

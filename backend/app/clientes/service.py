from datetime import date
from typing import List, Optional
from app.clientes.schemas import ClienteList, ClientePerfil, PaginatedClienteList, PedidoAba, AvaliacaoAba, TicketAba

# MOCK DATA
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

class ClienteService:
    @staticmethod
    async def listar_clientes(query: Optional[str] = None, estado: Optional[str] = None, page: int = 1, size: int = 10) -> PaginatedClienteList:
        resultados = MOCK_CLIENTES
        
        if query:
            q = query.lower()
            resultados = [c for c in resultados if q in c["nome_completo"].lower() or q in c["email"].lower()]
            
        if estado:
            resultados = [c for c in resultados if c["estado"].upper() == estado.upper()]
            
        total = len(resultados)
        start = (page - 1) * size
        end = start + size
        paginated = resultados[start:end]
        
        items = [ClienteList(**c) for c in paginated]
        pages = (total + size - 1) // size if size > 0 else 0
        
        return PaginatedClienteList(
            items=items,
            total=total,
            page=page,
            size=size,
            pages=pages
        )

    @staticmethod
    async def obter_perfil_cliente(cliente_id: int) -> Optional[ClientePerfil]:
        cliente = next((c for c in MOCK_CLIENTES if c["id"] == cliente_id), None)
        if cliente:
            return ClientePerfil(**cliente)
        return None

    @staticmethod
    async def obter_pedidos_cliente(cliente_id: int) -> List[PedidoAba]:
        return [PedidoAba(**p) for p in MOCK_PEDIDOS if p["cliente_id"] == cliente_id]

    @staticmethod
    async def obter_avaliacoes_cliente(cliente_id: int) -> List[AvaliacaoAba]:
        return [AvaliacaoAba(**a) for a in MOCK_AVALIACOES if a["cliente_id"] == cliente_id]

    @staticmethod
    async def obter_tickets_cliente(cliente_id: int) -> List[TicketAba]:
        return [TicketAba(**t) for t in MOCK_TICKETS if t["cliente_id"] == cliente_id]

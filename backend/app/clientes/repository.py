from typing import List, Optional, Dict, Any
from app.clientes.models import MOCK_CLIENTES, MOCK_PEDIDOS, MOCK_AVALIACOES, MOCK_TICKETS

class ClienteRepository:
    @staticmethod
    async def listar_clientes(query: Optional[str] = None, estado: Optional[str] = None) -> List[Dict[str, Any]]:
        resultados = MOCK_CLIENTES
        
        if query:
            q = query.lower()
            resultados = [c for c in resultados if q in c["nome_completo"].lower() or q in c["email"].lower()]
            
        if estado:
            resultados = [c for c in resultados if c["estado"].upper() == estado.upper()]
            
        return resultados

    @staticmethod
    async def obter_cliente_por_id(cliente_id: int) -> Optional[Dict[str, Any]]:
        return next((c for c in MOCK_CLIENTES if c["id"] == cliente_id), None)

    @staticmethod
    async def obter_pedidos_cliente(cliente_id: int) -> List[Dict[str, Any]]:
        return [p for p in MOCK_PEDIDOS if p["cliente_id"] == cliente_id]

    @staticmethod
    async def obter_avaliacoes_cliente(cliente_id: int) -> List[Dict[str, Any]]:
        return [a for a in MOCK_AVALIACOES if a["cliente_id"] == cliente_id]

    @staticmethod
    async def obter_tickets_cliente(cliente_id: int) -> List[Dict[str, Any]]:
        return [t for t in MOCK_TICKETS if t["cliente_id"] == cliente_id]

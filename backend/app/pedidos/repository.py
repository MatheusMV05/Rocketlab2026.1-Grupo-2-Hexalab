from typing import List, Optional, Dict, Any
from datetime import date
from app.pedidos.models import MOCK_PEDIDOS

class PedidoRepository:
    @staticmethod
    async def listar_pedidos(
        status: Optional[str] = None,
        data_inicio: Optional[date] = None,
        data_fim: Optional[date] = None,
        categoria: Optional[str] = None
    ) -> List[Dict[str, Any]]:
        resultados = MOCK_PEDIDOS
        
        if status:
            resultados = [p for p in resultados if p["status"].lower() == status.lower()]
            
        if categoria:
            resultados = [p for p in resultados if p["categoria"].lower() == categoria.lower()]
            
        if data_inicio:
            resultados = [p for p in resultados if p["data_pedido"] >= data_inicio]
            
        if data_fim:
            resultados = [p for p in resultados if p["data_pedido"] <= data_fim]
            
        return resultados

    @staticmethod
    async def obter_pedido_por_id(pedido_id: int) -> Optional[Dict[str, Any]]:
        return next((p for p in MOCK_PEDIDOS if p["id_pedido"] == pedido_id), None)

"""Re-export dos modelos ORM relevantes para o módulo de tickets.

A fonte de verdade dos modelos do data warehouse fica em `app/clientes/models.py`
porque o `TicketFato` é compartilhado entre as visões de tickets gerais e da
aba "Tickets" dentro do perfil do cliente. Este arquivo expõe os nomes que o
restante do módulo `tickets/` consome.
"""

from app.clientes.models import ClienteDim, DataDim, PedidoFato, ProdutoDim, TicketFato

__all__ = ["TicketFato", "DataDim", "ClienteDim", "PedidoFato", "ProdutoDim"]

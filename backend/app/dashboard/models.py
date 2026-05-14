# Override em memória para o endpoint PUT /entregas/{id}.
# Permite editar cliente/status/prazo sem alterar a tabela do data warehouse.

_entregas_overrides: dict[str, dict] = {}

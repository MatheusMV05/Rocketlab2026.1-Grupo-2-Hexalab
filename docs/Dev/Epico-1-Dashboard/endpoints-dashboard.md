# Endpoints do Dashboard

**Responsável:** Matheus (dashboard)
**Data:** 02/05/2026
**Prefixo base:** `/api/dashboard`

---

Todos os endpoints são somente leitura (GET) e retornam dados analíticos agregados. Enquanto os módulos dependentes não estão prontos, os dados vêm de mocks internos em `dashboard/models.py` que serão substituidos pelos dados reais quando os outros modulos forem implementados.

---

## GET /api/dashboard/kpis

Retorna os principais indicadores do negócio.

**Resposta:**

{
  "receita_total": 487320.50,
  "total_pedidos": 1243,
  "ticket_medio": 392.05,
  "total_clientes": 836
}


Depende de: `pedidos/`, `clientes/`

---

## GET /api/dashboard/vendas-mensal

Retorna a evolução mensal de receita e volume de pedidos dos últimos 12 meses, ordenados do mais antigo ao mais recente.

**Resposta:**

{
  "items": [
    { "mes_ano": "Jun/2024", "receita_total": 28750.00, "total_pedidos": 74 },
    { "mes_ano": "Jul/2024", "receita_total": 32140.00, "total_pedidos": 84 }
  ]
}


Depende de: `pedidos/`

---

## GET /api/dashboard/top-produtos

Retorna os 10 produtos com maior receita, ordenados de forma decrescente.

**Resposta:**

{
  "items": [
    { "nome_produto": "Notebook UltraSlim Pro 14\"", "categoria": "Informática", "receita_total": 58430.00 }
  ]
}


Depende de: `produtos/`, `pedidos/`

---

## GET /api/dashboard/por-regiao

Retorna receita e volume de pedidos agrupados por estado, ordenados por receita decrescente.

**Resposta:**

{
  "items": [
    { "estado": "São Paulo", "receita_total": 142380.50, "total_pedidos": 368 }
  ]
}


Depende de: `pedidos/`, `clientes/`

---

## GET /api/dashboard/status-pedidos

Retorna a distribuição dos pedidos por status, com total e percentual calculado.

**Resposta:**

{
  "items": [
    { "status": "Entregue", "total": 712, "percentual": 57.28 },
    { "status": "Em trânsito", "total": 241, "percentual": 19.39 }
  ]
}


Depende de: `pedidos/`

---

## Tratamento de erros

Todos os endpoints retornam `500` com mensagem se ocorrer uma falha interna:


{ "detail": "Erro ao buscar KPIs." }


---

## Como testar localmente

- Documentação interativa: `http://localhost:8000/docs`


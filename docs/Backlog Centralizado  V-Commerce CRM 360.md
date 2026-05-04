# Backlog Centralizado — V-Commerce CRM 360

> Documento único de referência para todos os times:Backend, Frontend e Gen AI.
> Valores nos exemplos de response são ilustrativos de estrutura os dados reais
> serão definidos pelo time de dados após entrega das tabelas Gold.

---

## Estrutura do Repositório

```
v-commerce-crm-360/
├── data-engineering/ -> Alterar de acordo com o que o pessoal de Dados fez
│   ├── 00_preparing_environment.ipynb   # criação de schemas, volumes e configs Unity Catalog
│   ├── 01_staging_to_bronze.ipynb       # ingestão raw dos CSVs → Delta Lake (Bronze)
│   ├── 02_bronze_to_silver.ipynb        # limpeza, tipagem, deduplicação (Silver)
│   ├── 03_silver_to_gold.ipynb          # agregações e data marts (Gold)
│   ├── 04_gold_to_sqlite.ipynb          # exportação CSVs Gold → SQLite para o backend
│   └── workflow.yaml                    # definição do Databricks Job (tasks + schedule)
│
├── backend/
│   ├── app/
│   │   ├── main.py                      # instância FastAPI, routers, lifespan
│   │   ├── database.py                  # engine SQLAlchemy, session factory, Base
│   │   ├── config.py                    # variáveis de ambiente via pydantic-settings
│   │   │
│   │   ├── dashboard/
│   │   │   ├── __init__.py
│   │   │   ├── router.py                # GET /api/dashboard/*
│   │   │   ├── service.py               # ordenações e cálculos (percentual, ticket_medio)
│   │   │   ├── repository.py            # queries usando models de pedidos/, clientes/ e produtos/
│   │   │   └── schemas.py               # Pydantic response models
│   │   │
│   │   ├── clientes/
│   │   │   ├── __init__.py
│   │   │   ├── router.py                # GET /api/clientes/*
│   │   │   ├── service.py               # regras de negócio (ticket_medio, prioridade)
│   │   │   ├── repository.py            # queries SQLAlchemy
│   │   │   ├── schemas.py               # ClienteList, ClientePerfil, PedidoAba, etc.
│   │   │   └── models.py                # ORM: GoldClientes360, GoldPedidos, etc.
│   │   │
│   │   ├── pedidos/                     # mesma estrutura de clientes/
│   │   ├── produtos/                    # mesma estrutura — inclui CRUD (POST/PUT/DELETE)
│   │   ├── tickets/                     # mesma estrutura — service calcula `prioridade`
│   │   │
│   │   └── agent/
│   │       ├── __init__.py
│   │       ├── router.py                # POST /api/agent/chat
│   │       ├── agent.py                 # lógica Text-to-SQL, guardrails, execução
│   │       └── prompts.py               # templates de system prompt
│   │
│   ├── tests/
│   │   ├── __init__.py
│   │   ├── conftest.py                  # fixtures compartilhadas (AsyncClient, db em memória)
│   │   ├── test_dashboard.py
│   │   ├── test_clientes.py
│   │   ├── test_pedidos.py
│   │   ├── test_produtos.py
│   │   ├── test_tickets.py
│   │   └── test_agent.py
│   │
│   ├── seed.py                          # importa CSVs Gold para o banco SQLite
│   ├── requirements.txt
│   └── .env.example
│
├── frontend/ -> sugestão usando Atomic Design
│   ├── src/
│   │   ├── pages/
│   │   │   ├── Dashboard.tsx
│   │   │   ├── Clientes.tsx
│   │   │   ├── ClientePerfil.tsx
│   │   │   ├── Pedidos.tsx
│   │   │   ├── Produtos.tsx
│   │   │   ├── Tickets.tsx
│   │   │   └── Chat.tsx
│   │   │
│   │   ├── components/
│   │   │   ├── atoms/
│   │   │   │   ├── Button.tsx
│   │   │   │   ├── Badge.tsx
│   │   │   │   ├── Input.tsx
│   │   │   │   ├── Spinner.tsx
│   │   │   │   ├── KpiCard.tsx
│   │   │   │   └── EmptyState.tsx
│   │   │   │
│   │   │   ├── molecules/
│   │   │   │   ├── SearchBar.tsx
│   │   │   │   ├── FilterSelect.tsx
│   │   │   │   ├── DateRangePicker.tsx
│   │   │   │   ├── Pagination.tsx
│   │   │   │   ├── PriorityBadge.tsx
│   │   │   │   └── SqlViewer.tsx
│   │   │   │
│   │   │   ├── organisms/
│   │   │   │   ├── KpiGrid.tsx
│   │   │   │   ├── SalesChart.tsx
│   │   │   │   ├── TopProductsChart.tsx
│   │   │   │   ├── StatusPieChart.tsx
│   │   │   │   ├── RegionTable.tsx
│   │   │   │   ├── ClienteTable.tsx
│   │   │   │   ├── ClienteHeader.tsx
│   │   │   │   ├── ClienteTabs.tsx
│   │   │   │   ├── PedidoTable.tsx
│   │   │   │   ├── ProdutoGrid.tsx
│   │   │   │   ├── ProdutoModal.tsx
│   │   │   │   ├── TicketTable.tsx
│   │   │   │   └── ChatWindow.tsx
│   │   │   │
│   │   │   └── templates/
│   │   │       ├── PageLayout.tsx
│   │   │       └── AuthLayout.tsx
│   │   │
│   │   ├── services/
│   │   │   └── api.ts
│   │   │
│   │   ├── hooks/
│   │   │   ├── useDashboard.ts
│   │   │   ├── useClientes.ts
│   │   │   ├── usePedidos.ts
│   │   │   ├── useProdutos.ts
│   │   │   ├── useTickets.ts
│   │   │   └── useAgent.ts
│   │   │
│   │   ├── types/
│   │   │   ├── dashboard.ts
│   │   │   ├── clientes.ts
│   │   │   ├── pedidos.ts
│   │   │   ├── produtos.ts
│   │   │   ├── tickets.ts
│   │   │   └── agent.ts
│   │   │
│   │   └── App.tsx
│   │
│   ├── package.json
│   └── vite.config.ts
│
└── README.md
```

>Nota: a estrutura acima é um modelo de referência. Novos módulos devem ser criados seguindo o mesmo padrão conforme as features forem sendo implementadas. Não adicionar lógica fora das camadas definidas.

---

## Convenções Gerais -> Devem ser discutidas mas segue a sugestão

| Convenção | Valor |
|---|---|
| Base URL | `http://localhost:8000` |
| Content-Type | `application/json` |
| Paginação padrão | `page=1`, `size=20` |
| Formato de datas | `DD-MM-YYYY` |
| Valores monetários | `float` com 2 casas decimais |
| Campos nulos | retornar `null`, nunca omitir o campo |
| Erros | `{ "detail": "Mensagem clara" }` |
| Ordenação padrão | decrescente por data, salvo indicação contrária |

---

## Dependências entre Épicos

```
Épico 2 (Clientes)      — sem dependências externas
Épico 3 (Pedidos)       — sem dependências externas
Épico 4 (Produtos)      — sem dependências externas
Épico 5 (Tickets)       — depende de: Clientes
Épico 1 (Dashboard)     — depende de: Pedidos e Produtos
Épico 6 (Agente de IA)  — depende de: todos os módulos
```

---

## Nota sobre Testes

US só está "done" quando os testes passam.
Cada US define **1 teste happy path** + **cenários de erro possíveis**.
Framework: `pytest` + `pytest-asyncio` + `httpx.AsyncClient`.


## Padrões Sugeridos -> devem ser discutidos com o time

> Definições de negócio e regras de cálculo acordadas entre os times.
> Qualquer divergência deve ser discutida e atualizada aqui antes de ser implementada.

---

| Termo | Definição |
|---|---|
| **LTV** | Soma histórica de todos os valores de pedidos do cliente (`total_gasto`). Sem projeção futura. |
| **Ticket médio** | `total_gasto / total_pedidos`. Se `total_pedidos = 0`, retornar `0.0`. |
| **NPS médio** | Média simples da coluna `nps` das avaliações do cliente. Escala de 0 a 10. Sem avaliações → `null`. |
| **Nota do produto** | Média simples da coluna `nota_produto` das avaliações. Escala de 1 a 5. |
| **Segmento RFM** | Calculado e documentado pelo time de dados. Backend apenas lê e repassa o valor recebido. |
| **Prioridade do ticket** | Calculada pelo backend no response, não armazenada no banco. `Alta` se `tempo_resolucao_horas > 72` ou `null`; `Media` se entre 24h e 72h; `Baixa` se menor que 24h. Tickets sem resolução são sempre `Alta`. |
| **Status de pedido** | Valores definidos pelo time de dados. Backend e frontend devem alinhar os valores reais após entrega das tabelas Gold. |
| **Tipo de problema (ticket)** | Valores definidos pelo time de dados. Backend e frontend devem alinhar os valores reais após entrega das tabelas Gold. |

# TIME DE BACKEND E FRONTEND

## Responsabilidade de cada camada — Backend

| Arquivo | Responsabilidade |
|---|---|
| `router.py` | Declarar rotas HTTP, validar query params, chamar service, tratar exceções HTTP |
| `service.py` | Regras de negócio (cálculos, ordenações, transformações), chamar repository |
| `repository.py` | Queries SQLAlchemy com `AsyncSession`. Sem lógica de negócio. |
| `schemas.py` | Modelos Pydantic de request e response. Sem lógica. |
| `models.py` | Modelos ORM mapeados para as tabelas Gold do SQLite. Sem lógica. |

## Responsabilidade de cada camada — Frontend -> tudo colocado aqui é apenas uma sugestão e pode sofrer alterações

| Camada | Descrição |
|---|---|
| `atoms/` | Unidades mínimas sem dependências internas |
| `molecules/` | Combinação de 2+ atoms com comportamento próprio |
| `organisms/` | Seções completas autossuficientes de UI |
| `templates/` | Layouts de página reutilizáveis |
| `pages/` | Composição de organisms + lógica de rota + chamada de hooks |
| `hooks/` | React Query hooks por domínio — toda comunicação com a API passa por aqui |
| `services/api.ts` | Instância Axios configurada + funções tipadas por endpoint |
| `types/` | Tipos TypeScript espelhando os schemas Pydantic do backend |

---
**OBS: Nomes de tabelas citados abaixo são apenas place holders enquanto não temos os nomes reais das tabelas.**
**OBS: Tudo colocado no frontend é apenas uma sugestão e pode sofrer alterações dependendo da forma que o time de dev receber os componentes do time de design**
## ÉPICO 1 — Dashboard Analítico

### Feature 1.1 — KPIs Gerais

#### US-01 `[OBR]`
> *Como gerente comercial, quero visualizar em uma tela inicial os principais indicadores do negócio (receita total, total de pedidos, ticket médio e total de clientes), para ter em segundos uma leitura confiável da saúde da operação sem precisar abrir planilhas.*

**Backend**
- Criar `repository.py` com query agregando receita total, total de pedidos e total de clientes a partir dos models de `pedidos/` e `clientes/` — o dashboard não define models próprios
- Criar `service.py` calculando `ticket_medio = receita_total / total_pedidos`, retornando `0.0` em caso de divisão por zero
- Criar `schemas.py` com `KpiResponse` tipando os quatro campos do response
- Criar `router.py` com `GET /api/dashboard/kpis` respondendo com `KpiResponse` e tratando exceções com 500

**Frontend**
- Criar atom `KpiCard.tsx` recebendo `label`, `value` e `prefix` como props
- Criar organism `KpiGrid.tsx` compondo quatro instâncias de `KpiCard`
- Criar hook `useKpis()` em `useDashboard.ts` consumindo `GET /api/dashboard/kpis` via React Query
- Adicionar tipagem `KpiResponse` em `types/dashboard.ts`
- Renderizar skeleton nos quatro cards durante carregamento e banner de erro em caso de falha
- Formatar valores monetários em `R$ 1.234,56` dentro do `KpiCard`
- Compor `KpiGrid` na página `Dashboard.tsx`

**Testes**
```
[HAPPY] GET /api/dashboard/kpis → 200 com os quatro campos presentes e tipos corretos
[ERRO]  GET /api/dashboard/kpis com banco inacessível → 500 com campo detail
```

**Contrato**
```
GET /api/dashboard/kpis
```
Response 200
```json
{
  "receita_total": float,
  "total_pedidos": int,
  "ticket_medio": float,
  "total_clientes": int
}
```
Response 500
```json
{ "detail": "Erro ao buscar KPIs." }
```

---

### Feature 1.2 — Evolução de Vendas

#### US-02 `[OBR]`
> *Como gerente comercial, quero visualizar um gráfico com a evolução da receita mês a mês dos últimos 12 meses, para identificar tendências e sazonalidades nas vendas.*

**Backend**
- Criar `repository.py` com query agrupando pedidos por mês/ano dos últimos 12 meses
- Criar `service.py` preenchendo meses sem pedidos com `receita_total: 0.0` e `total_pedidos: 0`, garantindo ordenação cronológica do mais antigo ao mais recente
- Criar `schemas.py` com `VendasMensalItem` e `VendasMensalResponse`
- Criar `router.py` com `GET /api/dashboard/vendas-mensal`

**Frontend**
- Criar organism `SalesChart.tsx` usando `LineChart` do Recharts com meses no eixo X e receita em R$ no eixo Y
- Adicionar `Tooltip` exibindo valor exato ao hover em cada ponto
- Criar hook `useVendasMensal()` em `useDashboard.ts`
- Adicionar tipagem `VendasMensalItem[]` em `types/dashboard.ts`
- Renderizar skeleton durante carregamento
- Compor `SalesChart` na página `Dashboard.tsx`

**Testes**
```
[HAPPY] GET /api/dashboard/vendas-mensal → 200, lista com 12 itens, ordenada do mais antigo ao mais recente
[ERRO]  GET /api/dashboard/vendas-mensal com banco inacessível → 500 com campo detail
```

**Contrato**
```
GET /api/dashboard/vendas-mensal
```
Response 200
```json
{
  "items": [
    { "mes_ano": "string (Mmm/AAAA)", "receita_total": float, "total_pedidos": int }
  ]
}
```
Response 500
```json
{ "detail": "Erro ao buscar vendas mensais." }
```

---

### Feature 1.3 — Ranking e Distribuição

#### US-03a `[OBR]`
> *Como gerente de produto, quero visualizar no dashboard um ranking dos 10 produtos com maior receita, para investigar variações de desempenho sem sair da tela principal.*

> Nota: US-03 original separada em duas histórias independentes (US-03a e US-03b).

**Backend**
- Criar `repository.py` com query retornando top 10 produtos agrupados por `receita_total` decrescente com `LIMIT 10`
- Criar `schemas.py` com `TopProdutoItem` e `TopProdutosResponse`
- Criar `router.py` com `GET /api/dashboard/top-produtos`

**Frontend**
- Criar organism `TopProductsChart.tsx` usando `BarChart` horizontal do Recharts exibindo nome, categoria e receita em R$
- Criar hook `useTopProdutos()` em `useDashboard.ts`
- Adicionar tipagem correspondente em `types/dashboard.ts`
- Compor `TopProductsChart` na página `Dashboard.tsx`

**Testes**
```
[HAPPY] GET /api/dashboard/top-produtos → 200, máximo 10 itens, receita_total decrescente
[ERRO]  GET /api/dashboard/top-produtos com banco inacessível → 500 com campo detail
```

**Contrato**
```
GET /api/dashboard/top-produtos
```
Response 200
```json
{
  "items": [
    { "nome_produto": "string", "categoria": "string", "receita_total": float }
  ]
}
```

---

#### US-03b `[OBR]`
> *Como gerente de produto, quero visualizar a distribuição percentual dos status de pedidos no dashboard, para investigar variações de desempenho sem sair da tela principal.*

**Backend**
- Criar `repository.py` com query agrupando pedidos por `status` com contagem total por grupo
- Criar `service.py` calculando `percentual` de cada status sobre o total geral com 2 casas decimais e ordenando por `total` decrescente
- Criar `schemas.py` com `StatusPedidoItem` (status, total, percentual) e `StatusPedidosResponse`
- Criar `router.py` com `GET /api/dashboard/status-pedidos`

**Frontend**
- Criar organism `StatusPieChart.tsx` usando `PieChart` do Recharts com cor distinta por status seguindo a tabela do design system
- Adicionar legenda com nome do status e percentual
- Criar hook `useStatusPedidos()` em `useDashboard.ts`
- Compor `StatusPieChart` na página `Dashboard.tsx`

**Testes**
```
[HAPPY] GET /api/dashboard/status-pedidos → 200, soma dos percentuais entre 99.9 e 100.1, ordenado por total decrescente
[ERRO]  GET /api/dashboard/status-pedidos com banco inacessível → 500 com campo detail
```

**Contrato**
```
GET /api/dashboard/status-pedidos
```
Response 200
```json
{
  "items": [
    { "status": "string", "total": int, "percentual": float }
  ]
}
```

---

### Feature 1.4 — Receita por Região

#### US-04 `[OBR]`
> *Como analista comercial, quero visualizar no dashboard a receita agregada por estado, para identificar as regiões com melhor e pior desempenho de vendas.*

**Backend**
- Criar `repository.py` com query agrupando pedidos por `estado`, somando receita e contando pedidos por grupo
- Criar `service.py` ordenando por `receita_total` decrescente e excluindo estados sem pedidos
- Criar `schemas.py` com `RegiaoItem` e `RegiaoResponse`
- Criar `router.py` com `GET /api/dashboard/por-regiao`

**Frontend**
- Criar organism `RegionTable.tsx` com colunas estado, receita formatada e total de pedidos com diferenciação visual entre linhas
- Criar hook `usePorRegiao()` em `useDashboard.ts`
- Compor `RegionTable` na página `Dashboard.tsx`

**Testes**
```
[HAPPY] GET /api/dashboard/por-regiao → 200, ordenado por receita_total decrescente
[ERRO]  GET /api/dashboard/por-regiao com banco inacessível → 500 com campo detail
```

**Contrato**
```
GET /api/dashboard/por-regiao
```
Response 200
```json
{
  "items": [
    { "estado": "string", "receita_total": float, "total_pedidos": int }
  ]
}
```

---

## ÉPICO 2 — Gestão de Clientes

### Feature 2.1 — Listagem e Busca de Clientes

#### US-05 `[OBR]`
> *Como analista de CRM, quero buscar e filtrar clientes por nome, e-mail e estado, para localizar rapidamente qualquer perfil no sistema sem precisar percorrer toda a base.*

**Backend**
- Criar `models.py` com ORM mapeando `gold_clientes_360`
- Criar `repository.py` com query paginada aplicando filtro `query` com `LOWER()` sobre `nome_completo` e `email` e filtro `estado` com match exato
- Criar `schemas.py` com `ClienteList` e `PaginatedClienteList` (items, total, page, size, pages)
- Criar `router.py` com `GET /api/clientes` validando `page >= 1` e `1 <= size <= 100`, retornando `items: []` com 200 quando não houver resultados

**Frontend**
- Criar atom `EmptyState.tsx` com mensagem configurável por prop
- Criar molecule `SearchBar.tsx` com `Input` e debounce de 400ms
- Criar molecule `FilterSelect.tsx` com select de estado
- Criar molecule `Pagination.tsx` com controles anterior, próxima e exibição do total de resultados
- Criar organism `ClienteTable.tsx` com colunas nome, email, cidade, estado, total gasto, total pedidos e segmento RFM, navegando para `/clientes/:id` ao clicar em uma linha
- Criar hook `useClientes(filters)` em `hooks/useClientes.ts`
- Adicionar tipagem `ClienteList` e `PaginatedClienteList` em `types/clientes.ts`
- Compor `ClienteTable`, `SearchBar`, `FilterSelect` e `Pagination` na página `Clientes.tsx`

**Testes**
```
[HAPPY] GET /api/clientes → 200 com estrutura de paginação correta
[ERRO]  GET /api/clientes?estado=INVALIDO → 200 com items: [] (filtro sem resultado não é erro)
[ERRO]  GET /api/clientes?page=0 → 422
[ERRO]  GET /api/clientes?size=0 → 422
[ERRO]  GET /api/clientes?size=200 → 422
```

**Contrato**
```
GET /api/clientes?query=string&estado=SP&page=1&size=20
```

Query params
| Param | Tipo | Obrigatório | Default | Validação |
|---|---|---|---|---|
| `query` | string | não | — | — |
| `estado` | string | não | — | — |
| `page` | int | não | 1 | >= 1 |
| `size` | int | não | 20 | >= 1, <= 100 |

Response 200
```json
{
  "items": [
    {
      "id": int,
      "nome_completo": "string",
      "email": "string",
      "cidade": "string",
      "estado": "string",
      "total_gasto": float,
      "total_pedidos": int,
      "segmento_rfm": "string"
    }
  ],
  "total": int,
  "page": int,
  "size": int,
  "pages": int
}
```
Response 422
```json
{ "detail": [{ "loc": ["query", "page"], "msg": "Input should be greater than or equal to 1" }] }
```

---

### Feature 2.2 — Perfil 360 do Cliente

#### US-06 `[OBR]`
> *Como analista de CRM, quero acessar o perfil completo de um cliente com seus dados cadastrais e métricas consolidadas (LTV, total de pedidos, ticket médio, NPS médio, tickets abertos e segmento RFM), para entender o valor e o comportamento desse cliente antes de qualquer interação.*

**Backend**
- Criar `repository.py` com query buscando cliente por ID em `gold_clientes_360` com join na tabela de avaliações para calcular `nps_medio`
- `nps_medio` retorna `null` se cliente sem avaliações; `ultimo_pedido` retorna `null` se cliente sem pedidos
- Criar `schemas.py` com `ClientePerfil` tipando todos os campos do perfil 360
- Criar `router.py` com `GET /api/clientes/{id}` retornando 404 se ID não existir e 422 se ID não for inteiro

**Frontend**
- Criar organism `ClienteHeader.tsx` exibindo dados cadastrais e métricas em destaque
- Exibir campos `null` como `—` em todos os campos do perfil
- Criar hook `useClientePerfil(id)` em `hooks/useClientes.ts`
- Adicionar tipagem `ClientePerfil` em `types/clientes.ts`
- Renderizar `ClienteHeader` na página `ClientePerfil.tsx` com mensagem amigável de não encontrado ao receber 404

**Testes**
```
[HAPPY] GET /api/clientes/{id_existente} → 200 com todos os campos presentes
[ERRO]  GET /api/clientes/999999 → 404 com campo detail
[ERRO]  GET /api/clientes/abc → 422 (id deve ser inteiro)
```

**Contrato**
```
GET /api/clientes/{id}
```
Response 200
```json
{
  "id": int,
  "nome_completo": "string",
  "email": "string",
  "cidade": "string",
  "estado": "string",
  "genero": "string",
  "idade": int,
  "data_cadastro": "DD-MM-YYYY",
  "origem": "string",
  "total_gasto": float,
  "total_pedidos": int,
  "ticket_medio": float,
  "ultimo_pedido": "DD-MM-YYYY | null",
  "nps_medio": "float | null",
  "tickets_abertos": int,
  "segmento_rfm": "string"
}
```
Response 404
```json
{ "detail": "Cliente nao encontrado." }
```
Response 422
```json
{ "detail": [{ "loc": ["path", "id"], "msg": "Input should be a valid integer" }] }
```

---

#### US-07 `[OBR]`
> *Como analista de CRM, quero visualizar dentro do perfil do cliente abas com seu histórico de pedidos, avaliações realizadas e tickets de suporte, para entender o comportamento de compra, o nível de satisfação e o histórico de problemas sem sair da tela.*

**Backend**
- Criar `GET /api/clientes/{id}/pedidos` com query ordenada por data decrescente, verificando existência do cliente (404 se não existir) e retornando `[]` se sem pedidos
- Criar `GET /api/clientes/{id}/avaliacoes` com mesma lógica; `comentario` pode ser `null`
- Criar `GET /api/clientes/{id}/tickets` com mesma lógica; `tempo_resolucao_horas` e `nota_avaliacao` podem ser `null`
- Criar `schemas.py` com `PedidoAba`, `AvaliacaoAba` e `TicketAba`

**Frontend**
- Criar organism `ClienteTabs.tsx` com três abas controladas por React state sem reload de página
- Aba Pedidos: tabela com ID, nome produto, categoria, valor, data e `Badge` de status colorido
- Aba Avaliações: tabela com ID pedido, nota produto, NPS e comentário (`—` se null)
- Aba Tickets: tabela com ID, tipo problema, data abertura, tempo resolução e nota avaliação
- Exibir `EmptyState` com mensagem específica em cada aba quando lista vier vazia
- Criar hooks `useClientePedidos(id)`, `useClienteAvaliacoes(id)` e `useClienteTickets(id)` em `hooks/useClientes.ts`
- Compor `ClienteTabs` na página `ClientePerfil.tsx`

**Testes**
```
[HAPPY] GET /api/clientes/{id_existente}/pedidos → 200 com lista (pode ser vazia)
[ERRO]  GET /api/clientes/999999/pedidos → 404
[ERRO]  GET /api/clientes/abc/pedidos → 422

[HAPPY] GET /api/clientes/{id_existente}/avaliacoes → 200 com lista (pode ser vazia)
[ERRO]  GET /api/clientes/999999/avaliacoes → 404
[ERRO]  GET /api/clientes/abc/avaliacoes → 422

[HAPPY] GET /api/clientes/{id_existente}/tickets → 200 com lista (pode ser vazia)
[ERRO]  GET /api/clientes/999999/tickets → 404
[ERRO]  GET /api/clientes/abc/tickets → 422
```

**Contratos**
```
GET /api/clientes/{id}/pedidos
```
Response 200
```json
[
  {
    "id": int,
    "nome_produto": "string",
    "categoria": "string",
    "valor": float,
    "data": "DD-MM-YYYY",
    "status": "string"
  }
]
```

```
GET /api/clientes/{id}/avaliacoes
```
Response 200
```json
[
  {
    "id_pedido": int,
    "nota_produto": int,
    "nps": int,
    "comentario": "string | null"
  }
]
```

```
GET /api/clientes/{id}/tickets
```
Response 200
```json
[
  {
    "id": int,
    "tipo_problema": "string",
    "data_abertura": "DD-MM-YYYY",
    "tempo_resolucao_horas": "int | null",
    "nota_avaliacao": "int | null"
  }
]
```
Response 404 (todos os três endpoints)
```json
{ "detail": "Cliente nao encontrado." }
```

---

## ÉPICO 3 — Gestão de Pedidos

### Feature 3.1 — Listagem e Filtros de Pedidos

#### US-08 `[OBR]`
> *Como analista de operações, quero listar e filtrar pedidos por status, período e categoria de produto, para acompanhar a operação de vendas com precisão e investigar casos fora do padrão.*

**Backend**
- Criar `models.py` com ORM mapeando `gold_pedidos`
- Criar `repository.py` com query paginada aplicando filtros `status` e `categoria` com match exato e filtros `data_inicio` e `data_fim` com `>=` e `<=`
- Criar `service.py` validando que `data_fim >= data_inicio` quando ambos forem informados
- Criar `schemas.py` com `PedidoItem` e `PaginatedPedidoList`
- Criar `router.py` com `GET /api/pedidos` validando `page`, `size` e datas no formato `DD-MM-YYYY`

**Frontend**
- Criar molecule `DateRangePicker.tsx` com dois inputs de data validando que `data_fim >= data_inicio` antes de submeter
- Criar organism `PedidoTable.tsx` com colunas ID, cliente, produto, categoria, valor, quantidade, data, método de pagamento e status com `Badge` colorido
- Criar hook `usePedidos(filters)` em `hooks/usePedidos.ts`
- Adicionar tipagem `PedidoItem` e `PaginatedPedidoList` em `types/pedidos.ts`
- Compor `PedidoTable`, `FilterSelect`, `DateRangePicker` e `Pagination` na página `Pedidos.tsx`

**Testes**
```
[HAPPY] GET /api/pedidos → 200 com estrutura de paginação correta
[ERRO]  GET /api/pedidos?page=0 → 422
[ERRO]  GET /api/pedidos?size=0 → 422
[ERRO]  GET /api/pedidos?size=200 → 422
[ERRO]  GET /api/pedidos?data_inicio=31-13-2024 → 422 (data inválida)
[ERRO]  GET /api/pedidos?data_inicio=30-12-2024&data_fim=01-01-2024 → 422 (data_fim anterior)
```

**Contrato**
```
GET /api/pedidos?status=string&categoria=string&data_inicio=DD-MM-YYYY&data_fim=DD-MM-YYYY&page=1&size=20
```

Query params
| Param | Tipo | Obrigatório | Default | Validação |
|---|---|---|---|---|
| `status` | string | não | — | — |
| `categoria` | string | não | — | — |
| `data_inicio` | date | não | — | `DD-MM-YYYY` |
| `data_fim` | date | não | — | `DD-MM-YYYY`, >= `data_inicio` |
| `page` | int | não | 1 | >= 1 |
| `size` | int | não | 20 | >= 1, <= 100 |

Response 200
```json
{
  "items": [
    {
      "id": int,
      "nome_cliente": "string",
      "nome_produto": "string",
      "categoria": "string",
      "valor": float,
      "quantidade": int,
      "data": "DD-MM-YYYY",
      "metodo_pagamento": "string",
      "status": "string"
    }
  ],
  "total": int,
  "page": int,
  "size": int,
  "pages": int
}
```

---

## ÉPICO 4 — Gestão de Produtos

### Feature 4.1 — Catálogo com Métricas de Desempenho

#### US-09 `[OBR]`
> *Como gerente de produto, quero visualizar o catálogo de produtos com as métricas de desempenho de cada item (receita total, quantidade vendida, avaliação média e quantidade de tickets gerados), para identificar produtos que vendem bem e produtos que geram problemas desproporcionais de suporte.*

**Backend**
- Criar `models.py` com ORM mapeando `gold_produtos_performance`
- Criar `repository.py` com query paginada aplicando filtros `categoria` e `ativo`
- `media_avaliacao` arredondada para 1 casa decimal; retornar `null` se produto sem avaliações
- Criar `schemas.py` com `ProdutoItem` e `PaginatedProdutoList`
- Criar `router.py` com `GET /api/produtos` validando `page`, `size` e que `ativo` seja bool

**Frontend**
- Criar organism `ProdutoGrid.tsx` exibindo cards com nome, categoria, preço, estoque, status e métricas de desempenho
- Aplicar `Badge` de status: `Ativo` = verde, `Inativo` = cinza
- Adicionar `FilterSelect` de categoria e de status ativo/inativo
- Criar hook `useProdutos(filters)` em `hooks/useProdutos.ts`
- Adicionar tipagem `ProdutoItem` e `PaginatedProdutoList` em `types/produtos.ts`
- Compor `ProdutoGrid` na página `Produtos.tsx`

**Testes**
```
[HAPPY] GET /api/produtos → 200 com estrutura de paginação correta
[ERRO]  GET /api/produtos?page=0 → 422
[ERRO]  GET /api/produtos?size=0 → 422
[ERRO]  GET /api/produtos?size=200 → 422
[ERRO]  GET /api/produtos?ativo=talvez → 422
```

**Contrato**
```
GET /api/produtos?categoria=string&ativo=bool&page=1&size=20
```
Response 200
```json
{
  "items": [
    {
      "id": int,
      "nome_produto": "string",
      "categoria": "string",
      "preco": float,
      "estoque_disponivel": int,
      "ativo": bool,
      "receita_total": float,
      "qtd_vendas": int,
      "media_avaliacao": "float | null",
      "qtd_tickets": int
    }
  ],
  "total": int,
  "page": int,
  "size": int,
  "pages": int
}
```

---

### Feature 4.2 — CRUD de Produtos

#### US-10 `[OBR]`
> *Como gerente de produto, quero adicionar novos produtos ao catálogo diretamente pelo CRM, para manter o cadastro atualizado sem depender de outros sistemas ou equipes.*

**Backend**
- Criar `schemas.py` com `ProdutoCreate` definindo `nome_produto`, `categoria`, `preco` (> 0) e `estoque_disponivel` (>= 0) como obrigatórios e `ativo` como opcional com default `true`
- Criar método `create_produto` em `repository.py` com INSERT retornando o produto criado com ID gerado e métricas zeradas
- Criar `router.py` com `POST /api/produtos` retornando 201

**Frontend**
- Criar organism `ProdutoModal.tsx` em modo criação com campos nome, categoria, preço, estoque e ativo
- Validar campos obrigatórios e exibir mensagem de erro inline por campo antes de submeter
- Abrir modal via botão "Novo Produto" na página `Produtos.tsx`
- Exibir toast de sucesso após criação, fechar modal e atualizar listagem via `invalidateQueries`
- Exibir toast de erro com mensagem do `detail` em caso de falha

**Testes**
```
[HAPPY] POST /api/produtos com body válido → 201 com produto criado e id gerado
[ERRO]  POST /api/produtos sem nome_produto → 422
[ERRO]  POST /api/produtos sem categoria → 422
[ERRO]  POST /api/produtos sem preco → 422
[ERRO]  POST /api/produtos sem estoque_disponivel → 422
[ERRO]  POST /api/produtos com preco = 0 → 422
[ERRO]  POST /api/produtos com preco negativo → 422
[ERRO]  POST /api/produtos com estoque negativo → 422
```

**Contrato**
```
POST /api/produtos
```
Request body
```json
{
  "nome_produto": "string",
  "categoria": "string",
  "preco": float,
  "estoque_disponivel": int,
  "ativo": "bool (opcional, default: true)"
}
```
Response 201
```json
{
  "id": int,
  "nome_produto": "string",
  "categoria": "string",
  "preco": float,
  "estoque_disponivel": int,
  "ativo": bool,
  "receita_total": 0.0,
  "qtd_vendas": 0,
  "media_avaliacao": null,
  "qtd_tickets": 0
}
```
Response 422
```json
{ "detail": [{ "loc": ["body", "preco"], "msg": "Input should be greater than 0" }] }
```

---

#### US-11 `[OBR]`
> *Como gerente de produto, quero editar os dados de um produto existente no catálogo, para corrigir informações, ajustar preço ou atualizar estoque diretamente pelo CRM.*

**Backend**
- Criar `schemas.py` com `ProdutoUpdate` com todos os campos opcionais e mesmas validações do `ProdutoCreate` quando presentes
- Criar método `update_produto` em `repository.py` aplicando apenas os campos enviados no body
- Criar `router.py` com `PUT /api/produtos/{id}` retornando 404 se não existir e 422 se validação falhar

**Frontend**
- Reutilizar `ProdutoModal.tsx` em modo edição com dados do produto pré-preenchidos
- Abrir modal via botão de edição por card no `ProdutoGrid`
- Mesma lógica de toast e atualização de listagem da criação

**Testes**
```
[HAPPY] PUT /api/produtos/{id_existente} com body parcial → 200 com produto atualizado
[ERRO]  PUT /api/produtos/999999 → 404
[ERRO]  PUT /api/produtos/abc → 422
[ERRO]  PUT /api/produtos/{id} com preco = 0 → 422
[ERRO]  PUT /api/produtos/{id} com preco negativo → 422
[ERRO]  PUT /api/produtos/{id} com estoque negativo → 422
```

**Contrato**
```
PUT /api/produtos/{id}
```
Request body — todos os campos opcionais
```json
{
  "nome_produto": "string (opcional)",
  "categoria": "string (opcional)",
  "preco": "float (opcional)",
  "estoque_disponivel": "int (opcional)",
  "ativo": "bool (opcional)"
}
```
Response 200 — produto completo atualizado (mesmo shape do GET por ID)

Response 404
```json
{ "detail": "Produto nao encontrado." }
```

---

#### US-12 `[OBR]`
> *Como gerente de produto, quero remover um produto do catálogo pelo CRM, para manter a base de produtos limpa e sem itens obsoletos.*

**Backend**
- Criar método `delete_produto` em `repository.py` com DELETE por ID
- Criar `router.py` com `DELETE /api/produtos/{id}` retornando 204 sem body e 404 se não existir

**Frontend**
- Adicionar botão de exclusão por card no `ProdutoGrid`
- Exibir modal de confirmação explícita antes de executar o DELETE
- Remover o card da listagem sem reload completo via `invalidateQueries` após resposta 204

**Testes**
```
[HAPPY] DELETE /api/produtos/{id_existente} → 204 sem body
[ERRO]  DELETE /api/produtos/999999 → 404
[ERRO]  DELETE /api/produtos/abc → 422
```

**Contrato**
```
DELETE /api/produtos/{id}
```
Response 204 — sem body

Response 404
```json
{ "detail": "Produto nao encontrado." }
```

---

## ÉPICO 5 — Gestão de Tickets de Suporte

### Feature 5.1 — Listagem e Priorização de Tickets

#### US-13 `[OBR]`
> *Como operador de suporte, quero visualizar todos os tickets com prioridade visual baseada no tempo de resolução e com filtros por tipo de problema, status, agente e período, para priorizar os casos mais críticos e distribuir o atendimento de forma eficiente.*

**Backend**
- Criar `models.py` com ORM mapeando `gold_tickets`
- Criar `repository.py` com query paginada aplicando filtros `tipo_problema`, `status` e `agente` com `LOWER()` e `data_inicio`/`data_fim` com `>=` e `<=`
- Criar `service.py` calculando campo `prioridade` por `tempo_resolucao_horas`: `Alta` se > 72 ou `null`, `Media` se 24–72, `Baixa` se < 24; campo nunca retorna `null`
- Criar `schemas.py` com `TicketItem` incluindo `prioridade` e `PaginatedTicketList`
- Criar `router.py` com `GET /api/tickets` validando `page`, `size` e datas

**Frontend**
- Criar molecule `PriorityBadge.tsx` recebendo `prioridade` como prop e aplicando cor: `Alta` = vermelho, `Media` = amarelo, `Baixa` = verde
- Criar organism `TicketTable.tsx` com colunas ID, cliente, tipo problema, status, abertura, resolução, tempo resolução, agente, nota e prioridade
- Destacar visualmente linhas com `prioridade = Alta` com borda ou fundo diferenciado
- Adicionar `FilterSelect` de tipo problema, status e agente e `DateRangePicker` de período
- Criar hook `useTickets(filters)` em `hooks/useTickets.ts`
- Adicionar tipagem `TicketItem` e `PaginatedTicketList` em `types/tickets.ts`
- Compor `TicketTable` com filtros e `Pagination` na página `Tickets.tsx`

**Testes**
```
[HAPPY] GET /api/tickets → 200 com campo prioridade presente em todos os itens
[ERRO]  GET /api/tickets?page=0 → 422
[ERRO]  GET /api/tickets?size=0 → 422
[ERRO]  GET /api/tickets?size=200 → 422
[ERRO]  GET /api/tickets?data_inicio=31-13-2024 → 422
[ERRO]  GET /api/tickets?data_inicio=30-12-2024&data_fim=01-01-2024 → 422
```

**Contrato**
```
GET /api/tickets?tipo_problema=string&status=string&agente=string&data_inicio=DD-MM-YYYY&data_fim=DD-MM-YYYY&page=1&size=20
```

Query params
| Param | Tipo | Obrigatório | Default | Validação |
|---|---|---|---|---|
| `tipo_problema` | string | não | — | — |
| `status` | string | não | — | — |
| `agente` | string | não | — | — |
| `data_inicio` | date | não | — | `DD-MM-YYYY` |
| `data_fim` | date | não | — | `DD-MM-YYYY`, >= `data_inicio` |
| `page` | int | não | 1 | >= 1 |
| `size` | int | não | 20 | >= 1, <= 100 |

Response 200
```json
{
  "items": [
    {
      "id": int,
      "id_cliente": int,
      "id_pedido": int,
      "tipo_problema": "string",
      "status": "string",
      "data_abertura": "DD-MM-YYYY",
      "data_resolucao": "DD-MM-YYYY | null",
      "tempo_resolucao_horas": "int | null",
      "agente_suporte": "string",
      "nota_avaliacao": "int | null",
      "prioridade": "Alta | Media | Baixa"
    }
  ],
  "total": int,
  "page": int,
  "size": int,
  "pages": int
}
```

> `data_resolucao`, `tempo_resolucao_horas` e `nota_avaliacao` são `null` para tickets ainda abertos.
> `prioridade` nunca é `null` — tickets sem resolução são sempre `Alta`.

---

## ÉPICO 7 — Diferenciais

### Feature 7.3 — Exportação de Dados em CSV

#### US-20 `[DIF]`
> *Como analista, quero exportar a lista de clientes com os filtros ativos aplicados em formato CSV, para realizar análises externas sem precisar acessar diretamente o banco de dados.*

**Backend**
- Criar `GET /api/clientes/export/csv` em `router.py` aceitando os mesmos filtros do endpoint de listagem sem paginação
- Gerar CSV com todos os registros filtrados usando encoding UTF-8 com BOM para compatibilidade com Excel
- Retornar com `Content-Type: text/csv` e `Content-Disposition: attachment; filename="clientes.csv"` incluindo cabeçalho com nomes das colunas

**Frontend**
- Adicionar botão "Exportar CSV" no organism `ClienteTable.tsx`
- Ao clicar, disparar `GET /api/clientes/export/csv` passando os filtros ativos do momento e iniciar download automático via `Blob` e `URL.createObjectURL`

**Testes**
```
[HAPPY] GET /api/clientes/export/csv → 200 com Content-Type text/csv e Content-Disposition corretos
```

**Contrato**
```
GET /api/clientes/export/csv?query=string&estado=SP
```
Response 200
```
Content-Type: text/csv; charset=utf-8
Content-Disposition: attachment; filename="clientes.csv"

id,nome_completo,email,cidade,estado,total_gasto,total_pedidos,segmento_rfm
```

---

#### US-21 `[DIF]`
> *Como analista, quero exportar a lista de pedidos com os filtros ativos aplicados em formato CSV, para realizar análises externas sem precisar acessar diretamente o banco de dados.*

**Backend**
- Criar `GET /api/pedidos/export/csv` em `router.py` com os mesmos filtros do endpoint de listagem sem paginação e mesma lógica de encoding e headers da exportação de clientes

**Frontend**
- Adicionar botão "Exportar CSV" no organism `PedidoTable.tsx` com mesma lógica de download da exportação de clientes

**Testes**
```
[HAPPY] GET /api/pedidos/export/csv → 200 com Content-Type text/csv e Content-Disposition corretos
[ERRO]  GET /api/pedidos/export/csv?data_inicio=31-13-2024 → 422
```

**Contrato**
```
GET /api/pedidos/export/csv?status=string&categoria=string&data_inicio=DD-MM-YYYY&data_fim=DD-MM-YYYY
```
Response 200
```
Content-Type: text/csv; charset=utf-8
Content-Disposition: attachment; filename="pedidos.csv"

id,nome_cliente,nome_produto,categoria,valor,quantidade,data,metodo_pagamento,status
```

---

### Feature 7.4 — Autenticação com Perfis de Acesso

#### US-22 `[DIF]`
> *Como administrador do sistema, quero que o acesso ao CRM exija autenticação com e-mail e senha, para proteger os dados da V-Commerce de acessos não autorizados.*

#### US-23 `[DIF]`
> *Como administrador do sistema, quero que cada perfil de usuário acesse apenas as funcionalidades pertinentes ao seu papel, para garantir que cada time opere somente dentro do seu escopo.*

**Backend**
- Criar módulo `auth/` com `router.py` implementando `POST /api/auth/login` validando credenciais e retornando JWT com `access_token`, `token_type` e `perfil`
- Implementar middleware de autenticação verificando o header `Authorization: Bearer {token}` em todas as rotas protegidas, retornando 401 se ausente ou expirado
- Implementar controle de autorização por perfil retornando 403 quando o perfil não tiver permissão para a rota acessada

**Frontend**
- Criar template `AuthLayout.tsx` com layout centralizado para a tela de login
- Criar página de login em `/login` com campos de email e senha
- Armazenar o token JWT e incluí-lo automaticamente em todas as chamadas via interceptor do Axios em `services/api.ts`
- Redirecionar para `/login` quando qualquer rota protegida retornar 401
- Ocultar da interface os elementos restritos com base no `perfil` retornado no login, não apenas desabilitar

**Testes**
```
[HAPPY] POST /api/auth/login com credenciais válidas → 200 com access_token e perfil
[ERRO]  POST /api/auth/login com senha errada → 401
[ERRO]  POST /api/auth/login sem email → 422
[ERRO]  POST /api/auth/login sem senha → 422
[ERRO]  GET /api/clientes sem token → 401
[ERRO]  GET /api/clientes com token expirado → 401
[ERRO]  DELETE /api/produtos/{id} com perfil comercial → 403
[ERRO]  GET /api/dashboard com perfil suporte → 403
```

**Contrato**
```
POST /api/auth/login
```
Request body
```json
{ "email": "string", "senha": "string" }
```
Response 200
```json
{ "access_token": "string", "token_type": "bearer", "perfil": "admin | comercial | suporte" }
```
Response 401
```json
{ "detail": "Credenciais invalidas." }
```

> Rotas protegidas exigem: `Authorization: Bearer {token}`

Permissões por perfil

| Rota | admin | comercial | suporte |
|---|---|---|---|
| Dashboard (leitura) | sim | sim | nao |
| Clientes (leitura) | sim | sim | sim |
| Pedidos (leitura) | sim | sim | nao |
| Produtos (leitura) | sim | sim | nao |
| Produtos (CRUD) | sim | nao | nao |
| Tickets (leitura) | sim | nao | sim |
| Agente de IA | sim | sim | sim |


---

# TIME DE FRONTEND 

## Rotas do React Router

| Rota | Página | Componentes principais |
|---|---|---|
| `/` | `Dashboard.tsx` | `KpiGrid`, `SalesChart`, `TopProductsChart`, `StatusPieChart`, `RegionTable` |
| `/clientes` | `Clientes.tsx` | `ClienteTable`, `SearchBar`, `FilterSelect`, `Pagination` |
| `/clientes/:id` | `ClientePerfil.tsx` | `ClienteHeader`, `ClienteTabs` |
| `/pedidos` | `Pedidos.tsx` | `PedidoTable`, `FilterSelect`, `DateRangePicker`, `Pagination` |
| `/produtos` | `Produtos.tsx` | `ProdutoGrid`, `ProdutoModal` |
| `/tickets` | `Tickets.tsx` | `TicketTable`, `PriorityBadge`, `FilterSelect`, `Pagination` |
| `/chat` | `Chat.tsx` | `ChatWindow`, `SqlViewer` |
| `/login` | (DIF) | `AuthLayout`, formulário de login |

## Comportamentos obrigatórios por página -> sugestão

| Página | Comportamento |
|---|---|
| Todas | Skeleton/spinner durante carregamento; banner de erro em caso de falha na API |
| Clientes | Debounce de 400ms na busca; `EmptyState` quando lista vazia |
| ClientePerfil | Campos `null` exibidos como `—`; troca de aba sem reload |
| Pedidos | `data_fim` não pode ser anterior a `data_inicio` (validação no `DateRangePicker`) |
| Produtos | Modal de confirmação antes de deletar; refresh da listagem após CRUD |
| Chat | Envio via botão e tecla Enter; `SqlViewer` colapsável por mensagem; tabela de dados quando `data` não vazio |

## Design System (será desenvolvido pelo pessoal de design)




---

# TIME DE GEN AI — Agente Text-to-SQL
**OBS: time de genAI por favor alterar qualquer coisa que estiver errada**
## Localização no repositório

```
backend/app/agent/
├── router.py      # POST /api/agent/chat — integrado ao backend FastAPI
├── agent.py       # lógica Text-to-SQL, guardrails, execução de query, memória
└── prompts.py     # system prompt com schema completo do banco
```

## Arquitetura do Agente

```
Mensagem do usuário
        ↓
POST /api/agent/chat  (router.py)
        ↓
Guardrail de escrita  (agent.py)
— rejeita INSERT/UPDATE/DELETE/DROP/ALTER/TRUNCATE/CREATE → 400
        ↓
PydanticAI Agent  (agent.py)
  ├── System Prompt  (prompts.py) → schema completo + regras de negócio
  ├── Tool: execute_sql(query: str) → list[dict], máx 100 linhas, timeout 30s
  └── Tool: get_schema() → str
        ↓
LLM (Gemini 2.5 Flash ou similar)
  ├── Gera SQL válido para o SQLite local
  ├── Detecta se pergunta está fora do escopo
  └── Formata resposta em português claro
        ↓
{ answer, sql_used, data[], out_of_scope }
```

## System Prompt (estrutura base — detalhar em `prompts.py`)

```
Você é o assistente de dados da V-Commerce.
Você tem acesso SOMENTE às seguintes tabelas: [SCHEMA COMPLETO AQUI]

Regras obrigatórias:
1. Gere APENAS queries SELECT — jamais modifique dados
2. Limite resultados a 100 linhas por padrão (use LIMIT 100)
3. Se a pergunta estiver fora do escopo, retorne out_of_scope: true
4. Explique brevemente qual dado foi consultado
5. Formate valores monetários em R$ com 2 casas decimais
6. Responda sempre em português brasileiro
```

## Guardrails

| Guardrail | Implementação |
|---|---|
| Bloqueio de escrita | Verificação por token isolado (case-insensitive) antes de chamar o modelo |
| Palavras bloqueadas | `INSERT`, `UPDATE`, `DELETE`, `DROP`, `ALTER`, `TRUNCATE`, `CREATE` |
| Out-of-scope | Detectado via system prompt; `out_of_scope: true` no response |
| Timeout SQL | 30 segundos na execução da query |
| Limite de dados | `LIMIT 100` aplicado em toda query antes de executar |
| Memória de sessão | Últimas 10 mensagens por `session_id`, em memória, sem persistência (DIF) |

---

## ÉPICO 6 — Agente de IA Conversacional

### Feature 6.1 — Consulta em Linguagem Natural

#### US-14 `[OBR]`
> *Como usuário não técnico, quero fazer perguntas sobre vendas, clientes, produtos e suporte em linguagem natural e receber respostas claras em português, para obter informações dos dados sem precisar escrever SQL ou depender de um analista.*

#### US-15 `[OBR]`
> *Como analista, quero que o agente exiba a query SQL utilizada para chegar à resposta, para verificar a origem do dado e confiar nas informações apresentadas.*

**Backend**
- Criar `prompts.py` com system prompt contendo o schema completo do banco e as regras de negócio do agente
- Criar `agent.py` implementando o agente PydanticAI com tool `execute_sql(query: str)` com timeout de 30s e `LIMIT 100` forçado e tool `get_schema()` retornando o schema como string
- Criar `schemas.py` com `ChatRequest` (message, session_id) e `ChatResponse` (answer, sql_used, data, out_of_scope)
- Criar `router.py` com `POST /api/agent/chat` orquestrando o fluxo completo e retornando `ChatResponse`

**Frontend**
- Criar molecule `SqlViewer.tsx` como bloco colapsável exibindo o SQL formatado e distinguível do restante da resposta
- Criar organism `ChatWindow.tsx` com histórico de mensagens, campo de input com envio via botão e via tecla Enter, spinner durante processamento, `SqlViewer` por mensagem quando `sql_used` não for null e tabela de dados quando `data` não estiver vazio
- Criar hook `useAgent()` em `hooks/useAgent.ts`
- Adicionar tipagem `ChatRequest` e `ChatResponse` em `types/agent.ts`
- Compor `ChatWindow` na página `Chat.tsx`

**Testes**
```
[HAPPY] POST /api/agent/chat com pergunta válida → 200 com answer, sql_used não nulo, out_of_scope: false
[ERRO]  POST /api/agent/chat sem campo message → 422
[ERRO]  POST /api/agent/chat sem campo session_id → 422
[ERRO]  POST /api/agent/chat com INSERT na message → 400
[ERRO]  POST /api/agent/chat com UPDATE na message → 400
[ERRO]  POST /api/agent/chat com DELETE na message → 400
[ERRO]  POST /api/agent/chat com DROP na message → 400
[ERRO]  POST /api/agent/chat com ALTER na message → 400
[ERRO]  POST /api/agent/chat com TRUNCATE na message → 400
[ERRO]  POST /api/agent/chat com CREATE na message → 400
```

**Contrato**
```
POST /api/agent/chat
```
Request body
```json
{
  "message": "string",
  "session_id": "string (UUID v4)"
}
```
Response 200 — pergunta válida
```json
{
  "answer": "string",
  "sql_used": "string",
  "data": [ {} ],
  "out_of_scope": false
}
```
Response 200 — fora do escopo
```json
{
  "answer": "string",
  "sql_used": null,
  "data": [],
  "out_of_scope": true
}
```
Response 400 — tentativa de escrita
```json
{ "detail": "Operacoes de escrita nao sao permitidas. O agente opera apenas em modo de consulta." }
```
Response 408 — timeout
```json
{ "detail": "A consulta excedeu o tempo limite de 30 segundos. Tente reformular a pergunta." }
```
Response 422
```json
{ "detail": [{ "loc": ["body", "message"], "msg": "Field required" }] }
```

---

### Feature 6.2 — Guardrails e Segurança do Agente

#### US-16 `[OBR]`
> *Como administrador do sistema, quero que o agente bloqueie qualquer tentativa de executar comandos que modifiquem dados no banco, para garantir que o agente opere exclusivamente em modo de consulta.*

#### US-17 `[OBR]`
> *Como usuário do CRM, quero que o agente reconheça quando uma pergunta está fora do escopo dos dados disponíveis e me informe claramente, para não receber respostas inventadas ou enganosas.*

**Backend**
- Implementar guardrail em `agent.py` verificando por token isolado (case-insensitive) a presença de palavras bloqueadas na mensagem antes de qualquer chamada ao modelo, retornando 400 imediatamente
- Implementar detecção de fora de escopo via system prompt em `prompts.py`, retornando `out_of_scope: true` e `sql_used: null` no response
- Aplicar timeout de 30s na execução da query SQL retornando 408 quando excedido
- Forçar `LIMIT 100` em toda query antes de executar

**Frontend**
- Exibir mensagem amigável quando `out_of_scope: true` sem expor detalhes técnicos
- Exibir mensagem de erro clara quando a API retornar 400 ou 408

---

## ÉPICO 7 — Diferenciais (Gen AI)

### Feature 7.1 — Memória de Conversa

#### US-18 `[DIF]`
> *Como analista, quero que o agente mantenha o contexto da conversa e consiga responder perguntas de acompanhamento relacionadas à pergunta anterior, para interagir de forma mais fluída e produtiva sem precisar repetir o contexto a cada mensagem.*

**Backend**
- Implementar armazenamento em memória de histórico por `session_id` em `agent.py` mantendo as últimas 10 mensagens (user + assistant alternados)
- Iniciar nova sessão silenciosamente quando `session_id` não existir
- Isolar histórico por sessão sem persistência entre reinicializações do servidor

**Frontend**
- Gerar `session_id` como UUID v4 ao carregar a página `Chat.tsx` e mantê-lo no estado local durante toda a sessão

---

### Feature 7.2 — Sugestões de Perguntas no Chat

#### US-19 `[DIF]`
> *Como usuário do CRM, quero visualizar sugestões de perguntas ao abrir a interface de chat, para descobrir o que posso consultar sem precisar imaginar exemplos por conta própria.*

**Backend**
- Não requer endpoint dedicado; sugestões são estáticas no frontend

**Frontend**
- Exibir pelo menos 4 sugestões clicáveis no `ChatWindow` quando o histórico estiver vazio
- Clicar em uma sugestão preenche automaticamente o campo de input sem enviar
- Sugestões obrigatórias: "Quais foram os 10 produtos mais vendidos esse mês?", "Qual região teve maior crescimento de receita no último trimestre?", "Quais clientes do Nordeste compraram mais de R$ 500 nos últimos 6 meses?", "Qual produto gera mais tickets de suporte?"
- Ocultar sugestões após o primeiro envio

---

### Feature 7.5 — Comportamento Digital do Cliente

#### US-24 `[DIF]`
> *Como analista de CRM, quero visualizar no perfil do cliente uma aba com seus dados de comportamento digital, para enriquecer o contexto antes de abordagens comerciais ou de retenção.*

**Backend**
- Criar `GET /api/clientes/{id}/comportamento` em `router.py` verificando existência do cliente (404 se não existir)
- Buscar dados da tabela `gold_clickstream_resumo`; se a tabela não estiver disponível, retornar `mock: true` com dados ilustrativos
- Criar `schemas.py` com `ComportamentoResponse` (mock: bool, sessoes: list)

**Frontend**
- Adicionar aba "Comportamento" no organism `ClienteTabs.tsx`
- Exibir tabela com sessões contendo canal, páginas visitadas, tempo de sessão e data
- Exibir banner amarelo "Dados ilustrativos — clickstream ainda não disponível" quando `mock: true`
- Criar hook `useClienteComportamento(id)` em `hooks/useClientes.ts`

**Testes**
```
[HAPPY] GET /api/clientes/{id_existente}/comportamento → 200 com campo mock e lista sessoes
[ERRO]  GET /api/clientes/999999/comportamento → 404
[ERRO]  GET /api/clientes/abc/comportamento → 422
```

**Contrato**
```
GET /api/clientes/{id}/comportamento
```
Response 200
```json
{
  "mock": bool,
  "sessoes": [
    {
      "sessao_id": "string",
      "canal": "string",
      "paginas_visitadas": int,
      "tempo_sessao_segundos": int,
      "data_sessao": "DD-MM-YYYY"
    }
  ]
}
```
Response 404
```json
{ "detail": "Cliente nao encontrado." }
```

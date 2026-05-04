# V-Commerce CRM 360 — Plano de Arquitetura

> **Foco:** Time de DEV (Backend FastAPI + Frontend React/TypeScript + Agente IA)
> **Data:** 30/04/2026 | **Deadline de entrega:** 19/05/2026

---

## 1. Estrutura do Repositório

```
v-commerce-crm-360/
├── data-engineering/
│   ├── 00.Preparing_enviroment.ipynb
│   ├── 01.staging_to_Bronze.ipynb
│   ├── 02_bronze_silver_cleaning.ipynb
│   ├── 03_silver_gold_marts.ipynb
│   ├── 04_Gold_to_SQLite
│   └── workflow.yaml
├── backend/
│   ├── app/
│   │   ├── main.py
│   │   ├── database.py          # engine SQLAlchemy, session factory
│   │   ├── config.py            # variáveis de ambiente
│   │   │
│   │   ├── clientes/
│   │   │   ├── router.py        # rotas FastAPI (HTTP)
│   │   │   ├── service.py       # regras de negócio
│   │   │   ├── repository.py    # queries ao banco (SQLAlchemy)
│   │   │   ├── schemas.py       # modelos Pydantic (request/response)
│   │   │   └── models.py        # modelos ORM
│   │   │
│   │   ├── pedidos/             # mesma estrutura
│   │   ├── produtos/            # mesma estrutura
│   │   ├── tickets/             # mesma estrutura
│   │   │
│   │   └── agent/
│   │       ├── router.py        # endpoint do chat
│   │       ├── agent.py         # lógica Text-to-SQL
│   │       └── prompts.py       # templates de prompt
│   │
│   ├── tests/
│   │   ├── test_clientes.py
│   │   ├── test_pedidos.py
│   │   ├── test_produtos.py
│   │   ├── test_tickets.py
│   │   └── test_agent.py
│   │
│   ├── seed.py            ← importa CSVs Gold para o banco
│   ├── requirements.txt
│   └── .env.example
├── frontend/
│   ├── src/
│   │   ├── pages/
│   │   │   ├── Dashboard.tsx
│   │   │   ├── Clientes.tsx
│   │   │   ├── ClientePerfil.tsx
│   │   │   ├── Pedidos.tsx
│   │   │   ├── Produtos.tsx
│   │   │   ├── Tickets.tsx
│   │   │   └── Chat.tsx
│   │   ├── components/ #ALTERAR PRA ATOMO, MOLECULA, ORGANISMO E TEMPLATES
│   │   ├── services/api.ts
│   │   └── App.tsx
│   ├── package.json
│   └── vite.config.ts
└── README.md
```

---

## 2. Interface com o Time de Dados

> O DEV não executa o pipeline Databricks, mas precisa das **tabelas Gold exportadas em CSV** para popular o banco local que será SQLite.

### 2.1 Problemas de qualidade já identificados nos CSVs

| Tabela | Problema Observado |
|---|---|
| `clientes.csv` | Telefone com lixo no final (ex: `14.9977.1729 r. 282`), sobrenomes em CAPS |
| `pedidos.csv` | Status com typo (`Aprovadoo` em vez de `Aprovado`) |
| `catalogo_produtos.csv` | `avaliacao_interna` = `"null"` como string literal; campo `ativo` inconsistente (`Nao`/`S`) |
| `suporte_tickets.csv` | `tipo_problema` truncado (`pro` em vez de `Produto`) |
| Geral | Colunas com caracteres especiais que quebram o Delta Lake |

### 2.2 Tabelas Gold que o DEV espera receber

| Tabela Gold | Descrição |
|---|---|
| `gold_clientes_360` | Visão unificada: cadastro + LTV + total pedidos/tickets + NPS médio + segmento |
| `gold_pedidos` | Pedidos limpos com join de produto e cliente |
| `gold_produtos_performance` | Produto + receita total + qtd vendas + avaliação média + qtd tickets |
| `gold_tickets` | Tickets com tipo e status normalizados |
| `gold_kpis_dashboard` | Métricas pré-agregadas por mês / categoria / estado |
| `gold_clickstream_resumo` | *(Diferencial)* Sessões por cliente: canal, páginas, tempo |

### 2.3 Schema mínimo esperado por tabela

```sql
-- gold_clientes_360
id_cliente, nome_completo, email, cidade, estado, genero, idade,
data_cadastro, origem, total_pedidos, total_gasto, ticket_medio,
ultimo_pedido_data, qtd_tickets_abertos, media_nps, segmento_rfm

-- gold_pedidos
id_pedido, id_cliente, nome_cliente, id_produto, nome_produto,
categoria, valor_pedido, quantidade, data_pedido, metodo_pagamento, status

-- gold_produtos_performance
id_produto, nome_produto, categoria, preco, estoque_disponivel,
ativo, receita_total, qtd_vendas, media_avaliacao, qtd_tickets

-- gold_kpis_dashboard
mes_ano, receita_total, total_pedidos, ticket_medio,
novos_clientes, categoria, estado

-- gold_tickets
ticket_id, id_cliente, id_pedido, tipo_problema, data_abertura,
data_resolucao, tempo_resolucao_horas, agente_suporte, nota_avaliacao
```

---

## 3. Backend — FastAPI

### 3.1 Stack

| Componente | Tecnologia |
|---|---|
| Framework | FastAPI + Uvicorn |
| ORM | SQLAlchemy 2.x (async) |
| Banco | **SQLite** (recomendado para o case — zero config) |
| Validação | Pydantic v2 |
| Docs | OpenAPI automático em `/docs` |

### 3.2 Endpoints

#### `/api/dashboard`
```
GET /kpis            → receita total, pedidos, ticket médio, total clientes
GET /vendas-mensal   → série temporal de receita por mês (12 meses)
GET /top-produtos    → top 10 produtos por receita
GET /por-regiao      → receita agregada por estado
GET /status-pedidos  → distribuição percentual de status
```

#### `/api/clientes`
```
GET /               → lista paginada com filtros
GET /{id}           → perfil 360 completo (pedidos + tickets + métricas)
GET /{id}/pedidos   → histórico de pedidos do cliente
GET /{id}/tickets   → tickets do cliente
GET /export/csv     → (Diferencial) exportar lista filtrada em CSV
```

#### `/api/pedidos`
```
GET /               → lista paginada com filtros (status, data, produto)
GET /{id}           → detalhe do pedido
```

#### `/api/produtos`
```
GET    /            → catálogo com métricas de performance
GET    /{id}        → detalhe + métricas individuais
POST   /            → criar produto  (CRUD obrigatório)
PUT    /{id}        → atualizar produto
DELETE /{id}        → remover produto
```

#### `/api/tickets`
```
GET /               → lista com filtros (tipo, agente, data)
GET /{id}           → detalhe do ticket
```

#### `/api/agent`
```
POST /chat          → { "message": "...", "session_id": "..." }
                    ← { "answer": "...", "sql_used": "...", "data": [...] }
```

### 3.3 Filtros comuns (query params)
```
?page=1&limit=20
?search=João
?estado=SP
?categoria=Eletronicos
?status=Aprovado
?data_inicio=2024-01-01&data_fim=2024-12-31
```

---

## 4. Frontend — React + TypeScript + Vite

### 4.1 Stack

| Componente | Tecnologia |
|---|---|
| Framework | React 18 + TypeScript + Vite |
| Roteamento | React Router v6 |
| Gráficos | Recharts |
| HTTP / Cache | Axios + React Query |
| Ícones | Lucide React |
| Estilo | Vanilla CSS com design system próprio |

### 4.2 Páginas

| Rota | Página | Conteúdo Principal |
|---|---|---|
| `/` | Dashboard | KPI Cards, gráfico de receita mensal, top produtos, distribuição de status |
| `/clientes` | Clientes | Tabela paginada com busca e filtros; exportar CSV |
| `/clientes/:id` | Perfil 360 | Header com métricas + tabs: Pedidos / Tickets / Avaliações / Comportamento |
| `/pedidos` | Pedidos | Tabela com status badges coloridos e filtros avançados |
| `/produtos` | Produtos | Cards com métricas + modal de criar/editar + delete |
| `/tickets` | Tickets | Lista com prioridade visual por tempo de resolução |
| `/chat` | Chat IA | Interface conversacional com sugestões e SQL expandível |

### 4.3 Design System

```css
/* Paleta — Dark Mode */
--color-primary:  hsl(220, 90%, 56%);   /* Azul principal */
--color-accent:   hsl(262, 80%, 60%);   /* Roxo destaque */
--color-success:  hsl(142, 71%, 45%);
--color-danger:   hsl(0, 72%, 51%);
--color-warning:  hsl(38, 92%, 50%);
--color-bg:       hsl(222, 47%, 11%);   /* Fundo dark */
--color-surface:  hsl(222, 40%, 16%);   /* Cards */
--color-border:   hsl(222, 30%, 22%);

/* Tipografia */
font-family: 'Inter', sans-serif;  /* Google Fonts */

/* Cards — Glassmorphism */
background: rgba(255, 255, 255, 0.05);
backdrop-filter: blur(12px);
border: 1px solid rgba(255, 255, 255, 0.08);
border-radius: 12px;
```

---

## 5. Agente de IA — Text-to-SQL

### 5.1 Stack

| Componente | Tecnologia |
|---|---|
| Framework | PydanticAI |
| Modelo | Gemini 2.5 Flash |
| Integração | Módulo Python dentro do backend FastAPI |
| Fonte de dados | Banco local (mesmo banco do backend) |

### 5.2 Arquitetura do Agente

```
Mensagem do usuário
        ↓
POST /api/agent/chat  (FastAPI)
        ↓
PydanticAI Agent
  ├── System Prompt  → schema completo + regras de negócio
  ├── Tool: execute_sql(query: str) → list[dict]
  ├── Tool: get_schema() → str
  └── Guardrail: detectar perguntas fora de escopo
        ↓
Gemini 2.5 Flash
  ├── Gera SQL válido para o banco local
  ├── Interpreta os resultados retornados
  └── Formata resposta em português claro
        ↓
{ answer, sql_used, data[], out_of_scope: bool }
```

### 5.3 System Prompt (estrutura base)

```
Você é o assistente de dados da V-Commerce.
Você tem acesso SOMENTE às seguintes tabelas: [SCHEMA COMPLETO AQUI]

Regras obrigatórias:
1. Gere APENAS queries SELECT — jamais modifique dados
2. Limite resultados a 100 linhas por padrão
3. Se a pergunta estiver fora do escopo dos dados disponíveis, informe claramente
4. Sempre explique brevemente qual dado foi consultado
5. Formate valores monetários em R$ com 2 casas decimais
6. Responda sempre em português brasileiro
```

### 5.4 Guardrails

| Guardrail | Implementação |
|---|---|
| Bloquear escrita | Rejeitar queries com `INSERT/UPDATE/DELETE/DROP/ALTER` |
| Out-of-scope | Detectar via prompt + fallback com mensagem amigável |
| Timeout SQL | 30s máximo de execução |
| Limite de dados | 100 rows retornadas ao LLM |
| Sessão | `session_id` por usuário, histórico das últimas 10 mensagens |

### 5.5 Perguntas de exemplo que o agente deve responder

- *"Quais foram os 10 produtos mais vendidos esse mês?"*
- *"Qual região teve maior crescimento de receita no último trimestre?"*
- *"Quais clientes do Nordeste compraram mais de R$ 500 nos últimos 6 meses?"*
- *"Qual produto gera mais tickets de suporte?"*

---

## 6. Fluxo de Dados Integrado

```
CSVs Brutos (Google Drive)
         ↓
  [Databricks — time de Dados]
  Bronze → Silver → Gold
         ↓
  Export: CSVs Gold
         ↓
  [DEV] seed.py → SQLite / PostgreSQL
         ↓
  FastAPI Backend ←────────── PydanticAI Agent (Gemini)
         ↓                           ↑
  React Frontend ──── /api/agent/chat ┘
  (Dashboards + Chat IA)
```

---

## 7. Decisões Arquiteturais

| Decisão | Escolha | Justificativa |
|---|---|---|
| Banco local | **SQLite** | Zero config, arquivo único, fácil setup no README |
| ORM | SQLAlchemy 2 async | Async nativo, integração perfeita com FastAPI |
| Gráficos | Recharts | Leve, declarativo, fácil de customizar vs Chart.js |
| State/Cache | React Query | Cache automático de API calls, loading/error states |
| Agente | PydanticAI | Tipagem forte, tools estruturadas, integração nativa com Gemini |
| Auth | *(diferencial)* JWT | Login com perfis: `admin`, `comercial`, `suporte` |

---

## 8. Roadmap de Implementação (DEV)

### Fase 1 — Base *(Dias 1–2)*
- [ ] Setup repositório GitHub + estrutura de pastas
- [ ] Backend: FastAPI boilerplate + SQLAlchemy + modelos
- [ ] Script `seed.py` para importar CSVs Gold → SQLite
- [ ] Frontend: Vite + React + React Router + design system CSS

### Fase 2 — Core *(Dias 3–5)*
- [ ] Endpoints: Dashboard KPIs + série temporal
- [ ] Endpoints: Clientes (lista + perfil 360)
- [ ] Endpoints: Pedidos (lista + filtros)
- [ ] Frontend: página Dashboard com Recharts
- [ ] Frontend: Listagem de Clientes + Perfil 360

### Fase 3 — Funcionalidades *(Dias 6–8)*
- [ ] Endpoints: Produtos (CRUD completo)
- [ ] Endpoints: Tickets (lista + filtros)
- [ ] Frontend: páginas Produtos, Tickets, Pedidos
- [ ] Agente Text-to-SQL (PydanticAI + Gemini 2.5 Flash)
- [ ] Frontend: página Chat integrada ao agente

### Fase 4 — Diferenciais *(Dias 9–10)*
- [ ] Memória de conversa por `session_id` no agente
- [ ] Guardrails completos no agente
- [ ] Exportação CSV no frontend
- [ ] Autenticação JWT com perfis
- [ ] Testes automatizados (pytest)
- [ ] README completo com passo a passo

---

## 9. Open Questions

> [!IMPORTANT]
> **Banco local:** Confirmado **SQLite** para simplificar o setup. Mudar para PostgreSQL apenas se houver necessidade de performance em consultas complexas.

> [!IMPORTANT]
> **Contrato com o time de Dados:** O DEV precisa das tabelas Gold em **CSV com schema fixo** (ver seção 2.3). Alinhar nomes de colunas antes de iniciar o `seed.py`.

> [!NOTE]
> **Clickstream:** É diferencial. O DEV pode construir a tab de "Comportamento" no perfil 360 com dados mock enquanto o time de dados entrega o `gold_clickstream_resumo`.

> [!NOTE]
> **Autenticação:** Implementar na Fase 4 apenas se houver tempo. Não bloquear entregas do Core.

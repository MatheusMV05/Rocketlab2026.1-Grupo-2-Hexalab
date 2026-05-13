# V-Commerce CRM 360 — RocketLab 2026

## 🎯 Projeto

Sistema CRM 360 integrado com **Agente de IA (Text-to-SQL)** para varejista digital V-Commerce (50k+ clientes, 310k+ pedidos).

Converte **perguntas em linguagem natural** → **SQL estruturado** → **respostas interpretadas** com sugestões inteligentes.

---

## 📦 Módulos

### 1. 📊 Engenharia de Dados (`data-engineering/`)

**Arquitetura Medalhão:** Bronze → Silver → Gold (Databricks)

- **Bronze:** Ingestão raw de CSVs (6 tabelas)
- **Silver:** Limpeza, deduplicação, padronização
- **Gold:** Data Marts consolidados → Exporta para SQLite local

**Tabelas:**
- `dim_clientes` (60k)
- `dim_produtos` (500)
- `dim_vendedores`
- `dim_tempo`
- `fact_pedidos` (310k)
- `fact_tickets` (35k)

**Orquestração:** Databricks Workflow (agendado diariamente)

---

### 2. 🚀 Backend (`backend/`)

**Stack:** FastAPI + PydanticAI + SQLite

**Módulos:**
- **Agente Text-to-SQL** — 5 agentes LLM orquestrados
- **CRM Endpoints** — CRUD de clientes, pedidos, produtos, etc
- **Dashboard** — KPIs e métricas

**Como rodar:**
```bash
cd backend
pip install -r requirements.txt
uvicorn app.main:app --reload
```

Acesse: http://localhost:8000/docs (Swagger UI)

**Documentação:** [backend/README.md](backend/README.md)

---

### 3. 🎨 Frontend (`frontend/`)

**Stack:** React + TypeScript + Vite + Tailwind CSS

**Pages:**
- 📊 Dashboard — KPIs (receita, pedidos, ticket médio)
- 👥 Clientes — Listagem, filtros, perfil 360
- 📦 Pedidos — Histórico, status, período
- 🛍️ Produtos — Catálogo com CRUD
- 🎤 Chat Agente — Interface text-to-SQL
- 🎫 Tickets — Suporte SAC

**Como rodar:**
```bash
cd frontend
pnpm install
pnpm dev
```

Acesse: http://localhost:5173

---

## 🤖 Agente Text-to-SQL (5 Agentes)

Fluxo completo:

```
Pergunta (Natural)
    ↓
1. AgenteSeletor (filtra tabelas relevantes)
    ↓
2. AgenteDecompositor (gera SQL candidato)
    ↓
3. AgenteRefinador (valida e corrige SQL)
    ↓
    ▼ SQLite executa
    ↓
4. AgenteInterpretador (linguagem natural)
    ↓
5. AgenteSugestor (3 próximas perguntas)
    ↓
Resposta Final {sql, dados, texto, sugestões}
```

**Testar:**
```bash
cd backend
python run_test.py          # Resultado final
python run_test.py debug    # Debug detalhado
```

**Documentação:** [backend/app/agent/agentes/README.md](backend/app/agent/agentes/README.md)

---

## 🗂️ Estrutura do Projeto

```
.
├── backend/
│   ├── app/
│   │   ├── agent/           ← Agentes Text-to-SQL
│   │   ├── clientes/
│   │   ├── pedidos/
│   │   ├── produtos/
│   │   ├── dashboard/
│   │   ├── api/
│   │   └── main.py
│   ├── data/
│   ├── tests/
│   ├── run_test.py
│   └── README.md
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   │   ├── Chat/
│   │   │   ├── Dashboard/
│   │   │   ├── Clientes/
│   │   │   ├── Pedidos/
│   │   │   ├── Produtos/
│   │   │   └── Tickets/
│   │   ├── services/
│   │   └── main.tsx
│   ├── package.json
│   └── README.md
│
├── data-engineering/
│   ├── bronze/
│   ├── silver/
│   ├── gold/
│   ├── raw/
│   └── workflow.yaml
│
├── docs/
│   ├── padroes-aplicados.md
│   └── Dev/
│
└── README.md (este arquivo)
```

---

## 🚀 Quick Start

### Backend

```bash
cd backend

# Setup
echo "MISTRAL_API_KEY=sk-xxxxx" > .env
pip install -r requirements.txt

# Teste
python run_test.py

# Rodar servidor
uvicorn app.main:app --reload
```

### Frontend

```bash
cd frontend
pnpm install
pnpm dev
```

### Engenharia de Dados

Confira: [data-engineering/workflow.yaml](data-engineering/workflow.yaml)

Databricks Workflow → exporta CSV Gold → backend importa

---

## 📊 Dataset Disponível

| Tabela | Volume | Descrição |
|--------|--------|-----------|
| Clientes | 60k | Dados cadastrais (nome, email, endereço) |
| Pedidos | 310k | Histórico de compras com datas e valores |
| Produtos | 500 | Catálogo com categorias, preços, estoque |
| Vendedores | ~100 | Equipe com métricas de desempenho |
| Tickets | 35k | Interações SAC + sentimento |
| Clickstream | 500k | Logs navegação digital (opcional) |

---

## 🎯 Funcionalidades Principais

### ✅ Implementadas

- [x] Agente Text-to-SQL com 5 agentes orquestrados
- [x] Pipeline engenharia de dados (Bronze/Silver/Gold)
- [x] Backend FastAPI com endpoints CRM
- [x] Frontend React com dashboard e listagens
- [x] Perfil 360 do cliente
- [x] CRUD completo de produtos
- [x] Filtros avançados (período, categoria, status, região)
- [x] Interpretação linguagem natural de respostas
- [x] Sugestões de próximas perguntas

### 🔄 Em Desenvolvimento

- [ ] Autenticação com JWT
- [ ] Exportação CSV/Excel de relatórios
- [ ] Processamento Clickstream integrado
- [ ] Histórico de conversas no agente
- [ ] Rate limiting e caching

---

## 📚 Documentação

- **Backend:** [backend/README.md](backend/README.md)
- **Agentes:** [backend/app/agent/agentes/README.md](backend/app/agent/agentes/README.md)
- **Frontend:** [frontend/README.md](frontend/README.md)
- **Engenharia de Dados:** [data-engineering/workflow.yaml](data-engineering/workflow.yaml)
- **Padrões:** [docs/padroes-aplicados.md](docs/padroes-aplicados.md)
- **Integração Frontend-Backend:** [backend/INTEGRACAO_BACKEND.md](backend/INTEGRACAO_BACKEND.md)

---

## 🔧 Dependências Principais

### Backend
- FastAPI 0.115.0
- PydanticAI 0.0.21
- Mistral AI 1.2.6
- SQLAlchemy 2.0.36
- SQLGlot 25.34.1

### Frontend
- React 18
- TypeScript
- Tailwind CSS
- Vite

### Data Engineering
- Databricks
- PySpark
- Python 3.x

---

## 👥 Contribuindo

1. Crie branch a partir da `main`: `git checkout -b feature/sua-feature`
2. Commit com Conventional Commits: `git commit -m "feat(agente): adiciona novo agente"`
3. Abra PR para `main`
4. Após merge, delete a branch

**Padrões:** [docs/padroes-aplicados.md](docs/padroes-aplicados.md)

---

## 📋 Checklist de Entrega

- [x] Pipeline completo (Bronze → Silver → Gold)
- [x] Orquestração Databricks
- [x] Exportação Gold para SQLite
- [x] Backend FastAPI funcional
- [x] Frontend React com páginas principais
- [x] Agente Text-to-SQL (5 agentes)
- [x] Interpretação linguagem natural
- [x] Sugestões de próximas perguntas
- [x] Filtros avançados
- [x] Documentação completa
- [ ] Testes automatizados (unit + integration)
- [ ] Autenticação
- [ ] Deploy em produção

---

## 🗓️ Prazos

- **Entrega:** 19/05/2026
- **Apresentação prévia:** 19/05/2026
- **Banca final:** 22/05/2026 (15 min apresentação + 15 min Q&A)

---

## ❓ Suporte

Dúvidas? Confira a documentação específica de cada módulo:
- Agente: [backend/app/agent/agentes/README.md](backend/app/agent/agentes/README.md)
- Backend: [backend/README.md](backend/README.md)
- Frontend: [frontend/README.md](frontend/README.md)

Ou abra uma issue/PR no repositório.

---

**V-Commerce CRM 360 — RocketLab 2026 | Grupo 2 — Hexalab**
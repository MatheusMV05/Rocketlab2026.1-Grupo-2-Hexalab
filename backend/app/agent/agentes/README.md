# Agentes Text-to-SQL (Pipeline MAC-SQL)

##  Visão Geral

Este diretório concentra os **5 agentes inteligentes** da pipeline **Text-to-SQL** para o CRM 360 V-Commerce.

A pipeline converte **perguntas em linguagem natural** em **SQL estruturado**, executa no banco de dados e retorna uma **resposta interpretada em português** com **sugestões de perguntas similares**.

```
┌─────────────────────────────────────────────────────────────────┐
│  "Qual foi o melhor vendedor no último trimestre?"  (Natural)   │
└──────────────────────────┬──────────────────────────────────────┘
                           │
            ┌──────────────▼──────────────┐
            │  5-Agentes Orchestrated     │
            │  ┌─────────────────────┐    │
            │  │1. AgenteSeletor     │    │
            │  │   (filtra tabelas)  │    │
            │  └──────────┬──────────┘    │
            │             │               │
            │  ┌──────────▼──────────┐    │
            │  │2. AgenteDecompositor│    │
            │  │   (gera SQL)        │    │
            │  └──────────┬──────────┘    │
            │             │               │
            │  ┌──────────▼──────────┐    │
            │  │3. AgenteRefinador   │    │
            │  │   (valida + corrige)│    │
            │  └──────────┬──────────┘    │
            │             │               │
            │             ▼               │
            │         SQLite DB           │
            │         (executa)           │
            │             │               │
            │  ┌──────────▼──────────┐    │
            │  │4. AgenteInterpretador│   │
            │  │ (linguagem natural) │    │
            │  └──────────┬──────────┘    │
            │             │               │
            │  ┌──────────▼──────────┐    │
            │  │5. AgenteSugestor    │    │
            │  │ (próximas perguntas)│    │
            │  └─────────────────────┘    │
            │                             │
            └─────────────┬───────────────┘
                          │
        ┌─────────────────▼─────────────────┐
        │ { sql, dados, resposta,          │
        │   sugestoes, tokens, sucesso }   │
        └─────────────────────────────────┘
```

---

## 🤖 Os 5 Agentes

### 1. **AgenteSeletor** (`agente_seletor.py`)

**Objetivo:** Filtrar o esquema DDL completo do banco para incluir apenas as tabelas relevantes.

| Aspecto | Descrição |
|---------|-----------|
| **Entrada** | `esquema_completo` (DDL) + `pergunta` (texto) |
| **Saída** | `esquema_filtrado` (DDL) + `tabelas_selecionadas` (lista) |
| **LLM** | Recebe schema + pergunta, retorna tabelas relevantes |
| **Validação** | Verifica se tabelas retornadas existem no schema original (segurança) |
| **Fallback** | Se falhar, retorna schema completo |

**Por que:** Reduz o contexto enviado aos agentes seguintes, economiza tokens e melhora qualidade.

---

### 2. **AgenteDecompositor** (`agente_decompositor.py`)

**Objetivo:** Gerar o SQL inicial a partir da pergunta e do esquema filtrado.

| Aspecto | Descrição |
|---------|-----------|
| **Entrada** | `esquema_filtrado` + `pergunta` + `exemplos_fewshot` (opcional) |
| **Saída** | `sql_candidato` + `raciocinio` |
| **LLM** | Recebe contexto estruturado, gera SQL inicial |
| **Few-Shot** | Recupera exemplos similares para melhorar a geração |
| **Raciocínio** | Explica como chegou no SQL (auditoria) |

**Por que:** LLM é melhor em geração quando tem contexto focado (schema filtrado) e exemplos (few-shot).

---

### 3. **AgenteRefinador** (`agente_refinador.py`)

**Objetivo:** Validar o SQL e corrigi-lo se houver erros. Loop de até 3 tentativas.

| Aspecto | Descrição |
|---------|-----------|
| **Entrada** | `sql_candidato` + `pergunta` + `schema` + `db_path` |
| **Saída** | `sql_final` (validado) ou marca como `impossivel` |
| **Tentativas** | Máx 3: tenta executar, se falhar pede ao LLM corrigir |
| **Execução** | Testa SQL real no banco SQLite |
| **Raciocínio** | Explica se foi impossível ou por quê corrigiu |

**Por que:** Detecta erros de SQL e corrige iterativamente, garante que SQL está executável.

---

### 4. **AgenteInterpretador** (`agente_interpretador.py`)

**Objetivo:** Converter o resultado SQL em linguagem natural clara para o usuário.

| Aspecto | Descrição |
|---------|-----------|
| **Entrada** | `pergunta` + `sql_final` + `colunas` + `dados` (resultados) + `erro` (se houve) |
| **Saída** | `resposta_natural` (texto em português) |
| **LLM** | Recebe dados estruturados, gera narrativa clara |
| **Contexto** | Sabe a pergunta original para adaptar a resposta |
| **Segurança** | Não inventa dados, relata erros honestamente |

**Por que:** Transforma tabelas em narrativa compreensível para usuários não-técnicos.

---

### 5. **AgenteSugestor** (`agente_sugestor.py`)

**Objetivo:** Sugerir 3 próximas perguntas analíticas baseado no contexto.

| Aspecto | Descrição |
|---------|-----------|
| **Entrada** | `pergunta` (original) + `sql_gerado` + `schema` + `amostra_resultado` |
| **Saída** | `sugestoes` (lista de 3 perguntas) |
| **LLM** | Entende contexto da pergunta e dos dados, propõe follow-ups |
| **Raciocínio** | Explica qual tabela principal e tabelas adjacentes considera |

**Por que:** Melhora UX — usuário não precisa pensar na próxima pergunta, só clicar.

---

##  Fluxo Completo (Orquestrador)

```python
Orquestrador.responder(pergunta: str) → ResultadoOrquestrador:

1. Validação (Guardrail)
   ├─ Verifica se pergunta é válida
   └─ Rejeita se for fora do escopo

2. Carregamento de Schema
   └─ Lê DDL do banco SQLite

3. AgenteSeletor.run()
   ├─ Input: esquema_completo, pergunta
   └─ Output: esquema_filtrado, tabelas_selecionadas

4. Recuperação Few-Shot (opcional)
   ├─ Busca exemplos similares
   └─ Passa para o Decompositor

5. AgenteDecompositor.run()
   ├─ Input: esquema_filtrado, pergunta, exemplos
   └─ Output: sql_candidato, raciocinio

6. AgenteRefinador.run() - Loop de até 3 tentativas
   ├─ Tenta executar SQL no banco
   ├─ Se falhar: pede ao LLM corrigir
   └─ Output: sql_final, sucesso, impossivel, ultimo_erro

7. Execução SQL
   ├─ Se sql_final é válido:
   │  ├─ Executa no SQLite
   │  └─ Captura dados + colunas
   └─ Senão: dados = []

8. AgenteInterpretador.run()
   ├─ Input: pergunta, sql_final, dados, colunas, erro
   └─ Output: resposta_natural

9. AgenteSugestor.run()
   ├─ Input: pergunta, sql_gerado, schema, amostra
   └─ Output: sugestoes (3 perguntas)

10. Retorna ResultadoOrquestrador
    └─ pergunta, sql_final, dados, resposta_natural, sugestoes, tokens_totais
```

---

## 📁 Estrutura de Arquivos

```
app/agent/agentes/
├── agente_base.py              # Classe base (LLM client, _render, _call_llm)
├── agente_seletor.py           # Agente 1 (filtra tabelas)
├── agente_decompositor.py      # Agente 2 (gera SQL)
├── agente_refinador.py         # Agente 3 (valida e corrige)
├── agente_interpretador.py     # Agente 4 (linguagem natural)
├── agente_sugestor.py          # Agente 5 (próximas perguntas)
├── refinador_parser.py         # Utilidade para extrair SQL/raciocinio
├── __init__.py                 # Exports dos agentes
└── README.md                   # Este arquivo
```

---

##  Como Testar

### Modo Normal (via Orquestrador)
```bash
cd backend
python run_test.py
```

Saída: pergunta → SQL → dados → resposta natural → sugestões.

### Modo Debug (cada agente separado)
```bash
python run_test.py debug
```

Saída: detalhado para cada etapa (schema filtrado, few-shot recuperados, tentativas de refinamento, etc).

---

##  Entrada e Saída de Cada Agente

### AgenteSeletor

```python
# Input
{
    "esquema_completo": "CREATE TABLE clientes (...)",
    "pergunta": "Qual foi o melhor vendedor?"
}

# Output (ResultadoSeletor)
{
    "esquema_filtrado": "CREATE TABLE vendedores (...)",
    "tabelas_selecionadas": ["vendedores", "pedidos"],
    "tokens_usados": 450
}
```

### AgenteDecompositor

```python
# Input
{
    "esquema_filtrado": "CREATE TABLE vendedores (...)",
    "pergunta": "Qual foi o melhor vendedor?"
}

# Output (ResultadoDecompositor)
{
    "sql": "SELECT vendedor, SUM(quantidade) FROM pedidos GROUP BY vendedor",
    "raciocinio": "Agrupei por vendedor e somei quantidades...",
    "tokens_usados": 800
}
```

### AgenteRefinador

```python
# Input
{
    "candidate_sql": "SELECT vendedor, SUM(quantidade) FROM pedidos...",
    "question": "Qual foi o melhor vendedor?",
    "filtered_schema": "CREATE TABLE vendedores (...)",
    "db_path": "/path/to/database.db"
}

# Output (ResultadoRefinador)
{
    "sql": "SELECT vendedor, SUM(quantidade) FROM fat_pedidos...",  # Corrigido
    "raciocinio": "Corrigi de 'pedidos' para 'fat_pedidos'",
    "sucesso": True,
    "impossivel": False,
    "tentativas": 2,
    "ultimo_erro": "table pedidos not found",
    "tokens_usados": 1200
}
```

### AgenteInterpretador

```python
# Input
{
    "pergunta": "Qual foi o melhor vendedor?",
    "sql_final": "SELECT vendedor, total FROM ...",
    "colunas": ["vendedor", "total"],
    "dados": [("João", 1500), ("Maria", 1200)],
    "erro": None
}

# Output (ResultadoInterpretador)
{
    "resposta": "O melhor vendedor foi João com 1500 unidades vendidas, seguido por Maria com 1200.",
    "tokens_usados": 300
}
```

### AgenteSugestor

```python
# Input
{
    "pergunta": "Qual foi o melhor vendedor?",
    "sql_gerado": "SELECT ...",
    "schema": "CREATE TABLE ...",
    "amostra_resultado": "vendedor: João, total: 1500"
}

# Output (ResultadoSugestor)
{
    "sugestoes": [
        "Qual foi a receita total de João?",
        "Como foi a evolução mensal de vendas?",
        "Qual produto João vendeu mais?"
    ],
    "tabela_principal": "fat_pedidos",
    "tabelas_adjacentes": ["dim_vendedores", "dim_produtos"],
    "tokens_usados": 500
}
```

---

##  Decisões de Arquitetura

- **Agentes Sequenciais:** Cada agente recebe output do anterior, simplifica orquestração.
- **LLM: Mistral:** Escolhido por custo-benefício e disponibilidade de API.
- **Few-Shot Retrieval:** Recupera exemplos similares para melhorar SQL generation.
- **Validação de SQL:** Agente refinador testa SQL real no banco antes de confirmar.
- **Loop de Retry:** Refinador tenta corrigir SQL automaticamente (máx 3 vezes).
- **Português:** Todos prompts, variáveis, nomes em português para clareza.
- **Type Safety:** Dataclasses + Pydantic para contratos entre agentes.

---

##  Próximos Passos (possiveis diferenciais se sobrar tempo)

- [ ] Caching de esquema para reduzir tokens
- [ ] Melhor retrieval de few-shot (MMR, similarity threshold)
- [ ] Guardrail mais robusto (detecção de SQL injection)
- [ ] Monitoring de qualidade (métricas de sucesso)

---

##  Referências

- **PydanticAI**: Framework para agentes LLM com tipos estruturados
- **Mistral API**: https://console.mistral.ai/
- **SQLite**: Database local para testes
- **Jinja2**: Templates para prompts
- **Few-Shot Learning**: https://en.wikipedia.org/wiki/Few-shot_learning



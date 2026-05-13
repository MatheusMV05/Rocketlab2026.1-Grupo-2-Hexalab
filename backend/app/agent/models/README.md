# Modelos de Dados (Agentes)

Este diretório contém os modelos de dados centrais que padronizam a comunicação e o retorno dos **5 agentes** de Inteligência Artificial no pipeline Text-to-SQL.

A utilização de modelos fortemente tipados (através de Pydantic e Dataclasses) é fundamental para garantir **previsibilidade, segurança e integração** natural com o framework `PydanticAI`.

---

##  Estrutura de Arquivos

- `resultado.py` — Centraliza todas as estruturas de dados que representam as **saídas (outputs)** dos agentes.

---

##  Detalhamento dos Modelos (`resultado.py`)

O arquivo é dividido em **dois tipos** de estruturas:

### Tipo 1: Modelos LLM (Pydantic + BaseModel)
Passadas como `result_type` no PydanticAI. Forçam a IA a estruturar a resposta em JSON.

**Vantagem:** Nunca recebemos texto solto — sempre JSON validado.

### Tipo 2: Modelos da Aplicação (Dataclasses)
Retornos oficiais dos agentes. Combinam saída estruturada + metadados (tokens, status, etc).

**Vantagem:** Interface limpa e tipada para os callers.

---

##  Os 5 Agentes e Seus Modelos

### 1. **AgenteSeletor** — Filtra Tabelas

| Nível | Modelo | Campos |
|-------|--------|--------|
| **LLM (Pydantic)** | `ResultadoSeletorLLM` | `blocos_ddl: list[str]` |
| **App (Dataclass)** | `ResultadoSeletor` | `esquema_filtrado, tabelas_selecionadas, tokens_usados` |

**Fluxo:**
1. LLM retorna `ResultadoSeletorLLM` (JSON com blocos DDL)
2. Agente converte para `ResultadoSeletor` (com validação)
3. Retorna para o orquestrador

**Exemplo:**
```python
# O que o LLM retorna (JSON)
{
  "blocos_ddl": [
    "CREATE TABLE dim_vendedores (...)",
    "CREATE TABLE fact_pedidos (...)"
  ]
}

# O que a aplicação recebe (Dataclass)
ResultadoSeletor(
  esquema_filtrado="CREATE TABLE dim_vendedores (...)\nCREATE TABLE fact_pedidos (...)",
  tabelas_selecionadas=["dim_vendedores", "fact_pedidos"],
  tokens_usados=450
)
```

---

### 2. **AgenteDecompositor** — Gera SQL

| Nível | Modelo | Campos |
|-------|--------|--------|
| **LLM (Pydantic)** | `ResultadoDecompositorLLM` | `reasoning: str, sql: str` |
| **App (Dataclass)** | `ResultadoDecompositor` | `sql, raciocinio, tokens_usados` |

**Fluxo:**
1. LLM retorna `ResultadoDecompositorLLM` (JSON com SQL + raciocínio)
2. Agente converte para `ResultadoDecompositor`
3. Passa para refinador

**Exemplo:**
```python
# JSON do LLM
{
  "reasoning": "Agrupei por vendedor e somei quantidade...",
  "sql": "SELECT vendedor, SUM(quantidade) FROM fact_pedidos GROUP BY vendedor"
}

# Dataclass da app
ResultadoDecompositor(
  sql="SELECT vendedor, SUM(quantidade) FROM fact_pedidos GROUP BY vendedor",
  raciocinio="Agrupei por vendedor e somei quantidade...",
  tokens_usados=800
)
```

---

### 3. **AgenteRefinador** — Valida e Corrige SQL

| Nível | Modelo | Campos |
|-------|--------|--------|
| **LLM (Pydantic)** | `ResultadoRefinadorLLM` | `reasoning: str, sql: str` |
| **App (Dataclass)** | `ResultadoRefinador` | `sql, raciocinio, sucesso, impossivel, tentativas, ultimo_erro, tokens_usados` |

**Fluxo:**
1. Tenta executar SQL no banco
2. Se falhar, pede ao LLM corrigir (até 3 vezes)
3. LLM retorna `ResultadoRefinadorLLM` (SQL corrigido)
4. Agente retorna `ResultadoRefinador` (com status de sucesso)

**Exemplo:**
```python
# JSON do LLM (se precisou corrigir)
{
  "reasoning": "A tabela correta é 'fat_pedidos', não 'pedidos'",
  "sql": "SELECT vendedor, SUM(quantidade) FROM fat_pedidos GROUP BY vendedor"
}

# Dataclass (após refinamento bem-sucedido)
ResultadoRefinador(
  sql="SELECT vendedor, SUM(quantidade) FROM fat_pedidos GROUP BY vendedor",
  raciocinio="A tabela correta é 'fat_pedidos'...",
  sucesso=True,
  impossivel=False,
  tentativas=2,
  ultimo_erro=None,
  tokens_usados=1200
)
```

---

### 4. **AgenteInterpretador** — Linguagem Natural

| Nível | Modelo | Campos |
|-------|--------|--------|
| **LLM (Pydantic)** | `ResultadoInterpretadorLLM` | `resposta: str` |
| **App (Dataclass)** | `ResultadoInterpretador` | `resposta, tokens_usados` |

**Fluxo:**
1. Recebe dados do SQL (resultado tabular)
2. LLM gera narrativa em português
3. Retorna `ResultadoInterpretador`

**Exemplo:**
```python
# JSON do LLM
{
  "resposta": "O vendedor com melhor desempenho foi João com 1.500 vendas, seguido por Maria com 1.200."
}

# Dataclass
ResultadoInterpretador(
  resposta="O vendedor com melhor desempenho foi João com 1.500 vendas, seguido por Maria com 1.200.",
  tokens_usados=300
)
```

---

### 5. **AgenteSugestor** — Próximas Perguntas

| Nível | Modelo | Campos |
|-------|--------|--------|
| **LLM (Pydantic)** | `ResultadoSugestorLLM` | `perguntas: list[str]` (exatamente 3) |
| **App (Dataclass)** | `ResultadoSugestor` | `sugestoes, tabela_principal, tabelas_adjacentes, tokens_usados` |

**Fluxo:**
1. LLM gera 3 perguntas contextualizadas
2. Agente extrai tabelas relacionadas
3. Retorna `ResultadoSugestor`

**Exemplo:**
```python
# JSON do LLM
{
  "perguntas": [
    "Qual foi a receita total desses vendedores?",
    "Como foi a evolução mensal de vendas?",
    "Qual produto cada um vendeu mais?"
  ]
}

# Dataclass
ResultadoSugestor(
  sugestoes=[
    "Qual foi a receita total desses vendedores?",
    "Como foi a evolução mensal de vendas?",
    "Qual produto cada um vendeu mais?"
  ],
  tabela_principal="fact_pedidos",
  tabelas_adjacentes=["dim_vendedores", "dim_produtos"],
  tokens_usados=500
)
```

---

##  Resumo: 10 Modelos Total

### Modelos LLM (5 classes Pydantic)
- `ResultadoSeletorLLM`
- `ResultadoDecompositorLLM`
- `ResultadoRefinadorLLM`
- `ResultadoInterpretadorLLM`
- `ResultadoSugestorLLM`

### Modelos App (5 classes Dataclass)
- `ResultadoSeletor`
- `ResultadoDecompositor`
- `ResultadoRefinador`
- `ResultadoInterpretador`
- `ResultadoSugestor`

---

##  Boas Práticas

### 1. Descrições no `Field()` — IA Lê Isso
As strings em `Field(description=...)` **não são comentários**. A IA as lê para preencher campos.

```python
#  Bom
class ResultadoInterpretadorLLM(BaseModel):
    resposta: str = Field(
        description="Resposta final em linguagem natural clara e objetiva para o usuario, sem invenções de dados."
    )

#  Ruim
class ResultadoInterpretadorLLM(BaseModel):
    resposta: str  # Sem description — IA não recebe instrução clara
```

### 2. Separar LLM do Aplicativo
Sempre mantenha duas camadas:
- **LLM layer:** O que entra do PydanticAI (JSON puro)
- **App layer:** O que a aplicação usa (tipado, validado, com metadados)

```python
#  Bom — Duas camadas
@agent.result_type
class ResultadoSeletorLLM(BaseModel):
    blocos_ddl: list[str]  # Resposta do LLM

def run(self, ...) -> ResultadoSeletor:
    resultado_llm = agent.run_sync(...)  # Pega JSON
    return ResultadoSeletor(
        esquema_filtrado=...,  # Processa e retorna
        tokens_usados=...,
    )

#  Ruim — Sem separação
def run(self, ...) -> dict:
    return agent.run_sync(...)  # Retorna JSON solto
```

### 3. Sempre Incluir `tokens_usados`
Para monitoramento de custos e debugging.

```python
@dataclass
class ResultadoAgente:
    resposta: str
    tokens_usados: int  # SEMPRE incluir
```

### 4. Se Adicionar Novo Agente
1. Crie `ResultadoNovoAgenteLLM` (Pydantic)
2. Crie `ResultadoNovoAgente` (Dataclass)
3. Adicione aqui neste arquivo
4. Exporte em `__init__.py`

---

##  Integração com Agentes

Cada agente segue este padrão:

```python
class AgenteNovo(AgenteBase):
    def run(self, ...) -> ResultadoNovoAgente:
        # 1. Monta prompt
        prompt = self._render("novo", ...)
        
        # 2. Chama LLM (retorna ResultadoNovoAgenteLLM)
        resultado_llm = agent.run_sync(prompt, deps=deps)
        
        # 3. Extrai dados
        uso = resultado_llm.usage()
        
        # 4. Retorna Dataclass da app
        return ResultadoNovoAgente(
            campo1=resultado_llm.data.campo1,
            tokens_usados=uso.total_tokens if uso else 0,
        )
```

---

##  Checklist para Novos Modelos

- [ ] `ResultadoNovoAgenteLLM` criado (Pydantic)
- [ ] `ResultadoNovoAgente` criado (Dataclass)
- [ ] Descrições claras em `Field()`
- [ ] `tokens_usados` incluído
- [ ] Exemplo JSON documentado
- [ ] Exportado em `__init__.py`
- [ ] Usado no agente correspondente

---

**Última atualização:** Maio 2026 | V-Commerce CRM 360

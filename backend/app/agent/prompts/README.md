# prompts/ — Templates de Prompts Jinja2

## 🎯 Objetivo

Este diretório contém os **5 templates Jinja2** usados pelos agentes da pipeline Text-to-SQL para gerar instruções ao modelo de linguagem (Mistral).

**Benefícios da separação:**
-  Iteração de wording sem abrir código Python
-  Git diffs claros (linguagem vs lógica separadas)
-  Testes isolados dos templates
-  Centralização de prompts (sem hardcoding em `.py`)
---

##  Os 5 Prompts

### 1. **seletor.j2** — Filtra Tabelas Relevantes

**Agente:** `AgenteSeletor`  
**Entrada:** Schema DDL completo + pergunta  
**Saída:** DDL filtrado (apenas tabelas relevantes)

| Variável | Tipo | Descrição |
|----------|------|-----------|
| `{{ schema }}` | str | Schema completo do banco (CREATE TABLE statements) |
| `{{ question }}` | str | Pergunta do usuário em português |

**Exemplo de render:**
```jinja2
Você é o Agente Seletor...
Esquema completo: {{ schema }}
Pergunta: {{ question }}
```

---

### 2. **decompositor.j2** — Gera SQL Candidato

**Agente:** `AgenteDecompositor`  
**Entrada:** Schema filtrado + pergunta + exemplos few-shot (opcional)  
**Saída:** SQL + raciocínio (2 campos JSON)

| Variável | Tipo | Descrição |
|----------|------|-----------|
| `{{ schema_filtrado }}` | str | DDL já filtrado pelo Seletor |
| `{{ question }}` | str | Pergunta original |
| `{{ exemplos }}` | list | Few-shot exemplos (opcional) |

**Iteração de few-shots:**
```jinja2
{% if exemplos %}
Exemplos para referência:
{% for ex in exemplos %}
P: {{ ex.question }}
SQL: {{ ex.sql }}
{% endfor %}
{% endif %}
```

---

### 3. **refinador.j2** — Valida e Corrige SQL

**Agente:** `AgenteRefinador`  
**Entrada:** SQL candidato + schema + pergunta + erro de execução (se houver)  
**Saída:** SQL corrigido + raciocínio

| Variável | Tipo | Descrição |
|----------|------|-----------|
| `{{ schema }}` | str | Schema para referência de correção |
| `{{ question }}` | str | Pergunta original (contexto) |
| `{{ previous_sql }}` | str | SQL que falhou |
| `{{ execution_result }}` | str | Erro ou resultado da execução |

**Seção condicional (só mostra se houve erro):**
```jinja2
{% if execution_result %}
O SQL anterior produziu o seguinte erro:
{{ execution_result }}

Corrija o SQL para resolver o problema.
{% endif %}
```

---

### 4. **interpretador.j2** — Gera Resposta em Linguagem Natural

**Agente:** `AgenteInterpretador`  
**Entrada:** SQL final + dados resultados + pergunta + erro (se houver)  
**Saída:** Resposta em português (1 campo JSON)

| Variável | Tipo | Descrição |
|----------|------|-----------|
| `{{ question }}` | str | Pergunta original do usuário |
| `{{ sql_final }}` | str | SQL validado que foi executado |
| `{{ colunas }}` | list | Nomes das colunas do resultado |
| `{{ dados }}` | list[list] | Dados retornados (tabular) |
| `{{ erro }}` | str \| None | Erro, se houve |

**Exemplo de iteração:**
```jinja2
{% if dados %}
Os resultados foram:
{% for linha in dados[:3] %}
  {{ linha }}
{% endfor %}
{% if dados|length > 3 %}
  ... e {{ dados|length - 3 }} mais linhas
{% endif %}
{% else %}
A query retornou 0 resultados.
{% endif %}
```

---

### 5. **sugestor.j2** — Gera Próximas Perguntas

**Agente:** `AgenteSugestor`  
**Entrada:** Pergunta original + SQL gerado + schema + amostra resultado  
**Saída:** 3 perguntas sugeridas (JSON com lista)

| Variável | Tipo | Descrição |
|----------|------|-----------|
| `{{ question }}` | str | Pergunta original (contexto) |
| `{{ sql_gerado }}` | str | SQL executado com sucesso |
| `{{ schema }}` | str | Schema disponível (opcional) |
| `{{ amostra_resultado }}` | str | Primeiras linhas dos resultados |

**Exemplo:**
```jinja2
Com base na pergunta "{{ question }}" e nos resultados:
{{ amostra_resultado }}

Sugira 3 próximas perguntas analíticas que façam sentido.
```

---

## Como Usar (Para Agentes)

Cada agente chama `_render()` (método de `AgenteBase`):

```python
# Dentro do agente
prompt_sistema = self._render(
    "seletor",  # Nome do template (sem .j2)
    schema=esquema_completo,
    question=pergunta,
)

# Resultado: prompt pronto para enviar ao LLM
```

O método `_render()`:
1. Carrega o template `.j2`
2. Injeta variáveis
3. Renderiza com Jinja2
4. Retorna string pronta

---

##  Estrutura Recomendada do Template

```jinja2
{# ---------------------------------------------------------------------------
   seletor.j2
   
   Propósito: Filtrar schema completo, retornando DDL apenas das tabelas
   necessárias para responder à pergunta.
   
   Saída esperada: CREATE TABLE statements válidos. Sem texto extra.
   
   Histórico:
   - v1 (original): Versão inicial
   - v2 (mai/2026): Adicionado aviso sobre não inventar tabelas
   --------------------------------------------------------------------------- #}

Você é o Agente Seletor em um pipeline de geração de SQL.

Tarefa:
- Analisar o schema DDL completo e a pergunta do usuário
- Filtrar e manter APENAS as tabelas estritamente necessárias
- Preservar formato DDL original e válido
- NÃO inventar colunas ou tabelas

Schema:
<schema>
{{ schema }}
</schema>

Pergunta do usuário:
<question>
{{ question }}
</question>

Retorne somente blocos CREATE TABLE copiados do schema de entrada.
Não adicione nada extra.
```

**Padrões importantes:**
-  Comentário de cabeçalho com propósito, histórico, saída esperada
-  Tags XML para delimitar seções (`<schema>`, `<question>`, etc)
-  Instruções explícitas de formato esperado
-  Comentário Jinja2 documentando decisões (`{# ... #}`)

---

##  Recursos Jinja2 Disponíveis

### Condicionais

```jinja2
{% if exemplos %}
  Exemplos recuperados:
  {% for ex in exemplos %}
    {{ ex.question }}
  {% endfor %}
{% endif %}
```

### Loops

```jinja2
{% for linha in dados %}
  - {{ linha[0] }}: {{ linha[1] }}
{% endfor %}
```

### Filtros

```jinja2
{{ pergunta | upper }}      {# Maiúsculas #}
{{ lista | length }}        {# Tamanho #}
{{ valor | default("N/A") }} {# Padrão #}
```

### Comentários (invisíveis)

```jinja2
{# Este comentário não aparece no prompt #}
{# Muito útil para documentar decisões #}
```

---

##  Checklist: Modificando um Prompt

Antes de fazer commit de mudanças:

- [ ] Template renderiza sem erros
- [ ] Variáveis injetadas aparecem corretamente
- [ ] Histórico de alterações atualizado no cabeçalho
- [ ] Nenhuma hardcoded sensitive data (API keys, etc)
- [ ] Instruções de formato são explícitas
- [ ] Não há variáveis `undefined` (Jinja2 `StrictUndefined`)
- [ ] Few-shots ou exemplos têm seções condicionais (`{% if %}`)
- [ ] Testes unitários atualizados (se houver)

---

##  Testando Prompts Isoladamente

Teste sem instanciar agente ou LLM:

```python
from jinja2 import Environment, FileSystemLoader, StrictUndefined
import pytest

def test_seletor_j2_renders():
    """Valida se template seletor.j2 renderiza com variáveis básicas."""
    env = Environment(
        loader=FileSystemLoader("app/agent/prompts"),
        undefined=StrictUndefined,
    )
    rendered = env.get_template("seletor.j2").render(
        schema="CREATE TABLE clientes (id INTEGER);",
        question="Quantos clientes temos?",
    )
    assert "CREATE TABLE clientes" in rendered
    assert "Quantos clientes temos?" in rendered

def test_seletor_j2_requires_question():
    """Valida que template falha se variável obrigatória faltar."""
    env = Environment(
        loader=FileSystemLoader("app/agent/prompts"),
        undefined=StrictUndefined,
    )
    with pytest.raises(jinja2.UndefinedError):
        env.get_template("seletor.j2").render(schema="...")
        # 'question' não foi passada → erro imediato
```

---

##  Matriz: Templates × Agentes

| Template | Agente | Entrada | Saída |
|----------|--------|---------|-------|
| seletor.j2 | AgenteSeletor | schema + question | DDL filtrado |
| decompositor.j2 | AgenteDecompositor | schema_filtrado + question + exemplos | SQL + reasoning |
| refinador.j2 | AgenteRefinador | schema + question + sql + erro | SQL corrigido + reasoning |
| interpretador.j2 | AgenteInterpretador | question + sql + dados + erro | resposta (português) |
| sugestor.j2 | AgenteSugestor | question + sql + schema + amostra | 3 perguntas |

---

##  Boas Práticas

### 1. Nunca Hardcode Prompts em `.py`
```python
#  Errado
prompt = "Você é um agente que..."  # Hardcoded!

#  Certo
prompt = self._render("seletor", schema=..., question=...)
```

### 2. Sempre Documente Mudanças
```jinja2
{# 
Histórico:
- v1: Versão inicial
- v2 (mai/26): Adicionado aviso de não inventar tabelas
- v3: Melhorou instrução de raciocínio
#}
```

### 3. Use Seções Condicionais para Few-Shots
```jinja2
{% if exemplos %}
  Exemplos:
  {% for ex in exemplos %}
    {{ ex.sql }}
  {% endfor %}
{% endif %}
```

Assim o template funciona com OU SEM exemplos.

### 4. Seja Explícito sobre Formato de Saída
```jinja2
Retorne EXATAMENTE neste formato JSON:
{
  "reasoning": "...",
  "sql": "..."
}

Nada além disso. Sem explicações adicionais.
```

---

##  Suporte

**Prompt não renderiza?**
- Confira variáveis em `_render()` call
- Use `StrictUndefined` para erro imediato

**Resultado errado do LLM?**
- Mude wording do template
- Adicione exemplos few-shot
- Seja mais explícito sobre formato esperado

**Quer adicionar novo prompt?**
- Crie `novo_agente.j2`
- Documente propósito no cabeçalho
- Chame `self._render("novo_agente", ...)` no agente
- Adicione testes

---
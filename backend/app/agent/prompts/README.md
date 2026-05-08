# prompts/

## Objetivo

Este diretório contém templates de prompts (Jinja2) usados pelos agentes da
pipeline para gerar instruções ao modelo de linguagem. Os templates aqui
presentes destinam-se a testes e avaliação de comportamento do LLM; os
system prompts finais que serão usados em produção devem ser definidos e
validados na etapa de integração.

Separar os prompts em arquivos `.j2` independentes do código Python permite
que o wording seja iterado sem abrir nenhum agente — e garante que mudanças
de linguagem e mudanças de lógica apareçam em diffs separados no Git.

---

## Uso

- Os templates são renderizados via Jinja2 por cada agente (ver `AgenteBase._render`).
- Mantenha os templates focados: forneça apenas as variáveis necessárias
  (`schema`, `question`, `examples`, etc.).
- **Nunca coloque strings de prompt dentro de arquivos `.py`** — toda
  linguagem natural fica aqui; toda lógica fica nos agentes.

### Variáveis por template

| Template | Variáveis injetadas |
|---|---|
| `selector.j2` | `{{ schema }}`, `{{ question }}`, `{{ schema_summary }}` |
| `decomposer.j2` | `{{ schema }}`, `{{ question }}`, `{{ examples }}` |
| `refiner.j2` | `{{ schema }}`, `{{ question }}`, `{{ candidate_sql }}` |

Se uma variável referenciada no template não for passada na chamada,
o ambiente Jinja2 está configurado com `StrictUndefined` e vai lançar
`UndefinedError` imediatamente — falha explícita em vez de prompt
silenciosamente incompleto chegando ao LLM.

---

## Estrutura recomendada do template

```jinja2
{# ---------------------------------------------------------------------------
   selector.j2
   Propósito: filtrar o schema completo, retornando apenas as tabelas e
   colunas necessárias para responder à pergunta do usuário.
   Saída esperada: DDL válido (CREATE TABLE statements). Sem texto adicional.
   Alterações: descreva aqui o que mudou e por quê.
   --------------------------------------------------------------------------- #}

Você é o Agente Seletor em um pipeline de geração de SQL.

Sua tarefa:
- Analisar o esquema DDL completo do banco de dados e a pergunta do usuário.
- Filtrar e manter apenas as tabelas, colunas e restrições (constraints) estritamente necessárias para responder à pergunta.
- Preservar o formato SQL DDL original e válido.
- Preservar os nomes das tabelas e colunas exatamente como aparecem no esquema, sem traduções ou abreviações.
- Usar os tipos e nomes das colunas da tabela para garantir precisão na resposta.

Esquema completo de entrada:
{{ schema }}
PERGUNTA DO USUÁRIO: {{ question }}

Formato exigido (exemplo):
```
CREATE TABLE customers (
	id INTEGER PRIMARY KEY,
	name TEXT,
	email TEXT
);
```

Importante: o texto acima é um exemplo do formato — a sua saída deve conter somente blocos `CREATE TABLE` copiados/modificados a partir do esquema de entrada, nunca linhas ou identificadores inventados.

```

**Regras de estrutura:**

- **Comentário de cabeçalho** (`{# ... #}`) explicando propósito, saída esperada
  e histórico de alterações. Comentários Jinja2 não aparecem no prompt renderizado.
- **Instruções de saída explícitas** — o LLM deve saber exatamente o formato
  esperado (ex.: `Reasoning: [...]\nSQL: [...]` para o Decompositor).
- **Tags XML para delimitar seções** (`<schema>`, `<question>`, `<examples>`) —
  ajudam o modelo a distinguir contextos e facilitam o parse do output.
- **Exemplos few-shot quando aplicável** — use bloco `{% for %}` para
  iterar dinamicamente (ver seção abaixo).

---

## Recursos Jinja2 disponíveis

### Iteração dinâmica de few-shots

Em vez de duplicar exemplos manualmente, itere a lista injetada pelo agente:

```jinja2
{% if examples %}
Use the following examples as reference:

{% for ex in examples %}
Question: {{ ex.question }}
SQL: {{ ex.sql }}
{% endfor %}
{% endif %}
```

O bloco `{% if examples %}` garante que a seção só aparece quando exemplos
foram fornecidos — o mesmo template funciona com e sem few-shots.

### Seções condicionais

Use `{% if %}` para adaptar o prompt ao contexto da chamada sem duplicar templates:

```jinja2
{% if execution_result %}
The previous SQL produced the following result or error:
{{ execution_result }}
{% endif %}
```

### Comentários invisíveis

Use `{# ... #}` para documentar o template. Esses comentários são removidos
pelo Jinja2 antes de o prompt ser enviado ao LLM — não consomem tokens.

```jinja2
{# Não remover a instrução abaixo: modelos tendem a adicionar markdown
   em volta do SQL quando não há instrução explícita de formato. #}
Return ONLY the SQL query. No backticks. No explanation.
```

---

## Testando templates isoladamente

Por serem arquivos separados do código, os templates podem ser testados
sem instanciar nenhum agente ou mockar o LLM:

```python
from jinja2 import Environment, FileSystemLoader, StrictUndefined

def test_selector_prompt_renders_schema():
    env = Environment(
      loader=FileSystemLoader("prompts/"),
      undefined=StrictUndefined,
    )
    rendered = env.get_template("selector.j2").render(
        schema="CREATE TABLE orders (id INTEGER PRIMARY KEY);",
        question="How many orders?",
    )
    assert "CREATE TABLE orders" in rendered
    assert "How many orders?" in rendered

def test_selector_prompt_raises_on_missing_variable():
    env = Environment(loader=FileSystemLoader("prompts/"), undefined=StrictUndefined)
    with pytest.raises(UndefinedError):
        env.get_template("selector.j2").render(schema="...")
        # 'question' não foi passada → UndefinedError imediato
```

---

## Integração

Antes de subir para produção, coordene a versão final do system prompt
com a equipe.

O histórico de alterações de cada template deve ser rastreável pelo Git —
por isso mantenha um comentário de cabeçalho `{# ... #}` com a descrição
da última mudança e sua motivação.

---

## Contribuição

- Ao modificar um template, atualize o comentário de cabeçalho `{# ... #}`
  explicando o que mudou e por quê.
- Adicione ou atualize testes que validem o formato de saída renderizado.
- Nunca remova uma variável do template sem verificar se ela ainda é
  passada pelo agente correspondente — `StrictUndefined` vai capturar em
  tempo de execução, mas um teste unitário captura antes.
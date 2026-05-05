# prompts/

## Objetivo

Este diretório concentra os templates Jinja2 usados pelos agentes de SQL da pipeline. A lógica continua nos agentes em Python; aqui fica apenas a linguagem natural do prompt.

Separar prompt de código facilita evoluir o texto sem alterar a implementação e mantém diffs de linguagem separados das mudanças de comportamento.

## Templates existentes

### `seletor.j2`

Usado pelo [Agente Seletor](../agentes/agente_seletor.py).

Objetivo do prompt:
- Receber o schema completo e uma visão resumida das tabelas.
- Filtrar e devolver somente os blocos `CREATE TABLE` realmente relevantes.
- Nunca inventar tabelas, colunas ou tipos.
- Preservar o DDL válido no formato original.

Variáveis injetadas:
- `schema`
- `question`
- `schema_summary`

Formato de saída esperado:
- Apenas DDL filtrado.
- Sem explicações, introduções ou texto adicional.

### `decompositor.j2`

Usado pelo agente de decomposição da consulta.

Objetivo do prompt:
- Receber um schema já filtrado, a pergunta do usuário e exemplos opcionais.
- Quebrar perguntas complexas em raciocínio estruturado.
- Produzir a resposta em duas tags obrigatórias: `<reasoning>` e `<sql>`.
- Manter a consulta apenas em leitura, usando `SELECT`.

Variáveis injetadas:
- `schema`
- `question`
- `examples`

Formato de saída esperado:
```xml
<reasoning>
...
</reasoning>
<sql>
SELECT ...
</sql>
```

### `refiner.j2`

Usado pelo agente refinador de QA/debug da consulta.

Objetivo do prompt:
- Receber a consulta candidata, o schema e a pergunta.
- Validar e corrigir problemas de sintaxe, nomes de colunas, joins e filtros.
- Retornar `IMPOSSIVEL` quando o schema não permitir responder à pergunta.
- Manter a resposta final nas tags `<reasoning>` e `<sql>`.

Variáveis injetadas:
- `schema`
- `question`
- `candidate_sql`

Formato de saída esperado:
```xml
<reasoning>
...
</reasoning>
<sql>
SELECT ...
</sql>
```

## Regras de uso

- Os templates são carregados por `AgenteBase._render` via Jinja2.
- O ambiente usa `StrictUndefined`; se uma variável citada no template não for passada, a renderização falha imediatamente.
- Se um template mudar, atualize também o comentário de cabeçalho `{# ... #}` do próprio `.j2` para manter o histórico da mudança perto do prompt.
- Nunca mova strings de prompt para arquivos `.py`.

## Observações sobre os templates atuais

- O seletor já inclui uma seção opcional de `<schema_summary>` quando `schema_summary` é fornecido.
- O decompositor aceita exemplos em loop Jinja2 via `examples`.
- O refinador usa `candidate_sql` como entrada da consulta a ser testada e corrigida.
- As tags XML são parte do contrato do prompt e devem ser preservadas.

## Teste rápido

Se precisar validar um template isoladamente, renderize-o com as mesmas variáveis passadas pelo agente correspondente e confirme que a saída segue o formato esperado.

# Agent: Selector (MAC-SQL)

Descrição
---------
O `SelectorAgent` é o primeiro componente da pipeline MAC-SQL. Recebe o DDL completo do banco (`full_schema`) e a pergunta do usuário e devolve um DDL filtrado contendo apenas as tabelas relevantes para a pergunta.

Decisões de arquitetura
-----------------------
- MAC-SQL: fluxo com agentes sequenciais para simplificar coordenação entre etapas.
- Modelo preferido: Mistral (especificações e rationale estão em `Arquitetura.md`).

Como o `SelectorAgent` funciona
------------------------------
1. Renderiza o template `prompts/selector.j2` passando `full_schema` e a `question`.
2. Chama `BaseAgent._call_llm(system, user)` para obter a resposta do LLM.
3. Recebe `filtered_schema` (texto) e `tokens_used` (meta informação retornada pela camada client).
4. Valida a presença de pelo menos um `CREATE TABLE` no `filtered_schema`.
	- Se ausente, faz fallback e retorna o `full_schema`.
5. Extrai blocos `CREATE TABLE` do `full_schema` via `_extract_table_blocks` (mapeia `table_name -> bloco_DDL`).
6. Extrai nomes de tabelas do `filtered_schema` via `_extract_tables`.
7. Cross-check: mantém apenas as tabelas que aparecem em `original_blocks` para evitar blocos inventados pelo LLM.
8. Reconstrói o `filtered_schema` juntando os blocos validados e retorna um `SelectorResult` com `filtered_schema`, `tables_selected` e `tokens_used`.

Pontos importantes
------------------
- Segurança: o agente nunca usa blocos DDL gerados pelo LLM sem verificar que o mesmo nome existe no `full_schema` original.
- Fallback: se a saída do LLM não contiver DDL válido, o agente devolve o `full_schema` (modo conservador).

Arquivos principais
-------------------
- `backend/app/agent/agents/selector.py` — implementação do `SelectorAgent`.
- `backend/app/agent/agents/base.py` — inicialização do cliente LLM e `_call_llm`.
- `backend/app/agent/prompts/selector.j2` — template Jinja2 usado para construir o prompt.

Pipeline detalhado (próximos passos técnicos)
-------------------------------------------

- `FewShotRetriever.retrieve()` → `few_shots: List[dict]`
	- Retorna exemplos (few-shot) relevantes para o prompt do Decomposer. Cada `dict` contém `input`, `output` e metadados.

- `DecomposerAgent.run()` → `DecomposerResult` com `sql` e `reasoning`
	- `sql`: SQL inicial gerado pelo Decomposer com base no `filtered_schema`, `question` e `few_shots`.
	- `reasoning`: explicação do raciocínio usado para construir o SQL.

- `RefinerAgent.run()` → `RefinerResult` com `sql` e `success`
	- `sql`: SQL refinado após validações/ajustes.
	- `success`: booleano indicando se o refinamento resultou em SQL válido/executável.

- `PipelineResult`
	- Estrutura agregada com campos como `sql_final`, `tables_used`, `tokens_used_total`, `success` e `steps_reasoning`.
	- Usada pela camada de orquestração para decidir execução, rollback ou iterações adicionais.





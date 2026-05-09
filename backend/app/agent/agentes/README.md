# Agentes MAC-SQL

Descrição
---------
Este diretório concentra os agentes da pipeline MAC-SQL. Hoje o fluxo já conta com o `SelectorAgent` e o `DecomposerAgent`, e a próxima etapa é evoluir o `FewShotRetriever`, adicionar o `RefinerAgent` e consolidar o `PipelineResult`.

Decisões de arquitetura
-----------------------
- MAC-SQL: fluxo com agentes sequenciais para simplificar coordenação entre etapas.
- Modelo preferido: Mistral (especificações e rationale estão em `Arquitetura.md`).

Fluxo atual
-----------
1. `SelectorAgent` recebe o DDL completo do banco (`full_schema`) e a pergunta do usuário.
2. O agente filtra o esquema para manter apenas as tabelas mais relevantes para a pergunta.
3. `DecomposerAgent` usa o esquema filtrado para montar o SQL inicial a partir da pergunta.

Como o `SelectorAgent` funciona
------------------------------
1. Renderiza o template `prompts/selector.j2` passando `full_schema` e `question`.
2. Chama `BaseAgent._call_llm(system, user)` para obter a resposta do LLM.
3. Recebe `filtered_schema` (texto) e `tokens_used` (meta informação retornada pela camada client).
4. Valida a presença de pelo menos um `CREATE TABLE` no `filtered_schema`.
	- Se ausente, faz fallback e retorna o `full_schema`.
5. Extrai blocos `CREATE TABLE` do `full_schema` via `_extract_table_blocks`.
6. Extrai nomes de tabelas do `filtered_schema` via `_extract_tables`.
7. Faz cross-check para manter apenas as tabelas que existem no `full_schema` original.
8. Reconstrói o `filtered_schema` com os blocos validados e retorna um `SelectorResult` com `filtered_schema`, `tables_selected` e `tokens_used`.

Como o `DecomposerAgent` funciona
---------------------------------
1. Recebe o `filtered_schema`, a `question` e, no futuro, os exemplos retornados pelo `FewShotRetriever`.
2. Monta o prompt do decomposer com o contexto necessário para gerar a consulta inicial.
3. Chama o modelo e devolve o SQL inicial junto com o raciocínio usado na geração.

Pontos importantes
------------------
- Segurança: o selector nunca usa blocos DDL gerados pelo LLM sem verificar se o nome existe no `full_schema` original.
- Fallback: se a saída do LLM não contiver DDL válido, o selector devolve o `full_schema` em modo conservador.
- Extensibilidade: a pipeline foi pensada para incorporar retrieval de few-shots, refinamento e consolidação de resultado sem quebrar o fluxo principal.

Arquivos principais
-------------------
- `backend/app/agent/agentes/agente_seletor.py` — implementação do `SelectorAgent`.
- `backend/app/agent/agentes/agente_decompositor.py` — implementação do `DecomposerAgent`.
- `backend/app/agent/agentes/agente_base.py` — inicialização do cliente LLM e `_call_llm`.
- `backend/app/agent/prompts/selector.j2` — template Jinja2 usado para construir o prompt do selector.
- `backend/app/agent/prompts/decompositor.j2` — template Jinja2 usado para construir o prompt do decomposer.

Próximos passos
--------------
- `FewShotRetriever.retrieve()`
  - Retorna exemplos relevantes para o prompt do Decomposer.
  - Esta camada deve ser aprimorada para selecionar melhor os exemplos e melhorar a qualidade do SQL gerado.

- `RefinerAgent.run()`
  - Recebe o SQL inicial e aplica validações/ajustes.
  - Deve devolver o SQL refinado e um indicador de sucesso.

- `PipelineResult`
  - Estrutura agregada com campos como `sql_final`, `tables_used`, `tokens_used_total`, `success` e `steps_reasoning`.
  - Deve representar o resultado final da orquestração da pipeline.

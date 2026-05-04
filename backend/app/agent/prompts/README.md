Objetivo
--------
Este diretório contém templates de prompts (Jinja2) usados pelos agentes da
pipeline para gerar instruções ao modelo de linguagem. Os templates aqui
presentes destinam‑se a testes e avaliação de comportamento do LLM; os
system prompts finais que serão usados em produção devem ser definidos e
validados na etapa de integração.

Uso
---
- Os templates devem ser renderizados via Jinja2 por cada agente
	(ver `BaseAgent._render`).
- Mantenha os templates focados: forneça apenas as variáveis necessárias
	(schema, pergunta, few_shot examples, etc.).

Estrutura recomendada do template
---------------------------------
- Comentário de cabeçalho explicando o propósito do prompt.
- Instruções claras sobre o formato de saída esperado (ex.:
	`Tabela: <nome> | Colunas: c1,c2,...`).
- Exemplo(s) de input/output para few‑shot quando aplicável.

Integração
----------
Antes de subir para produção, coordene a versão final do `system` prompt
com a equipe de arquitetura e registre o texto final em `Arquitetura.md`.

Contribuição
------------
- Ao modificar um template, inclua um comentário explicando a alteração
	e adicione/atualize testes que validem o formato de saída.

Observações
-----------
- Estes arquivos atualmente servem para experimentação e avaliação; não
	os considere definitivos até a validação final do prompt de sistema.

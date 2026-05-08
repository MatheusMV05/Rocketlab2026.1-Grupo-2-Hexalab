# 📦 Modelos de Dados (Agentes)

Este diretório contém os modelos de dados centrais que padronizam a comunicação e o retorno dos agentes de Inteligência Artificial no pipeline da aplicação.

A utilização de modelos fortemente tipados (através de Pydantic e Dataclasses) é fundamental para garantir previsibilidade, segurança e integrar de forma natural com o framework `PydanticAI`.

## 📂 Estrutura de Arquivos

- `resultado.py`: Concentra todas as classes e estruturas de dados que representam as **saídas** (outputs) produzidas pelos agentes.

## 📝 Detalhamento dos Modelos (`resultado.py`)

O arquivo é conceitualmente dividido em dois tipos de estruturas: as saídas brutas extraídas e validadas diretamente do LLM, e os retornos consolidados e limpos usados pelo restante da aplicação.

### 1. Modelos de Saída Estruturada do LLM (Pydantic)
Estas classes herdam de `BaseModel`. Elas são passadas como o `result_type` no PydanticAI. Isso força a inteligência artificial a estruturar a sua resposta em JSON, garantindo que nunca receberemos texto solto ou respostas fora do padrão.

- **`ResultadoSeletorLLM`**: Usado pelo `AgenteSeletor` para capturar a resposta do LLM.
  - `blocos_ddl`: Uma lista de strings, onde cada item é uma instrução `CREATE TABLE` validada.
- **`ResultadoDecompositorLLM`**: Usado pelo `AgenteDecompositor` para forçar a IA a justificar seu código.
  - `reasoning`: A explicação passo a passo lógica gerada pela IA.
  - `sql`: A query SQL propriamente dita.

### 2. Modelos de Retorno da Aplicação (Dataclasses)
Estas classes são os empacotadores finais. É o que as funções da sua aplicação recebem quando invocam a classe de um Agente. Elas combinam o resultado estruturado (visto acima) com metadados importantes de execução.

- **`ResultadoSeletor`**: Retorno oficial do `AgenteSeletor`.
  - `esquema_filtrado`: O texto DDL final que será passado adiante.
  - `tabelas_selecionadas`: Lista com os nomes das tabelas mantidas.
  - `tokens_usados`: Informação vital para monitoramento de custos da API.
- **`ResultadoDecompositor`**: Retorno oficial do `AgenteDecompositor`.
  - `sql`: A query SQL.
  - `raciocinio`: A explicação associada.
  - `tokens_usados`: Custo em tokens daquela geração.

## 🛠️ Regras e Boas Práticas (Para Desenvolvedores)

- **Descrições no `Field()`**: As strings passadas no parâmetro `description` dos modelos Pydantic não são meros comentários. **A Inteligência Artificial lê essas descrições para entender como preencher cada campo**. Se for alterar algo, garanta que a descrição seja o mais clara possível sobre o que a IA deve colocar lá.
- **Desacoplamento**: Mantenha a separação clara entre "o que o LLM cospe em JSON" (os Pydantic BaseModels) e "o que o Python repassa para os controllers" (os Dataclasses).
- **Centralização**: Se no futuro criarmos novos agentes (ex: Agente de Correção, Agente de Gráficos), todos os modelos de resposta estruturada deles devem ser declarados aqui no `resultado.py` (ou num novo arquivo dentro deste diretório `models/`).

O seu ficheiro MD (Markdown) está pronto. Podes descarregá-lo no link abaixo ou copiar diretamente o texto estruturado que partilho aqui.

[file-tag: code-generated-file-0-1778863430774884370]

Aqui tens o conteúdo completo para copiares facilmente:

***

# Arquitetura de Memória e Compressão (MAC-SQL)

Esta documentação detalha a implementação da memória de compressão automatizada para a pipeline MAC-SQL, utilizando a extensão `ContextManagerCapability` do PydanticAI.

## 1. Visão Geral
A pipeline MAC-SQL coordena múltiplos agentes para transformar perguntas em linguagem natural em consultas SQL e respostas interpretadas. Para manter a eficiência em conversas longas, implementamos uma estratégia de **Compressão Seletiva**.

## 2. Estratégia de Compressão
Em vez de todos os agentes tentarem gerir o histórico, delegamos a função de "limpeza" aos agentes que possuem maior carga conversacional.

| Agente | Função na Memória | Descrição |
| :--- | :--- | :--- |
| **Seletor** | Consumidor | Lê o histórico para identificar tabelas relevantes, mas não altera o histórico. |
| **Decompositor** | **Editor/Compressor** | Gera o SQL e comprime o histórico se exceder os limites de tokens. |
| **Refinador** | Técnico | Foca apenas na correção do SQL; o histórico é mantido para contexto mínimo. |
| **Interpretador** | **Editor/Compressor** | Finaliza a resposta ao usuário e garante que o histórico salvo está otimizado. |

## 3. Implementação Técnica

### Requisito: `pydantic-ai-summarization`

A compressão é configurada através do parâmetro `capabilities` na inicialização do Agente:

```python
from pydantic_ai_summarization import ContextManagerCapability

# Configuração sugerida
capability = ContextManagerCapability(
    max_tokens=30000,       # Limite total de tokens do contexto
    compress_threshold=0.9  # Inicia compressão ao atingir 27.000 tokens
)

# No AgenteDecompositor e AgenteInterpretador:
self._agent = Agent(
    model,
    deps_type=ContextoAgente,
    output_type=ResultadoEsperado,
    capabilities=[capability]
)

4. Fluxo de Dados e Persistência
O Orquestrador centraliza o movimento da memória:

Recuperação: O histórico é carregado do banco de dados (SQLite/SessionStore).

Ciclo de Vida: O histórico circula pelos agentes. Se o Decompositor realizar uma compressão, o objeto message_history é atualizado.

Persistência: O Orquestrador recebe a lista de mensagens final (já resumida pela capability) e a persiste no banco de dados.

5. Benefícios da Arquitetura
Redução de Custos: Menor volume de tokens enviados para a API (Mistral/OpenAI).

Consistência: Evita que o modelo "se perca" em conversas muito extensas.

Baixa Latência: Ao não comprimir em todos os agentes, evitamos chamadas redundantes de sumarização.
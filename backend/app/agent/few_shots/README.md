# Few-Shot Prompting

Este diretório contém a lógica e os dados responsáveis por guiar as respostas da Inteligência Artificial por meio de exemplos práticos, uma técnica conhecida como **Few-Shot Prompting**.

Ao fornecer exemplos claros de como interpretar uma pergunta em linguagem natural, estruturar um raciocínio lógico e gerar uma query SQL válida, aumentamos drasticamente a precisão e a estabilidade do agente.

##  Estrutura de Arquivos

- `exemplos.yaml`: O "banco de dados" bruto de exemplos. É aqui que você adiciona, remove ou atualiza as demonstrações dadas à IA.
- `modelos.py`: Define o modelo de dados (`ExemploFewShot` via Pydantic), garantindo que todos os exemplos extraídos do YAML estejam tipados, formatados corretamente e tenham compatibilidade com nomenclaturas antigas.
- `fewshot_retriever.py`: O "motor de busca" dos exemplos. Esta classe carrega os exemplos do YAML e cria um índice de embeddings semânticos usando o modelo `paraphrase-multilingual-MiniLM-L12-v2`. Quando uma pergunta chega, o retriever a compara com todos os exemplos usando **similaridade cosseno** no espaço vetorial. O objetivo é selecionar dinamicamente apenas os `k` exemplos mais similares e relevantes para injetar no prompt (evitando que o contexto fique gigante e caro de processar).

##  Como funciona o `exemplos.yaml`

Cada item no arquivo YAML representa um único exemplo (um "shot") e deve possuir os seguintes campos:

1. **`question`**: A pergunta original que o usuário faria em linguagem natural.
2. **`reasoning`**: O raciocínio lógico passo a passo de como resolver o problema da pergunta. Isso ensina o modelo a "pensar" metodicamente antes de escrever a query (técnica de *Chain of Thought*).
3. **`sql`**: A query SQL exata e funcional que responde à pergunta.

### Exemplo de Estrutura:

```yaml
- question: "Qual produto com mais lucro no ultimo mes"
  reasoning: |
    Para encontrar o produto com mais lucro no último mês, precisamos:
    1. Juntar a tabela de fatos 'fat_pedidos' com as dimensões 'dim_produtos' e 'dim_data'.
    2. Filtrar as datas para incluir apenas o mês anterior completo.
    3. Agrupar pelo nome do produto e somar a 'receita_liquida_brl'.
    4. Ordenar de forma decrescente pela receita e pegar apenas o 1º registro.
  sql: |
    SELECT
      p.nome_produto,
      SUM(f.receita_liquida_brl) AS lucro_total
    FROM fat_pedidos f
    INNER JOIN dim_produtos p ON p.id_produto = f.id_produto
    INNER JOIN dim_data d ON d.sk_data = f.sk_data_pedido
    WHERE d.data_completa >= date('now', 'start of month', '-1 month')
      AND d.data_completa < date('now', 'start of month')
    GROUP BY p.nome_produto
    ORDER BY lucro_total DESC
    LIMIT 1
```

## Como Usar o Retriever

```python
from app.agent.few_shots.fewshot_retriever import FewShotRetriever

# Inicializa o retriever com o arquivo de exemplos
retriever = FewShotRetriever(path="exemplos.yaml")

# Recupera os 3 exemplos mais similares à pergunta
pergunta_usuario = "Quais os produtos com melhor desempenho?"
exemplos_selecionados = retriever.retrieve(pergunta_usuario, k=3)

# Cada exemplo possui: question, sql, reasoning
for exemplo in exemplos_selecionados:
    print(exemplo.question)
    print(exemplo.sql)
    print(exemplo.reasoning)
```

### Parâmetros do Retriever

- **`path`**: Caminho para o arquivo YAML com os exemplos.
- **`model_name`** (padrão: `"paraphrase-multilingual-MiniLM-L12-v2"`): Modelo de embeddings usado. Este modelo é:
  - **Multilíngue**: Funciona bem em português, inglês e outras línguas.
  - **Eficiente**: Dimensão de 384 vetores, ideal para aplicações em tempo real.
  - **Rápido**: Baixo custo computacional.

### Parâmetros do `retrieve()`

- **`pergunta`**: A pergunta do usuário em linguagem natural.
- **`k`**: Número de exemplos a retornar (padrão: 3). Ajuste conforme o tamanho do seu prompt.

## Regras e Boas Práticas 

Ao dar manutenção neste módulo, siga as regras de boa pratica:

- **Quantidade e Diversidade**: Mantenha uma coleção robusta de exemplos (ex: 20 a 30 amostras). Foque em cobrir diferentes complexidades (agrupamentos, subqueries, cálculos de data, JOINs complexos com diversas dimensões).
- **A Importância do `reasoning`**: Nunca pule esta etapa. O raciocínio é crucial para que a IA justifique os relacionamentos e deduza como filtrar campos. É ele que minimiza as alucinações (inventar tabelas ou colunas).
- **Formatação do SQL**: A IA irá imitar o seu estilo. Sempre escreva queries bem indentadas e otimizadas. Prefira UPPER CASE para palavras-chave SQL.
- **Qualidade das Perguntas**: Escreva perguntas naturais que reflitam como usuários reais fariam a mesma pergunta. Isso melhora a recuperação semântica.
- **Corrigindo Comportamentos**: Se o agente de IA estiver errando consistentemente um tipo específico de pergunta na aplicação, a correção mais fácil **não é mudar o prompt principal**, e sim **adicionar um exemplo dessa situação no `exemplos.yaml`**.
- **Tipagem no `modelos.py`**: A classe `ExemploFewShot` possui compatibilidade embutida com nomenclaturas antigas (ex: suporta `input`/`output` além de `question`/`sql` na função `from_raw`). Se você planeja expandir a estrutura do prompt com novos contextos, sempre faça a atualização de tipagem primeiro no `modelos.py`.
- **Performance do Retriever**: O carregamento de embeddings acontece apenas uma vez na inicialização. Após isso, a recuperação é rápida (~ms por query). Se o YAML ficar muito grande (>100 exemplos), considere expandir para embeddings dimensionais menores ou paginar os exemplos por categoria.

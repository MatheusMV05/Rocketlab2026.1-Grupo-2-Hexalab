# Dashboard — Como cada gráfico funciona

Este documento explica o que cada visualização do dashboard exibe, como os números são calculados e quais decisões foram tomadas na construção de cada uma.

---

## Fundamentos comuns

Antes de entrar em cada gráfico, vale entender dois mecanismos que se aplicam a todos eles.

### Comparação com período anterior

Quase todo indicador exibe uma variação percentual (ex.: "+12,4% vs Dez"). O cálculo é simples: a diferença entre o valor atual e o valor do período anterior, dividida pelo valor anterior — convertida em percentual.

A lógica de "período anterior" funciona assim:

| Filtro aplicado | Período de comparação |
|---|---|
| Nenhum | Mês atual vs. mês anterior |
| Um mês específico (ex.: Março/2025) | Mês anterior (Fevereiro/2025) |
| Um ano específico (ex.: 2024) | Ano anterior (2023) |

Se não houver dado no período anterior (ou o valor for zero), a variação não é exibida.

### Filtros globais vs. filtros locais

Existe um conjunto de filtros no topo do dashboard (**filtros globais**) que afeta todos os gráficos ao mesmo tempo — por ano, mês e localidade. Além disso, cada gráfico tem seu próprio filtro local que permite ajustá-lo individualmente sem alterar os demais.

Quando um gráfico está usando um filtro local diferente do global, os filtros globais exibem `---` no campo correspondente, indicando que aquele campo foi sobrescrito localmente por ao menos um gráfico. Ao alterar o filtro global, todos os filtros locais são redefinidos automaticamente para o novo valor global.

---

## Cards de KPI (faixa superior)

Os quatro cartões no topo do dashboard apresentam os indicadores principais do negócio para o período selecionado.

### Receita Total

**O que mostra:** Soma de toda a receita bruta gerada pelos pedidos aprovados no período.

**Decisão tomada:** Considera apenas pedidos com status aprovado, excluindo cancelamentos e reembolsos. O valor exibido em reais é formatado de forma extensa (ex.: R$ 1.245.678,90).

---

### Volume de Pedidos

**O que mostra:** Quantidade total de pedidos aprovados no período.

**Decisão tomada:** Contagem simples de pedidos aprovados. Útil para entender se a variação de receita vem do aumento de pedidos ou do aumento do ticket médio.

---

### Ticket Médio

**O que mostra:** Valor médio por pedido aprovado no período.

**Decisão tomada:** Calculado como a média do valor de cada pedido (não a receita bruta dividida pelos pedidos, pois um pedido pode ter vários itens). Serve para rastrear se os clientes estão comprando itens mais caros ao longo do tempo.

---

### Total de Clientes

**O que mostra:** Número de clientes distintos que realizaram ao menos um pedido aprovado no período.

**Decisão tomada:** Conta clientes únicos, não o número de compras. Um cliente que comprou três vezes conta como um. Isso diferencia crescimento de base de clientes de aumento de recorrência.

---

## Gráfico de Receita Mensal

**O que mostra:** Evolução da receita ao longo do tempo, com uma linha de meta como referência.

### Como funciona

O gráfico tem dois modos que mudam automaticamente conforme o filtro aplicado:

**Modo mensal (sem filtro de mês):** Exibe os últimos 12 meses, com cada ponto representando a receita total daquele mês.

**Modo semanal (com mês selecionado):** Detalha o mês escolhido semana a semana, permitindo ver variações dentro do próprio mês.

### A linha de meta

A linha tracejada com marcadores triangulares representa uma meta de receita calculada automaticamente — ela equivale a 90% da média dos períodos exibidos. A decisão de usar 90% da média (e não 100%) foi intencional: representa um patamar conservador e alcançável, evitando que a meta pareça impossível em meses de queda natural.

### O indicador de variação

No canto superior esquerdo aparece a variação percentual do período mais recente em relação ao anterior (ex.: último mês vs. penúltimo mês).

---

## Gráfico de Taxa de Satisfação

**O que mostra:** O percentual de avaliações positivas dos clientes, em formato de velocímetro (gauge).

### Como é calculado

A taxa considera todas as avaliações registradas para pedidos aprovados no período. Uma avaliação é considerada **positiva** quando a nota NPS é 7 ou maior. A taxa exibida é: `(avaliações com nota ≥ 7) ÷ (total de avaliações) × 100`.

### As zonas de cor

O velocímetro é dividido em três zonas que refletem o estado de saúde da satisfação:

| Zona | Faixa | Significado |
|---|---|---|
| Vermelha | 0% a 68% | Nível crítico, atenção necessária |
| Amarela | 68% a 82% | Zona de atenção, próxima da meta |
| Verde | 82% a 100% | Nível saudável |

A linha vertical fixa indica a **meta de 70%** — patamar definido como mínimo aceitável para a operação.

### Decisão de design

A animação do ponteiro (1,4 segundos) foi mantida para transmitir a sensação de "medição em tempo real", tornando o número mais impactante visualmente do que um simples percentual estático.

---

## Gráfico de Distribuição de Pedidos

**O que mostra:** Como os pedidos estão distribuídos entre os diferentes status do ciclo de vida — entregues, em processamento, reembolsados e cancelados.

### Como é calculado

Conta todos os pedidos (inclusive não aprovados) agrupados por status, traduzindo os status internos do banco para nomes amigáveis:

| Status interno | Exibido como |
|---|---|
| aprovado | Entregue |
| processando | Em Processamento |
| reembolsado | Reembolsado |
| recusado | Cancelado |

### Decisão tomada

Ao contrário dos outros indicadores, este gráfico considera **todos** os pedidos — não apenas os aprovados. Isso é intencional: o objetivo aqui é mostrar a distribuição operacional completa, incluindo cancelamentos e reembolsos, para que a equipe consiga identificar se há um volume anormal em algum status problemático.

O cabeçalho mostra o total de pedidos do período e a variação em relação ao período anterior.

---

## Gráfico Top 5 Produtos

**O que mostra:** Os cinco produtos com melhor desempenho no período, ranqueados por receita ou por volume de unidades vendidas.

### Como é calculado

O sistema identifica os 10 produtos com maior receita bruta total no período e exibe apenas os 5 primeiros. Para cada produto são calculados:
- **Receita total:** soma da receita bruta de todos os pedidos daquele produto
- **Total de unidades:** soma das quantidades vendidas

### Alternância de visualização

O botão no canto do gráfico permite alternar entre dois modos:
- **Volume:** as barras representam quantidade de unidades vendidas
- **Receita:** as barras representam o valor financeiro gerado

Essa decisão permite que o gráfico responda tanto à pergunta "o que mais vende?" quanto "o que mais gera receita?" — pois nem sempre são os mesmos produtos.

### Indicadores de variação

Dois percentuais são exibidos: variação da receita total dos top 5 e variação do volume total dos top 5, ambos comparados ao período anterior.

---

## Matriz de Satisfação vs. Performance

**O que mostra:** Posicionamento de cada produto em um gráfico de dispersão de dois eixos — satisfação dos clientes (vertical, escala 1–5) e percentil de volume de vendas (horizontal, escala 0–100) — dividido em quatro quadrantes.

### Como é calculado

**Passo 1 — Métricas por produto:**
Para cada produto ativo que possui avaliações no período, são calculados via SQL:
- **Volume:** quantidade total de unidades vendidas em pedidos aprovados
- **Satisfação:** média das notas dos clientes (escala 1 a 5), considerando apenas notas entre 1 e 5
- **Percentil de volume (`participacao_rank`):** posição relativa do produto dentro do conjunto, calculada com `PERCENT_RANK() OVER (ORDER BY volume)` — varia de 0 (menor volume) a 100 (maior volume)
- **Participação percentual:** fatia do produto no volume total do conjunto avaliado

**Passo 2 — Definição dos quadrantes:**
Dois cortes dividem o espaço:
- **Eixo X (volume):** corte fixo no percentil 50 — separa produtos de alta performance dos de baixo volume relativo
- **Eixo Y (satisfação):** corte configurável, padrão 4,0 — ajustável pelo painel de configurações

| Quadrante | Condição | Significado |
|---|---|---|
| **Estrelas** | `participacao_rank ≥ 50` e `satisfacao ≥ corte` | Vendem muito e são bem avaliados |
| **Oportunidades** | `participacao_rank < 50` e `satisfacao ≥ corte` | Bem avaliados, mas ainda vendem pouco |
| **Alerta Vermelho** | `participacao_rank ≥ 50` e `satisfacao < corte` | Vendem muito, mas geram insatisfação |
| **Ofensores** | `participacao_rank < 50` e `satisfacao < corte` | Baixo volume e baixa satisfação |

### Histórico de quadrante (`bloco_anterior`)

Cada produto exibe de qual quadrante ele vinha no período imediatamente anterior (ex.: mês anterior). Isso permite identificar produtos que melhoraram ou pioraram de posição recentemente.

### Limite por quadrante e critérios de ordenação

Por padrão, cada quadrante exibe no máximo 4 produtos. Quando há mais candidatos, os exibidos são escolhidos por ordem de relevância:

| Quadrante | Ordenação primária | Desempate |
|---|---|---|
| **Estrelas** | Maior volume | Maior satisfação |
| **Oportunidades** | Maior satisfação | Maior volume |
| **Alerta Vermelho** | Maior volume | Menor satisfação (mais críticos primeiro) |
| **Ofensores** | Menor satisfação | Menor volume |

O limite de cada quadrante e o corte de satisfação são ajustáveis pelo painel de configurações (ícone de engrenagem no canto do gráfico).

### Cor dos pontos

A cor indica o quadrante ao qual o produto pertence — não a nota isolada:

| Cor | Quadrante |
|---|---|
| Verde | Estrelas |
| Âmbar | Oportunidades |
| Vermelho | Alerta Vermelho |
| Cinza | Ofensores |

### Grupos sobrepostos

Quando dois ou mais produtos ficam em posições muito próximas no gráfico (diferença ≤ 5 no percentil de volume e ≤ 0,2 na satisfação, dentro do mesmo quadrante), eles são agrupados automaticamente em uma única pílula com o símbolo ▾. Clicar no grupo abre um menu com todos os produtos que ele representa e, ao passar o mouse sobre cada item, aparece o tooltip detalhado.

### Posicionamento de rótulos

As pílulas (rótulos dos produtos) são posicionadas de forma a não se sobrepor umas às outras nem ultrapassar os limites do gráfico. Pílulas próximas à borda direita são automaticamente espelhadas: o texto e o corpo da pílula se estendem para a esquerda, enquanto o ponto colorido permanece ancorado na posição exata do produto no eixo.

---

## Lista de Entregas

**O que mostra:** Tabela paginada com os pedidos individuais, permitindo busca, filtragem, ordenação e edição em lote.

### Funcionalidades

**Busca por cliente:** campo de busca que aceita aproximações — basta digitar parte do nome para encontrar os registros correspondentes. A busca aguarda 400ms após a última tecla antes de disparar a consulta, evitando requisições desnecessárias a cada letra digitada.

**Filtros locais da lista:**
- **Data:** por ano e, opcionalmente, por mês dentro do ano
- **Localidade:** por estado de origem do cliente
- **Status:** Entregue, Em Processamento, Reembolsado ou Cancelado

**Ordenação ("Organizar Lista"):**
- Mais recentes primeiro (padrão)
- Mais antigos primeiro
- Cliente A–Z
- Cliente Z–A

**Edição em lote:** é possível selecionar de 1 a 10 pedidos (página inteira) e editar em conjunto — alterando nome do cliente, status e prazo de entrega. Os campos deixados em branco não são modificados, permitindo atualizar apenas o que for necessário.

**Exportação:** o botão de upload exporta os registros filtrados e ordenados para um arquivo CSV, útil para análises externas.

### Paginação

A lista exibe 10 pedidos por página. A navegação mostra sempre a primeira e última página, além de uma janela de 2 páginas ao redor da página atual. Páginas distantes são recolhidas em `…`.

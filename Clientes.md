# Dicionário de Dados - Clientes

Este documento descreve as colunas presentes na tabela de clientes (`gold_clientes_360`) no banco de dados e o significado de cada uma.

| Coluna | Tipo | Descrição |
| :--- | :--- | :--- |
| **id** | Integer | Identificador único do cliente (Chave Primária). |
| **nome_completo** | String | Nome completo do cliente. |
| **email** | String | Endereço de e-mail do cliente (deve ser único). |
| **cidade** | String | Cidade de residência do cliente. |
| **estado** | String | Estado de residência do cliente (sigla de 2 caracteres). |
| **genero** | String | Gênero do cliente (ex: Masculino, Feminino). |
| **idade** | Integer | Idade do cliente. |
| **data_cadastro** | Date | Data em que o cliente realizou o cadastro no sistema. |
| **origem** | String | Canal de marketing ou plataforma por onde o cliente chegou (ex: Google, Instagram). |
| **total_pedidos** | Integer | Quantidade total de pedidos realizados pelo cliente desde o cadastro. |
| **total_gasto** | Float | Soma de todos os valores gastos pelo cliente. |
| **ticket_medio** | Float | Valor médio gasto pelo cliente por pedido (`total_gasto` / `total_pedidos`). |
| **ultimo_pedido** | Date | Data da última compra realizada pelo cliente. |
| **nps_medio** | Float | Nota média de satisfação (Net Promoter Score) atribuída pelo cliente. |
| **tickets_abertos** | Integer | Quantidade de chamados de suporte/atendimento que estão atualmente em aberto. |
| **segmento_rfm** | String | Situação (Segmentação do cliente baseada na análise de Recência, Frequência e Valor Monetário - ex: Campeão, Fiel, Em Risco, Hibernando). |

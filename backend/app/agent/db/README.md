# DB - Esquema e descrições das tabelas

Descrição
---------
Esta pasta concentra a camada de apoio ao entendimento do banco de dados pelo pipeline de agentes. Aqui ficam o leitor de esquema SQLite e o catálogo textual de descrições das tabelas usadas para contextualizar os agentes.

Arquivos principais
-------------------
- `descricao_tabelas.json` — mapa entre nome da tabela e uma descrição curta do seu papel no domínio.
- `leitor_esquema.py` — função responsável por ler o DDL diretamente de um banco SQLite.

`descricao_tabelas.json`
------------------------
O arquivo guarda uma estrutura simples de chave/valor, onde:
- a chave é o nome físico da tabela, como `dim_consumidores` ou `fat_itens_pedidos`;
- o valor é uma descrição em linguagem natural explicando o conteúdo da tabela e seu uso esperado.

Esse catálogo é útil para enriquecer prompts, apoiar seleção de tabelas e deixar a pipeline mais interpretável.

Tabelas documentadas
--------------------
- `dim_consumidores`: dimensão de consumidores/clients com atributos de identificação e perfil.
- `dim_produtos`: dimensão de produtos com dados descritivos e preço.
- `dim_vendedores`: dimensão de vendedores/comerciais com região de atuação.
- `fat_avaliacoes_pedidos`: fato com avaliações ou métricas ligadas a pedidos.
- `fat_itens_pedidos`: fato de itens por pedido, com quantidade e valor unitário.
- `fat_pedido_total`: fato agregada por pedido com valor total.
- `fat_pedidos`: fato mestre de pedidos com informações de cabeçalho.
- `fat_totalpedidos`: variante/sinônimo de fato total por pedido.

`ler_esquema(db_path)`
----------------------
A função em `leitor_esquema.py` conecta em um banco SQLite e extrai o DDL de tabelas e views a partir de `sqlite_master`.

Comportamento principal:
- lê objetos do tipo `table` e `view`;
- ignora objetos internos com prefixo `sqlite_`;
- descarta entradas sem SQL associado;
- normaliza a saída garantindo que cada bloco termine com `;`;
- retorna todos os blocos concatenados em uma única string, separados por uma linha em branco.

Uso típico
----------
1. Ler o DDL bruto do banco com `ler_esquema`.
2. Combinar esse esquema com as descrições de `descricao_tabelas.json`.
3. Entregar esse contexto aos agentes, principalmente ao `SelectorAgent`.

Observação
----------
O papel desta pasta é fornecer contexto confiável e estável para a pipeline. O DDL vem do banco real; as descrições servem como apoio sem substituir o esquema físico.

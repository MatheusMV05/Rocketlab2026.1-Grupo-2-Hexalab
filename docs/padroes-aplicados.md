# Padrões de Desenvolvimento — V-Commerce CRM 360

## 1. Idioma

Todo o código deve ser escrito em **português**.

Isso inclui:
- Nomes de variáveis, funções, classes e constantes
- Nomes de arquivos e pastas
- Comentários e documentação inline
- Nomes de rotas da API e query parameters
- Nomes de colunas e tabelas do banco de dados
- Nomes de branches
- Títulos e descrições de pull requests
- Mensagens de commit (ver seção 2)

---

## 2. Mensagens de Commit

Todas as mensagens de commit devem seguir o padrão [Conventional Commits](https://www.conventionalcommits.org/) em **português**.

### Formato

```
<tipo>(<escopo>): <descrição curta>

[corpo opcional]

[rodapé opcional]
```

### Tipos

| Tipo | Quando usar |
|---|---|
| `feat` | Nova funcionalidade |
| `fix` | Correção de bug |
| `refactor` | Mudança de código que não é fix nem feature |
| `test` | Adição ou atualização de testes |
| `docs` | Alterações apenas em documentação |
| `chore` | Build, atualização de dependências, configuração |
| `style` | Formatação, ponto e vírgula faltando (sem mudança de lógica) |

### Escopo (opcional)

Use o módulo ou área afetada: `clientes`, `pedidos`, `produtos`, `tickets`, `agente`, `dashboard`, `frontend`, `seed`, `db`.

### Exemplos

```
feat(clientes): adiciona endpoint de listagem paginada
fix(pedidos): corrige parsing do filtro de status
refactor(agente): extrai validação de SQL para guardrail separado
test(produtos): adiciona cenários 404 e 422 nos endpoints de produto
docs: adiciona exemplos de uso da API no README
chore: atualiza SQLAlchemy para 2.0.36
```

---

## 3. Branches

Nomes de branches em português, minúsculas, com hífens.

```
feat/listagem-clientes
fix/filtro-status-pedido
refactor/guardrails-agente
test/endpoints-produto
```

---


## 6. O que NÃO commitar

- Arquivos `.env` com credenciais reais
- Arquivos de banco de dados SQLite (`*.db`)
- Pastas de configuração de IDE (`.vscode/`, `.idea/`)

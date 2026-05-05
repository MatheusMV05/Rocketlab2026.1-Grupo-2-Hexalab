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
| `merge` | Commit gerado ao integrar uma branch via PR (criado automaticamente pelo GitHub) |

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
feature/listagem-clientes
fix/filtro-status-pedido
refactor/guardrails-agente
test/endpoints-produto
```

---

## 4. Ciclo de Vida de uma Branch

Toda branch segue o fluxo abaixo, sem exceções:

```
main
 └─► branch criada a partir da main
       └─► commits da feature/fix e etc
             └─► Pull Request aberto para a main
                   └─► revisão e aprovação
                         └─► merge na main
                               └─► branch apagada
```

### Regras

- **Sempre crie a branch a partir da `main` atualizada.** Antes de criar, faça `git pull origin main`.
- **Nunca commite direto na `main`.** Todo trabalho passa por branch + PR.
- **A branch é apagada após o merge.** Branches mescladas não devem permanecer no repositório.
- **Um PR por branch.** Não reaproveite branches para features diferentes.

### Passo a passo

```bash
# 1. Atualizar a main local
git checkout main
git pull origin main

# 2. Criar a branch
git checkout -b feature/nome-da-feature

# 3. Desenvolver e commitar normalmente
git add .
git commit -m "feat(escopo): descrição"

# 4. Subir a branch e abrir o PR
git push origin feature/nome-da-feature
# → abrir PR no GitHub apontando para main

# 5. Após o merge, apagar a branch local e remota
git checkout main
git pull origin main
git branch -d feature/nome-da-feature
git push origin --delete feature/nome-da-feature
```

---


## 6. O que NÃO commitar

- Arquivos `.env` com credenciais reais
- Arquivos de banco de dados SQLite (`*.db`)
- Pastas de configuração de IDE (`.vscode/`, `.idea/`)

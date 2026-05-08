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
| `merge` | Commit gerado ao integrar uma branch |

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

## 5. Estrutura de Pull Request

Para todo PR é ideal que ele contenha uma descrição seguindo o modelo abaixo:

### Título do PR

O título deve seguir o mesmo padrão de Conventional Commits da seção 2:

```
<tipo>(<escopo>): <descrição curta>
```

Exemplos:
```
feat(clientes): adiciona listagem paginada com filtros
fix(pedidos): corrige validação de data_fim anterior a data_inicio
test(produtos): adiciona testes E2E com Cypress para CRUD
```


## O que foi alterado?

Explique brevemente o que foi implementado.

## Por quê?

Explique o motivo ou o problema que este PR resolve.

## Como funciona?

Descreva o fluxo principal ou o comportamento técnico.

## Feature / User Story relacionada

Feature: F-XX Nome da Feature

User Story: US-XX Nome da User Story


### Exemplo


## O que foi alterado?

Implementada a listagem paginada de clientes com filtros por nome, e-mail e estado.

## Por quê?

Permite que analistas de CRM localizem clientes rapidamente sem percorrer toda a base.

## Como funciona?

O hook `useClientes(filters)` dispara `GET /api/clientes` com os parâmetros de filtro e paginação.
A tabela atualiza reativamente via React Query com debounce de 400ms na busca por texto.

## Feature / User Story relacionada

Feature: F-02 Gestão de Clientes

User Story: US-05 Listagem e Busca de Clientes


---

## 6. O que NÃO commitar

- Arquivos `.env` com credenciais reais
- Arquivos de banco de dados SQLite (`*.db`)
- Pastas de configuração de IDE (`.vscode/`, `.idea/`)

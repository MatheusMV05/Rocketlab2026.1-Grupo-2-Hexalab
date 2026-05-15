# Decisões Técnicas — Épico 5: Gestão de Tickets

## 1. Cálculo de prioridade em runtime, sem persistência

**Decisão:** o campo `prioridade` é calculado pelo `service.py` a cada request e **não é armazenado** na tabela `gold_tickets`.

**Motivo:** o backlog define explicitamente *"campo calculado pelo backend no response, não armazenado no banco"*. Persistir a prioridade criaria inconsistência se a regra de negócio mudasse, pois exigiria migração ou recálculo em massa. Calculando em runtime, qualquer mudança de regra reflete imediatamente sem tocar no banco.

**Regra implementada:**

| `tempo_resolucao_horas` | `prioridade` |
|---|---|
| `null` (ticket em aberto) | `Alta` |
| `> 72` | `Alta` |
| `>= 24` e `<= 72` | `Media` |
| `< 24` | `Baixa` |

---

## 2. Dados mock restritos ao escopo de teste

**Decisão:** os dados mock (`DADOS_MOCK`) vivem em `models.py` e são usados exclusivamente pela fixture de teste definida em `test_tickets.py`. O `main.py` não contém nenhuma lógica de seed.

**Motivo:** seed de dados mock em `main.py` polui o ambiente de desenvolvimento e não pertence ao ciclo de vida da aplicação. Mocks são uma preocupação de teste, não de produção. Mantê-los dentro do próprio arquivo de testes garante que cada módulo seja autossuficiente e não cause conflito de merge em arquivos compartilhados ao ser integrado.

**Alternativa descartada:** seed no lifespan da aplicação com verificação por `COUNT`. Essa abordagem exige modificar `main.py` a cada novo módulo implementado, acumulando imports e lógica de seed de múltiplos times no mesmo arquivo compartilhado.

---

## 3. Validação de datas no router via `HTTPException(422)`

**Decisão:** a validação do formato `DD-MM-YYYY` e da regra `data_fim >= data_inicio` é feita manualmente no router, lançando `HTTPException(status_code=422)`.

**Motivo:** FastAPI/Pydantic não tem um tipo nativo para o formato `DD-MM-YYYY` nos query params. A alternativa de criar um tipo Pydantic customizado adicionaria complexidade desnecessária para uma regra simples. A resposta 422 com `{"detail": "mensagem"}` é consistente com o padrão de erros da API definido no backlog.

**Atenção:** os erros de `page` e `size` (via `Query(ge=1, le=100)`) geram 422 com formato Pydantic (`{"detail": [{"loc": ...}]}`), enquanto os erros de data geram 422 com formato simples (`{"detail": "string"}`). Ambos os formatos satisfazem os contratos definidos no backlog.

---

## 4. Filtros de texto com `LOWER()` (case-insensitive)

**Decisão:** os filtros `tipo_problema`, `status` e `agente_suporte` usam `func.lower()` do SQLAlchemy tanto na coluna quanto no valor recebido da query string.

**Motivo:** o SQLite é case-sensitive para comparações de string por padrão. Sem `LOWER()`, `?status=fechado` não casaria com `"Fechado"` no banco. O uso de `LOWER()` garante que o frontend passe o valor em qualquer capitalização sem quebrar a busca.

**Limitação:** `LOWER()` no SQLite não trata acentos nem caracteres Unicode além do ASCII básico. Se os valores do banco contiverem acentos (ex: `"Reclamação"`), a busca ainda é case-insensitive para letras sem acento mas pode falhar em outros casos. Esse comportamento está documentado aqui para revisão quando os dados reais chegarem.

---

## 5. Isolamento do banco nos testes

**Decisão:** a fixture `cliente_async` é definida dentro de `test_tickets.py` (sem `conftest.py`). Ela cria um engine `sqlite+aiosqlite:///:memory:`, semeia os 20 registros mock e usa `app.dependency_overrides[get_db]` para substituir a sessão durante os testes.

**Motivo:** centralizar fixtures em `conftest.py` exigiria que esse arquivo importasse models e dados mock de todos os módulos conforme fossem implementados, tornando-se um arquivo compartilhado com alto risco de conflito de merge. Com a fixture dentro do próprio arquivo de testes, cada módulo é completamente autossuficiente.

**Escopo da fixture `cliente_async`:** `function` (padrão do pytest-asyncio). Cada teste recebe um banco novo com os dados mock frescos, eliminando dependências entre testes.

---

## 6. Ordenação padrão por `data_abertura` decrescente

**Decisão:** sem filtro de ordenação explícito, os tickets são retornados ordenados por `data_abertura` decrescente (mais recentes primeiro).

**Motivo:** o backlog define *"Ordenação padrão: decrescente por data, salvo indicação contrária"* nas convenções gerais. Para uma lista de suporte, os tickets mais recentes são naturalmente os mais relevantes para o operador.

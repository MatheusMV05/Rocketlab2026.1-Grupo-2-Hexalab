# Por que mantive os mocks dentro do próprio módulo dashboard

**Responsável:** Matheus (dashboard)
**Data:** 02/05/2026

---

O dashboard depende de dados que virão de `pedidos/`, `clientes/`, `produtos/` e `tickets/` — módulos que ainda não existem. Precisei decidir como lidar com isso sem travar o desenvolvimento.

Considerei criar um `app/shared/mocks.py` centralizado, mas descartei porque resolveria o problema errado: em vez de eliminar dependências, criaria uma nova. O dashboard passaria a importar de `shared/`, e qualquer mudança lá poderia quebrar meu módulo — o mesmo risco que eu queria evitar, só com outro nome.

A decisão foi manter os mocks **dentro do próprio `dashboard/models.py`**. O dashboard não está "simulando o módulo pedidos" ele tem sua própria representação interna dos dados enquanto a fonte real não existe. Quando `pedidos/` estiver pronto, a troca acontece em uma única linha no `repository.py`, sem tocar em mais nada:

```python
# hoje
async def get_kpis(db: AsyncSession) -> dict:
    # TODO: substituir pela query real — depende do módulo pedidos e clientes
    return mock_kpis()

# depois do swap
async def get_kpis(db: AsyncSession) -> dict:
    return await pedidos_service.calcular_kpis(db)
```

Isso também garante que quem está desenvolvendo `pedidos/` não precisa coordenar comigo enquanto trabalha — os módulos evoluem em paralelo sem bloqueio.

Para encontrar todos os pontos que ainda precisam de swap, basta buscar por `TODO: substituir pela query real` no repositório.

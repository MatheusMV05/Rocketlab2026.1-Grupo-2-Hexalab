# Por que fiz mocks

**Responsável:** Matheus (dashboard)
**Data:** 02/05/2026

---

O dashboard depende de dados que virão de `pedidos/`, `clientes/`, `produtos/` e `tickets/` — módulos que ainda não existem. Precisei decidir como lidar com isso sem travar o desenvolvimento.

Considerei criar um `app/shared/mocks.py` centralizado, mas descartei porque resolveria o problema errado: em vez de eliminar dependências, criaria uma nova. O dashboard passaria a importar de `shared/`, e qualquer mudança lá poderia quebrar meu módulo — o mesmo risco que eu queria evitar, só com outro nome.

A decisão foi manter os mocks **dentro do próprio `dashboard/models.py`**. O dashboard não está "simulando o módulo pedidos" ele tem sua própria representação interna dos dados enquanto a fonte real não existe. Quando `pedidos/` estiver pronto, a troca acontece em uma única linha no `repository.py`, sem tocar em mais nada:


# hoje
async def get_kpis(db: AsyncSession) -> dict:
    # TODO: substituir pela query real — depende do módulo pedidos e clientes
    return mock_kpis()

# exemplo de depois do swap
async def get_kpis(db: AsyncSession) -> dict:
    return await pedidos_service.calcular_kpis(db)


Isso também garante que quem está desenvolvendo `pedidos/` não precisa coordenar comigo enquanto trabalha — os módulos evoluem em paralelo sem bloqueio.

Para encontrar todos os pontos que ainda precisam de swap, basta buscar por `TODO: substituir pela query real` no repositório.

---

## O que acontece com o models.py do dashboard quando os módulos ficarem prontos?

O `dashboard/models.py` é temporário. Ele só existe porque os outros módulos ainda não existem.

Conforme cada módulo for ficando pronto, as funções de mock vão sendo removidas do `models.py` uma por uma, substituídas por chamadas reais no `repository.py`. Quando o último mock for substituído, o arquivo fica vazio e pode ser deletado.

Ele não vira um models geral nem migra para outro lugar. O dashboard não tem tabelas próprias, é puramente analítico, então não tem entidades SQLAlchemy para declarar. Quem vai ter um `models.py` de verdade são os módulos `pedidos/`, `clientes/`, `produtos/` e `tickets/`, cada um responsável pelas suas próprias tabelas.

Resumindo: o `dashboard/models.py` some quando cumprir seu papel.

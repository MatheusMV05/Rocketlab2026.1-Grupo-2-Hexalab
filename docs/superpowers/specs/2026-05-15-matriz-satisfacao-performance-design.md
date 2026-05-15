# Design — Matriz de Satisfação vs. Performance

**Data:** 2026-05-15
**Branch:** feature/dashboard
**Status:** Aprovado

---

## Contexto

A Matriz de Satisfação vs. Performance é um componente do dashboard do CRM V-Commerce que cruza satisfação do cliente com performance comercial (volume de vendas) para classificar produtos em quatro quadrantes estratégicos: Estrelas, Oportunidades, Alerta Vermelho e Ofensores.

A implementação atual possui problemas conceituais (corte de satisfação dinâmico em vez de fixo em 4.0, ordenação incorreta dos quadrantes, status "neutro" inexistente na spec, corte Y hardcoded em 3.0) e visuais (agrupamento sem verificação de quadrante, tooltip sem quadrante atual, ausência de estados vazios). Esta spec documenta a reescrita completa do componente frontend e as correções no backend.

---

## Abordagem

**Abordagem 2 — Reescrita do componente frontend + correções backend.**

O componente `MatrizSatisfacaoPerformance.tsx` será reescrito do zero. O backend (`repository.py` e `router.py`) receberá correções cirúrgicas na lógica de classificação, ordenação e nos parâmetros aceitos. Os contratos de API são mantidos (sem breaking changes nos schemas existentes, apenas adição de campos opcionais).

---

## Seção 1 — Backend

### 1.1 Corte de satisfação fixo em 4.0

**Arquivo:** `backend/app/dashboard/repository.py`

O SQL `_SQL_PERIODO_MATRIZ` atual usa `mediana_satisfacao` para classificar os quadrantes. Isso é conceitualmente incorreto: o corte de satisfação é fixo em 4.0 conforme a spec.

**Mudança no SQL:**
- Remover `PERCENTILE_CONT` de satisfação do CTE `medians`
- Substituir `m.med_sat` no `CASE` por o parâmetro `:corte_sat` (default 4.0)
- Remover `mediana_satisfacao` da resposta

### 1.2 Corte de volume dinâmico ou fixo

O backend calculará a mediana de volume (como hoje). Adicionalmente, aceitará um parâmetro opcional `corte_volume: float | None`:
- Se `None` → usa mediana calculada
- Se informado → usa o valor fixo como divisor de performance

O campo `mediana_volume` na resposta sempre retornará a mediana real calculada (para o frontend exibir o default no painel de configuração).

### 1.3 Ordenação correta por quadrante

```python
# Estrelas: maior volume, desempate por maior nota
quadrantes["estrelas"].sort(key=lambda x: (-x["volume"], -x["satisfacao"]))

# Oportunidades: maior nota, desempate por maior volume
quadrantes["oportunidades"].sort(key=lambda x: (-x["satisfacao"], -x["volume"]))

# Alerta Vermelho: maior volume, desempate por menor nota
quadrantes["alerta_vermelho"].sort(key=lambda x: (-x["volume"], x["satisfacao"]))

# Ofensores: menor nota, desempate por menor volume
quadrantes["ofensores"].sort(key=lambda x: (x["satisfacao"], x["volume"]))
```

### 1.4 Novos parâmetros no endpoint

`GET /api/dashboard/matriz-produtos` passa a aceitar:
- `corte_satisfacao: float` (opcional, default 4.0, range 1.0–4.9)
- `corte_volume: float | None` (opcional, default None → usa mediana)

O campo `quadrante` retornado por produto já existia e permanece. O campo `status` continuará sendo calculado pelo backend com a regra simplificada: `>= corte_satisfacao` → `"bom"`, caso contrário → `"ruim"` (remove "neutro").

---

## Seção 2 — Tipos e Contratos

**Arquivo:** `frontend/src/types/dashboard.ts`

`LimitesBloco` passa a incluir os dois cortes configuráveis:

```ts
export interface LimitesBloco {
  limite_estrelas: number
  limite_oportunidades: number
  limite_alerta_vermelho: number
  limite_ofensores: number
  corte_satisfacao: number        // default 4.0
  corte_volume: number | null     // null = usar mediana dinâmica
}
```

`MatrizProdutoItem` permanece igual — `quadrante` e `status` já existem.

---

## Seção 3 — Componente Frontend

**Arquivo:** `frontend/src/components/organisms/dashboard/MatrizSatisfacaoPerformance.tsx`

### 3.1 Constantes

```ts
const CORTE_Y_PADRAO = 4.0          // era 3.0 — corrigido
const DOM_Y: [number, number] = [1, 5]
const LIMITES_PADRAO: LimitesBloco = {
  limite_estrelas: 4,
  limite_oportunidades: 4,
  limite_alerta_vermelho: 4,
  limite_ofensores: 4,
  corte_satisfacao: 4.0,
  corte_volume: null,               // null = mediana dinâmica
}
```

O valor efetivo do corte Y (linha horizontal) é `limites.corte_satisfacao` (não mais uma constante fixa).
O valor efetivo do corte X (linha vertical) é `limites.corte_volume ?? data.mediana_volume`.

### 3.2 Cores

```ts
const COR_PONTO: Record<string, string> = {
  bom:  '#1a9a45',
  ruim: '#c20000',
  // "neutro" removido
}
```

### 3.3 Agrupamento

A função `agruparPorProximidade` recebe apenas produtos do mesmo quadrante (o agrupamento é aplicado por quadrante, não globalmente). A tolerância de nota é `0.2`. O produto principal do grupo segue a ordenação do quadrante (já ordenado pelo backend), não por nome.

```ts
// Aplicação:
const porQuadrante = agruparPorQuadrante(data.items)
// Para cada quadrante, agrupar internamente:
const agrupados = Object.entries(porQuadrante).flatMap(([, items]) =>
  agruparPorProximidade(items, 0.2)
)
```

### 3.4 Tooltip

`TooltipMatriz` passa a exibir também o quadrante atual:

```
Produto: Notebook Intel Core i5
Categoria: Informática
Volume: 2.550 vendas
Satisfação: 3.8 ★
Quadrante: Alerta Vermelho
Período anterior: Estrelas
```

O campo `quadrante` já está no `MatrizProdutoItem`.

### 3.5 Estados Vazios

Quando um quadrante não tem produtos no contexto filtrado, exibir texto discreto dentro da `ReferenceArea` correspondente via `BadgeQuadrante` secundário ou elemento SVG com a mensagem: `"Nenhum produto neste quadrante"`.

A verificação é feita no frontend com base nos dados retornados (`data.items.filter(i => i.quadrante === 'estrelas').length === 0`).

### 3.6 Legenda

```ts
[
  { cor: '#1a9a45', label: 'Alta satisfação' },
  { cor: '#c20000', label: 'Baixa satisfação' },
  // "Neutro" removido
]
```

---

## Seção 4 — Painel de Configuração (PainelLimitesBloco)

**Arquivo:** `frontend/src/components/molecules/dashboard/PainelLimitesBloco.tsx`

O painel é expandido com uma segunda seção "Cortes da matriz":

### 4.1 Corte de satisfação

- Input numérico, step 0.1
- Mínimo: 1.0 — Máximo: 4.9
- Default: 4.0
- Validação: fora do range → botão Aplicar desabilitado + mensagem de erro inline

### 4.2 Corte de volume

- Toggle: "Mediana dinâmica" (default) | "Valor fixo"
- Quando "Valor fixo": input numérico inteiro, mínimo 1
- Máximo: volume máximo observado nos dados atuais (passado como prop)
- Se `corte_volume > maxVolume` → erro: "Todos os produtos ficariam em baixa performance"
- Se `corte_volume = 0` → erro (bloqueado pelo min=1)

### 4.3 Limitações

- Qualquer corte fora dos limites → botão Aplicar desabilitado
- Ao aplicar, verificar se ≥ 3 dos 4 quadrantes ficariam sem produtos no contexto atual. Se sim → exibir aviso: "Este corte deixa a maioria dos quadrantes vazios. Revise os valores." (mas ainda permite aplicar)
- Botão "Restaurar padrões" → volta `corte_satisfacao = 4.0` e `corte_volume = null`

### 4.4 Props do componente

```ts
interface Props {
  limites: LimitesBloco
  maxVolume: number          // para validar o corte de volume
  medianaVolume: number      // exibido como dica quando o usuário ativa "Valor fixo"
  onAplicar: (novos: LimitesBloco) => void
}
```

---

## Seção 5 — Fluxo de Dados

```
Usuário altera filtros ou cortes
→ MatrizSatisfacaoPerformance chama useMatrizProdutos(filtros, limites)
→ Hook envia GET /matriz-produtos com ano, mes, localidade, limites, corte_satisfacao, corte_volume
→ Backend calcula mediana, aplica cortes, ordena, seleciona por cotas
→ Retorna { items, mediana_volume }
→ Frontend agrupa por quadrante, aplica agrupamento visual por proximidade (por quadrante)
→ Renderiza: pílulas, tooltips, estados vazios, linha de corte X e Y corretas
```

---

## Restrições e Invariantes

- Corte de satisfação é fixo em 4.0 por padrão e não varia com contexto (apenas com input do usuário)
- Corte de volume é a mediana do contexto por padrão (recalculada a cada mudança de filtro)
- Quando o usuário define um corte de volume fixo, o valor NÃO é recalculado ao mudar o contexto — o usuário precisa redefinir manualmente ou restaurar o padrão
- Produtos sem nota média no contexto não entram na matriz (Opção 1 da spec)
- Agrupamento ocorre apenas dentro do mesmo quadrante, com tolerância de 0.2 na nota
- A ausência de produtos em um quadrante não é compensada por outro quadrante
- Nomes dos quadrantes são imutáveis: Estrelas, Oportunidades, Alerta Vermelho, Ofensores

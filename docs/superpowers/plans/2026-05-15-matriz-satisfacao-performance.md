# Matriz de Satisfação vs. Performance — Plano de Implementação

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Reescrever o componente MatrizSatisfacaoPerformance e corrigir o backend para estar 100% alinhado com a spec funcional, incluindo cortes configuráveis pelo usuário.

**Architecture:** Backend recebe `corte_satisfacao` (padrão 4.0) e `corte_volume` (padrão NULL = mediana dinâmica) como query params. O frontend reescreve o componente principal, expande o painel de configuração e corrige agrupamento, tooltip, estados vazios e constantes de corte.

**Tech Stack:** Python 3.12 / FastAPI / SQLAlchemy async / PostgreSQL · React 19 / TypeScript / Recharts / TailwindCSS / TanStack Query

---

## Mapa de Arquivos

| Arquivo | Ação | Responsabilidade |
|---|---|---|
| `backend/app/dashboard/models.py` | Modificar | Adicionar funções mock para testes |
| `backend/app/dashboard/repository.py` | Modificar | SQL com cortes parametrizados, ordenação correta, status sem "neutro" |
| `backend/app/dashboard/service.py` | Modificar | Repassar novos parâmetros |
| `backend/app/dashboard/router.py` | Modificar | Expor `corte_satisfacao` e `corte_volume` como query params |
| `backend/tests/dashboard/test_dashboard_service.py` | Modificar | Adicionar testes de ordenação e cortes |
| `frontend/src/types/dashboard.ts` | Modificar | Adicionar `corte_satisfacao` e `corte_volume` em `LimitesBloco` |
| `frontend/src/services/dashboardService.ts` | Modificar | Passar novos params na chamada de API |
| `frontend/src/hooks/useDashboard.ts` | Modificar | Incluir novos params na queryKey |
| `frontend/src/components/molecules/dashboard/TooltipMatriz.tsx` | Modificar | Adicionar campo `quadrante` atual |
| `frontend/src/components/molecules/dashboard/PainelLimitesBloco.tsx` | Reescrever | Seção de cortes com validação |
| `frontend/src/components/organisms/dashboard/MatrizSatisfacaoPerformance.tsx` | Reescrever | Componente completo conforme spec |

---

## Task 1: Backend — SQL parametrizado e lógica do repositório

**Files:**
- Modify: `backend/app/dashboard/models.py`
- Modify: `backend/app/dashboard/repository.py`
- Test: `backend/tests/dashboard/test_dashboard_service.py`

- [ ] **Step 1.1: Adicionar funções mock em models.py**

O arquivo `models.py` está sem as funções mock que os testes importam. Adicione-as:

```python
# backend/app/dashboard/models.py

_entregas_overrides: dict[str, dict] = {}


def mock_kpis() -> dict:
    return {
        "receita_total": 487320.50,
        "total_pedidos": 1243,
        "ticket_medio": 392.05,
        "total_clientes": 836,
        "variacao_receita": 5.2,
        "variacao_pedidos": 3.1,
        "variacao_ticket": 2.0,
        "variacao_clientes": 1.5,
        "periodo_ref": "Abr",
    }


def mock_vendas_mensal() -> list[dict]:
    meses = ["Jun/2024","Jul/2024","Ago/2024","Set/2024","Out/2024","Nov/2024",
             "Dez/2024","Jan/2025","Fev/2025","Mar/2025","Abr/2025","Mai/2025"]
    return [{"mes_ano": m, "receita_total": 40000.0 + i * 1000, "total_pedidos": 100 + i * 5}
            for i, m in enumerate(meses)]


def mock_top_produtos() -> dict:
    items = [
        {"nome_produto": f"Produto {i}", "categoria": "Cat", "receita_total": float(10000 - i * 800), "total_unidades": 100 - i * 8}
        for i in range(10)
    ]
    return {"items": items, "variacao_receita": 3.5, "variacao_volume": 2.1, "periodo_ref": "Abr"}


def mock_por_regiao() -> list[dict]:
    estados = [("São Paulo", 180000), ("Rio de Janeiro", 120000), ("Minas Gerais", 90000)]
    return [{"estado": e, "receita_total": float(r), "total_pedidos": r // 100} for e, r in estados]


def mock_status_pedidos() -> dict:
    items = [
        {"status": "aprovado", "total": 700},
        {"status": "processando", "total": 300},
        {"status": "reembolsado", "total": 150},
        {"status": "recusado", "total": 93},
    ]
    return {"items": items, "variacao_total": 2.4, "periodo_ref": "Abr"}


def mock_matriz_produtos(
    limite_estrelas: int = 4,
    limite_oportunidades: int = 4,
    limite_alerta_vermelho: int = 4,
    limite_ofensores: int = 4,
) -> dict:
    # mediana_volume = 1750 para este mock
    estrelas = [
        {"nome": "Notebook Core i7",    "categoria": "Informática",      "volume": 3200, "satisfacao": 4.8, "status": "bom",  "quadrante": "estrelas",        "bloco_anterior": "estrelas"},
        {"nome": "Smartphone Samsung",  "categoria": "Eletrônicos",      "volume": 2900, "satisfacao": 4.5, "status": "bom",  "quadrante": "estrelas",        "bloco_anterior": "oportunidades"},
        {"nome": "Tablet Apple",        "categoria": "Eletrônicos",      "volume": 2600, "satisfacao": 4.3, "status": "bom",  "quadrante": "estrelas",        "bloco_anterior": "estrelas"},
        {"nome": "Fone Bluetooth",      "categoria": "Acessórios",       "volume": 2100, "satisfacao": 4.1, "status": "bom",  "quadrante": "estrelas",        "bloco_anterior": "estrelas"},
    ]
    oportunidades = [
        {"nome": "Livro Python Pro",    "categoria": "Livros",           "volume":  800, "satisfacao": 4.9, "status": "bom",  "quadrante": "oportunidades",   "bloco_anterior": "oportunidades"},
        {"nome": "Panela Elétrica",     "categoria": "Casa",             "volume":  950, "satisfacao": 4.7, "status": "bom",  "quadrante": "oportunidades",   "bloco_anterior": "ofensores"},
        {"nome": "Cafeteira Premium",   "categoria": "Casa",             "volume":  700, "satisfacao": 4.5, "status": "bom",  "quadrante": "oportunidades",   "bloco_anterior": "oportunidades"},
        {"nome": "Mochila Esportiva",   "categoria": "Esportes",         "volume":  600, "satisfacao": 4.2, "status": "bom",  "quadrante": "oportunidades",   "bloco_anterior": "oportunidades"},
    ]
    alerta = [
        {"nome": "TV 55 OLED",          "categoria": "Eletrônicos",      "volume": 3500, "satisfacao": 2.5, "status": "ruim", "quadrante": "alerta_vermelho", "bloco_anterior": "estrelas"},
        {"nome": "Geladeira Duplex",    "categoria": "Eletrodomésticos", "volume": 2800, "satisfacao": 2.8, "status": "ruim", "quadrante": "alerta_vermelho", "bloco_anterior": "alerta_vermelho"},
        {"nome": "Máquina de Lavar",    "categoria": "Eletrodomésticos", "volume": 2200, "satisfacao": 3.1, "status": "ruim", "quadrante": "alerta_vermelho", "bloco_anterior": "alerta_vermelho"},
        {"nome": "Aspirador Robô",      "categoria": "Casa",             "volume": 1900, "satisfacao": 3.5, "status": "ruim", "quadrante": "alerta_vermelho", "bloco_anterior": "estrelas"},
    ]
    ofensores = [
        {"nome": "Cabo USB Genérico",   "categoria": "Acessórios",       "volume":  200, "satisfacao": 1.5, "status": "ruim", "quadrante": "ofensores",       "bloco_anterior": "ofensores"},
        {"nome": "Suporte Monitor",     "categoria": "Acessórios",       "volume":  350, "satisfacao": 2.0, "status": "ruim", "quadrante": "ofensores",       "bloco_anterior": "ofensores"},
        {"nome": "Teclado Sem Fio",     "categoria": "Informática",      "volume":  450, "satisfacao": 2.5, "status": "ruim", "quadrante": "ofensores",       "bloco_anterior": "alerta_vermelho"},
        {"nome": "Mouse Óptico",        "categoria": "Informática",      "volume":  600, "satisfacao": 3.2, "status": "ruim", "quadrante": "ofensores",       "bloco_anterior": "ofensores"},
    ]
    items = (
        estrelas[:limite_estrelas]
        + oportunidades[:limite_oportunidades]
        + alerta[:limite_alerta_vermelho]
        + ofensores[:limite_ofensores]
    )
    return {"items": items, "mediana_volume": 1750.0}
```

- [ ] **Step 1.2: Rodar testes existentes para confirmar estado atual**

```bash
cd backend
python -m pytest tests/dashboard/test_dashboard_service.py -v
```

Esperado: todos os testes passam agora (com o mock adicionado). Se algum falhar, verifique se o import do `models.py` está correto.

- [ ] **Step 1.3: Atualizar `_SQL_PERIODO_MATRIZ` em repository.py**

Substitua o bloco completo `_SQL_PERIODO_MATRIZ` (linhas 68–110):

```python
_SQL_PERIODO_MATRIZ = text("""
    WITH periodo AS (
        SELECT
            p.sk_produto,
            p.nome_produto        AS nome,
            p.categoria,
            COUNT(DISTINCT fp.sk_pedido)    AS volume,
            AVG(fa.nota_produto)            AS satisfacao
        FROM dim_produtos p
        JOIN fat_pedidos   fp ON fp.sk_produto  = p.sk_produto  AND fp.fl_pedido_aprovado = 1
        JOIN dim_data      dd ON dd.sk_data      = fp.sk_data_pedido AND dd.ano > 0
        JOIN dim_clientes  dc ON dc.sk_cliente   = fp.sk_cliente
        LEFT JOIN fat_avaliacoes fa
               ON fa.sk_produto = p.sk_produto AND fa.sk_pedido = fp.sk_pedido
        WHERE p.ativo = 1
          AND (:ano        = '' OR dd.ano::text   = :ano)
          AND (:mes        = '' OR dd.mes::text   = :mes)
          AND (:localidade = '' OR dc.estado      = :localidade)
        GROUP BY p.sk_produto, p.nome_produto, p.categoria
        HAVING AVG(fa.nota_produto) IS NOT NULL
           AND COUNT(DISTINCT fp.sk_pedido) > 0
    ),
    medians AS (
        SELECT
            PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY volume) AS med_vol
        FROM periodo
    )
    SELECT
        p.nome,
        p.categoria,
        p.volume,
        ROUND(p.satisfacao::numeric, 2)         AS satisfacao,
        m.med_vol                               AS mediana_volume,
        CASE
            WHEN p.volume >= COALESCE(:corte_vol, m.med_vol) AND p.satisfacao >= :corte_sat THEN 'estrelas'
            WHEN p.volume <  COALESCE(:corte_vol, m.med_vol) AND p.satisfacao >= :corte_sat THEN 'oportunidades'
            WHEN p.volume >= COALESCE(:corte_vol, m.med_vol) AND p.satisfacao <  :corte_sat THEN 'alerta_vermelho'
            ELSE 'ofensores'
        END AS quadrante
    FROM periodo p CROSS JOIN medians m
""")
```

Mudanças:
- Removido `PERCENTILE_CONT` de satisfação do CTE `medians`
- Removido `mediana_satisfacao` do SELECT
- `m.med_sat` → `:corte_sat` (parâmetro bindado)
- `m.med_vol` → `COALESCE(:corte_vol, m.med_vol)` (suporta override ou mediana)

- [ ] **Step 1.4: Atualizar `_calcular_status` em repository.py**

Substitua a função:

```python
def _calcular_status(satisfacao: float, corte: float = 4.0) -> str:
    return "bom" if satisfacao >= corte else "ruim"
```

- [ ] **Step 1.5: Atualizar `_query_periodo_matriz` em repository.py**

Substitua a função completa:

```python
async def _query_periodo_matriz(
    db: AsyncSession,
    ano: str,
    mes: str,
    localidade: str,
    corte_satisfacao: float = 4.0,
    corte_volume: float | None = None,
) -> dict:
    result = await db.execute(
        _SQL_PERIODO_MATRIZ,
        {
            "ano": ano,
            "mes": mes,
            "localidade": localidade,
            "corte_sat": corte_satisfacao,
            "corte_vol": corte_volume,
        },
    )
    rows = result.mappings().all()

    if not rows:
        return {"items": [], "mediana_volume": 0.0}

    mediana_volume = float(rows[0]["mediana_volume"])

    items = [
        {
            "nome": row["nome"],
            "categoria": row["categoria"],
            "volume": int(row["volume"]),
            "satisfacao": float(row["satisfacao"]),
            "quadrante": row["quadrante"],
        }
        for row in rows
    ]
    return {"items": items, "mediana_volume": mediana_volume}
```

- [ ] **Step 1.6: Atualizar `get_matriz_produtos` em repository.py**

Substitua a função completa (linhas 434–478):

```python
async def get_matriz_produtos(
    db: AsyncSession,
    ano: str = "",
    mes: str = "",
    localidade: str = "",
    limite_estrelas: int = 4,
    limite_oportunidades: int = 4,
    limite_alerta_vermelho: int = 4,
    limite_ofensores: int = 4,
    corte_satisfacao: float = 4.0,
    corte_volume: float | None = None,
) -> dict:
    atual = await _query_periodo_matriz(db, ano, mes, localidade, corte_satisfacao, corte_volume)

    if not atual["items"]:
        return {"items": [], "mediana_volume": 0.0}

    ano_ant, mes_ant = _periodo_anterior(ano, mes)
    anterior = await _query_periodo_matriz(db, ano_ant, mes_ant, localidade, corte_satisfacao, corte_volume)
    bloco_anterior_map = {item["nome"]: item["quadrante"] for item in anterior["items"]}

    for item in atual["items"]:
        item["bloco_anterior"] = bloco_anterior_map.get(item["nome"], "desconhecido")
        item["status"] = _calcular_status(item["satisfacao"], corte_satisfacao)

    quadrantes: dict[str, list] = {
        "estrelas": [],
        "oportunidades": [],
        "alerta_vermelho": [],
        "ofensores": [],
    }
    for item in atual["items"]:
        quadrantes[item["quadrante"]].append(item)

    # Estrelas: maior volume, desempate por maior nota
    quadrantes["estrelas"].sort(key=lambda x: (-x["volume"], -x["satisfacao"]))
    # Oportunidades: maior nota, desempate por maior volume
    quadrantes["oportunidades"].sort(key=lambda x: (-x["satisfacao"], -x["volume"]))
    # Alerta Vermelho: maior volume, desempate por menor nota
    quadrantes["alerta_vermelho"].sort(key=lambda x: (-x["volume"], x["satisfacao"]))
    # Ofensores: menor nota, desempate por menor volume
    quadrantes["ofensores"].sort(key=lambda x: (x["satisfacao"], x["volume"]))

    selecionados = (
        quadrantes["estrelas"][:limite_estrelas]
        + quadrantes["oportunidades"][:limite_oportunidades]
        + quadrantes["alerta_vermelho"][:limite_alerta_vermelho]
        + quadrantes["ofensores"][:limite_ofensores]
    )

    return {"items": selecionados, "mediana_volume": atual["mediana_volume"]}
```

- [ ] **Step 1.7: Adicionar testes de ordenação e corte em test_dashboard_service.py**

Adicione ao final do arquivo:

```python
@pytest.mark.asyncio
async def test_get_matriz_estrelas_ordenadas_por_volume(mock_db):
    dados_mock = mock_matriz_produtos()
    with patch("app.dashboard.repository.get_matriz_produtos", new=AsyncMock(return_value=dados_mock)):
        result = await service.get_matriz_produtos(mock_db)

    estrelas = [i for i in result.items if i.quadrante == "estrelas"]
    volumes = [i.volume for i in estrelas]
    assert volumes == sorted(volumes, reverse=True)


@pytest.mark.asyncio
async def test_get_matriz_oportunidades_ordenadas_por_nota(mock_db):
    dados_mock = mock_matriz_produtos()
    with patch("app.dashboard.repository.get_matriz_produtos", new=AsyncMock(return_value=dados_mock)):
        result = await service.get_matriz_produtos(mock_db)

    ops = [i for i in result.items if i.quadrante == "oportunidades"]
    notas = [i.satisfacao for i in ops]
    assert notas == sorted(notas, reverse=True)


@pytest.mark.asyncio
async def test_get_matriz_ofensores_ordenados_por_nota_crescente(mock_db):
    dados_mock = mock_matriz_produtos()
    with patch("app.dashboard.repository.get_matriz_produtos", new=AsyncMock(return_value=dados_mock)):
        result = await service.get_matriz_produtos(mock_db)

    ofensores = [i for i in result.items if i.quadrante == "ofensores"]
    notas = [i.satisfacao for i in ofensores]
    assert notas == sorted(notas)


@pytest.mark.asyncio
async def test_get_matriz_status_sem_neutro(mock_db):
    dados_mock = mock_matriz_produtos()
    with patch("app.dashboard.repository.get_matriz_produtos", new=AsyncMock(return_value=dados_mock)):
        result = await service.get_matriz_produtos(mock_db)

    for item in result.items:
        assert item.status in ("bom", "ruim")
        assert item.status != "neutro"
```

- [ ] **Step 1.8: Rodar testes**

```bash
cd backend
python -m pytest tests/dashboard/test_dashboard_service.py -v
```

Esperado: todos os testes passam, incluindo os 4 novos.

- [ ] **Step 1.9: Commit**

```bash
git add backend/app/dashboard/models.py backend/app/dashboard/repository.py backend/tests/dashboard/test_dashboard_service.py
git commit -m "fix(backend): corrige sql, ordenação e status da matriz de produtos"
```

---

## Task 2: Backend — Service e Router com novos parâmetros

**Files:**
- Modify: `backend/app/dashboard/service.py` (função `get_matriz_produtos`)
- Modify: `backend/app/dashboard/router.py` (endpoint `/matriz-produtos`)

- [ ] **Step 2.1: Atualizar `get_matriz_produtos` em service.py**

Substitua a função (linhas 108–123):

```python
async def get_matriz_produtos(
    db: AsyncSession,
    ano: str = "",
    mes: str = "",
    localidade: str = "",
    limite_estrelas: int = 4,
    limite_oportunidades: int = 4,
    limite_alerta_vermelho: int = 4,
    limite_ofensores: int = 4,
    corte_satisfacao: float = 4.0,
    corte_volume: float | None = None,
) -> MatrizProdutosResponse:
    data = await repository.get_matriz_produtos(
        db, ano, mes, localidade,
        limite_estrelas, limite_oportunidades, limite_alerta_vermelho, limite_ofensores,
        corte_satisfacao, corte_volume,
    )
    items = [MatrizProdutoItem(**item) for item in data["items"]]
    return MatrizProdutosResponse(items=items, mediana_volume=data["mediana_volume"])
```

- [ ] **Step 2.2: Atualizar endpoint `/matriz-produtos` em router.py**

Substitua a função `get_matriz_produtos` no router (linhas 108–125):

```python
@router.get("/matriz-produtos", response_model=MatrizProdutosResponse)
async def get_matriz_produtos(
    ano: str = "",
    mes: str = "",
    localidade: str = "",
    limite_estrelas: int = 4,
    limite_oportunidades: int = 4,
    limite_alerta_vermelho: int = 4,
    limite_ofensores: int = 4,
    corte_satisfacao: float = 4.0,
    corte_volume: float | None = None,
    db: AsyncSession = Depends(get_db),
):
    try:
        return await service.get_matriz_produtos(
            db, ano, mes, localidade,
            limite_estrelas, limite_oportunidades, limite_alerta_vermelho, limite_ofensores,
            corte_satisfacao, corte_volume,
        )
    except Exception:
        raise HTTPException(status_code=500, detail="Erro ao buscar matriz de produtos.")
```

- [ ] **Step 2.3: Rodar testes**

```bash
cd backend
python -m pytest tests/dashboard/test_dashboard_service.py -v
```

Esperado: todos os testes continuam passando.

- [ ] **Step 2.4: Commit**

```bash
git add backend/app/dashboard/service.py backend/app/dashboard/router.py
git commit -m "feat(backend): expõe corte_satisfacao e corte_volume no endpoint da matriz"
```

---

## Task 3: Frontend — Types, Service e Hook

**Files:**
- Modify: `frontend/src/types/dashboard.ts`
- Modify: `frontend/src/services/dashboardService.ts`
- Modify: `frontend/src/hooks/useDashboard.ts`

- [ ] **Step 3.1: Atualizar `LimitesBloco` em types/dashboard.ts**

Substitua a interface `LimitesBloco` (linhas 81–86):

```typescript
export interface LimitesBloco {
  limite_estrelas: number
  limite_oportunidades: number
  limite_alerta_vermelho: number
  limite_ofensores: number
  corte_satisfacao: number
  corte_volume: number | null
}
```

- [ ] **Step 3.2: Atualizar `buscarMatrizProdutos` em dashboardService.ts**

Substitua o método `buscarMatrizProdutos` (linhas 63–72):

```typescript
  buscarMatrizProdutos: (params: {
    ano?: string
    mes?: string
    localidade?: string
  } & Partial<LimitesBloco> = {}) =>
    api
      .get<MatrizProdutosDados>('/dashboard/matriz-produtos', {
        params: {
          ...params,
          mes: normalizarMes(params.mes),
          corte_volume: params.corte_volume ?? undefined,
        },
      })
      .then((r) => r.data),
```

O `?? undefined` garante que `null` não seja enviado como string `"null"` na URL — o Axios omite `undefined` automaticamente, deixando o backend usar o default (mediana dinâmica).

- [ ] **Step 3.3: Atualizar `useMatrizProdutos` em useDashboard.ts**

Substitua a função (linhas 75–91):

```typescript
export function useMatrizProdutos(filtros: FiltrosPeriodo, limites: LimitesBloco) {
  return useQuery({
    queryKey: [
      'dashboard', 'matriz-produtos',
      filtros.ano, filtros.mes, filtros.localidade,
      limites.limite_estrelas, limites.limite_oportunidades,
      limites.limite_alerta_vermelho, limites.limite_ofensores,
      limites.corte_satisfacao, limites.corte_volume,
    ],
    queryFn: () =>
      dashboardService.buscarMatrizProdutos({
        ano: filtros.ano || undefined,
        mes: filtros.mes || undefined,
        localidade: filtros.localidade || undefined,
        ...limites,
      }),
  })
}
```

- [ ] **Step 3.4: Commit**

```bash
git add frontend/src/types/dashboard.ts frontend/src/services/dashboardService.ts frontend/src/hooks/useDashboard.ts
git commit -m "feat(frontend): atualiza tipos, service e hook da matriz com cortes configuráveis"
```

---

## Task 4: Frontend — TooltipMatriz com quadrante atual

**Files:**
- Modify: `frontend/src/components/molecules/dashboard/TooltipMatriz.tsx`

- [ ] **Step 4.1: Reescrever TooltipMatriz.tsx**

```typescript
const ROTULO_QUADRANTE: Record<string, string> = {
  estrelas:        'Estrelas',
  oportunidades:   'Oportunidades',
  alerta_vermelho: 'Alerta Vermelho',
  ofensores:       'Ofensores',
  desconhecido:    '—',
}

interface Props {
  nome: string
  categoria: string
  volume: number
  satisfacao: number
  quadrante: string
  bloco_anterior: string
}

export function TooltipMatriz({ nome, categoria, volume, satisfacao, quadrante, bloco_anterior }: Props) {
  return (
    <div className="bg-white border border-[#e0e0e0] rounded-[5px] p-2 text-[11px] shadow-sm whitespace-nowrap">
      <p className="font-semibold text-[#1d5358]">{nome}</p>
      <p className="text-[#666666]">Categoria: {categoria}</p>
      <p>
        Volume: {volume.toLocaleString('pt-BR')}
        <span className="mx-1 text-[#b0b0b0]">•</span>
        Satisfação: {satisfacao.toFixed(1)} ★
      </p>
      <p className="text-[#343434] mt-0.5">
        Quadrante: <span className="font-medium">{ROTULO_QUADRANTE[quadrante] ?? quadrante}</span>
      </p>
      <p className="text-[#666666] mt-0.5">
        Período anterior:{' '}
        <span className="font-medium text-[#343434]">
          {ROTULO_QUADRANTE[bloco_anterior] ?? bloco_anterior}
        </span>
      </p>
    </div>
  )
}
```

- [ ] **Step 4.2: Commit**

```bash
git add frontend/src/components/molecules/dashboard/TooltipMatriz.tsx
git commit -m "feat(frontend): adiciona quadrante atual no tooltip da matriz"
```

---

## Task 5: Frontend — PainelLimitesBloco com seção de cortes

**Files:**
- Modify: `frontend/src/components/molecules/dashboard/PainelLimitesBloco.tsx`

- [ ] **Step 5.1: Reescrever PainelLimitesBloco.tsx**

```typescript
import { useState } from 'react'
import { RotateCcw } from 'lucide-react'
import { StepperNumerico } from '../../atoms/dashboard/StepperNumerico'
import type { LimitesBloco } from '../../../types/dashboard'

interface Props {
  limites: LimitesBloco
  maxVolume: number
  medianaVolume: number
  onAplicar: (limites: LimitesBloco) => void
}

const ROTULOS_QUADRANTE: { chave: keyof LimitesBloco; label: string }[] = [
  { chave: 'limite_estrelas',        label: 'Estrelas' },
  { chave: 'limite_oportunidades',   label: 'Oportunidades' },
  { chave: 'limite_alerta_vermelho', label: 'Alerta Vermelho' },
  { chave: 'limite_ofensores',       label: 'Ofensores' },
]

const PADRAO: Pick<LimitesBloco, 'corte_satisfacao' | 'corte_volume'> = {
  corte_satisfacao: 4.0,
  corte_volume: null,
}

function validarCortes(
  corteSat: number,
  corteVol: number | null,
  maxVolume: number,
): string | null {
  if (corteSat < 1.0 || corteSat > 4.9)
    return 'Corte de satisfação deve estar entre 1,0 e 4,9'
  if (corteVol !== null) {
    if (corteVol < 1)
      return 'Corte de volume deve ser maior que zero'
    if (maxVolume > 0 && corteVol >= maxVolume)
      return 'Corte de volume muito alto: todos os produtos ficariam em baixa performance'
  }
  return null
}

export function PainelLimitesBloco({ limites, maxVolume, medianaVolume, onAplicar }: Props) {
  const [rascunho, setRascunho] = useState<LimitesBloco>(limites)
  const [volumeFixo, setVolumeFixo] = useState(limites.corte_volume !== null)
  const [corteVolInput, setCorteVolInput] = useState(
    limites.corte_volume !== null ? String(limites.corte_volume) : String(Math.round(medianaVolume))
  )

  const corteVol = volumeFixo ? parseFloat(corteVolInput) || null : null
  const erroValidacao = validarCortes(rascunho.corte_satisfacao, corteVol, maxVolume)

  function handleAplicar() {
    if (erroValidacao) return
    onAplicar({ ...rascunho, corte_volume: corteVol })
  }

  function handleRestaurar() {
    setRascunho((prev) => ({ ...prev, ...PADRAO }))
    setVolumeFixo(false)
    setCorteVolInput(String(Math.round(medianaVolume)))
  }

  return (
    <div className="bg-white border border-[#e0e0e0] rounded-[5px] shadow-md p-3 min-w-[260px]">

      {/* Seção 1: Produtos por quadrante */}
      <p className="text-[11px] font-semibold text-[#1d5358] mb-2">Produtos por quadrante</p>
      <div className="flex flex-col gap-2 mb-4">
        {ROTULOS_QUADRANTE.map(({ chave, label }) => (
          <div key={chave} className="flex items-center justify-between gap-4">
            <span className="text-[11px] text-[#4d4d4d]">{label}</span>
            <StepperNumerico
              valor={rascunho[chave] as number}
              onChange={(v) => setRascunho((prev) => ({ ...prev, [chave]: v }))}
            />
          </div>
        ))}
      </div>

      <div className="border-t border-[#f0f0f0] my-3" />

      {/* Seção 2: Cortes da matriz */}
      <div className="flex items-center justify-between mb-2">
        <p className="text-[11px] font-semibold text-[#1d5358]">Cortes da matriz</p>
        <button
          onClick={handleRestaurar}
          className="flex items-center gap-1 text-[10px] text-[#888] hover:text-[#1d5358] transition-colors"
          title="Restaurar padrões"
        >
          <RotateCcw size={11} />
          Padrões
        </button>
      </div>

      {/* Corte de satisfação */}
      <div className="flex flex-col gap-1 mb-3">
        <div className="flex items-center justify-between">
          <span className="text-[11px] text-[#4d4d4d]">Satisfação ≥</span>
          <div className="flex items-center gap-1">
            <input
              type="number"
              min={1.0}
              max={4.9}
              step={0.1}
              value={rascunho.corte_satisfacao}
              onChange={(e) => {
                const v = parseFloat(e.target.value)
                if (!isNaN(v)) setRascunho((prev) => ({ ...prev, corte_satisfacao: Math.round(v * 10) / 10 }))
              }}
              className="w-14 h-6 text-center text-[11px] border border-[#e0e0e0] rounded-[4px] focus:outline-none focus:border-[#1d5358]"
            />
            <span className="text-[10px] text-[#888]">/ 5,0</span>
          </div>
        </div>
      </div>

      {/* Corte de volume */}
      <div className="flex flex-col gap-1 mb-3">
        <div className="flex items-center justify-between">
          <span className="text-[11px] text-[#4d4d4d]">Volume</span>
          <button
            onClick={() => {
              setVolumeFixo((v) => !v)
              if (!volumeFixo) setCorteVolInput(String(Math.round(medianaVolume)))
            }}
            className={`text-[10px] px-2 py-0.5 rounded border transition-colors ${
              volumeFixo
                ? 'border-[#1d5358] text-[#1d5358] bg-[#f0f7f7]'
                : 'border-[#e0e0e0] text-[#888] hover:border-[#1d5358] hover:text-[#1d5358]'
            }`}
          >
            {volumeFixo ? 'Valor fixo' : 'Mediana dinâmica'}
          </button>
        </div>
        {volumeFixo && (
          <div className="flex items-center justify-between mt-1">
            <span className="text-[10px] text-[#888]">Valor de corte</span>
            <input
              type="number"
              min={1}
              step={1}
              value={corteVolInput}
              onChange={(e) => setCorteVolInput(e.target.value)}
              className="w-20 h-6 text-center text-[11px] border border-[#e0e0e0] rounded-[4px] focus:outline-none focus:border-[#1d5358]"
            />
          </div>
        )}
        {!volumeFixo && (
          <p className="text-[10px] text-[#aaa] text-right">
            atual: {Math.round(medianaVolume).toLocaleString('pt-BR')} vendas
          </p>
        )}
      </div>

      {/* Erro de validação */}
      {erroValidacao && (
        <p className="text-[10px] text-[#c20000] mb-2 leading-tight">{erroValidacao}</p>
      )}

      <button
        onClick={handleAplicar}
        disabled={!!erroValidacao}
        className="w-full h-[28px] bg-[#1d5358] text-white text-[11px] font-medium rounded-[4px] hover:bg-[#174347] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
      >
        Aplicar
      </button>
    </div>
  )
}
```

- [ ] **Step 5.2: Commit**

```bash
git add frontend/src/components/molecules/dashboard/PainelLimitesBloco.tsx
git commit -m "feat(frontend): expande painel com cortes configuráveis de satisfação e volume"
```

---

## Task 6: Frontend — Reescrita de MatrizSatisfacaoPerformance

**Files:**
- Modify: `frontend/src/components/organisms/dashboard/MatrizSatisfacaoPerformance.tsx`

- [ ] **Step 6.1: Reescrever o componente completo**

Substitua o conteúdo completo do arquivo:

```typescript
import { useState, useEffect, useRef, useMemo, useCallback } from 'react'
import { Settings } from 'lucide-react'
import {
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  ReferenceLine,
  ReferenceArea,
  Label,
} from 'recharts'
import { FiltroPeriodo, type FiltrosPeriodo } from '../../molecules/compartilhados/FiltroPeriodo'
import { TooltipMatriz } from '../../molecules/dashboard/TooltipMatriz'
import { PainelLimitesBloco } from '../../molecules/dashboard/PainelLimitesBloco'
import { useMatrizProdutos } from '../../../hooks/useDashboard'
import type { LimitesBloco, MatrizProdutoItem } from '../../../types/dashboard'

// ─── Constantes visuais ───────────────────────────────────────────────────────

const DOM_Y: [number, number] = [1, 5]
const LIMITES_PADRAO: LimitesBloco = {
  limite_estrelas: 4,
  limite_oportunidades: 4,
  limite_alerta_vermelho: 4,
  limite_ofensores: 4,
  corte_satisfacao: 4.0,
  corte_volume: null,
}
const NOTE_TOLERANCE = 0.2
const DOT_R = 5
const PILL_H = 25
const PILL_DOT_R = 5
const PILL_DOT_CX = 10
const PILL_PAD_LEFT = 22
const PILL_PAD_RIGHT = 8
const PILL_CHEVRON_W = 14
const LABEL_FONT = 11
const CHART_MARGIN = { top: 16, right: 24, left: 36, bottom: 20 }
const CHART_H = 400

const COR_PONTO: Record<string, string> = {
  bom:  '#1a9a45',
  ruim: '#c20000',
}

// ─── Tipos internos ───────────────────────────────────────────────────────────

type ProdutoBase = MatrizProdutoItem

interface ProdutoAgrupado extends ProdutoBase {
  membros: ProdutoBase[]
}

interface ProdutoComLabel extends ProdutoAgrupado {
  labelDx: number
  labelDy: number
}

// ─── Helpers de agrupamento ───────────────────────────────────────────────────

function agruparPorProximidade(items: ProdutoBase[], limiar = NOTE_TOLERANCE): ProdutoAgrupado[] {
  if (items.length === 0) return []
  // items já chegam ordenados pelo backend — o primeiro de cada grupo é o produto principal
  const grupos: ProdutoBase[][] = []
  let grupo: ProdutoBase[] = [items[0]]
  let ancora = items[0].satisfacao
  for (let i = 1; i < items.length; i++) {
    if (Math.abs(items[i].satisfacao - ancora) <= limiar) {
      grupo.push(items[i])
    } else {
      grupos.push(grupo)
      grupo = [items[i]]
      ancora = items[i].satisfacao
    }
  }
  grupos.push(grupo)
  return grupos.map((g) => {
    const principal = g[0]
    const avgSat = g.reduce((s, p) => s + p.satisfacao, 0) / g.length
    const avgVol = Math.round(g.reduce((s, p) => s + p.volume, 0) / g.length)
    return { ...principal, satisfacao: avgSat, volume: avgVol, membros: g }
  })
}

function agruparTodos(items: ProdutoBase[]): ProdutoAgrupado[] {
  const porQuadrante: Record<string, ProdutoBase[]> = {
    estrelas: [], oportunidades: [], alerta_vermelho: [], ofensores: [],
  }
  for (const item of items) {
    porQuadrante[item.quadrante]?.push(item)
  }
  return Object.values(porQuadrante).flatMap((grupo) => agruparPorProximidade(grupo))
}

// ─── Posicionamento de labels ─────────────────────────────────────────────────

function calcLabelPositions(
  items: ProdutoAgrupado[],
  containerWidth: number,
  domX: [number, number],
): ProdutoComLabel[] {
  const plotW = containerWidth - CHART_MARGIN.left - CHART_MARGIN.right
  const plotH = CHART_H - CHART_MARGIN.top - CHART_MARGIN.bottom
  const toPixX = (v: number) =>
    CHART_MARGIN.left + ((v - domX[0]) / (domX[1] - domX[0])) * plotW
  const toPixY = (v: number) =>
    CHART_MARGIN.top + ((DOM_Y[1] - v) / (DOM_Y[1] - DOM_Y[0])) * plotH

  type Box = { x: number; y: number; w: number; h: number }
  const placed: Box[] = []

  const overlaps = (b: Box) =>
    placed.some(
      (p) =>
        b.x < p.x + p.w + 2 && b.x + b.w + 2 > p.x &&
        b.y < p.y + p.h + 2 && b.y + b.h + 2 > p.y,
    )

  return items.map((item) => {
    const px = toPixX(item.volume)
    const py = toPixY(item.satisfacao)
    const isGrupo = item.membros.length > 1
    const lw =
      item.nome.length * 6.5 + PILL_PAD_LEFT + PILL_PAD_RIGHT + (isGrupo ? PILL_CHEVRON_W : 0)

    const BASE_DX = -PILL_DOT_CX
    const BASE_DY = -PILL_H / 2
    const candidates: [number, number][] = [
      [BASE_DX, BASE_DY],
      [BASE_DX, BASE_DY - PILL_H - 4],
      [BASE_DX, BASE_DY + PILL_H + 4],
      [-lw + PILL_DOT_CX, BASE_DY],
      [-lw + PILL_DOT_CX, BASE_DY - PILL_H - 4],
      [-lw + PILL_DOT_CX, BASE_DY + PILL_H + 4],
      [-lw / 2, BASE_DY - PILL_H - DOT_R - 5],
      [-lw / 2, BASE_DY + PILL_H + DOT_R + 5],
    ]

    let dx = candidates[0][0]
    let dy = candidates[0][1]
    for (const [cdx, cdy] of candidates) {
      const box: Box = { x: px + cdx, y: py + cdy, w: lw, h: PILL_H }
      if (!overlaps(box)) {
        dx = cdx; dy = cdy
        placed.push(box)
        break
      }
    }
    if (!placed.some((p) => p.x === px + dx && p.y === py + dy)) {
      placed.push({ x: px + dx, y: py + dy, w: lw, h: PILL_H })
    }
    return { ...item, labelDx: dx, labelDy: dy }
  })
}

// ─── Componentes SVG auxiliares ───────────────────────────────────────────────

function LabelQuadrante({
  viewBox,
  texto,
  corTexto,
  corFundo,
  ancoragem,
  vazio,
}: {
  viewBox?: { x: number; y: number; width: number; height: number }
  texto: string
  corTexto: string
  corFundo: string
  ancoragem: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right'
  vazio?: boolean
}) {
  if (!viewBox) return null
  const { x, y, width, height } = viewBox
  const PAD_X = 8
  const PAD_Y = 6
  const FONT = 10
  const CHAR_W = 6.5
  const textWidth = texto.length * CHAR_W
  const boxWidth = textWidth + PAD_X * 2
  const boxHeight = FONT + PAD_Y * 2
  let bx = x, by = y
  if (ancoragem === 'top-left')     { bx = x + 6;                    by = y + 6 }
  if (ancoragem === 'top-right')    { bx = x + width - boxWidth - 6; by = y + 6 }
  if (ancoragem === 'bottom-left')  { bx = x + 6;                    by = y + height - boxHeight - 6 }
  if (ancoragem === 'bottom-right') { bx = x + width - boxWidth - 6; by = y + height - boxHeight - 6 }

  const VAZIO_MSG = 'Nenhum produto neste quadrante'
  const VAZIO_FONT = 9
  const vazioCx = x + width / 2
  const vazioCy = y + height / 2

  return (
    <g>
      <rect x={bx} y={by} width={boxWidth} height={boxHeight} rx={4} ry={4} fill={corFundo} />
      <text x={bx + PAD_X} y={by + PAD_Y + FONT - 1} fontSize={FONT} fontWeight={700} fontFamily="inherit" fill={corTexto}>
        {texto}
      </text>
      {vazio && (
        <text
          x={vazioCx} y={vazioCy}
          textAnchor="middle" dominantBaseline="middle"
          fontSize={VAZIO_FONT} fill="#b0b0b0" fontFamily="inherit" fontStyle="italic"
        >
          {VAZIO_MSG}
        </text>
      )}
    </g>
  )
}

// ─── Componente principal ─────────────────────────────────────────────────────

interface Props {
  filtrosGlobais: FiltrosPeriodo
}

interface TooltipPill {
  cx: number; cy: number; ldx: number; ldy: number; lw: number
  produto: ProdutoBase
}

interface GrupoAberto {
  key: string; cx: number; cy: number; ldx: number; ldy: number; lw: number
  membros: ProdutoBase[]
}

interface TooltipDrop {
  produto: ProdutoBase; left: number; top: number
}

export function MatrizSatisfacaoPerformance({ filtrosGlobais }: Props) {
  const [filtros, setFiltros] = useState(filtrosGlobais)
  const [limites, setLimites] = useState<LimitesBloco>(LIMITES_PADRAO)
  const [painelAberto, setPainelAberto] = useState(false)
  const [chartWidth, setChartWidth] = useState(1000)
  const [tooltipPill, setTooltipPill] = useState<TooltipPill | null>(null)
  const [grupoAberto, setGrupoAberto] = useState<GrupoAberto | null>(null)
  const [tooltipDrop, setTooltipDrop] = useState<TooltipDrop | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const chartAreaRef = useRef<HTMLDivElement>(null)
  const painelRef = useRef<HTMLDivElement>(null)

  const clearPillHover = useCallback(() => setTooltipPill(null), [])

  useEffect(() => { setFiltros(filtrosGlobais) }, [filtrosGlobais])

  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    const obs = new ResizeObserver(([entry]) => setChartWidth(entry.contentRect.width))
    obs.observe(el)
    return () => obs.disconnect()
  }, [])

  useEffect(() => {
    if (!painelAberto) return
    const handler = (e: MouseEvent) => {
      if (painelRef.current && !painelRef.current.contains(e.target as Node))
        setPainelAberto(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [painelAberto])

  const { data, isLoading, isError } = useMatrizProdutos(filtros, limites)

  const corteX = limites.corte_volume ?? data?.mediana_volume ?? 1750
  const corteY = limites.corte_satisfacao

  const medianaVolume = data?.mediana_volume ?? 0
  const maxVolume = useMemo(
    () => data?.items.reduce((m, i) => Math.max(m, i.volume), 0) ?? 0,
    [data],
  )

  const domX = useMemo<[number, number]>(() => {
    const ref = Math.max(corteX, maxVolume)
    return [0, Math.ceil(ref * 1.3) || 3800]
  }, [corteX, maxVolume])

  const produtos = useMemo(
    () => calcLabelPositions(agruparTodos(data?.items ?? []), chartWidth, domX),
    [data, chartWidth, domX],
  )

  const quadrantesVazios = useMemo(() => {
    const presentes = new Set((data?.items ?? []).map((i) => i.quadrante))
    return {
      estrelas:        !presentes.has('estrelas'),
      oportunidades:   !presentes.has('oportunidades'),
      alerta_vermelho: !presentes.has('alerta_vermelho'),
      ofensores:       !presentes.has('ofensores'),
    }
  }, [data])

  return (
    <div ref={containerRef} className="relative bg-white border-2 border-[#e0e0e0] rounded-[5px] p-4 flex flex-col">
      {/* Controles superiores */}
      <div className="absolute top-[7px] right-[75px] flex items-center gap-2">
        <div ref={painelRef} className="relative">
          <button
            onClick={() => setPainelAberto((v) => !v)}
            className={`flex items-center justify-center w-[30px] h-[30px] rounded border transition-colors ${
              painelAberto
                ? 'border-[#1d5358] text-[#1d5358] bg-[#f0f7f7]'
                : 'border-[#e0e0e0] text-[#666] hover:border-[#1d5358] hover:text-[#1d5358]'
            }`}
            title="Configurar produtos e cortes da matriz"
          >
            <Settings size={14} />
          </button>
          {painelAberto && (
            <div className="absolute right-0 top-full mt-1 z-50">
              <PainelLimitesBloco
                limites={limites}
                maxVolume={maxVolume}
                medianaVolume={medianaVolume}
                onAplicar={(novos) => { setLimites(novos); setPainelAberto(false) }}
              />
            </div>
          )}
        </div>
        <FiltroPeriodo filtros={filtros} onChange={setFiltros} />
      </div>

      <div className="mb-2 pr-4">
        <h3 className="text-[18px] font-bold text-[#1d5358]">
          Matriz de Satisfação vs. Performance
        </h3>
      </div>

      <div ref={chartAreaRef} className="relative" style={{ height: CHART_H }}>
        {isLoading && (
          <div className="flex items-center justify-center h-full text-[#4d4d4d] text-sm">Carregando...</div>
        )}
        {isError && (
          <div className="flex items-center justify-center h-full text-[#c20000] text-sm">Erro ao carregar dados</div>
        )}

        {!isLoading && !isError && (
          <ResponsiveContainer width="100%" height="100%">
            <ScatterChart margin={CHART_MARGIN} onMouseLeave={clearPillHover}>
              <CartesianGrid strokeDasharray="4 4" stroke="#e8e8e8" />

              <XAxis type="number" dataKey="volume" name="Volume" domain={domX}
                tick={{ fontSize: 9, fill: '#343434' }} axisLine={false} tickLine={false}>
                <Label value="Volume de vendas" position="insideBottom" offset={-14} fontSize={11} fill="#343434" />
              </XAxis>

              <YAxis type="number" dataKey="satisfacao" name="Satisfação" domain={DOM_Y}
                tick={{ fontSize: 9, fill: '#343434' }} axisLine={false} tickLine={false} width={36}>
                <Label value="Satisfação ★" angle={-90} position="insideLeft" offset={10} fontSize={11} fill="#343434" />
              </YAxis>

              {/* Quadrantes */}
              <ReferenceArea x1={domX[0]} x2={corteX} y1={corteY} y2={DOM_Y[1]}
                fill="#FFF9C9" fillOpacity={0.6} stroke="none"
                label={(props) => (
                  <LabelQuadrante {...props} texto="OPORTUNIDADES" corTexto="#D97706" corFundo="#FFF9C9"
                    ancoragem="top-left" vazio={quadrantesVazios.oportunidades} />
                )}
              />
              <ReferenceArea x1={corteX} x2={domX[1]} y1={corteY} y2={DOM_Y[1]}
                fill="#DCFCE7" fillOpacity={0.6} stroke="none"
                label={(props) => (
                  <LabelQuadrante {...props} texto="ESTRELAS" corTexto="#15803D" corFundo="#DCFCE7"
                    ancoragem="top-right" vazio={quadrantesVazios.estrelas} />
                )}
              />
              <ReferenceArea x1={domX[0]} x2={corteX} y1={DOM_Y[0]} y2={corteY}
                fill="#F3F4F6" fillOpacity={0.6} stroke="none"
                label={(props) => (
                  <LabelQuadrante {...props} texto="OFENSORES" corTexto="#4B5563" corFundo="#F3F4F6"
                    ancoragem="bottom-left" vazio={quadrantesVazios.ofensores} />
                )}
              />
              <ReferenceArea x1={corteX} x2={domX[1]} y1={DOM_Y[0]} y2={corteY}
                fill="#FEE2E2" fillOpacity={0.6} stroke="none"
                label={(props) => (
                  <LabelQuadrante {...props} texto="ALERTA VERMELHO" corTexto="#B91C1C" corFundo="#FEE2E2"
                    ancoragem="bottom-right" vazio={quadrantesVazios.alerta_vermelho} />
                )}
              />

              {/* Divisórias */}
              <ReferenceLine x={corteX} stroke="#94A3B8" strokeWidth={1} strokeDasharray="5 4" />
              <ReferenceLine y={corteY} stroke="#94A3B8" strokeWidth={1} strokeDasharray="5 4" />

              {/* Pílulas */}
              <Scatter
                data={produtos}
                shape={(props: { cx?: number; cy?: number; payload?: ProdutoComLabel }) => {
                  const { cx = 0, cy = 0, payload } = props
                  if (!payload) return <g />
                  const cor = COR_PONTO[payload.status] ?? '#b0b0b0'
                  const { nome, labelDx: ldx, labelDy: ldy } = payload
                  const isGrupo = payload.membros.length > 1
                  const lw = nome.length * 6.5 + PILL_PAD_LEFT + PILL_PAD_RIGHT + (isGrupo ? PILL_CHEVRON_W : 0)
                  const grupoKey = `${payload.volume}|${payload.satisfacao}|${payload.quadrante}`
                  const isAberto = grupoAberto?.key === grupoKey

                  return (
                    <g
                      onClick={() => {
                        if (!isGrupo) return
                        setTooltipPill(null)
                        setGrupoAberto((prev) =>
                          prev?.key === grupoKey
                            ? null
                            : { key: grupoKey, cx, cy, ldx, ldy, lw, membros: payload.membros },
                        )
                      }}
                      onMouseEnter={() => {
                        if (!isGrupo) setTooltipPill({ cx, cy, ldx, ldy, lw, produto: payload })
                      }}
                      onMouseLeave={clearPillHover}
                      style={{ cursor: isGrupo ? 'pointer' : 'default' }}
                    >
                      <rect
                        x={cx + ldx} y={cy + ldy} width={lw} height={PILL_H}
                        fill={isAberto ? '#f0f0f0' : 'white'}
                        stroke={isAberto ? '#aaa' : '#d0d0d0'}
                        strokeWidth={1} rx={PILL_H / 2} ry={PILL_H / 2}
                      />
                      <circle cx={cx + ldx + PILL_DOT_CX} cy={cy + ldy + PILL_H / 2} r={PILL_DOT_R} fill={cor} />
                      <text
                        x={cx + ldx + PILL_PAD_LEFT}
                        y={cy + ldy + PILL_H / 2 + LABEL_FONT / 2 - 1}
                        fontSize={LABEL_FONT} fontWeight={500} fontFamily="inherit" fill="#343434"
                        style={{ pointerEvents: 'none' }}
                      >
                        {nome}
                      </text>
                      {isGrupo && (
                        <text
                          x={cx + ldx + PILL_PAD_LEFT + nome.length * 6.5 + 3}
                          y={cy + ldy + PILL_H / 2 + LABEL_FONT / 2 - 1}
                          fontSize={13} fill="#555" fontFamily="inherit"
                          style={{ pointerEvents: 'none' }}
                        >
                          ▾
                        </text>
                      )}
                    </g>
                  )
                }}
              />
            </ScatterChart>
          </ResponsiveContainer>
        )}

        {/* Tooltip de pílula individual */}
        {tooltipPill && (
          <div
            className="absolute pointer-events-none z-50"
            style={{
              left: tooltipPill.cx + tooltipPill.ldx + tooltipPill.lw / 2,
              top: tooltipPill.cy + tooltipPill.ldy + PILL_H + 6,
              transform: 'translateX(-50%)',
            }}
          >
            <TooltipMatriz
              nome={tooltipPill.produto.nome}
              categoria={tooltipPill.produto.categoria}
              volume={tooltipPill.produto.volume}
              satisfacao={tooltipPill.produto.satisfacao}
              quadrante={tooltipPill.produto.quadrante}
              bloco_anterior={tooltipPill.produto.bloco_anterior}
            />
          </div>
        )}

        {/* Overlay para fechar dropdown */}
        {grupoAberto && (
          <div
            className="fixed inset-0 z-40"
            onClick={() => { setGrupoAberto(null); setTooltipDrop(null) }}
          />
        )}

        {/* Dropdown de grupo */}
        {grupoAberto && (
          <div
            className="absolute z-50 bg-white border border-[#e0e0e0] rounded-[5px] shadow-md py-1 min-w-[140px]"
            style={{
              left: grupoAberto.cx + grupoAberto.ldx,
              top: grupoAberto.cy + grupoAberto.ldy + PILL_H + 4,
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {(() => {
              const porAvaliacao = new Map<number, ProdutoBase[]>()
              for (const m of grupoAberto.membros) {
                if (!porAvaliacao.has(m.satisfacao)) porAvaliacao.set(m.satisfacao, [])
                porAvaliacao.get(m.satisfacao)!.push(m)
              }
              return Array.from(porAvaliacao.entries())
                .sort(([a], [b]) => b - a)
                .map(([sat, membros]) => (
                  <div key={sat}>
                    <div className="px-3 pt-2 pb-0.5 text-[9px] font-semibold text-[#888] tracking-wide">
                      {sat.toFixed(1)} <span style={{ color: '#FBBF24' }}>★</span>
                    </div>
                    {membros.map((membro) => (
                      <div
                        key={membro.nome}
                        className="px-3 py-1.5 text-[11px] text-[#343434] hover:bg-[#f5f5f5] cursor-default"
                        onMouseEnter={(e) => {
                          const itemRect = (e.currentTarget as HTMLElement).getBoundingClientRect()
                          const chartRect = chartAreaRef.current?.getBoundingClientRect()
                          if (!chartRect) return
                          setTooltipDrop({
                            produto: membro,
                            left: itemRect.left - chartRect.left + itemRect.width / 2,
                            top: itemRect.bottom - chartRect.top + 4,
                          })
                        }}
                        onMouseLeave={() => setTooltipDrop(null)}
                      >
                        {membro.nome}
                      </div>
                    ))}
                  </div>
                ))
            })()}
          </div>
        )}

        {/* Tooltip de item do dropdown */}
        {tooltipDrop && (
          <div
            className="absolute pointer-events-none z-[60]"
            style={{
              left: tooltipDrop.left,
              top: tooltipDrop.top,
              transform: 'translateX(-50%)',
            }}
          >
            <TooltipMatriz
              nome={tooltipDrop.produto.nome}
              categoria={tooltipDrop.produto.categoria}
              volume={tooltipDrop.produto.volume}
              satisfacao={tooltipDrop.produto.satisfacao}
              quadrante={tooltipDrop.produto.quadrante}
              bloco_anterior={tooltipDrop.produto.bloco_anterior}
            />
          </div>
        )}
      </div>

      {/* Legenda */}
      <div className="flex items-center gap-4 mt-2 text-[10px] text-[#343434]">
        {[
          { cor: '#1a9a45', label: 'Alta satisfação' },
          { cor: '#c20000', label: 'Baixa satisfação' },
        ].map(({ cor, label }) => (
          <div key={label} className="flex items-center gap-1">
            <span className="inline-block w-2 h-2 rounded-full" style={{ backgroundColor: cor }} />
            <span>{label}</span>
          </div>
        ))}
        {limites.corte_volume !== null && (
          <span className="ml-auto text-[#888]">
            Corte volume: {limites.corte_volume.toLocaleString('pt-BR')} · Satisfação: {limites.corte_satisfacao.toFixed(1)}
          </span>
        )}
      </div>
    </div>
  )
}
```

- [ ] **Step 6.2: Verificar se há erros de TypeScript**

```bash
cd frontend
npx tsc --noEmit
```

Esperado: sem erros. Se houver erros relacionados ao `import type { FiltrosPeriodo }` (o componente ainda importa de `../../molecules/compartilhados/FiltroPeriodo`), verifique se o path está correto com a estrutura de pastas atual.

- [ ] **Step 6.3: Commit**

```bash
git add frontend/src/components/organisms/dashboard/MatrizSatisfacaoPerformance.tsx
git commit -m "feat(frontend): reescreve matriz com corte 4.0, agrupamento por quadrante, estados vazios e tooltip completo"
```

---

## Verificação Final

- [ ] Iniciar backend e frontend, abrir o dashboard

```bash
# Terminal 1
cd backend && uvicorn app.main:app --reload --port 8080

# Terminal 2
cd frontend && pnpm dev
```

- [ ] Checar cada item da spec:
  - [ ] Corte Y na linha 4.0 (não 3.0)
  - [ ] Quadrantes com cores e rótulos corretos
  - [ ] Produtos em verde (≥ 4.0) e vermelho (< 4.0), sem cinza "neutro"
  - [ ] Legenda sem "Neutro"
  - [ ] Tooltip mostra quadrante atual + período anterior
  - [ ] Painel de configuração tem seção "Cortes da matriz"
  - [ ] Corte de satisfação (1.0–4.9) bloqueia valores inválidos
  - [ ] Toggle volume: "Mediana dinâmica" vs "Valor fixo"
  - [ ] Botão "Padrões" restaura corte_satisfacao=4.0 e corte_volume=null
  - [ ] Quadrantes sem produtos mostram mensagem "Nenhum produto neste quadrante"
  - [ ] Agrupamento não mistura produtos de quadrantes diferentes
  - [ ] Filtros recalculam tudo (ano, mês, localidade)

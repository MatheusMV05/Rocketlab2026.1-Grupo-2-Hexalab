import { useState, useEffect, useRef, useMemo, useCallback } from 'react'
import { Settings, AlertCircle } from 'lucide-react'
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
const DOM_X: [number, number] = [0, 100]
const LS_LIMITES = 'dashboard_matriz_limites'
const LIMITES_PADRAO: LimitesBloco = {
  limite_estrelas: 4,
  limite_oportunidades: 4,
  limite_alerta_vermelho: 4,
  limite_ofensores: 4,
  corte_satisfacao: 4.0,
  corte_volume: 50,
}

function loadLimites(): LimitesBloco {
  try {
    const s = localStorage.getItem(LS_LIMITES)
    if (!s) return LIMITES_PADRAO
    const parsed = JSON.parse(s) as Partial<LimitesBloco>
    return { ...LIMITES_PADRAO, ...parsed }
  } catch {
    return LIMITES_PADRAO
  }
}
const RATING_GROUP_TOLERANCE = 0.2
const X_GROUP_TOLERANCE = 5
const PILL_H = 25
const PILL_DOT_R = 5
const PILL_DOT_CX = 10
const PILL_PAD_LEFT = 22
const PILL_PAD_RIGHT = 8
const PILL_CHEVRON_W = 14
const LABEL_FONT = 11
const CHART_MARGIN = { top: 16, right: 24, left: 36, bottom: 20 }
const CHART_H = 400

const COR_QUADRANTE: Record<string, string> = {
  estrelas:        '#15803D',
  oportunidades:   '#D97706',
  alerta_vermelho: '#B91C1C',
  ofensores:       '#4B5563',
}

// ─── Tipos internos ───────────────────────────────────────────────────────────

type ProdutoBase = MatrizProdutoItem

interface ProdutoAgrupado extends ProdutoBase {
  membros: ProdutoBase[]
}

interface ProdutoComLabel extends ProdutoAgrupado {
  labelDx: number
  labelDy: number
  flipped: boolean  // pílula estende para esquerda, dot na borda direita
}

// ─── Helpers de agrupamento ───────────────────────────────────────────────────

function agruparPorProximidade(items: ProdutoBase[]): ProdutoAgrupado[] {
  if (items.length === 0) return []

  const comIdx = items.map((item, i) => ({ item, i }))
  comIdx.sort(
    (a, b) =>
      a.item.participacao_rank - b.item.participacao_rank ||
      a.item.satisfacao - b.item.satisfacao,
  )

  const grupos: { item: ProdutoBase; i: number }[][] = []
  const usado = new Set<number>()

  for (let i = 0; i < comIdx.length; i++) {
    if (usado.has(i)) continue
    const grupo = [comIdx[i]]
    usado.add(i)
    const ancX = comIdx[i].item.participacao_rank
    const ancY = comIdx[i].item.satisfacao

    for (let j = i + 1; j < comIdx.length; j++) {
      if (usado.has(j)) continue
      const dX = Math.abs(comIdx[j].item.participacao_rank - ancX)
      const dY = Math.abs(comIdx[j].item.satisfacao - ancY)
      if (dX <= X_GROUP_TOLERANCE && dY <= RATING_GROUP_TOLERANCE) {
        grupo.push(comIdx[j])
        usado.add(j)
      }
    }
    grupos.push(grupo)
  }

  return grupos.map((g) => {
    const members = g.map((x) => x.item)
    const principal = [...g].sort((a, b) => a.i - b.i)[0].item
    const avgSat = members.reduce((s, p) => s + p.satisfacao, 0) / members.length
    const avgRank = members.reduce((s, p) => s + p.participacao_rank, 0) / members.length
    return {
      ...principal,
      satisfacao: avgSat,
      participacao_rank: avgRank,
      membros: members,
    }
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

function calcPillWidth(nome: string, isGrupo: boolean): number {
  return nome.length * 6.5 + PILL_PAD_LEFT + PILL_PAD_RIGHT + (isGrupo ? PILL_CHEVRON_W : 0)
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

  const PLOT_LEFT = CHART_MARGIN.left
  const PLOT_RIGHT = containerWidth - CHART_MARGIN.right
  const PLOT_TOP = CHART_MARGIN.top
  const PLOT_BOTTOM = CHART_H - CHART_MARGIN.bottom

  type Box = { x: number; y: number; w: number; h: number }
  const placed: Box[] = []

  const overlaps = (b: Box) =>
    placed.some(
      (p) =>
        b.x < p.x + p.w + 2 && b.x + b.w + 2 > p.x &&
        b.y < p.y + p.h + 2 && b.y + b.h + 2 > p.y,
    )

  const inBoundsFor = (b: Box, flipped: boolean) => {
    const rBound = flipped ? PLOT_RIGHT + PILL_DOT_CX : PLOT_RIGHT
    return b.x >= PLOT_LEFT && b.x + b.w <= rBound &&
           b.y >= PLOT_TOP  && b.y + b.h <= PLOT_BOTTOM
  }

  return items.map((item) => {
    const px = toPixX(item.participacao_rank)
    const py = toPixY(item.satisfacao)
    const isGrupo = item.membros.length > 1
    const lw = calcPillWidth(item.nome, isGrupo)

    const BASE_DX = -PILL_DOT_CX
    const BASE_DY = -PILL_H / 2
    // Candidatos "flipped" usam -lw + PILL_DOT_CX para que o dot dentro da
    // pílula (na borda direita) fique exatamente sobre o ponto de dados (px).
    const candidates: [number, number][] = [
      [BASE_DX, BASE_DY],
      [BASE_DX, BASE_DY - PILL_H - 4],
      [BASE_DX, BASE_DY + PILL_H + 4],
      [-lw + PILL_DOT_CX, BASE_DY],
      [-lw + PILL_DOT_CX, BASE_DY - PILL_H - 4],
      [-lw + PILL_DOT_CX, BASE_DY + PILL_H + 4],
      [-lw / 2, BASE_DY - PILL_H - PILL_DOT_R - 5],
      [-lw / 2, BASE_DY + PILL_H + PILL_DOT_R + 5],
    ]

    let dx = candidates[0][0]
    let dy = candidates[0][1]
    let chosen = false

    for (const [cdx, cdy] of candidates) {
      const box: Box = { x: px + cdx, y: py + cdy, w: lw, h: PILL_H }
      if (inBoundsFor(box, cdx < -lw / 2) && !overlaps(box)) {
        dx = cdx; dy = cdy
        placed.push(box)
        chosen = true
        break
      }
    }

    if (!chosen) {
      for (const [cdx, cdy] of candidates) {
        const box: Box = { x: px + cdx, y: py + cdy, w: lw, h: PILL_H }
        if (inBoundsFor(box, cdx < -lw / 2)) {
          dx = cdx; dy = cdy
          placed.push(box)
          chosen = true
          break
        }
      }
    }

    if (!chosen) {
      // Fallback: escolhe direção com base no espaço disponível à direita
      const normalFits = px + lw - PILL_DOT_CX <= PLOT_RIGHT
      dx = normalFits ? BASE_DX : -lw + PILL_DOT_CX
      dy = BASE_DY
      placed.push({ x: px + dx, y: py + dy, w: lw, h: PILL_H })
    }

    const flipped = dx < -lw / 2
    return { ...item, labelDx: dx, labelDy: dy, flipped }
  })
}

// ─── Componentes SVG auxiliares ───────────────────────────────────────────────

function LabelQuadrante({
  viewBox,
  texto,
  corTexto,
  corFundo,
  ancoragem,
}: {
  viewBox?: { x: number; y: number; width: number; height: number }
  texto: string
  corTexto: string
  corFundo: string
  ancoragem: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right'
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

  return (
    <g>
      <rect x={bx} y={by} width={boxWidth} height={boxHeight} rx={4} ry={4} fill={corFundo} />
      <text x={bx + PAD_X} y={by + PAD_Y + FONT - 1} fontSize={FONT} fontWeight={700} fontFamily="inherit" fill={corTexto}>
        {texto}
      </text>
    </g>
  )
}

// ─── Componente principal ─────────────────────────────────────────────────────

interface Props {
  filtrosGlobais: FiltrosPeriodo
  onFiltrosLocaisChange?: (filtros: FiltrosPeriodo) => void
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

export function MatrizSatisfacaoPerformance({ filtrosGlobais, onFiltrosLocaisChange }: Props) {
  const [limites, setLimites] = useState<LimitesBloco>(loadLimites)
  const [painelAberto, setPainelAberto] = useState(false)
  const [chartWidth, setChartWidth] = useState(1000)
  const [tooltipPill, setTooltipPill] = useState<TooltipPill | null>(null)
  const [grupoAberto, setGrupoAberto] = useState<GrupoAberto | null>(null)
  const [tooltipDrop, setTooltipDrop] = useState<TooltipDrop | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const chartAreaRef = useRef<HTMLDivElement>(null)
  const painelRef = useRef<HTMLDivElement>(null)

  const clearPillHover = useCallback(() => setTooltipPill(null), [])

  useEffect(() => {
    localStorage.setItem(LS_LIMITES, JSON.stringify(limites))
  }, [limites])

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

  const { data, isLoading, isError } = useMatrizProdutos(filtrosGlobais, limites)

  const corteY = limites.corte_satisfacao

  const produtos = useMemo(
    () => calcLabelPositions(agruparTodos(data?.items ?? []), chartWidth, DOM_X),
    [data, chartWidth],
  )

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
                onAplicar={(novos) => { setLimites(novos); setPainelAberto(false) }}
              />
            </div>
          )}
        </div>
        <FiltroPeriodo filtros={filtrosGlobais} onChange={(f) => onFiltrosLocaisChange?.(f)} />
      </div>

      <div className="mb-2 pr-4">
        <h3 className="text-[18px] font-bold text-[#1d5358] flex items-center gap-2">
          Matriz de Satisfação vs. Performance
          <span className="relative group flex items-center">
            <AlertCircle size={16} className="text-[#1d5358] opacity-60 cursor-help flex-shrink-0" />
            <div className="
              pointer-events-none absolute z-50 top-full left-1/2 -translate-x-1/2 mt-2
              w-80 rounded-lg bg-white text-[#1d2d2e] text-[12px] font-normal leading-relaxed
              px-3 py-3 shadow-xl border border-[#e0e0e0]
              opacity-0 group-hover:opacity-100
              transition-opacity duration-200
            ">
              <div className="absolute left-1/2 -translate-x-1/2 bottom-full w-0 h-0 border-l-4 border-r-4 border-b-4 border-l-transparent border-r-transparent border-b-white" />
              <p className="font-semibold mb-1 text-[13px]">Como a matriz funciona</p>
              <p className="mb-2">Os produtos são posicionados por <strong>satisfação</strong> (eixo Y) e <strong>percentil de volume de vendas</strong> (eixo X), divididos em 4 quadrantes:</p>
              <ul className="space-y-1 mb-3">
                <li><span className="font-semibold text-[#15803D]">Estrelas</span> — alta satisfação e alto volume. Produtos de destaque.</li>
                <li><span className="font-semibold text-[#D97706]">Oportunidades</span> — alta satisfação, baixo volume. Potencial de crescimento.</li>
                <li><span className="font-semibold text-[#B91C1C]">Alerta Vermelho</span> — baixa satisfação, alto volume. Impacto crítico.</li>
                <li><span className="font-semibold text-[#4B5563]">Ofensores</span> — baixa satisfação, baixo volume. Monitorar.</li>
              </ul>
              <div className="border-t border-[#e0e0e0] pt-2">
                <p className="font-semibold mb-1 text-[13px]">Customizações disponíveis</p>
                <ul className="space-y-1">
                  <li><span className="font-semibold">Produtos por quadrante</span> — define quantos produtos são exibidos em cada quadrante.</li>
                  <li><span className="font-semibold">Corte de satisfação</span> — nota mínima (de 1,0 a 4,9) para considerar um produto como de alta satisfação. O padrão é 4,0.</li>
                  <li><span className="font-semibold">Corte de volume</span> — percentil mínimo (de 20% a 80%) para considerar um produto como de alto volume. O padrão é 50%.</li>
                </ul>
              </div>
            </div>
          </span>
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

              <XAxis type="number" dataKey="participacao_rank" name="Percentil de Volume" domain={DOM_X}
                tick={{ fontSize: 9, fill: '#343434' }} axisLine={false} tickLine={false}
                tickFormatter={(v: number) => `${v}`}>
                <Label value="Percentil de Volume" position="insideBottom" offset={-14} fontSize={11} fill="#343434" />
              </XAxis>

              <YAxis type="number" dataKey="satisfacao" name="Satisfação" domain={DOM_Y}
                tick={{ fontSize: 9, fill: '#343434' }} axisLine={false} tickLine={false} width={36}>
                <Label value="Satisfação ★" angle={-90} position="insideLeft" offset={10} fontSize={11} fill="#343434" />
              </YAxis>

              {/* Quadrantes */}
              <ReferenceArea x1={DOM_X[0]} x2={limites.corte_volume} y1={corteY} y2={DOM_Y[1]}
                fill="#FFF9C9" fillOpacity={0.6} stroke="none"
                label={(props) => (
                  <LabelQuadrante {...props} texto="OPORTUNIDADES" corTexto="#D97706" corFundo="#FFF9C9"
                    ancoragem="top-left" />
                )}
              />
              <ReferenceArea x1={limites.corte_volume} x2={DOM_X[1]} y1={corteY} y2={DOM_Y[1]}
                fill="#DCFCE7" fillOpacity={0.6} stroke="none"
                label={(props) => (
                  <LabelQuadrante {...props} texto="ESTRELAS" corTexto="#15803D" corFundo="#DCFCE7"
                    ancoragem="top-right" />
                )}
              />
              <ReferenceArea x1={DOM_X[0]} x2={limites.corte_volume} y1={DOM_Y[0]} y2={corteY}
                fill="#F3F4F6" fillOpacity={0.6} stroke="none"
                label={(props) => (
                  <LabelQuadrante {...props} texto="OFENSORES" corTexto="#4B5563" corFundo="#F3F4F6"
                    ancoragem="bottom-left" />
                )}
              />
              <ReferenceArea x1={limites.corte_volume} x2={DOM_X[1]} y1={DOM_Y[0]} y2={corteY}
                fill="#FEE2E2" fillOpacity={0.6} stroke="none"
                label={(props) => (
                  <LabelQuadrante {...props} texto="ALERTA VERMELHO" corTexto="#B91C1C" corFundo="#FEE2E2"
                    ancoragem="bottom-right" />
                )}
              />

              {/* Divisórias */}
              <ReferenceLine x={limites.corte_volume} stroke="#94A3B8" strokeWidth={1} strokeDasharray="5 4" />
              <ReferenceLine y={corteY} stroke="#94A3B8" strokeWidth={1} strokeDasharray="5 4" />

              {/* Pílulas */}
              <Scatter
                data={produtos}
                shape={(props: { cx?: number; cy?: number; payload?: ProdutoComLabel }) => {
                  const { cx = 0, cy = 0, payload } = props
                  if (!payload) return <g />
                  const cor = COR_QUADRANTE[payload.quadrante] ?? '#b0b0b0'
                  const { nome, labelDx: ldx, labelDy: ldy, flipped } = payload
                  const isGrupo = payload.membros.length > 1
                  const lw = calcPillWidth(nome, isGrupo)
                  const grupoKey = `${payload.participacao_rank}|${payload.satisfacao}|${payload.quadrante}`
                  const isAberto = grupoAberto?.key === grupoKey

                  // Pílula normal: dot na borda esquerda, texto à direita do dot
                  // Pílula flipped: dot na borda direita, texto à esquerda do dot
                  const dotCx = flipped
                    ? cx + ldx + lw - PILL_DOT_CX
                    : cx + ldx + PILL_DOT_CX
                  const textY = cy + ldy + PILL_H / 2 + LABEL_FONT / 2 - 1
                  const textX = flipped
                    ? cx + ldx + PILL_PAD_RIGHT
                    : cx + ldx + PILL_PAD_LEFT
                  const chevronX = flipped
                    ? cx + ldx + PILL_PAD_RIGHT + nome.length * 6.5 + 3
                    : cx + ldx + PILL_PAD_LEFT + nome.length * 6.5 + 3

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
                      <circle cx={dotCx} cy={cy + ldy + PILL_H / 2} r={PILL_DOT_R} fill={cor} />
                      <text
                        x={textX} y={textY}
                        fontSize={LABEL_FONT} fontWeight={500} fontFamily="inherit" fill="#343434"
                        style={{ pointerEvents: 'none' }}
                      >
                        {nome}
                      </text>
                      {isGrupo && (
                        <text
                          x={chevronX} y={textY}
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
              volume_produto={tooltipPill.produto.volume_produto}
              participacao_percentual={tooltipPill.produto.participacao_percentual}
              satisfacao={tooltipPill.produto.satisfacao}
              qtd_avaliacoes={tooltipPill.produto.qtd_avaliacoes}
              quadrante={tooltipPill.produto.quadrante}
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
            {[...grupoAberto.membros]
              .sort((a, b) => b.satisfacao - a.satisfacao || b.volume_produto - a.volume_produto)
              .map((membro) => (
                <div
                  key={membro.nome}
                  className="px-3 py-2 text-[11px] text-[#343434] hover:bg-[#f5f5f5] cursor-default border-b border-[#f5f5f5] last:border-b-0"
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
                  <p className="font-medium leading-tight">{membro.nome}</p>
                  <p className="text-[#888] mt-0.5">
                    Vol: {membro.volume_produto.toLocaleString('pt-BR')}
                    <span className="mx-1">·</span>
                    {membro.participacao_percentual.toFixed(1)}%
                    <span className="mx-1">·</span>
                    {membro.satisfacao.toFixed(1)} ★ ({membro.qtd_avaliacoes})
                  </p>
                </div>
              ))}
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
              volume_produto={tooltipDrop.produto.volume_produto}
              participacao_percentual={tooltipDrop.produto.participacao_percentual}
              satisfacao={tooltipDrop.produto.satisfacao}
              qtd_avaliacoes={tooltipDrop.produto.qtd_avaliacoes}
              quadrante={tooltipDrop.produto.quadrante}
            />
          </div>
        )}
      </div>

      {/* Legenda */}
      <div className="flex items-center gap-4 mt-2 text-[10px] text-[#343434]">
        {[
          { cor: COR_QUADRANTE.estrelas,        label: 'Estrelas' },
          { cor: COR_QUADRANTE.oportunidades,   label: 'Oportunidades' },
          { cor: COR_QUADRANTE.alerta_vermelho, label: 'Alerta Vermelho' },
          { cor: COR_QUADRANTE.ofensores,       label: 'Ofensores' },
        ].map(({ cor, label }) => (
          <div key={label} className="flex items-center gap-1">
            <span className="inline-block w-2 h-2 rounded-full" style={{ backgroundColor: cor }} />
            <span>{label}</span>
          </div>
        ))}
        <span className="ml-auto text-[#888]">
          Satisfação ≥ {limites.corte_satisfacao.toFixed(1)} · Acima da mediana de volume
        </span>
      </div>
    </div>
  )
}

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
  // Sort by satisfacao for proximity detection; track original index to restore backend-ordered principal
  const comIdx = items.map((item, i) => ({ item, i }))
  comIdx.sort((a, b) => a.item.satisfacao - b.item.satisfacao)

  const grupos: { item: ProdutoBase; i: number }[][] = []
  let grupo = [comIdx[0]]
  let ancora = comIdx[0].item.satisfacao
  for (let i = 1; i < comIdx.length; i++) {
    if (Math.abs(comIdx[i].item.satisfacao - ancora) <= limiar) {
      grupo.push(comIdx[i])
    } else {
      grupos.push(grupo)
      grupo = [comIdx[i]]
      ancora = comIdx[i].item.satisfacao
    }
  }
  grupos.push(grupo)

  return grupos.map((g) => {
    const members = g.map((x) => x.item)
    const principal = [...g].sort((a, b) => a.i - b.i)[0].item
    const avgSat = members.reduce((s, p) => s + p.satisfacao, 0) / members.length
    const avgVol = Math.round(members.reduce((s, p) => s + p.volume, 0) / members.length)
    return { ...principal, satisfacao: avgSat, volume: avgVol, membros: members }
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
    const lw = calcPillWidth(item.nome, isGrupo)

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
                  const lw = calcPillWidth(nome, isGrupo)
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

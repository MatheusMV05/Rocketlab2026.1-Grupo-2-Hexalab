import { useState, useEffect, useRef, useMemo } from 'react'
import {
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  ReferenceArea,
  Label,
} from 'recharts'
import { FiltroPeriodo, type FiltrosPeriodo } from '../../molecules/compartilhados/FiltroPeriodo'
import { TooltipMatriz } from '../../molecules/dashboard/TooltipMatriz'
import { useMatrizProdutos } from '../../../hooks/useDashboard'

const COR_PONTO: Record<string, string> = {
  bom: '#1a9a45',
  neutro: '#b0b0b0',
  ruim: '#c20000',
}

/* ─── Configuração do gráfico ────────────────────────────────────────────── */
/** Valor do eixo X onde a linha de divisão vertical é desenhada */
const CORTE_X = 1750
/** Valor do eixo Y onde a linha de divisão horizontal é desenhada */
const CORTE_Y = 3.0

const DOM_X: [number, number] = [0, 3800]
const DOM_Y: [number, number] = [1, 5]

/* ─── Badge de quadrante renderizada dentro do SVG via <Label> ─────────── */
/**
 * Render prop passado para `<ReferenceArea label={...}>`.
 * Cria um badge com fundo colorido e texto nos cantos do quadrante.
 */
function BadgeQuadrante({
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
  /** onde fixar o badge dentro do quadrante */
  ancoragem: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right'
}) {
  if (!viewBox) return null
  const { x, y, width, height } = viewBox

  const PAD_X = 8
  const PAD_Y = 6
  const FONT = 10
  // estimativa de largura do texto (recharts SVG não tem getBBox fácil)
  const CHAR_W = 6.5
  const textWidth = texto.length * CHAR_W
  const boxWidth = textWidth + PAD_X * 2
  const boxHeight = FONT + PAD_Y * 2

  let bx = x
  let by = y

  if (ancoragem === 'top-left') { bx = x + 6; by = y + 6 }
  if (ancoragem === 'top-right') { bx = x + width - boxWidth - 6; by = y + 6 }
  if (ancoragem === 'bottom-left') { bx = x + 6; by = y + height - boxHeight - 6 }
  if (ancoragem === 'bottom-right') { bx = x + width - boxWidth - 6; by = y + height - boxHeight - 6 }

  return (
    <g>
      <rect
        x={bx}
        y={by}
        width={boxWidth}
        height={boxHeight}
        rx={4}
        ry={4}
        fill={corFundo}
      />
      <text
        x={bx + PAD_X}
        y={by + PAD_Y + FONT - 1}
        fontSize={FONT}
        fontWeight={700}
        fontFamily="inherit"
        fill={corTexto}
      >
        {texto}
      </text>
    </g>
  )
}

/* ─── Constantes do label ────────────────────────────────────────────────── */
const DOT_R = 6
const LABEL_FONT = 11
const LABEL_PAD_X = 10
const LABEL_PAD_Y = 5
const LABEL_H = LABEL_FONT + LABEL_PAD_Y * 2
const CHART_MARGIN = { top: 16, right: 24, left: 36, bottom: 20 }
const CHART_H = 400

interface ProdutoComLabel {
  nome: string
  volume: number
  satisfacao: number
  status: string
  labelDx: number
  labelDy: number
}

/* Pré-computa offsets de label evitando sobreposição.
   Testa candidatos de posição em ordem de preferência e escolhe o primeiro livre. */
function calcLabelPositions(
  items: { nome: string; volume: number; satisfacao: number; status: string }[],
  containerWidth: number
): ProdutoComLabel[] {
  const plotW = containerWidth - CHART_MARGIN.left - CHART_MARGIN.right
  const plotH = CHART_H - CHART_MARGIN.top - CHART_MARGIN.bottom
  const toPixX = (v: number) => CHART_MARGIN.left + ((v - DOM_X[0]) / (DOM_X[1] - DOM_X[0])) * plotW
  const toPixY = (v: number) => CHART_MARGIN.top + ((DOM_Y[1] - v) / (DOM_Y[1] - DOM_Y[0])) * plotH

  type Box = { x: number; y: number; w: number; h: number }
  const placed: Box[] = []
  const gap = DOT_R + 5

  const overlaps = (b: Box) =>
    placed.some(
      (p) => b.x < p.x + p.w + 2 && b.x + b.w + 2 > p.x && b.y < p.y + p.h + 2 && b.y + b.h + 2 > p.y
    )

  return items.map((item) => {
    const px = toPixX(item.volume)
    const py = toPixY(item.satisfacao)
    const lw = item.nome.length * 6.5 + LABEL_PAD_X * 2

    const candidates: [number, number][] = [
      [gap, -LABEL_H / 2],
      [gap, -LABEL_H - 4],
      [gap, 4],
      [-lw - gap, -LABEL_H / 2],
      [-lw - gap, -LABEL_H - 4],
      [-lw - gap, 4],
      [-lw / 2, -LABEL_H - gap],
      [-lw / 2, gap],
    ]

    let dx = candidates[0][0]
    let dy = candidates[0][1]

    for (const [cdx, cdy] of candidates) {
      const box: Box = { x: px + cdx, y: py + cdy, w: lw, h: LABEL_H }
      if (!overlaps(box)) {
        dx = cdx; dy = cdy
        placed.push(box)
        break
      }
    }

    if (!placed.some((p) => p.x === px + dx && p.y === py + dy)) {
      placed.push({ x: px + dx, y: py + dy, w: lw, h: LABEL_H })
    }

    return { ...item, labelDx: dx, labelDy: dy }
  })
}

/* ─── Props ──────────────────────────────────────────────────────────────── */
interface Props {
  filtrosGlobais: FiltrosPeriodo
}

/* ─── Componente ─────────────────────────────────────────────────────────── */
export function MatrizSatisfacaoPerformance({ filtrosGlobais }: Props) {
  const [filtros, setFiltros] = useState(filtrosGlobais)
  const [chartWidth, setChartWidth] = useState(1000)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => { setFiltros(filtrosGlobais) }, [filtrosGlobais])

  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    const obs = new ResizeObserver(([entry]) => setChartWidth(entry.contentRect.width))
    obs.observe(el)
    return () => obs.disconnect()
  }, [])

  const { data, isLoading, isError } = useMatrizProdutos()

  const top10 = useMemo(() => {
    const items = data?.items ?? []
    return [...items].sort((a, b) => b.volume - a.volume).slice(0, 10)
  }, [data])

  const produtos = useMemo(
    () => calcLabelPositions(top10, chartWidth),
    [top10, chartWidth]
  )

  return (
    <div ref={containerRef} className="relative bg-white border-2 border-[#e0e0e0] rounded-[5px] p-4 flex flex-col">
      {/* Filtro absoluto no topo direito */}
      <div className="absolute top-3 right-3">
        <FiltroPeriodo filtros={filtros} onChange={setFiltros} />
      </div>

      {/* Cabeçalho */}
      <div className="mb-2 pr-4">
        <h3 className="text-[18px] font-bold text-[#1d5358]">
          Matriz de Satisfação vs. Performance
        </h3>
        {/* TODO: integrar agente de insights — exibir aqui a mensagem gerada automaticamente
             com os produtos em situação crítica identificados pela IA (quadrante ALERTA VERMELHO).
             O card abaixo é o template visual a ser preenchido com o conteúdo do agente. */}
        <div className="hidden flex items-center gap-2 mt-1 bg-[#e0e0e0] rounded-[5px] px-2 py-1 text-[10px] text-[#343434] font-medium max-w-xl">
          <span className="text-[10px]">✦</span>
          <span />
        </div>
      </div>

      {/* Gráfico de dispersão */}
      <div style={{ height: 400 }}>
        {isLoading && (
          <div className="flex items-center justify-center h-full text-[#4d4d4d] text-sm">
            Carregando...
          </div>
        )}
        {isError && (
          <div className="flex items-center justify-center h-full text-[#c20000] text-sm">
            Erro ao carregar dados
          </div>
        )}
        {!isLoading && !isError && <ResponsiveContainer width="100%" height="100%">
          <ScatterChart margin={{ top: 16, right: 24, left: 0, bottom: 20 }}>
            <CartesianGrid strokeDasharray="4 4" stroke="#e8e8e8" />

            <XAxis
              type="number"
              dataKey="volume"
              name="Volume"
              domain={DOM_X}
              tick={{ fontSize: 9, fill: '#343434' }}
              axisLine={false}
              tickLine={false}
            >
              <Label
                value="Volume de vendas"
                position="insideBottom"
                offset={-14}
                fontSize={11}
                fill="#343434"
              />
            </XAxis>

            <YAxis
              type="number"
              dataKey="satisfacao"
              name="Satisfação"
              domain={DOM_Y}
              tick={{ fontSize: 9, fill: '#343434' }}
              axisLine={false}
              tickLine={false}
              width={36}
            >
              <Label
                value="Satisfação ★"
                angle={-90}
                position="insideLeft"
                offset={10}
                fontSize={11}
                fill="#343434"
              />
            </YAxis>

            <Tooltip content={<TooltipMatriz />} />

            {/* ── Quadrantes coloridos (ReferenceArea) com badges nos cantos ── */}

            {/* Superior-esquerdo: OPORTUNIDADES (alto vol < corte, alta satisf) */}
            <ReferenceArea
              x1={DOM_X[0]} x2={CORTE_X}
              y1={CORTE_Y} y2={DOM_Y[1]}
              fill="#FFF9C9"
              fillOpacity={0.6}
              stroke="none"
              label={(props) => (
                <BadgeQuadrante
                  {...props}
                  texto="OPORTUNIDADES"
                  corTexto="#D97706"
                  corFundo="#FFF9C9"
                  ancoragem="top-left"
                />
              )}
            />

            {/* Superior-direito: ESTRELAS (alto vol, alta satisf) */}
            <ReferenceArea
              x1={CORTE_X} x2={DOM_X[1]}
              y1={CORTE_Y} y2={DOM_Y[1]}
              fill="#DCFCE7"
              fillOpacity={0.6}
              stroke="none"
              label={(props) => (
                <BadgeQuadrante
                  {...props}
                  texto="ESTRELAS"
                  corTexto="#15803D"
                  corFundo="#DCFCE7"
                  ancoragem="top-right"
                />
              )}
            />

            {/* Inferior-esquerdo: OFENSORES (baixo vol, baixa satisf) */}
            <ReferenceArea
              x1={DOM_X[0]} x2={CORTE_X}
              y1={DOM_Y[0]} y2={CORTE_Y}
              fill="#F3F4F6"
              fillOpacity={0.6}
              stroke="none"
              label={(props) => (
                <BadgeQuadrante
                  {...props}
                  texto="OFENSORES"
                  corTexto="#4B5563"
                  corFundo="#F3F4F6"
                  ancoragem="bottom-left"
                />
              )}
            />

            {/* Inferior-direito: ALERTA VERMELHO (alto vol, baixa satisf) */}
            <ReferenceArea
              x1={CORTE_X} x2={DOM_X[1]}
              y1={DOM_Y[0]} y2={CORTE_Y}
              fill="#FEE2E2"
              fillOpacity={0.6}
              stroke="none"
              label={(props) => (
                <BadgeQuadrante
                  {...props}
                  texto="ALERTA VERMELHO"
                  corTexto="#B91C1C"
                  corFundo="#FEE2E2"
                  ancoragem="bottom-right"
                />
              )}
            />

            {/* ── Linhas divisórias ── */}
            <ReferenceLine
              x={CORTE_X}
              stroke="#94A3B8"
              strokeWidth={1}
              strokeDasharray="5 4"
            />
            <ReferenceLine
              y={CORTE_Y}
              stroke="#94A3B8"
              strokeWidth={1}
              strokeDasharray="5 4"
            />

            {/* ── Pontos de dispersão (top 10 por volume) ── */}
            <Scatter
              data={produtos}
              shape={(props: {
                cx?: number
                cy?: number
                payload?: ProdutoComLabel
              }) => {
                const { cx = 0, cy = 0, payload } = props
                const cor = COR_PONTO[payload?.status ?? 'neutro']
                const nome = payload?.nome ?? ''
                const ldx = payload?.labelDx ?? DOT_R + 5
                const ldy = payload?.labelDy ?? -LABEL_H / 2
                const lw = nome.length * 6.5 + LABEL_PAD_X * 2

                return (
                  <g>
                    <circle cx={cx} cy={cy} r={DOT_R} fill={cor} />
                    <rect
                      x={cx + ldx}
                      y={cy + ldy}
                      width={lw}
                      height={LABEL_H}
                      fill="white"
                      stroke="#d0d0d0"
                      strokeWidth={1}
                      rx={4}
                    />
                    <text
                      x={cx + ldx + LABEL_PAD_X}
                      y={cy + ldy + LABEL_FONT + LABEL_PAD_Y - 2}
                      fontSize={LABEL_FONT}
                      fontWeight={500}
                      fontFamily="inherit"
                      fill="#343434"
                      style={{ pointerEvents: 'none' }}
                    >
                      {nome}
                    </text>
                  </g>
                )
              }}
            />
          </ScatterChart>
        </ResponsiveContainer>}
      </div>

      {/* Legenda */}
      <div className="flex items-center gap-4 mt-2 text-[10px] text-[#343434]">
        {[
          { cor: '#1a9a45', label: 'Alta satisfação' },
          { cor: '#b0b0b0', label: 'Neutro' },
          { cor: '#c20000', label: 'Baixa satisfação' },
        ].map(({ cor, label }) => (
          <div key={label} className="flex items-center gap-1">
            <span
              className="inline-block w-2 h-2 rounded-full"
              style={{ backgroundColor: cor }}
            />
            <span>{label}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

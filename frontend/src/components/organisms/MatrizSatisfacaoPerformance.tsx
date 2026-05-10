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
import { FiltroPeriodo, type FiltrosPeriodo } from '../molecules/FiltroPeriodo'
import { TooltipMatriz } from '../molecules/TooltipMatriz'
import { useMatrizProdutos } from '../../hooks/useDashboard'

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

/* ─── Props ──────────────────────────────────────────────────────────────── */
interface Props {
  filtros: FiltrosPeriodo
  onFiltrosChange: (f: FiltrosPeriodo) => void
}

/* ─── Componente ─────────────────────────────────────────────────────────── */
export function MatrizSatisfacaoPerformance({ filtros, onFiltrosChange }: Props) {
  const { data, isLoading, isError } = useMatrizProdutos()
  const produtos = data?.items ?? []

  return (
    <div className="relative bg-white border-2 border-[#e0e0e0] rounded-[5px] p-4 flex flex-col">
      {/* Filtro absoluto no topo direito */}
      <div className="absolute top-3 right-3">
        <FiltroPeriodo filtros={filtros} onChange={onFiltrosChange} />
      </div>

      {/* Cabeçalho */}
      <div className="mb-2 pr-4">
        <h3 className="text-[18px] font-bold text-[#1d5358]">
          Matriz de Satisfação vs. Performance
        </h3>
        <div className="flex items-center gap-2 mt-1 bg-[#e0e0e0] rounded-[5px] px-2 py-1 text-[10px] text-[#343434] font-medium max-w-xl">
          <span className="text-[10px]">✦</span>
          <span>
            ATENÇÃO: Teclado mecânico e máquina de lavar ultra com alta performance e baixa satisfação.
          </span>
        </div>
      </div>

      {/* Gráfico de dispersão */}
      <div style={{ height: 320 }}>
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

            {/* ── Pontos de dispersão ── */}
            <Scatter
              data={produtos}
              shape={(props: {
                cx?: number
                cy?: number
                payload?: { nome: string; status: string }
              }) => {
                const { cx = 0, cy = 0, payload } = props
                const cor = COR_PONTO[payload?.status ?? 'neutro']
                const nome = payload?.nome ?? ''
                const labelW = nome.length * 5.5 + 6
                return (
                  <g>
                    <circle cx={cx} cy={cy} r={6} fill={cor} />
                    <rect
                      x={cx + 8}
                      y={cy - 6}
                      width={labelW}
                      height={13}
                      fill="white"
                      fillOpacity={0.85}
                      rx={2}
                    />
                    <text
                      x={cx + 11}
                      y={cy + 4}
                      fontSize={9}
                      fill="#343434"
                      className="pointer-events-none"
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

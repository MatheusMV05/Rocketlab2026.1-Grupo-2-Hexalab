import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  type DotProps,
  type TooltipProps,
} from 'recharts'
import { useReceitaGrafico } from '../../hooks/useDashboard'
import { TagVariacao } from '../atoms/TagVariacao'
import { FiltroPeriodo, type FiltrosPeriodo } from '../molecules/FiltroPeriodo'
import { formatarReais } from '../../utils/formatadores'

/* ── Tooltip ─────────────────────────────────────────────────────────────── */
function TooltipReceita(props: TooltipProps<number, string>) {
  const { active, payload, label } = props
  if (!active || !payload || payload.length === 0) return null

  const receita = payload.find((p) => p.dataKey === 'receita')?.value as number | undefined
  const meta    = payload.find((p) => p.dataKey === 'meta')?.value    as number | undefined
  const fmt = (v: number) => `R$ ${v.toLocaleString('pt-BR')}`

  return (
    <div style={{
      display: 'flex', alignItems: 'center', pointerEvents: 'none',
      filter: 'drop-shadow(0 1px 4px rgba(197,197,197,0.7))',
    }}>
      <div style={{
        width: 0, height: 0, flexShrink: 0,
        borderTop: '9px solid transparent',
        borderBottom: '9px solid transparent',
        borderRight: '9px solid #C5C5C5',
      }} />
      <div style={{
        width: 0, height: 0, flexShrink: 0, position: 'relative', zIndex: 1,
        borderTop: '8px solid transparent',
        borderBottom: '8px solid transparent',
        borderRight: '8px solid white',
        marginLeft: -8,
      }} />
      <div style={{
        background: 'white',
        border: '1px solid #C5C5C5',
        borderLeft: 'none',
        borderRadius: '0 4px 4px 0',
        padding: '8px 12px',
        fontSize: 11,
        fontFamily: 'inherit',
        whiteSpace: 'nowrap',
        position: 'relative',
        zIndex: 1,
      }}>
        <div style={{ fontWeight: 600, color: '#343434', marginBottom: 4, lineHeight: 1 }}>
          {label}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 5, color: '#343434', lineHeight: 1.4 }}>
          <span style={{
            width: 7, height: 7, borderRadius: '50%',
            background: '#3f7377', display: 'inline-block', flexShrink: 0,
          }} />
          <span>Receita real: <strong>{receita !== undefined ? fmt(receita) : '—'}</strong></span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 5, color: '#343434', marginTop: 3, lineHeight: 1.4 }}>
          <svg width="7" height="7" viewBox="0 0 7 7" style={{ flexShrink: 0 }}>
            <polygon points="3.5,0 0,7 7,7" fill="#343434" />
          </svg>
          <span>Meta ponderada: <strong>{meta !== undefined ? fmt(meta) : '—'}</strong></span>
        </div>
      </div>
    </div>
  )
}

/* ── Triângulo nos dots da linha de meta ─────────────────────────────────── */
function TrianguloMeta(props: DotProps) {
  const { cx = 0, cy = 0 } = props
  const s = 5
  return <polygon points={`${cx},${cy - s} ${cx - s},${cy + s} ${cx + s},${cy + s}`} fill="#343434" />
}

/* ── Título do subtítulo de período ─────────────────────────────────────── */
function tituloPeriodo(modo: string, filtros: FiltrosPeriodo): string {
  if (modo === 'semanal') return `${filtros.mes} de ${filtros.ano}`
  if (modo === 'comparativo') return `${filtros.mes} — todos os anos`
  if (filtros.ano) return `Ano ${filtros.ano}`
  return 'Todos os períodos'
}

/* ── Props ───────────────────────────────────────────────────────────────── */
interface Props {
  filtros: FiltrosPeriodo
  onFiltrosChange: (f: FiltrosPeriodo) => void
}

/* ── Componente ──────────────────────────────────────────────────────────── */
export function GraficoReceitaMensal({ filtros, onFiltrosChange }: Props) {
  const { data, isLoading, isError } = useReceitaGrafico(filtros)

  const modo = data?.modo ?? 'mensal'
  const dados = data?.items ?? []
  const receitaTotal = dados.reduce((s, i) => s + i.receita, 0)
  const metaTotal    = dados.reduce((s, i) => s + i.meta, 0)

  return (
    <div className="relative bg-white border-2 border-[#e0e0e0] rounded-[5px] h-full flex flex-col">
      <div className="absolute top-[13px] right-[14px]">
        <FiltroPeriodo filtros={filtros} onChange={onFiltrosChange} />
      </div>

      {/* Cabeçalho */}
      <div className="px-4 pt-[50px] pb-2">
        <h3 className="text-[18px] font-bold text-[#1d5358]">Receita Mensal</h3>
        <div className="flex items-center gap-1 mt-1 text-[11px] font-medium text-[#343434]">
          <span>Receita total realizada:</span>
          <span className="font-bold">
            {receitaTotal > 0
              ? `R$ ${receitaTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`
              : '—'}
          </span>
          {receitaTotal > 0 && <TagVariacao valor="+6,6%/ABR" tipo="bom" />}
        </div>
        <div className="text-[11px] text-[#898989] mt-0.5">
          {metaTotal > 0
            ? `Meta de receita total: R$ ${metaTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`
            : 'Meta de receita total: —'}
        </div>
        {data && (
          <div className="text-[10px] text-[#b8b8b8] mt-0.5">
            {tituloPeriodo(modo, filtros)}
            {filtros.localidade ? ` · ${filtros.localidade}` : ''}
          </div>
        )}
      </div>

      {/* Gráfico */}
      <div className="flex-1 min-h-0 px-4 pb-1">
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
        {!isLoading && !isError && (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={dados} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="4 4" stroke="#e0e0e0" />
              <XAxis
                dataKey="label"
                tick={{ fontSize: 9, fill: '#343434' }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tickFormatter={formatarReais}
                tick={{ fontSize: 9, fill: '#343434' }}
                axisLine={false}
                tickLine={false}
                width={52}
              />
              <Tooltip
                content={(props) => <TooltipReceita {...props} />}
                wrapperStyle={{ background: 'transparent', border: 'none', boxShadow: 'none', outline: 'none', padding: 0 }}
              />
              <Line
                type="monotone"
                dataKey="receita"
                stroke="#3f7377"
                strokeWidth={2}
                dot={{ r: 4, fill: '#3f7377', strokeWidth: 0 }}
                activeDot={{ r: 6 }}
              />
              <Line
                type="monotone"
                dataKey="meta"
                stroke="#343434"
                strokeWidth={1.5}
                strokeDasharray="6 4"
                dot={<TrianguloMeta />}
                activeDot={{ r: 5 }}
              />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Legenda customizada */}
      <div className="flex items-center justify-center gap-6 pb-3 text-[11px] text-[#343434]">
        <div className="flex items-center gap-1.5">
          <svg width="26" height="12" viewBox="0 0 26 12">
            <line x1="0" y1="6" x2="26" y2="6" stroke="#3f7377" strokeWidth="2" />
            <circle cx="13" cy="6" r="4" fill="#3f7377" />
          </svg>
          <span>Receita realizada</span>
        </div>
        <div className="flex items-center gap-1.5">
          <svg width="26" height="12" viewBox="0 0 26 12">
            <line x1="0" y1="6" x2="26" y2="6" stroke="#343434" strokeWidth="1.5" strokeDasharray="6 4" />
            <polygon points="13,1 9,11 17,11" fill="#343434" />
          </svg>
          <span>Meta sazonal</span>
        </div>
      </div>
    </div>
  )
}

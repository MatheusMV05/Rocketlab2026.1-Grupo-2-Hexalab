import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  type DotProps,
} from 'recharts'
import { useVendasMensal } from '../../hooks/useDashboard'
import { TagVariacao } from '../atoms/TagVariacao'
import { FiltroPeriodo, type FiltrosPeriodo } from '../molecules/FiltroPeriodo'
import { formatarMes, formatarReais } from '../../utils/formatadores'

function TrianguloMeta(props: DotProps) {
  const { cx = 0, cy = 0 } = props
  const s = 5
  return (
    <polygon
      points={`${cx},${cy - s} ${cx - s},${cy + s} ${cx + s},${cy + s}`}
      fill="#b0b0b0"
    />
  )
}

interface Props {
  filtros: FiltrosPeriodo
  onFiltrosChange: (f: FiltrosPeriodo) => void
}

export function GraficoReceitaMensal({ filtros, onFiltrosChange }: Props) {
  const { data, isLoading, isError } = useVendasMensal()

  const dados = (data?.items ?? []).map((item) => ({
    mes: formatarMes(item.mes_ano),
    receita: item.receita_total,
    meta: Math.round(item.receita_total * 0.9),
  }))

  const receitaTotal = data?.items.reduce((s, i) => s + i.receita_total, 0) ?? 0

  return (
    <div className="relative bg-white border-2 border-[#e0e0e0] rounded-[5px] h-full flex flex-col">
      {/* Filtros: absoluto y=13 do card, alinhado à direita — conforme SVG */}
      <div className="absolute top-[13px] right-[14px]">
        <FiltroPeriodo filtros={filtros} onChange={onFiltrosChange} />
      </div>

      {/* Cabeçalho: título abaixo dos filtros — pt-[50px] posiciona abaixo do filtro (y=41) */}
      <div className="px-4 pt-[50px] pb-2">
        <h3 className="text-[18px] font-bold text-[#1d5358]">Receita Mensal</h3>
        <div className="flex items-center gap-1 mt-1 text-[11px]">
          <span className="text-[#343434] font-medium">Receita total realizada:</span>
          <span className="font-bold text-[#343434]">
            {receitaTotal > 0
              ? `R$ ${receitaTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`
              : '—'}
          </span>
          {receitaTotal > 0 && <TagVariacao valor="+6,6%/ABR" tipo="bom" />}
        </div>
      </div>

      {/* Gráfico */}
      <div className="flex-1 min-h-0 px-4 pb-4">
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
                dataKey="mes"
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
                formatter={(valor: number, nome: string) => [
                  `R$ ${valor.toLocaleString('pt-BR')}`,
                  nome === 'receita' ? 'Receita realizada' : 'Meta ponderada',
                ]}
                contentStyle={{ fontSize: 11, borderColor: '#e0e0e0', borderRadius: 5 }}
              />
              <Legend
                formatter={(value) =>
                  value === 'receita' ? 'Receita realizada' : 'Meta ponderada'
                }
                wrapperStyle={{ fontSize: 11 }}
              />
              <Line
                type="monotone"
                dataKey="receita"
                stroke="#3f7377"
                strokeWidth={2}
                dot={{ r: 3, fill: '#3f7377' }}
                activeDot={{ r: 5 }}
              />
              <Line
                type="monotone"
                dataKey="meta"
                stroke="#b0b0b0"
                strokeWidth={1.5}
                strokeDasharray="8 4"
                dot={<TrianguloMeta />}
                activeDot={{ r: 5 }}
              />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  )
}

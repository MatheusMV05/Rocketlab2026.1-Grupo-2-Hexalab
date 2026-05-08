import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts'
import { useVendasMensal } from '../../hooks/useDashboard'
import { TagVariacao } from '../atoms/TagVariacao'
import { FiltroPeriodo, type FiltrosPeriodo } from '../molecules/FiltroPeriodo'
import { formatarMes, formatarReais } from '../../utils/formatadores'

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
    <div className="bg-white border-2 border-[#e0e0e0] rounded-[5px] p-4 h-full flex flex-col">
      {/* Cabeçalho: título à esquerda, filtros à direita */}
      <div className="flex items-start justify-between gap-3 mb-2">
        <div className="min-w-0">
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
        <div className="shrink-0">
          <FiltroPeriodo filtros={filtros} onChange={onFiltrosChange} />
        </div>
      </div>

      {/* Gráfico */}
      <div className="flex-1 min-h-0">
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
                  nome === 'receita' ? 'Receita realizada' : 'Meta sazonal',
                ]}
                contentStyle={{ fontSize: 11, borderColor: '#e0e0e0', borderRadius: 5 }}
              />
              <Legend
                formatter={(value) =>
                  value === 'receita' ? 'Receita realizada' : 'Meta sazonal'
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
                stroke="#e0e0e0"
                strokeWidth={2}
                strokeDasharray="5 3"
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  )
}

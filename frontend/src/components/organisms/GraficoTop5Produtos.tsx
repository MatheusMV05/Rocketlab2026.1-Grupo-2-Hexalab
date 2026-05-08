import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LabelList,
} from 'recharts'
import { useTopProdutos } from '../../hooks/useDashboard'
import { TagVariacao } from '../atoms/TagVariacao'
import { FiltroPeriodo, type FiltrosPeriodo } from '../molecules/FiltroPeriodo'
import { DropdownFiltro } from '../atoms/DropdownFiltro'
import { useState } from 'react'
import { formatarReais } from '../../utils/formatadores'

interface Props {
  filtros: FiltrosPeriodo
  onFiltrosChange: (f: FiltrosPeriodo) => void
}

export function GraficoTop5Produtos({ filtros, onFiltrosChange }: Props) {
  const { data, isLoading, isError } = useTopProdutos()
  // Figma mostra "Dados: Volume" como padrão no DASHBOARD 2
  const [tipoDado, setTipoDado] = useState('Volume')

  const top5 = (data?.items ?? []).slice(0, 5)

  const dados = top5.map((item, idx) => ({
    // Label do eixo Y inclui a posição numérica (ex: "1° Produto")
    label: `${idx + 1}° ${item.nome_produto}`,
    nome: item.nome_produto,
    receita: item.receita_total,
    // volume_vendas não vem da API ainda, usando receita como fallback
    volume: item.receita_total,
  }))

  const receitaTotal = top5.reduce((s, i) => s + i.receita_total, 0)
  const isReceita = tipoDado === 'Receita'

  return (
    <div className="relative bg-white border-2 border-[#e0e0e0] rounded-[5px] p-4 h-full flex flex-col">
      {/* Filtro absoluto no topo direito */}
      <div className="absolute top-3 right-3">
        <FiltroPeriodo filtros={filtros} onChange={onFiltrosChange} />
      </div>

      {/* Cabeçalho */}
      <div className="mb-2 pr-4">
        <h3 className="text-[18px] font-bold text-[#1d5358]">Top 5 Produtos Mais Vendidos</h3>
        <div className="flex items-center gap-2 mt-1">
          <DropdownFiltro
            label="Dados"
            opcoes={['Receita', 'Volume']}
            valor={tipoDado}
            onChange={setTipoDado}
            rotulo="Dados"
          />
        </div>
        <div className="flex items-center gap-1 mt-1 text-[11px]">
          <span className="text-[#343434] font-medium">
            {isReceita ? 'Receita Total dos Top 5:' : 'Volume Total dos Top 5:'}
          </span>
          <span className="font-bold text-[#343434]">
            {receitaTotal > 0
              ? isReceita
                ? `R$ ${receitaTotal.toLocaleString('pt-BR')}`
                : `${top5.reduce((s, i) => s + Math.round(i.receita_total / 100), 0).toLocaleString('pt-BR')} un.`
              : '—'}
          </span>
          {receitaTotal > 0 && <TagVariacao valor={isReceita ? '+12%/ABR' : '-2%/ABR'} tipo={isReceita ? 'bom' : 'ruim'} />}
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
            <BarChart
              data={dados}
              layout="vertical"
              margin={{ top: 4, right: 96, left: 0, bottom: 4 }}
            >
              <CartesianGrid strokeDasharray="4 4" stroke="#e0e0e0" horizontal={false} />
              <XAxis
                type="number"
                hide
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                type="category"
                dataKey="label"
                tick={{ fontSize: 9, fill: '#343434' }}
                axisLine={false}
                tickLine={false}
                width={155}
              />
              <Tooltip
                formatter={(v: number) => [isReceita ? formatarReais(v) : `${Math.round(v / 100).toLocaleString('pt-BR')} un.`, tipoDado]}
                contentStyle={{ fontSize: 11, borderColor: '#e0e0e0', borderRadius: 5 }}
              />
              <Bar dataKey="receita" fill="#61878a" radius={[0, 2, 2, 0]} barSize={16}>
                <LabelList
                  dataKey="receita"
                  position="right"
                  formatter={(v: number) => isReceita ? formatarReais(v) : `${Math.round(v / 100).toLocaleString('pt-BR')} un.`}
                  style={{ fontSize: 9, fill: '#343434', fontWeight: 700 }}
                />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  )
}

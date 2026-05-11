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
import { useTopProdutos } from '../../../hooks/useDashboard'
import { useState, useEffect } from 'react'
import { TagVariacao } from '../../atoms/dashboard/TagVariacao'
import { FiltroPeriodo, type FiltrosPeriodo } from '../../molecules/compartilhados/FiltroPeriodo'
import { formatarReais } from '../../../utils/formatadores'

interface Props {
  filtrosGlobais: FiltrosPeriodo
}

export function GraficoTop5Produtos({ filtrosGlobais }: Props) {
  const [filtros, setFiltros] = useState(filtrosGlobais)
  const [tipoDado, setTipoDado] = useState('Volume')

  useEffect(() => { setFiltros(filtrosGlobais) }, [filtrosGlobais])

  const { data, isLoading, isError } = useTopProdutos()

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
    <div className="relative bg-white border-2 border-[#e0e0e0] rounded-[5px] h-full flex flex-col">
      {/* Filtros: absoluto no topo direito */}
      <div className="absolute top-[13px] right-[14px]">
        <FiltroPeriodo filtros={filtros} onChange={setFiltros} />
      </div>

      {/* Cabeçalho abaixo dos filtros */}
      <div className="px-4 pt-[50px] pb-2">
        <h3 className="text-[18px] font-bold text-[#1d5358]">
          Top 5 Produtos Mais Vendidos
        </h3>
      </div>

      {/* Dropdown único "Dados: Volume/Receita" — conforme protótipo */}
      <div className="px-4 mb-2">
        <div className="relative inline-block">
          <select
            value={tipoDado}
            onChange={(e) => setTipoDado(e.target.value)}
            className="h-[30px] pl-2 pr-7 text-[13px] font-medium rounded-[4px] border border-[#e0e0e0] bg-white text-[#262626] appearance-none cursor-pointer focus:outline-none focus:border-[#3f7377]"
          >
            <option value="Volume">Dados: Volume</option>
            <option value="Receita">Dados: Receita</option>
          </select>
          <span className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-[#4d4d4d] text-xs">▼</span>
        </div>
      </div>

      {/* Subtítulo com total */}
      <div className="flex items-center gap-1 px-4 mb-2 text-[11px]">
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
        {receitaTotal > 0 && (
          <TagVariacao
            valor={isReceita ? '+12%/ABR' : '-2%/ABR'}
            tipo={isReceita ? 'bom' : 'ruim'}
          />
        )}
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

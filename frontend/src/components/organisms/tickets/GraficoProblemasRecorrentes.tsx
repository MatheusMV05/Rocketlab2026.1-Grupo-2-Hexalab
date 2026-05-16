import { useState } from 'react'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  LabelList,
} from 'recharts'
import { FiltroPeriodo, type FiltrosPeriodo } from '../../molecules/compartilhados/FiltroPeriodo'
import { useProblemasRecorrentes } from '../../../hooks/useTickets'

export function GraficoProblemasRecorrentes() {
  const [filtros, setFiltros] = useState<FiltrosPeriodo>({ ano: '', mes: '', localidade: '' })
  const { data, isLoading } = useProblemasRecorrentes(filtros)

  const dados = (data?.itens ?? []).map((item) => ({
    label: `${item.posicao}° ${item.rotulo}`,
    total: item.total,
  }))

  return (
    <div className="relative bg-white border-2 border-[#e0e0e0] rounded-[5px] h-full flex flex-col">
      <div className="absolute top-[13px] right-[14px]">
        <FiltroPeriodo filtros={filtros} onChange={setFiltros} />
      </div>

      <div className="px-4 pt-[50px] pb-2 border-b border-[#e0e0e0] mx-4">
        <h3 className="text-[18px] font-bold text-[#1d5358]">Problemas mais recorrentes nos tickets</h3>
        <p className="text-[11px] text-[#343434] font-medium mt-1">
          Volume Total dos Top 5: <span className="font-bold">{data?.volume_total ?? 0} un.</span>
        </p>
      </div>

      <div className="flex-1 min-h-0 px-4 pt-2">
        {isLoading ? (
          <div className="flex items-center justify-center h-full text-[#4d4d4d] text-sm">Carregando...</div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={dados} layout="vertical" margin={{ top: 8, right: 72, left: 0, bottom: 8 }}>
              <XAxis type="number" hide />
              <YAxis
                type="category"
                dataKey="label"
                tick={{ fontSize: 11, fill: '#343434' }}
                axisLine={false}
                tickLine={false}
                width={160}
                interval={0}
              />
              <Tooltip
                formatter={((v: number) => [`${v.toLocaleString('pt-BR')} un.`, 'Total']) as never}
                contentStyle={{ fontSize: 11, borderColor: '#e0e0e0', borderRadius: 5 }}
              />
              <Bar dataKey="total" fill="#1c5258" radius={[0, 2, 2, 0]} barSize={18}>
                <LabelList
                  dataKey="total"
                  position="right"
                  formatter={((v: number) => `${v.toLocaleString('pt-BR')} un.`) as never}
                  style={{ fontSize: 11, fill: '#343434', fontWeight: 700 }}
                />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  )
}

import { useState } from 'react'
import {
  BarChart,
  Bar,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LabelList,
} from 'recharts'
import { FiltroPeriodo, type FiltrosPeriodo } from '../../molecules/compartilhados/FiltroPeriodo'
import { useTicketsPorStatus } from '../../../hooks/useTickets'

// Paleta cíclica que cobre qualquer conjunto de status que venha do banco.
const PALETA = ['#12632f', '#e37405', '#c20000', '#1c5258', '#3f7377', '#61878a']

function corPara(status: string, idx: number): string {
  const txt = status.toLowerCase()
  if (txt.includes('atras')) return '#c20000'
  if (txt.includes('risco') || txt.includes('alerta')) return '#e37405'
  if (txt.includes('finaliz') || txt.includes('resolv') || txt.includes('fech')) return '#12632f'
  if (txt.includes('aberto') || txt.includes('ok') || txt.includes('dentro')) return '#1c5258'
  return PALETA[idx % PALETA.length]
}

export function GraficoTicketsPorStatus() {
  const [filtros, setFiltros] = useState<FiltrosPeriodo>({ ano: '', mes: '', localidade: '' })
  const { data, isLoading } = useTicketsPorStatus(filtros)

  const dados = (data?.itens ?? []).map((item, idx) => ({
    status: item.status,
    label: item.status,
    cor: corPara(item.status, idx),
    total: item.total,
  }))

  return (
    <div className="relative bg-white border-2 border-[#e0e0e0] rounded-[5px] h-full flex flex-col">
      <div className="absolute top-[13px] right-[14px]">
        <FiltroPeriodo filtros={filtros} onChange={setFiltros} />
      </div>

      <div className="px-4 pt-[50px] pb-2 border-b border-[#e0e0e0] mx-4">
        <h3 className="text-[18px] font-bold text-[#1d5358]">Tickets por status</h3>
        <p className="text-[11px] text-[#343434] font-medium mt-1">
          Volume Total: <span className="font-bold">{data?.volume_total ?? 0} tickets</span>
        </p>
      </div>

      <div className="flex-1 min-h-0 px-4 pb-4 pt-2">
        {isLoading ? (
          <div className="flex items-center justify-center h-full text-[#4d4d4d] text-sm">Carregando...</div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={dados} layout="vertical" margin={{ top: 8, right: 64, left: 0, bottom: 20 }}>
              <CartesianGrid strokeDasharray="4 4" stroke="#e0e0e0" horizontal={false} />
              <XAxis
                type="number"
                tick={{ fontSize: 10, fill: '#343434' }}
                axisLine={false}
                tickLine={false}
                label={{
                  value: 'Quantidade de tickets',
                  position: 'insideBottom',
                  offset: -12,
                  fontSize: 10,
                  fill: '#343434',
                }}
              />
              <YAxis
                type="category"
                dataKey="label"
                tick={{ fontSize: 11, fill: '#343434' }}
                axisLine={false}
                tickLine={false}
                width={150}
                interval={0}
              />
              <Tooltip
                formatter={((v: number) => [v.toLocaleString('pt-BR'), 'Tickets']) as never}
                contentStyle={{ fontSize: 11, borderColor: '#e0e0e0', borderRadius: 5 }}
              />
              <Bar dataKey="total" radius={[0, 2, 2, 0]} barSize={18}>
                {dados.map((d) => (
                  <Cell key={d.status} fill={d.cor} />
                ))}
                <LabelList
                  dataKey="total"
                  position="right"
                  formatter={((v: number) => v.toLocaleString('pt-BR')) as never}
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

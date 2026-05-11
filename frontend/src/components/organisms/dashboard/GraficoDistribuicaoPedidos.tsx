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
import { useState, useEffect } from 'react'
import { useStatusPedidos } from '../../../hooks/useDashboard'
import { TagVariacao } from '../../atoms/dashboard/TagVariacao'
import { FiltroPeriodo, type FiltrosPeriodo } from '../../molecules/compartilhados/FiltroPeriodo'

// Traduz valores de status do backend para os rótulos exibidos no Figma
const ROTULOS: Record<string, string> = {
  // snake_case do backend
  aguardando_pagamento: 'Aguardando pagamento',
  pagamento_aprovado: 'Pagamento aprovado',
  em_separacao: 'Em separação',
  em_rota: 'Em rota de entrega',
  em_rota_de_entrega: 'Em rota de entrega',
  entregue: 'Entregue',
  cancelado: 'Cancelado',
  // Variações possíveis
  'Em rota': 'Em rota de entrega',
  'Processando': 'Em separação',
  processando: 'Em separação',
  'Aguardando pagamento': 'Aguardando pagamento',
  'Pagamento aprovado': 'Pagamento aprovado',
  'Em separação': 'Em separação',
  'Entregue': 'Entregue',
  'Cancelado': 'Cancelado',
}

interface Props {
  filtrosGlobais: FiltrosPeriodo
}

export function GraficoDistribuicaoPedidos({ filtrosGlobais }: Props) {
  const [filtros, setFiltros] = useState(filtrosGlobais)

  useEffect(() => { setFiltros(filtrosGlobais) }, [filtrosGlobais])

  const { data, isLoading, isError } = useStatusPedidos()

  const total = data?.items.reduce((s, i) => s + i.total, 0) ?? 0

  const dados = (data?.items ?? []).map((item) => ({
    status: ROTULOS[item.status] ?? item.status,
    total: item.total,
  }))

  return (
    <div className="relative bg-white border-2 border-[#e0e0e0] rounded-[5px] h-full flex flex-col">
      {/* Filtros: absoluto no topo direito */}
      <div className="absolute top-[13px] right-[14px]">
        <FiltroPeriodo filtros={filtros} onChange={setFiltros} />
      </div>

      {/* Cabeçalho abaixo dos filtros */}
      <div className="px-4 pt-[50px] pb-2">
        <h3 className="text-[18px] font-bold text-[#1d5358]">
          Distribuição de pedidos por status
        </h3>
        <div className="flex items-center gap-1 mt-1 text-[11px]">
          <span className="text-[#343434] font-medium">Total de pedidos no mês:</span>
          <span className="font-bold text-[#343434]">{total || '—'}</span>
          {total > 0 && <TagVariacao valor="+12%/ABR" tipo="bom" />}
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
            <BarChart
              data={dados}
              layout="vertical"
              margin={{ top: 4, right: 56, left: 0, bottom: 16 }}
            >
              <CartesianGrid strokeDasharray="4 4" stroke="#e0e0e0" horizontal={false} />
              <XAxis
                type="number"
                tick={{ fontSize: 9, fill: '#343434' }}
                axisLine={false}
                tickLine={false}
                label={{
                  value: 'Quantidade de pedidos',
                  position: 'insideBottom',
                  offset: -12,
                  fontSize: 10,
                  fill: '#343434',
                }}
              />
              <YAxis
                type="category"
                dataKey="status"
                tick={{ fontSize: 9, fill: '#343434' }}
                axisLine={false}
                tickLine={false}
                width={130}
              />
              <Tooltip
                formatter={(v: number) => [v, 'Pedidos']}
                contentStyle={{ fontSize: 11, borderColor: '#e0e0e0', borderRadius: 5 }}
              />
              <Bar dataKey="total" fill="#3f7377" radius={[0, 2, 2, 0]} barSize={16}>
                <LabelList
                  dataKey="total"
                  position="right"
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

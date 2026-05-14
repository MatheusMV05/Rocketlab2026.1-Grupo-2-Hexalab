import type { PedidoItem } from '../../../types/pedidos'
import { Checkbox } from '../../atoms/compartilhados/Checkbox'
import { StatusBadge } from '../../atoms/pedidos/StatusBadge'
import { formatarReaisCompleto } from '../../../utils/formatadores'
import { useState } from 'react'

interface Props {
  pedidos: PedidoItem[]
  isLoading: boolean
  isError: boolean
}

export function TabelaPedidosPremium({ pedidos, isLoading, isError }: Props) {
  const [selecionados, setSelecionados] = useState<string[]>([])

  const toggleTodos = () => {
    if (selecionados.length === pedidos.length) {
      setSelecionados([])
    } else {
      setSelecionados(pedidos.map(p => p.id))
    }
  }

  const toggleUm = (id: string) => {
    if (selecionados.includes(id)) {
      setSelecionados(selecionados.filter(s => s !== id))
    } else {
      setSelecionados([...selecionados, id])
    }
  }

  return (
    <div className="bg-white border border-[#e0e0e0] rounded-[24px] shadow-sm overflow-hidden">
      <table className="w-full border-collapse text-left">
        <thead>
          <tr className="border-b border-[#f0f0f0]">
            <th className="pl-6 py-4 w-12">
              <Checkbox 
                checked={pedidos.length > 0 && selecionados.length === pedidos.length}
                onChange={toggleTodos}
              />
            </th>
            <th className="px-4 py-4 text-[13px] font-semibold text-[#898989] uppercase tracking-wider">Pedido</th>
            <th className="px-4 py-4 text-[13px] font-semibold text-[#898989] uppercase tracking-wider">Produto</th>
            <th className="px-4 py-4 text-[13px] font-semibold text-[#898989] uppercase tracking-wider">Valor</th>
            <th className="px-4 py-4 text-[13px] font-semibold text-[#898989] uppercase tracking-wider">Período</th>
            <th className="px-4 py-4 text-[13px] font-semibold text-[#898989] uppercase tracking-wider">Pgto.</th>
            <th className="px-4 py-4 text-[13px] font-semibold text-[#898989] uppercase tracking-wider">Risco</th>
            <th className="px-4 py-4 text-[13px] font-semibold text-[#898989] uppercase tracking-wider">Status</th>
            <th className="pr-6 py-4 text-[13px] font-semibold text-[#898989] uppercase tracking-wider text-right">Qtd.</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-[#f0f0f0]">
          {isLoading && (
            <tr>
              <td colSpan={9} className="px-6 py-20 text-center text-[#898989]">Carregando pedidos...</td>
            </tr>
          )}
          {isError && (
            <tr>
              <td colSpan={9} className="px-6 py-20 text-center text-red-500">Erro ao carregar pedidos.</td>
            </tr>
          )}
          {!isLoading && !isError && pedidos.length === 0 && (
            <tr>
              <td colSpan={9} className="px-6 py-20 text-center text-[#898989]">Nenhum pedido encontrado.</td>
            </tr>
          )}
          {!isLoading && !isError && pedidos.map((pedido) => (
            <tr key={pedido.id} className="hover:bg-[#fcfcfc] transition-colors group">
              <td className="pl-6 py-4">
                <Checkbox 
                  checked={selecionados.includes(pedido.id)}
                  onChange={() => toggleUm(pedido.id)}
                />
              </td>
              <td className="px-4 py-4 text-[14px] font-semibold text-[#1d5358]">
                #{pedido.cod_pedido}
              </td>
              <td className="px-4 py-4 text-[13px] font-medium text-[#343434]">
                {pedido.cod_produto}
              </td>
              <td className="px-4 py-4 text-[13px] font-semibold text-[#343434]">
                {formatarReaisCompleto(pedido.valor)}
              </td>
              <td className="px-4 py-4 text-[13px] text-[#343434]">
                {pedido.data}
              </td>
              <td className="px-4 py-4 text-[13px] text-[#343434]">
                {pedido.metodo_pagamento}
              </td>
              <td className="px-4 py-4 text-[13px]">
                <span className={`${
                  pedido.risco === 'Atrasado' ? 'text-red-500 font-bold' : 
                  pedido.risco.includes('05 dias') ? 'text-[#e37405] font-semibold' : 
                  'text-[#3f7377]'
                }`}>
                  {pedido.risco}
                </span>
              </td>
              <td className="px-4 py-4">
                <StatusBadge status={pedido.status} />
              </td>
              <td className="pr-6 py-4 text-[13px] text-[#343434] text-right font-medium">
                {pedido.quantidade.toString().padStart(2, '0')}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

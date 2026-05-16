import { useState } from 'react'
import { ArrowLeft, Box, DollarSign, CreditCard, Layers, Edit, Share2, Sparkles, Layout } from 'lucide-react'
import type { PedidoDetalhe } from '../../../types/pedidos'
import { PedidoEditModal } from './PedidoEditModal'
import { useUpdatePedido } from '../../../hooks/usePedidos'

interface Props {
  pedidoId: string
  pedido: PedidoDetalhe | undefined
  isLoading: boolean
  onClose: () => void
}

export function PedidoPerfilView({ pedido, isLoading, onClose }: Props) {
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const updateMutation = useUpdatePedido()

  if (isLoading) {
    return (
      <div className="flex flex-col gap-8 animate-pulse">
        <div className="h-6 w-48 bg-gray-200 rounded"></div>
        <div className="grid grid-cols-4 gap-4">
          {[1,2,3,4].map(i => <div key={i} className="h-24 bg-gray-100 rounded-2xl"></div>)}
        </div>
      </div>
    )
  }

  if (!pedido) return null

  const handleSave = (dados: any) => {
    updateMutation.mutate({ id: pedido.id, dados }, {
      onSuccess: () => {
        setIsEditModalOpen(false)
      }
    })
  }

  return (
    <div className="flex flex-col gap-8">
      {/* Header / Breadcrumb */}
      <div className="flex flex-col gap-4">
        <button 
          onClick={onClose}
          className="flex items-center gap-2 text-[#898989] hover:text-[#1d5358] transition-colors text-[13px] font-medium"
        >
          <ArrowLeft size={16} />
          <span>Todos os pedidos</span>
        </button>
      </div>

      {/* KPI Cards Top */}
      <div className="grid grid-cols-4 gap-4">
        <div className="p-6 bg-white rounded-[24px] shadow-sm border border-[#f0f0f0] flex items-center gap-4">
          <div className="w-12 h-12 bg-[#f6fbfb] rounded-2xl flex items-center justify-center text-[#1d5358]">
            <Layers size={24} />
          </div>
          <div className="flex flex-col">
            <span className="text-[11px] text-[#898989] font-medium uppercase">Status financeiro</span>
            <span className="text-[18px] font-bold text-[#343434] capitalize">{pedido.status}</span>
          </div>
        </div>

        <div className="p-6 bg-white rounded-[24px] shadow-sm border border-[#f0f0f0] flex items-center gap-4">
          <div className="w-12 h-12 bg-[#f6fbfb] rounded-2xl flex items-center justify-center text-[#1d5358]">
            <DollarSign size={24} />
          </div>
          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <span className="text-[11px] text-[#898989] font-medium uppercase">Receita retida</span>
              <span className="px-2 py-0.5 bg-[#fff1f1] text-[#c20000] text-[9px] font-bold rounded-full uppercase">Alta retenção</span>
            </div>
            <span className="text-[18px] font-bold text-[#343434]">
              {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(pedido.valor_total)}
            </span>
          </div>
        </div>

        <div className="p-6 bg-white rounded-[24px] shadow-sm border border-[#f0f0f0] flex items-center gap-4">
          <div className="w-12 h-12 bg-[#f6fbfb] rounded-2xl flex items-center justify-center text-[#1d5358]">
            <CreditCard size={24} />
          </div>
          <div className="flex flex-col">
            <span className="text-[11px] text-[#898989] font-medium uppercase">Pagamento</span>
            <span className="text-[18px] font-bold text-[#343434] uppercase">{pedido.metodo_pagamento}</span>
          </div>
        </div>

        <div className="p-6 bg-white rounded-[24px] shadow-sm border border-[#f0f0f0] flex items-center gap-4">
          <div className="w-12 h-12 bg-[#f6fbfb] rounded-2xl flex items-center justify-center text-[#1d5358]">
            <Box size={24} />
          </div>
          <div className="flex flex-col">
            <span className="text-[11px] text-[#898989] font-medium uppercase">Quantidade</span>
            <span className="text-[18px] font-bold text-[#343434]">
              {pedido.quantidade_total.toString().padStart(2, '0')} unidades
            </span>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="bg-white rounded-[32px] border border-[#f0f0f0] shadow-sm overflow-hidden">
        {/* Section Header */}
        <div className="p-8 border-b border-[#f0f0f0] flex items-center justify-between">
          <div className="flex flex-col">
            <h3 className="text-[18px] font-bold text-[#1d5358]">Detalhes do pedido</h3>
            <span className="text-[12px] text-[#898989] uppercase font-medium">{pedido.cod_pedido.slice(0, 10)}...</span>
          </div>
          <div className="flex items-center gap-2">
            <button 
              onClick={() => setIsEditModalOpen(true)}
              className="p-3 bg-white border border-[#e0e0e0] rounded-[12px] text-[#898989] hover:text-[#1d5358] hover:border-[#1d5358] transition-all"
            >
              <Edit size={18} />
            </button>
            <button className="p-3 bg-white border border-[#e0e0e0] rounded-[12px] text-[#898989] hover:text-[#1d5358] hover:border-[#1d5358] transition-all">
              <Share2 size={18} />
            </button>
          </div>
        </div>

        {/* Details Grid */}
        <div className="p-8 grid grid-cols-1 gap-8">
          <div className="grid grid-cols-2 gap-y-6">
            <div className="flex flex-col gap-1">
              <span className="text-[13px] font-bold text-[#343434]">ID do pedido</span>
              <span className="text-[14px] text-[#898989]">{pedido.id}</span>
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-[13px] font-bold text-[#343434]">ID do cliente</span>
              <span className="text-[14px] text-[#898989]">{pedido.id_cliente}</span>
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-[13px] font-bold text-[#343434]">Valor</span>
              <span className="text-[14px] text-[#898989]">
                {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(pedido.valor_total)}
              </span>
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-[13px] font-bold text-[#343434]">Data do pedido</span>
              <span className="text-[14px] text-[#898989]">{pedido.data}</span>
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-[13px] font-bold text-[#343434]">Método de pagamento</span>
              <span className="text-[14px] text-[#898989] uppercase">{pedido.metodo_pagamento}</span>
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-[13px] font-bold text-[#343434]">Quantidade</span>
              <span className="text-[14px] text-[#898989]">{pedido.quantidade_total.toString().padStart(2, '0')} unidades</span>
            </div>
          </div>

          {/* Produtos Cards */}
          <div className="flex flex-col gap-4">
            <h4 className="text-[14px] font-bold text-[#343434]">Produtos</h4>
            <div className="grid grid-cols-3 gap-6">
              {pedido.produtos.map((p, idx) => (
                <div key={idx} className="p-4 rounded-[20px] border border-[#f0f0f0] bg-[#fafafa]/50 flex flex-col gap-4">
                  <div className="flex flex-col">
                    <span className="text-[10px] text-[#898989] uppercase font-bold">{p.cod_produto}</span>
                    <h5 className="text-[15px] font-bold text-[#343434] line-clamp-1">{p.nome_produto}</h5>
                    <span className="text-[12px] text-[#898989]">{p.categoria}</span>
                  </div>
                  <div className="w-full aspect-[4/3] bg-white rounded-[16px] border border-[#f0f0f0] flex items-center justify-center">
                    <Box size={32} className="text-[#f0f0f0]" />
                  </div>
                  <div className="flex items-center justify-between mt-2 pt-3 border-t border-[#f0f0f0]">
                    <span className="text-[16px] font-bold text-[#1d5358]">
                      {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(p.valor)}
                    </span>
                    <div className="flex flex-col items-end">
                      <div className="flex items-center gap-1">
                        <span className="text-[12px] font-bold text-[#1d5358]">0.0</span>
                        <span className="text-[10px] text-[#898989]">★</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* AI Insights Section */}
      <div className="p-8 bg-[#f2f4f6] rounded-[24px] flex flex-col gap-4 relative overflow-hidden">
        <div className="flex items-center gap-2 text-[#1d5358]">
          <Sparkles size={18} />
          <h4 className="text-[14px] font-bold">Principais insights detectados:</h4>
        </div>
        <ul className="flex flex-col gap-2 pl-6 list-disc text-[13px] text-[#343434] font-medium leading-relaxed">
          <li>Cartão de crédito concentra maior índice de reembolso.</li>
          <li>PIX representa o maior volume de pedidos aprovados.</li>
          <li>Pedidos com mais de 3 itens apresentam maior ticket médio.</li>
          <li>Pedidos reembolsados apresentam menor receita líquida.</li>
        </ul>
        <Sparkles size={120} className="absolute -bottom-8 -right-8 text-[#1d5358]/5 rotate-12" />
      </div>

      {/* Financial Summary */}
      <div className="bg-white rounded-[32px] border border-[#f0f0f0] shadow-sm overflow-hidden mb-12">
        <div className="p-8 border-b border-[#f0f0f0] flex items-center justify-between">
          <div className="flex flex-col">
            <h3 className="text-[18px] font-bold text-[#1d5358]">Resumo financeiro do pedido</h3>
            <span className="text-[12px] text-[#898989] uppercase font-medium">{pedido.cod_pedido.slice(0, 10)}...</span>
          </div>
          <div className="flex items-center gap-2">
            <button className="p-3 bg-white border border-[#e0e0e0] rounded-[12px] text-[#898989] hover:text-[#1d5358] hover:border-[#1d5358] transition-all">
              <Edit size={18} />
            </button>
            <button className="p-3 bg-white border border-[#e0e0e0] rounded-[12px] text-[#898989] hover:text-[#1d5358] hover:border-[#1d5358] transition-all">
              <Share2 size={18} />
            </button>
          </div>
        </div>
        
        <table className="w-full">
          <thead>
            <tr className="border-b border-[#f0f0f0]">
              <th className="text-left p-6 pl-8 text-[12px] font-bold text-[#343434] uppercase tracking-wider">Indicador</th>
              <th className="text-right p-6 pr-8 text-[12px] font-bold text-[#343434] uppercase tracking-wider">Valor</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#f0f0f0]">
            {[
              { label: 'Receita bruta', value: new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(pedido.valor_total) },
              { label: 'Receita líquida', value: new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(pedido.valor_total * 0.9) },
              { label: 'Diferença', value: new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(pedido.valor_total * 0.1) },
              { label: 'Status financeiro', value: pedido.status, isStatus: true },
            ].map((row, idx) => (
              <tr key={idx} className="hover:bg-gray-50 transition-colors">
                <td className="p-6 pl-8 text-[14px] font-medium text-[#343434]">{row.label}</td>
                <td className={`p-6 pr-8 text-[14px] font-bold text-right ${row.isStatus ? 'text-[#1d5358] capitalize' : 'text-[#343434]'}`}>
                  {row.value}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <PedidoEditModal 
        pedido={pedido}
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        onSave={handleSave}
      />
    </div>
  )
}

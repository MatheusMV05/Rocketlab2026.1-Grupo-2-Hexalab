import { X, User, ShoppingBag, CreditCard, Clock, CheckCircle2 } from 'lucide-react'
import type { PedidoItem } from '../../../types/pedidos'
import { StatusBadge } from '../../atoms/pedidos/StatusBadge'

interface Props {
  pedido: PedidoItem | null
  isOpen: boolean
  onClose: () => void
  onUpdateStatus: (id: string, newStatus: string) => void
}

export function GavetaPedido({ pedido, isOpen, onClose, onUpdateStatus }: Props) {
  if (!pedido) return null

  const statuses = ['aprovado', 'processando', 'recusado', 'reembolsado']

  return (
    <>
      {/* Overlay */}
      <div 
        className={`fixed inset-0 bg-black/20 backdrop-blur-sm z-[100] transition-opacity duration-300 ${
          isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        onClick={onClose}
      />

      {/* Side Panel */}
      <div 
        className={`fixed top-0 right-0 h-full w-full max-w-[450px] bg-white shadow-2xl z-[101] transform transition-transform duration-300 ease-out flex flex-col ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        {/* Header */}
        <div className="p-6 border-b border-[#f0f0f0] flex items-center justify-between bg-[#fcfcfc]">
          <div className="flex flex-col">
            <span className="text-[12px] text-[#898989] font-medium uppercase tracking-wider">Edição de Pedido</span>
            <h2 className="text-[18px] font-bold text-[#1d5358]">#{pedido.cod_pedido.slice(0, 8)}</h2>
          </div>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-[#f0f0f0] rounded-full transition-colors text-[#898989]"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-8 custom-scrollbar">
          {/* Status Section */}
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-2 text-[#1d5358]">
              <CheckCircle2 size={16} />
              <h3 className="text-[14px] font-bold">Status do Pedido</h3>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {statuses.map(s => (
                <button
                  key={s}
                  onClick={() => onUpdateStatus(pedido.id, s)}
                  className={`px-3 py-2 rounded-[8px] text-[12px] font-medium border transition-all ${
                    pedido.status.toLowerCase() === s
                    ? 'bg-[#1d5358] border-[#1d5358] text-white shadow-md'
                    : 'bg-white border-[#f0f0f0] text-[#343434] hover:border-[#1d5358]/30'
                  }`}
                >
                  {s.charAt(0).toUpperCase() + s.slice(1)}
                </button>
              ))}
            </div>
          </div>

          {/* Info Sections */}
          <div className="flex flex-col gap-6">
            <div className="p-4 bg-[#f6f7f9] rounded-[16px] flex flex-col gap-4">
              <div className="flex items-center gap-2 text-[#1d5358]">
                <User size={16} />
                <span className="text-[13px] font-bold">Informações do Cliente</span>
              </div>
              <div className="flex flex-col gap-1 pl-6">
                <p className="text-[14px] font-bold text-[#343434]">{pedido.nome_cliente}</p>
                <p className="text-[12px] text-[#898989]">ID: {pedido.id.slice(0, 8)}...</p>
              </div>
            </div>

            <div className="p-4 bg-[#f6f7f9] rounded-[16px] flex flex-col gap-4">
              <div className="flex items-center gap-2 text-[#1d5358]">
                <ShoppingBag size={16} />
                <span className="text-[13px] font-bold">Detalhes do Produto</span>
              </div>
              <div className="flex flex-col gap-2 pl-6">
                <p className="text-[14px] font-bold text-[#343434]">{pedido.nome_produto}</p>
                <div className="flex items-center justify-between">
                  <span className="text-[12px] text-[#898989]">Categoria:</span>
                  <span className="text-[12px] font-medium text-[#343434] capitalize">{pedido.categoria}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[12px] text-[#898989]">Quantidade:</span>
                  <span className="text-[12px] font-medium text-[#343434]">{pedido.quantidade} un.</span>
                </div>
              </div>
            </div>

            <div className="p-4 bg-[#f6f7f9] rounded-[16px] flex flex-col gap-4">
              <div className="flex items-center gap-2 text-[#1d5358]">
                <CreditCard size={16} />
                <span className="text-[13px] font-bold">Pagamento</span>
              </div>
              <div className="flex flex-col gap-2 pl-6">
                <div className="flex items-center justify-between">
                  <span className="text-[12px] text-[#898989]">Método:</span>
                  <span className="text-[12px] font-medium text-[#343434] uppercase">{pedido.metodo_pagamento}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[12px] text-[#898989]">Valor Total:</span>
                  <span className="text-[16px] font-bold text-[#1d5358]">
                    {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(pedido.valor)}
                  </span>
                </div>
              </div>
            </div>

            <div className="p-4 bg-[#f6f7f9] rounded-[16px] flex flex-col gap-4">
              <div className="flex items-center gap-2 text-[#1d5358]">
                <Clock size={16} />
                <span className="text-[13px] font-bold">Data do Pedido</span>
              </div>
              <div className="pl-6">
                <p className="text-[14px] font-medium text-[#343434]">{pedido.data}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-[#f0f0f0] flex gap-3 bg-[#fcfcfc]">
          <button 
            onClick={onClose}
            className="flex-1 py-3 rounded-[12px] text-[14px] font-bold text-[#898989] bg-white border border-[#f0f0f0] hover:bg-[#f9f9f9] transition-colors"
          >
            Cancelar
          </button>
          <button 
            onClick={onClose}
            className="flex-1 py-3 rounded-[12px] text-[14px] font-bold text-white bg-[#1d5358] hover:bg-[#153f43] transition-colors shadow-lg shadow-[#1d5358]/20"
          >
            Salvar Alterações
          </button>
        </div>
      </div>
    </>
  )
}

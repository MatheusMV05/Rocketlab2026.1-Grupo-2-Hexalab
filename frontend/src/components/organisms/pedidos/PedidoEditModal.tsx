import { useState, useEffect } from 'react'
import { X, Trash2, PlusCircle } from 'lucide-react'
import type { PedidoDetalhe, ProdutoNoPedido } from '../../../types/pedidos'
import { ConfirmacaoModal } from '../../molecules/compartilhados/ConfirmacaoModal'

interface Props {
  pedido: PedidoDetalhe | null
  isOpen: boolean
  onClose: () => void
  onSave: (dados: any) => void
}

export function PedidoEditModal({ pedido, isOpen, onClose, onSave }: Props) {
  const [formData, setFormData] = useState({
    valor: 0,
    data: '',
    metodo_pagamento: '',
    quantidade: 1,
    produtos: [] as ProdutoNoPedido[]
  })
  
  const [isConfirmOpen, setIsConfirmOpen] = useState(false)

  useEffect(() => {
    if (pedido) {
      setFormData({
        valor: pedido.valor_total,
        data: pedido.data,
        metodo_pagamento: pedido.metodo_pagamento,
        quantidade: pedido.quantidade_total,
        produtos: [...pedido.produtos]
      })
    }
  }, [pedido])

  if (!pedido || !isOpen) return null

  const handleApply = () => {
    setIsConfirmOpen(true)
  }

  const handleConfirm = () => {
    onSave(formData)
    setIsConfirmOpen(false)
  }

  const removeProduto = (index: number) => {
    setFormData(prev => ({
      ...prev,
      produtos: prev.produtos.filter((_, i) => i !== index)
    }))
  }

  return (
    <>
      <div className="fixed inset-0 z-[150] flex items-center justify-center p-4">
        {/* Overlay */}
        <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
        
        {/* Modal Content */}
        <div className="relative bg-white rounded-[24px] shadow-2xl w-full max-w-[900px] max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
          {/* Header */}
          <div className="p-6 border-b border-[#f0f0f0] flex items-center justify-between">
            <h2 className="text-[18px] font-bold text-[#1d5358]">
              Edição de perfil do pedido ({pedido.cod_pedido.slice(0, 8)}...)
            </h2>
            <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
              <X size={20} className="text-[#898989]" />
            </button>
          </div>

          {/* Scrollable Content */}
          <div className="flex-1 overflow-y-auto p-8 flex flex-col gap-8 custom-scrollbar">
            {/* Fields Grid */}
            <div className="grid grid-cols-2 gap-6">
              <div className="flex flex-col gap-2">
                <label className="text-[12px] font-medium text-[#898989] uppercase">Valor</label>
                <input 
                  type="text"
                  value={new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(formData.valor)}
                  onChange={(e) => {
                    const val = parseFloat(e.target.value.replace(/[^\d]/g, '')) / 100
                    setFormData(prev => ({ ...prev, valor: val }))
                  }}
                  className="w-full h-[48px] px-4 rounded-[12px] border border-[#e0e0e0] text-[14px] font-medium text-[#343434] focus:outline-none focus:border-[#1d5358] transition-colors"
                />
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-[12px] font-medium text-[#898989] uppercase">Data do pedido</label>
                <input 
                  type="text"
                  value={formData.data}
                  onChange={(e) => setFormData(prev => ({ ...prev, data: e.target.value }))}
                  placeholder="DD-MM-YYYY"
                  className="w-full h-[48px] px-4 rounded-[12px] border border-[#e0e0e0] text-[14px] font-medium text-[#343434] focus:outline-none focus:border-[#1d5358] transition-colors"
                />
              </div>
            </div>

            {/* Pagamento */}
            <div className="flex flex-col gap-3">
              <label className="text-[12px] font-medium text-[#898989] uppercase">Pagamento</label>
              <div className="flex gap-2">
                {['Wall-et', 'Card', 'Cash', 'Pix'].map(metodo => (
                  <button
                    key={metodo}
                    onClick={() => setFormData(prev => ({ ...prev, metodo_pagamento: metodo }))}
                    className={`px-6 py-2.5 rounded-[12px] text-[13px] font-bold border transition-all ${
                      formData.metodo_pagamento.toLowerCase() === metodo.toLowerCase()
                      ? 'bg-[#f6fbfb] border-[#1d5358] text-[#1d5358]'
                      : 'bg-white border-[#e0e0e0] text-[#898989] hover:border-[#1d5358]/30'
                    }`}
                  >
                    {metodo}
                  </button>
                ))}
              </div>
            </div>

            {/* Quantidade */}
            <div className="flex flex-col gap-2">
              <label className="text-[12px] font-medium text-[#898989] uppercase">Quantidade</label>
              <div className="flex items-center gap-4 w-[120px] h-[48px] px-3 rounded-[12px] border border-[#e0e0e0]">
                <button 
                  onClick={() => setFormData(prev => ({ ...prev, quantidade: Math.max(1, prev.quantidade - 1) }))}
                  className="w-8 h-8 flex items-center justify-center text-[#898989] hover:text-[#1d5358]"
                >
                  -
                </button>
                <span className="flex-1 text-center text-[14px] font-bold text-[#343434]">
                  {formData.quantidade.toString().padStart(2, '0')}
                </span>
                <button 
                  onClick={() => setFormData(prev => ({ ...prev, quantidade: prev.quantidade + 1 }))}
                  className="w-8 h-8 flex items-center justify-center text-[#898989] hover:text-[#1d5358]"
                >
                  +
                </button>
              </div>
            </div>

            {/* Produtos */}
            <div className="flex flex-col gap-4">
              <label className="text-[12px] font-medium text-[#898989] uppercase">Produtos</label>
              <div className="grid grid-cols-3 gap-4">
                {formData.produtos.map((p, idx) => (
                  <div key={idx} className="relative p-4 rounded-[20px] border border-[#f0f0f0] bg-white group hover:shadow-lg transition-all">
                    <button 
                      onClick={() => removeProduto(idx)}
                      className="absolute -top-2 -right-2 w-6 h-6 bg-white border border-[#c20000] text-[#c20000] rounded-full flex items-center justify-center shadow-sm hover:bg-[#c20000] hover:text-white transition-all opacity-0 group-hover:opacity-100 z-10"
                    >
                      <X size={14} />
                    </button>
                    
                    <div className="flex flex-col gap-3">
                      <div className="flex flex-col gap-0.5">
                        <span className="text-[10px] text-[#898989] uppercase font-bold">{p.cod_produto}</span>
                        <h4 className="text-[14px] font-bold text-[#343434] line-clamp-1">{p.nome_produto}</h4>
                        <span className="text-[11px] text-[#898989]">{p.categoria}</span>
                      </div>
                      
                      {/* Fake Image Placeholder */}
                      <div className="w-full aspect-square bg-[#f8f9fb] rounded-[12px] flex items-center justify-center text-[#e0e0e0]">
                        <PlusCircle size={32} />
                      </div>

                      <div className="flex items-center justify-between mt-2 pt-3 border-t border-[#f0f0f0]">
                        <span className="text-[14px] font-bold text-[#1d5358]">
                          {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(p.valor)}
                        </span>
                        <div className="flex flex-col items-end">
                          <span className="text-[9px] text-[#898989] uppercase font-bold">Estoque</span>
                          <span className="text-[12px] font-bold text-[#343434]">00</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
                
                <button className="flex flex-col items-center justify-center gap-3 p-4 rounded-[20px] border-2 border-dashed border-[#e0e0e0] text-[#898989] hover:border-[#1d5358] hover:text-[#1d5358] transition-all min-h-[300px]">
                  <PlusCircle size={24} />
                  <span className="text-[13px] font-bold">Adicionar produto</span>
                </button>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="p-6 border-t border-[#f0f0f0] bg-white flex items-center justify-end gap-3">
            <button 
              onClick={onClose}
              className="px-6 py-2.5 rounded-[12px] text-[14px] font-bold text-[#898989] hover:bg-gray-50 transition-colors border border-transparent"
            >
              Cancelar
            </button>
            <button 
              onClick={handleApply}
              className="px-8 py-2.5 rounded-[12px] bg-[#1d5358] text-[14px] font-bold text-white hover:bg-[#153f43] transition-colors shadow-lg shadow-[#1d5358]/20"
            >
              Aplicar
            </button>
          </div>
        </div>
      </div>

      <ConfirmacaoModal 
        isOpen={isConfirmOpen}
        titulo="Confirmar alterações"
        mensagem={`Deseja confirmar as alterações feitas no pedido ${pedido.cod_pedido.slice(0, 8)}...?`}
        onConfirm={handleConfirm}
        onCancel={() => setIsConfirmOpen(false)}
      />
    </>
  )
}

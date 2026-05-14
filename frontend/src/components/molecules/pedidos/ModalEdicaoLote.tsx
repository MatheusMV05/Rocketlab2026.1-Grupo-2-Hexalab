import { useState } from 'react'
import { X, CheckCircle2, AlertCircle } from 'lucide-react'

type ModalState = 'edit' | 'confirm' | 'success'

interface Props {
  isOpen: boolean
  onClose: () => void
  selectedCount: number
  onConfirm: (data: any) => void
}

export function ModalEdicaoLote({ isOpen, onClose, selectedCount, onConfirm }: Props) {
  const [step, setStep] = useState<ModalState>('edit')
  const [formData, setFormData] = useState({
    pagamento: '',
    status: ''
  })

  if (!isOpen) return null

  const handleApply = () => {
    if (formData.pagamento || formData.status) {
      setStep('confirm')
    }
  }

  const handleConfirm = () => {
    onConfirm(formData)
    setStep('success')
  }

  const handleClose = () => {
    setStep('edit')
    onClose()
  }

  const renderContent = () => {
    switch (step) {
      case 'edit':
        return (
          <div className="flex flex-col gap-6 animate-in fade-in duration-300">
            <div className="flex flex-col gap-4">
              <label className="text-[12px] font-bold text-[#898989] uppercase">ID</label>
              <input 
                disabled 
                value="0d244537-8164-4b84-bcf2-0e43766f3221" 
                className="w-full px-4 py-3 bg-[#f6f7f9] border border-[#e0e0e0] rounded-[10px] text-[14px] text-[#343434] opacity-50"
              />
            </div>

            <div className="flex flex-col gap-4">
              <label className="text-[12px] font-bold text-[#898989] uppercase">Pagamento</label>
              <div className="flex gap-2">
                {['Wall-et', 'Card', 'Cash', 'Pix'].map(p => (
                  <button
                    key={p}
                    onClick={() => setFormData({ ...formData, pagamento: p })}
                    className={`px-4 py-2 rounded-[8px] text-[13px] font-medium border transition-all ${
                      formData.pagamento === p
                      ? 'bg-[#1d5358] border-[#1d5358] text-white shadow-md'
                      : 'bg-white border-[#f0f0f0] text-[#343434] hover:border-[#1d5358]/30'
                    }`}
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex flex-col gap-4">
              <label className="text-[12px] font-bold text-[#898989] uppercase">Status</label>
              <div className="flex gap-2">
                {['Em risco', 'Atrasado', 'Dentro do SLA', 'Finalizado'].map(s => (
                  <button
                    key={s}
                    onClick={() => setFormData({ ...formData, status: s })}
                    className={`px-4 py-2 rounded-[8px] text-[13px] font-medium border transition-all ${
                      formData.status === s
                      ? 'bg-[#1d5358] border-[#1d5358] text-white shadow-md'
                      : 'bg-white border-[#f0f0f0] text-[#343434] hover:border-[#1d5358]/30'
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex gap-3 mt-4">
              <button onClick={handleClose} className="flex-1 py-3 rounded-[12px] text-[14px] font-bold text-[#343434] border border-[#f0f0f0] hover:bg-[#f9f9f9]">
                Cancelar
              </button>
              <button 
                onClick={handleApply} 
                disabled={!formData.pagamento && !formData.status}
                className="flex-1 py-3 rounded-[12px] text-[14px] font-bold text-white bg-[#1d5358] disabled:opacity-50 hover:bg-[#153f43] transition-shadow"
              >
                Aplicar
              </button>
            </div>
          </div>
        )

      case 'confirm':
        return (
          <div className="flex flex-col items-center text-center gap-6 animate-in zoom-in-95 duration-300">
            <div className="p-4 bg-[#f6f7f9] rounded-full text-[#1d5358]">
              <AlertCircle size={40} />
            </div>
            <p className="text-[16px] font-medium text-[#343434] leading-relaxed">
              Confirmar alterações em <br />
              <span className="font-bold">"{formData.pagamento || 'Sem alteração'}"</span> e <br />
              <span className="font-bold">"{formData.status || 'Sem alteração'}"</span>
            </p>
            <div className="flex gap-3 w-full">
              <button onClick={() => setStep('edit')} className="flex-1 py-3 rounded-[12px] text-[14px] font-bold text-[#343434] border border-[#f0f0f0]">
                Cancelar
              </button>
              <button onClick={handleConfirm} className="flex-1 py-3 rounded-[12px] text-[14px] font-bold text-white bg-[#1d5358]">
                Confirmar
              </button>
            </div>
          </div>
        )

      case 'success':
        return (
          <div className="flex flex-col items-center text-center gap-6 animate-in zoom-in-95 duration-300">
            <div className="p-4 bg-[#eefaf3] rounded-full text-[#1a9a45]">
              <CheckCircle2 size={40} />
            </div>
            <h3 className="text-[18px] font-bold text-[#343434]">Lista editada com sucesso!</h3>
            <button onClick={handleClose} className="w-full py-3 rounded-[12px] text-[14px] font-bold text-white bg-[#1d5358]">
              Fechar
            </button>
          </div>
        )
    }
  }

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[200] flex items-center justify-center p-4">
      <div className={`bg-white rounded-[24px] shadow-2xl w-full transition-all duration-300 ${
        step === 'edit' ? 'max-w-[500px]' : 'max-w-[400px]'
      } overflow-hidden`}>
        <div className="p-6 border-b border-[#f0f0f0] flex items-center justify-between">
          <h2 className="text-[16px] font-bold text-[#343434]">
            {step === 'edit' ? `Edição de linhas selecionadas (${selectedCount.toString().padStart(2, '0')})` : ''}
          </h2>
          <button onClick={handleClose} className="p-1 hover:bg-[#f0f0f0] rounded-full">
            <X size={20} className="text-[#898989]" />
          </button>
        </div>
        <div className="p-8">
          {renderContent()}
        </div>
      </div>
    </div>
  )
}

import { X, Check } from 'lucide-react'

interface Props {
  isOpen: boolean
  titulo: string
  mensagem: string
  onConfirm: () => void
  onCancel: () => void
}

export function ConfirmacaoModal({ isOpen, titulo, mensagem, onConfirm, onCancel }: Props) {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
      {/* Overlay */}
      <div 
        className="absolute inset-0 bg-black/40 backdrop-blur-[2px]"
        onClick={onCancel}
      />
      
      {/* Modal */}
      <div className="relative bg-white rounded-[24px] shadow-2xl w-full max-w-[400px] p-8 flex flex-col items-center text-center gap-6 animate-in zoom-in-95 duration-200">
        <div className="w-16 h-16 bg-[#f6fbfb] rounded-full flex items-center justify-center text-[#1d5358]">
          <Check size={32} />
        </div>

        <div className="flex flex-col gap-2">
          <h3 className="text-[18px] font-bold text-[#343434]">{titulo}</h3>
          <p className="text-[14px] text-[#898989] leading-relaxed">
            {mensagem}
          </p>
        </div>

        <div className="flex items-center gap-3 w-full">
          <button 
            onClick={onCancel}
            className="flex-1 py-3 px-4 rounded-[12px] border border-[#e0e0e0] text-[14px] font-bold text-[#898989] hover:bg-gray-50 transition-colors"
          >
            Cancelar
          </button>
          <button 
            onClick={onConfirm}
            className="flex-1 py-3 px-4 rounded-[12px] bg-[#1d5358] text-[14px] font-bold text-white hover:bg-[#153f43] transition-colors shadow-lg shadow-[#1d5358]/20"
          >
            Confirmar
          </button>
        </div>

        <button 
          onClick={onCancel}
          className="absolute top-4 right-4 p-2 text-[#898989] hover:bg-gray-100 rounded-full transition-colors"
        >
          <X size={18} />
        </button>
      </div>
    </div>
  )
}

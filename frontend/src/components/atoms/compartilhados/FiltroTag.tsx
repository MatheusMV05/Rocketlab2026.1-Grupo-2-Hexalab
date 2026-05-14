import { X } from 'lucide-react'

interface Props {
  label: string
  valor: string
  onRemove: () => void
}

export function FiltroTag({ label, valor, onRemove }: Props) {
  return (
    <div className="flex items-center gap-1.5 px-3 py-1 bg-white border border-[#1d5358] rounded-[8px] shadow-sm animate-in fade-in zoom-in duration-200">
      <span className="text-[12px] font-semibold text-[#1d5358]">{label}:</span>
      <span className="text-[12px] text-[#343434]">{valor}</span>
      <button 
        onClick={onRemove}
        className="ml-1 p-0.5 hover:bg-[#f6f7f9] rounded-full transition-colors"
      >
        <X size={14} className="text-[#1d5358]" />
      </button>
    </div>
  )
}

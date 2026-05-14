import { ReactNode } from 'react'
import { Clock } from 'lucide-react'

interface Props {
  titulo: string
  icone: ReactNode
  status: 'Atraso' | 'Risco de atraso' | 'Dentro do SLA'
  valor: string
  tempoMedio: string
  textoRodape: string
  selecionado: boolean
  onClick: () => void
}

export function CardEtapaFluxo({ 
  titulo, 
  icone, 
  status, 
  valor, 
  tempoMedio, 
  textoRodape, 
  selecionado, 
  onClick 
}: Props) {
  const getStatusColor = () => {
    switch (status) {
      case 'Atraso': return '#c20000'
      case 'Risco de atraso': return '#e37405'
      case 'Dentro do SLA': return '#1a9a45'
      default: return '#898989'
    }
  }

  const color = getStatusColor()

  return (
    <button 
      onClick={onClick}
      className={`flex-1 min-w-[200px] bg-white border rounded-[16px] overflow-hidden transition-all text-left flex flex-col ${
        selecionado ? 'border-[#1d5358] shadow-lg scale-[1.02] z-10' : 'border-[#f0f0f0] hover:border-[#1d5358]/30'
      }`}
    >
      <div className="p-4 flex-1 flex flex-col gap-4 relative">
        <div className="flex items-center justify-between">
          <div className="p-2 bg-[#f6f7f9] rounded-[8px] text-[#1d5358]">
            {icone}
          </div>
          <span className={`px-2 py-0.5 rounded-[4px] text-[10px] font-bold uppercase border`} 
            style={{ color, borderColor: color, backgroundColor: `${color}10` }}>
            {status}
          </span>
        </div>

        <div className="flex flex-col gap-1">
          <span className="text-[11px] text-[#898989] uppercase font-bold">Etapa</span>
          <span className="text-[14px] font-bold text-[#343434] leading-tight">{titulo}</span>
        </div>

        <div className="flex flex-col gap-1">
          <span className="text-[20px] font-bold text-[#343434]">{valor}</span>
          <div className="flex items-center gap-1 text-[11px] text-[#898989]">
            <Clock size={12} />
            <span>{tempoMedio}</span>
          </div>
        </div>
      </div>

      <div 
        className="px-3 py-2 text-[10px] font-bold text-white text-center leading-tight min-h-[32px] flex items-center justify-center transition-opacity"
        style={{ backgroundColor: color, opacity: selecionado ? 1 : 0.6 }}
      >
        {textoRodape}
      </div>
    </button>
  )
}

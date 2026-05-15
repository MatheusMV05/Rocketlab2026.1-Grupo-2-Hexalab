import type { ReactNode } from 'react'
import { TagVariacao } from '../../atoms/dashboard/TagVariacao'

interface Props {
  titulo: string
  valor: string
  variacao?: string
  tipo?: 'bom' | 'ruim'
  icone: ReactNode
}

export function CardKpi({ titulo, valor, variacao, tipo = 'bom', icone }: Props) {
  const renderValor = () => {
    if (valor.toLowerCase().includes('/cliente')) {
      const partes = valor.split(/(\/cliente)/i)
      return (
        <span className="text-[23px] font-semibold text-[#343434] leading-none flex items-baseline">
          {partes.map((parte, i) => 
            parte.toLowerCase() === '/cliente' 
              ? <span key={i} className="text-[14px] font-medium text-[#343434] ml-0.5">{parte}</span>
              : <span key={i}>{parte}</span>
          )}
        </span>
      )
    }
    return <span className="text-[23px] font-semibold text-[#343434] leading-none">{valor}</span>
  }

  return (
    <div className="bg-white rounded-[10px] shadow-[0px_8px_30px_0px_rgba(0,0,0,0.05)] px-5 py-[24px] flex items-center gap-4 flex-1 min-w-0">
      <div className="text-[#3f7377] shrink-0">{icone}</div>
      <div className="flex flex-col gap-1 min-w-0">
        <span className="text-[13px] text-[#4d4d4d] font-medium leading-none truncate">{titulo}</span>
        {renderValor()}
      </div>
      {variacao && (
        <div className="ml-auto shrink-0">
          <TagVariacao valor={variacao} tipo={tipo} />
        </div>
      )}
    </div>
  )
}

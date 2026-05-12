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
  return (
    <div className="bg-white rounded-[10px] shadow-[0px_8px_30px_0px_rgba(0,0,0,0.05)] px-4 py-[18px] flex items-end gap-4 flex-1 min-w-0">
      <div className="text-[#3f7377] shrink-0">{icone}</div>
      <div className="flex flex-col gap-1 min-w-0">
        <span className="text-[12px] text-[#4d4d4d] font-medium leading-none truncate">{titulo}</span>
        <span className="text-[20px] font-semibold text-[#343434] leading-none">{valor}</span>
      </div>
      {variacao && (
        <div className="ml-auto shrink-0">
          <TagVariacao valor={variacao} tipo={tipo} />
        </div>
      )}
    </div>
  )
}

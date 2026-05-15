import { RefreshCw } from 'react-feather'
import { ChipSugestao } from '../../atoms/chat/ChipSugestao'

interface Props {
  sugestoes: string[]
  onSelecionar: (texto: string) => void
  colunas?: 1 | 2
}

export function ListaSugestoes({ sugestoes, onSelecionar, colunas = 1 }: Props) {
  return (
    <div className="flex flex-col gap-[10px]">
      <div className="flex items-center gap-1 text-[12px] text-[#343434]">
        <RefreshCw size={12} strokeWidth={2} className="text-[#3f7377]" />
        <span>Sugestões:</span>
      </div>
      <div
        className={`grid gap-[10px] ${
          colunas === 2 ? 'grid-cols-1 md:grid-cols-2' : 'grid-cols-1'
        }`}
      >
        {sugestoes.map((texto) => (
          <ChipSugestao key={texto} texto={texto} onClick={() => onSelecionar(texto)} />
        ))}
      </div>
    </div>
  )
}

/**
 * Atom: BotaoFiltro
 * Botão de toggle para seleção de filtros em painéis expansíveis.
 * Estado ativo/inativo controlado externamente via prop `ativo`.
 */
interface Props {
  label: string
  ativo: boolean
  onClick: () => void
}

export function BotaoFiltro({ label, ativo, onClick }: Props) {
  return (
    <button
      onClick={onClick}
      className={`border-2 rounded-[10px] px-[10px] py-[10px] text-[13px] whitespace-nowrap transition-colors ${
        ativo
          ? 'border-[#3f7377] bg-[#dde5e6] text-[#1d5358] font-semibold'
          : 'border-[#e0e0e0] bg-white text-[#343434] hover:border-[#3f7377] hover:bg-[#f6f7f9]'
      }`}
    >
      {label}
    </button>
  )
}

// BotaoFiltro — botão de toggle para filtros; estado ativo/inativo controlado via prop `ativo`
interface Props {
  label: string
  ativo: boolean
  onClick: () => void
  variante?: 'leve' | 'solido'
}

export function BotaoFiltro({ label, ativo, onClick, variante = 'leve' }: Props) {
  if (variante === 'solido') {
    return (
      <button
        onClick={onClick}
        className={`border rounded-full px-4 py-[8px] text-[13px] font-medium whitespace-nowrap transition-colors ${
          ativo
            ? 'border-[#1c5258] bg-[#1c5258] text-white hover:bg-[#154247]'
            : 'border-[#b3b3b3] bg-white text-[#343434] hover:border-[#1c5258] hover:bg-[#f6f7f9]'
        }`}
      >
        {label}
      </button>
    )
  }

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

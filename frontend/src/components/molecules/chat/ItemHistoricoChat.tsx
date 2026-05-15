interface Props {
  titulo: string
  ativo: boolean
  onClick: () => void
}

export function ItemHistoricoChat({ titulo, ativo, onClick }: Props) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-full text-left px-[12px] py-[10px] rounded-[8px] text-[13px] transition-colors ${
        ativo
          ? 'bg-transparent text-[#1d5358] font-semibold hover:bg-transparent'
          : 'text-[#343434] font-normal hover:bg-[#f0f1f3]'
      }`}
    >
      {titulo}
    </button>
  )
}

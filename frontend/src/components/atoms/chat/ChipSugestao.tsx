interface Props {
  texto: string
  onClick: () => void
}

export function ChipSugestao({ texto, onClick }: Props) {
  return (
    <button
      onClick={onClick}
      className="border border-[#d8dadf] rounded-full px-[14px] py-[8px] text-[12px] text-[#343434] bg-white hover:border-[#3f7377] hover:text-[#1d5358] transition-colors whitespace-normal break-words text-left"
    >
      {texto}
    </button>
  )
}

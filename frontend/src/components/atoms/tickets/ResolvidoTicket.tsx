interface Props {
  resolvido: boolean
}

export function ResolvidoTicket({ resolvido }: Props) {
  return (
    <span className="inline-flex items-center gap-2 text-[14px] font-medium text-[#343434]">
      <span
        className="w-[10px] h-[10px] rounded-full shrink-0"
        style={{ backgroundColor: resolvido ? '#12632f' : '#c20000' }}
      />
      {resolvido ? 'Sim' : 'Não'}
    </span>
  )
}

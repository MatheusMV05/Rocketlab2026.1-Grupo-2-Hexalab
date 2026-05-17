interface Props {
  valor: string
  tipo?: 'bom' | 'ruim'
}

export function TagVariacao({ valor, tipo = 'bom' }: Props) {
  const estilos =
    tipo === 'bom'
      ? 'border-[#12632f] text-[#12632f]'
      : 'border-[#c20000] text-[#c20000]'

  return (
    <span
      className={`inline-flex items-center justify-center border rounded-[10px] px-2 py-[3px] text-[10px] font-semibold whitespace-nowrap ${estilos}`}
    >
      {valor}
    </span>
  )
}

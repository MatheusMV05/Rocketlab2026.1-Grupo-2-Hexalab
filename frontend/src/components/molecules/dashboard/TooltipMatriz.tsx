// TooltipMatriz — tooltip posicionado abaixo da pílula do produto na matriz
interface Props {
  nome: string
  volume: number
  satisfacao: number
}

export function TooltipMatriz({ nome, volume, satisfacao }: Props) {
  return (
    <div className="bg-white border border-[#e0e0e0] rounded-[5px] p-2 text-[11px] shadow-sm whitespace-nowrap">
      <p className="font-semibold">{nome}</p>
      <p>Volume: {volume.toLocaleString('pt-BR')}</p>
      <p>Satisfação: {satisfacao.toFixed(1)} ★</p>
    </div>
  )
}

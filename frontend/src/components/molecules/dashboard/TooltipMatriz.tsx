// TooltipMatriz — tooltip personalizado do ScatterChart da Matriz de Satisfação vs. Performance
interface TooltipPayloadItem {
  payload: {
    nome: string
    volume: number
    satisfacao: number
  }
}

interface Props {
  active?: boolean
  payload?: TooltipPayloadItem[]
}

export function TooltipMatriz({ active, payload }: Props) {
  if (!active || !payload?.length) return null
  const d = payload[0].payload
  return (
    <div className="bg-white border border-[#e0e0e0] rounded-[5px] p-2 text-[11px]">
      <p className="font-semibold">{d.nome}</p>
      <p>Volume: {d.volume.toLocaleString('pt-BR')}</p>
      <p>Satisfação: {d.satisfacao.toFixed(1)} ★</p>
    </div>
  )
}

import { Star } from 'lucide-react'

const STAR_BORDER = '#3f7377'

export function AvaliacaoTicket({ nota }: { nota: number | null }) {
  if (nota == null || !Number.isFinite(Number(nota))) {
    return <span className="text-[14px] font-medium text-[#898989]">—</span>
  }

  const rounded = Math.round(Number(nota))
  if (rounded < 1) {
    return <span className="text-[14px] font-medium text-[#898989]">—</span>
  }

  const quantidade = Math.min(5, rounded)

  return (
    <span className="inline-flex items-center gap-[3px]" aria-label={`Nota ${quantidade}`}>
      {Array.from({ length: quantidade }, (_, i) => (
        <Star key={i} size={14} strokeWidth={1.75} fill="none" stroke={STAR_BORDER} className="shrink-0" />
      ))}
    </span>
  )
}

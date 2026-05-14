interface Props {
  valor: number
  onChange: (v: number) => void
  min?: number
  max?: number
}

export function StepperNumerico({ valor, onChange, min = 1, max = 10 }: Props) {
  return (
    <div className="flex items-center gap-1">
      <button
        onClick={() => onChange(Math.max(min, valor - 1))}
        disabled={valor <= min}
        className="w-6 h-6 rounded border border-[#e0e0e0] text-[#4d4d4d] hover:bg-[#f5f5f5] disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center text-sm leading-none"
      >
        −
      </button>
      <span className="w-6 text-center text-[12px] font-medium text-[#343434]">{valor}</span>
      <button
        onClick={() => onChange(Math.min(max, valor + 1))}
        disabled={valor >= max}
        className="w-6 h-6 rounded border border-[#e0e0e0] text-[#4d4d4d] hover:bg-[#f5f5f5] disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center text-sm leading-none"
      >
        +
      </button>
    </div>
  )
}

import { useState } from 'react'
import { StepperNumerico } from '../../atoms/dashboard/StepperNumerico'
import type { LimitesBloco } from '../../../types/dashboard'

interface Props {
  limites: LimitesBloco
  onAplicar: (limites: LimitesBloco) => void
}

const ROTULOS_QUADRANTE: { chave: keyof LimitesBloco; label: string }[] = [
  { chave: 'limite_estrelas',        label: 'Estrelas' },
  { chave: 'limite_oportunidades',   label: 'Oportunidades' },
  { chave: 'limite_alerta_vermelho', label: 'Alerta Vermelho' },
  { chave: 'limite_ofensores',       label: 'Ofensores' },
]

export function PainelLimitesBloco({ limites, onAplicar }: Props) {
  const [rascunho, setRascunho] = useState<LimitesBloco>(limites)

  return (
    <div className="bg-white border border-[#e0e0e0] rounded-[5px] shadow-md p-3 min-w-[240px]">

      <p className="text-[11px] font-semibold text-[#1d5358] mb-2">Produtos por quadrante</p>
      <div className="flex flex-col gap-2 mb-3">
        {ROTULOS_QUADRANTE.map(({ chave, label }) => (
          <div key={chave} className="flex items-center justify-between gap-4">
            <span className="text-[11px] text-[#4d4d4d]">{label}</span>
            <StepperNumerico
              valor={rascunho[chave] as number}
              onChange={(v) => setRascunho((prev) => ({ ...prev, [chave]: v }))}
            />
          </div>
        ))}
      </div>

      <button
        onClick={() => onAplicar(rascunho)}
        className="w-full h-[28px] bg-[#1d5358] text-white text-[11px] font-medium rounded-[4px] hover:bg-[#174347] transition-colors"
      >
        Aplicar
      </button>
    </div>
  )
}

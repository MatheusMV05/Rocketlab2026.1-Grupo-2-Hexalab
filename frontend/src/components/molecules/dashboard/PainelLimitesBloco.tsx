import { useState } from 'react'
import { RotateCcw } from 'lucide-react'
import { StepperNumerico } from '../../atoms/dashboard/StepperNumerico'
import type { LimitesBloco } from '../../../types/dashboard'

interface Props {
  limites: LimitesBloco
  maxVolume: number
  medianaVolume: number
  onAplicar: (limites: LimitesBloco) => void
}

const ROTULOS_QUADRANTE: { chave: keyof LimitesBloco; label: string }[] = [
  { chave: 'limite_estrelas',        label: 'Estrelas' },
  { chave: 'limite_oportunidades',   label: 'Oportunidades' },
  { chave: 'limite_alerta_vermelho', label: 'Alerta Vermelho' },
  { chave: 'limite_ofensores',       label: 'Ofensores' },
]

const PADRAO: Pick<LimitesBloco, 'corte_satisfacao' | 'corte_volume'> = {
  corte_satisfacao: 4.0,
  corte_volume: null,
}

function validarCortes(
  corteSat: number,
  corteVol: number | null,
  maxVolume: number,
): string | null {
  if (corteSat < 1.0 || corteSat > 4.9)
    return 'Corte de satisfação deve estar entre 1,0 e 4,9'
  if (corteVol !== null) {
    if (corteVol < 1)
      return 'Corte de volume deve ser maior que zero'
    if (maxVolume > 0 && corteVol >= maxVolume)
      return 'Corte de volume muito alto: todos os produtos ficariam em baixa performance'
  }
  return null
}

export function PainelLimitesBloco({ limites, maxVolume, medianaVolume, onAplicar }: Props) {
  const [rascunho, setRascunho] = useState<LimitesBloco>(limites)
  const [volumeFixo, setVolumeFixo] = useState(limites.corte_volume !== null)
  const [corteVolInput, setCorteVolInput] = useState(
    limites.corte_volume !== null ? String(limites.corte_volume) : String(Math.round(medianaVolume))
  )

  const corteVol = volumeFixo ? parseFloat(corteVolInput) || null : null
  const erroValidacao = validarCortes(rascunho.corte_satisfacao, corteVol, maxVolume)

  function handleAplicar() {
    if (erroValidacao) return
    onAplicar({ ...rascunho, corte_volume: corteVol })
  }

  function handleRestaurar() {
    setRascunho((prev) => ({ ...prev, ...PADRAO }))
    setVolumeFixo(false)
    setCorteVolInput(String(Math.round(medianaVolume)))
  }

  return (
    <div className="bg-white border border-[#e0e0e0] rounded-[5px] shadow-md p-3 min-w-[260px]">

      {/* Seção 1: Produtos por quadrante */}
      <p className="text-[11px] font-semibold text-[#1d5358] mb-2">Produtos por quadrante</p>
      <div className="flex flex-col gap-2 mb-4">
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

      <div className="border-t border-[#f0f0f0] my-3" />

      {/* Seção 2: Cortes da matriz */}
      <div className="flex items-center justify-between mb-2">
        <p className="text-[11px] font-semibold text-[#1d5358]">Cortes da matriz</p>
        <button
          onClick={handleRestaurar}
          className="flex items-center gap-1 text-[10px] text-[#888] hover:text-[#1d5358] transition-colors"
          title="Restaurar padrões"
        >
          <RotateCcw size={11} />
          Padrões
        </button>
      </div>

      {/* Corte de satisfação */}
      <div className="flex flex-col gap-1 mb-3">
        <div className="flex items-center justify-between">
          <span className="text-[11px] text-[#4d4d4d]">Satisfação ≥</span>
          <div className="flex items-center gap-1">
            <input
              type="number"
              min={1.0}
              max={4.9}
              step={0.1}
              value={rascunho.corte_satisfacao}
              onChange={(e) => {
                const v = parseFloat(e.target.value)
                if (!isNaN(v)) setRascunho((prev) => ({ ...prev, corte_satisfacao: Math.round(v * 10) / 10 }))
              }}
              className="w-14 h-6 text-center text-[11px] border border-[#e0e0e0] rounded-[4px] focus:outline-none focus:border-[#1d5358]"
            />
            <span className="text-[10px] text-[#888]">/ 5,0</span>
          </div>
        </div>
      </div>

      {/* Corte de volume */}
      <div className="flex flex-col gap-1 mb-3">
        <div className="flex items-center justify-between">
          <span className="text-[11px] text-[#4d4d4d]">Volume</span>
          <button
            onClick={() => {
              setVolumeFixo((v) => !v)
              if (!volumeFixo) setCorteVolInput(String(Math.round(medianaVolume)))
            }}
            className={`text-[10px] px-2 py-0.5 rounded border transition-colors ${
              volumeFixo
                ? 'border-[#1d5358] text-[#1d5358] bg-[#f0f7f7]'
                : 'border-[#e0e0e0] text-[#888] hover:border-[#1d5358] hover:text-[#1d5358]'
            }`}
          >
            {volumeFixo ? 'Valor fixo' : 'Mediana dinâmica'}
          </button>
        </div>
        {volumeFixo && (
          <div className="flex items-center justify-between mt-1">
            <span className="text-[10px] text-[#888]">Valor de corte</span>
            <input
              type="number"
              min={1}
              step={1}
              value={corteVolInput}
              onChange={(e) => setCorteVolInput(e.target.value)}
              className="w-20 h-6 text-center text-[11px] border border-[#e0e0e0] rounded-[4px] focus:outline-none focus:border-[#1d5358]"
            />
          </div>
        )}
        {!volumeFixo && (
          <p className="text-[10px] text-[#aaa] text-right">
            atual: {Math.round(medianaVolume).toLocaleString('pt-BR')} vendas
          </p>
        )}
      </div>

      {/* Erro de validação */}
      {erroValidacao && (
        <p className="text-[10px] text-[#c20000] mb-2 leading-tight">{erroValidacao}</p>
      )}

      <button
        onClick={handleAplicar}
        disabled={!!erroValidacao}
        className="w-full h-[28px] bg-[#1d5358] text-white text-[11px] font-medium rounded-[4px] hover:bg-[#174347] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
      >
        Aplicar
      </button>
    </div>
  )
}

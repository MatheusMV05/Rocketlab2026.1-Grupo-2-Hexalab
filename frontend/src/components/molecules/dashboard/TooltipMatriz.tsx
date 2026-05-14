const ROTULO_BLOCO: Record<string, string> = {
  estrelas: 'ESTRELAS',
  oportunidades: 'OPORTUNIDADES',
  alerta_vermelho: 'ALERTA VERMELHO',
  ofensores: 'OFENSORES',
}

interface Props {
  nome: string
  categoria: string
  volume: number
  satisfacao: number
  bloco_anterior: string
}

export function TooltipMatriz({ nome, categoria, volume, satisfacao, bloco_anterior }: Props) {
  return (
    <div className="bg-white border border-[#e0e0e0] rounded-[5px] p-2 text-[11px] shadow-sm whitespace-nowrap">
      <p className="font-semibold text-[#1d5358]">{nome}</p>
      <p className="text-[#666666]">Categoria: {categoria}</p>
      <p>
        Volume: {volume.toLocaleString('pt-BR')}
        <span className="mx-1 text-[#b0b0b0]">•</span>
        Satisfação: {satisfacao.toFixed(1)} ★
      </p>
      <p className="text-[#666666] mt-0.5">
        Período anterior:{' '}
        <span className="font-medium text-[#343434]">
          {ROTULO_BLOCO[bloco_anterior] ?? bloco_anterior.toUpperCase()} →
        </span>
      </p>
    </div>
  )
}

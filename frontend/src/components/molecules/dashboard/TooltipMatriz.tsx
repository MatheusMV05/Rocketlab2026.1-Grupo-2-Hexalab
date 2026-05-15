const ROTULO_QUADRANTE: Record<string, string> = {
  estrelas:        'Estrelas',
  oportunidades:   'Oportunidades',
  alerta_vermelho: 'Alerta Vermelho',
  ofensores:       'Ofensores',
  desconhecido:    '—',
}

interface Props {
  nome: string
  categoria: string
  volume: number
  satisfacao: number
  quadrante: string
  bloco_anterior: string
}

export function TooltipMatriz({ nome, categoria, volume, satisfacao, quadrante, bloco_anterior }: Props) {
  return (
    <div className="bg-white border border-[#e0e0e0] rounded-[5px] p-2 text-[11px] shadow-sm whitespace-nowrap">
      <p className="font-semibold text-[#1d5358]">{nome}</p>
      <p className="text-[#666666]">Categoria: {categoria}</p>
      <p>
        Volume: {volume.toLocaleString('pt-BR')}
        <span className="mx-1 text-[#b0b0b0]">•</span>
        Satisfação: {satisfacao.toFixed(1)} ★
      </p>
      <p className="text-[#343434] mt-0.5">
        Quadrante: <span className="font-medium">{ROTULO_QUADRANTE[quadrante] ?? quadrante}</span>
      </p>
      <p className="text-[#666666] mt-0.5">
        Período anterior:{' '}
        <span className="font-medium text-[#343434]">
          {ROTULO_QUADRANTE[bloco_anterior] ?? bloco_anterior}
        </span>
      </p>
    </div>
  )
}

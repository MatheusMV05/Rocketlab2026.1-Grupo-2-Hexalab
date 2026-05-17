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
  volume_produto: number
  participacao_percentual: number
  satisfacao: number
  qtd_avaliacoes: number
  quadrante: string
}

export function TooltipMatriz({
  nome,
  categoria,
  volume_produto,
  participacao_percentual,
  satisfacao,
  qtd_avaliacoes,
  quadrante,
}: Props) {
  return (
    <div className="bg-white border border-[#e0e0e0] rounded-[5px] p-2 text-[11px] shadow-sm whitespace-nowrap">
      <p className="font-semibold text-[#1d5358]">{nome}</p>
      {categoria && <p className="text-[#666666]">Categoria: {categoria}</p>}
      <p>
        Volume: {volume_produto.toLocaleString('pt-BR')}
        <span className="mx-1 text-[#b0b0b0]">•</span>
        Participação: {participacao_percentual.toFixed(1)}%
      </p>
      <p>
        Avaliação: {satisfacao.toFixed(1)} ★
        <span className="mx-1 text-[#b0b0b0]">•</span>
        {qtd_avaliacoes} avaliações
      </p>
      <p className="text-[#343434] mt-0.5">
        Quadrante: <span className="font-medium">{ROTULO_QUADRANTE[quadrante] ?? quadrante}</span>
      </p>
    </div>
  )
}

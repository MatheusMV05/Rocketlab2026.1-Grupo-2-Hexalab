import { ChevronLeft, ChevronRight } from 'lucide-react'

interface Props {
  paginaAtual: number
  totalPaginas: number
  onMudar: (pagina: number) => void
  carregando?: boolean
  maxVisiveis?: number
}

export function Paginacao({
  paginaAtual,
  totalPaginas,
  onMudar,
  carregando = false,
  maxVisiveis = 6,
}: Props) {
  const janela = Math.min(maxVisiveis, totalPaginas)
  const inicio = Math.max(
    1,
    Math.min(paginaAtual - Math.floor(janela / 2), totalPaginas - janela + 1),
  )
  const paginas = Array.from({ length: janela }, (_, i) => inicio + i)

  const naPrimeira = paginaAtual === 1
  const naUltima = paginaAtual === totalPaginas

  return (
    <div className="flex items-center justify-center gap-[10px] py-4">
      <button
        onClick={() => onMudar(Math.max(1, paginaAtual - 1))}
        disabled={naPrimeira || carregando}
        aria-label="Página anterior"
        className={`w-[28px] h-[28px] flex items-center justify-center rounded-full transition-colors ${
          naPrimeira || carregando
            ? 'bg-[#e5ebeb] text-[#b3b3b3] cursor-not-allowed'
            : 'bg-[#1c5258] text-white hover:bg-[#154247]'
        }`}
      >
        <ChevronLeft size={14} strokeWidth={2.5} />
      </button>

      {paginas.map((p) => (
        <button
          key={p}
          onClick={() => onMudar(p)}
          disabled={carregando}
          className={`min-w-[28px] h-[28px] px-2 flex items-center justify-center rounded-full text-[13px] transition-colors ${
            paginaAtual === p
              ? 'bg-[#e5ebeb] text-[#1c5258] font-semibold'
              : 'text-[#343434] font-medium hover:bg-[#f6f7f9]'
          }`}
        >
          {p.toString().padStart(2, '0')}
        </button>
      ))}

      <button
        onClick={() => onMudar(Math.min(totalPaginas, paginaAtual + 1))}
        disabled={naUltima || carregando}
        aria-label="Próxima página"
        className={`w-[28px] h-[28px] flex items-center justify-center rounded-full transition-colors ${
          naUltima || carregando
            ? 'bg-[#e5ebeb] text-[#b3b3b3] cursor-not-allowed'
            : 'bg-[#1c5258] text-white hover:bg-[#154247]'
        }`}
      >
        <ChevronRight size={14} strokeWidth={2.5} />
      </button>
    </div>
  )
}

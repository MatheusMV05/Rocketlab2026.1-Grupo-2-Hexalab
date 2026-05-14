interface Props {
  paginaAtual: number
  totalPaginas: number
  onPaginaChange: (pagina: number) => void
}

export function Paginacao({ paginaAtual, totalPaginas, onPaginaChange }: Props) {
  if (totalPaginas <= 1) return null

  const getPaginasVisiveis = () => {
    const paginas: (number | string)[] = []
    const range = 2 // Quantas páginas mostrar ao redor da atual

    // Sempre mostrar a primeira página
    paginas.push(1)

    if (paginaAtual > range + 2) {
      paginas.push('...')
    }

    // Páginas ao redor da atual
    const inicio = Math.max(2, paginaAtual - range)
    const fim = Math.min(totalPaginas - 1, paginaAtual + range)

    for (let i = inicio; i <= fim; i++) {
      paginas.push(i)
    }

    if (paginaAtual < totalPaginas - range - 1) {
      paginas.push('...')
    }

    // Sempre mostrar a última página
    if (totalPaginas > 1) {
      paginas.push(totalPaginas)
    }

    return paginas
  }

  const paginas = getPaginasVisiveis()

  return (
    <div className="flex items-center justify-center gap-2 mt-8 mb-4">
      <button 
        disabled={paginaAtual === 1}
        onClick={() => onPaginaChange(paginaAtual - 1)}
        className="w-8 h-8 flex items-center justify-center rounded-full border border-[#e0e0e0] text-[#898989] hover:bg-[#f6f7f9] disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
      >
        <span className="text-[18px] leading-none">&larr;</span>
      </button>

      <div className="flex items-center gap-1">
        {paginas.map((p, i) => (
          <button
            key={i}
            disabled={p === '...'}
            onClick={() => typeof p === 'number' && onPaginaChange(p)}
            className={`w-8 h-8 flex items-center justify-center rounded-full text-[13px] font-medium transition-all ${
              p === paginaAtual 
                ? 'bg-[#1d5358] text-white shadow-md' 
                : p === '...'
                ? 'text-[#898989] cursor-default'
                : 'bg-white border border-[#e0e0e0] text-[#4d4d4d] hover:border-[#1d5358] hover:text-[#1d5358]'
            }`}
          >
            {typeof p === 'number' ? p.toString().padStart(2, '0') : p}
          </button>
        ))}
      </div>

      <button 
        disabled={paginaAtual === totalPaginas}
        onClick={() => onPaginaChange(paginaAtual + 1)}
        className="w-8 h-8 flex items-center justify-center rounded-full border border-[#e0e0e0] text-[#898989] hover:bg-[#f6f7f9] disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
      >
        <span className="text-[18px] leading-none">&rarr;</span>
      </button>
    </div>
  )
}

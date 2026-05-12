import { Copy, RotateCcw, ThumbsDown, ThumbsUp } from 'react-feather'

interface Props {
  onLike?: () => void
  onDislike?: () => void
  onRegenerar?: () => void
  onCopiar?: () => void
}

export function AcoesRespostaAssistente({
  onLike,
  onDislike,
  onRegenerar,
  onCopiar,
}: Props) {
  return (
    <div className="mt-3 flex items-center gap-4 text-[#1D5358]">
      <button
        type="button"
        onClick={onLike}
        aria-label="Útil"
        className="text-[#1D5358] hover:opacity-80 transition-opacity"
      >
        <ThumbsUp size={16} strokeWidth={1.7} />
      </button>
      <button
        type="button"
        onClick={onDislike}
        aria-label="Não útil"
        className="text-[#1D5358] hover:opacity-80 transition-opacity"
      >
        <ThumbsDown size={16} strokeWidth={1.7} />
      </button>
      <button
        type="button"
        onClick={onRegenerar}
        aria-label="Refazer resposta"
        className="text-[#1D5358] hover:opacity-80 transition-opacity"
      >
        <RotateCcw size={16} strokeWidth={1.7} />
      </button>
      <button
        type="button"
        onClick={onCopiar}
        aria-label="Copiar resposta"
        className="text-[#1D5358] hover:opacity-80 transition-opacity"
      >
        <Copy size={16} strokeWidth={1.7} />
      </button>
    </div>
  )
}

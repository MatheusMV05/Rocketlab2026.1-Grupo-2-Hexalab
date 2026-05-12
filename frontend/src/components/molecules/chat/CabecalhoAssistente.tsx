import { Maximize2, Minimize2, X } from 'react-feather'
import type { PointerEvent as ReactPointerEvent } from 'react'
import { IconeAssistente } from '../../atoms/chat/IconeAssistente'
import type { ModoAssistente } from '../../organisms/chat/AssistenteProvider'

interface Props {
  modo: Exclude<ModoAssistente, 'fechado'>
  onExpandir: () => void
  onMinimizar: () => void
  onFechar: () => void
  variante?: 'completo' | 'compacto'
  /** Só usado no pop-up: arrastar a janela pelo header */
  onArrastarPointerDown?: (evento: ReactPointerEvent<HTMLElement>) => void
}

export function CabecalhoAssistente({
  modo,
  onExpandir,
  onMinimizar,
  onFechar,
  variante = 'completo',
  onArrastarPointerDown,
}: Props) {
  const mostrarTitulo = variante === 'completo' && modo === 'popup'
  const temaPopup = modo === 'popup'

  return (
    <header
      className={
        (temaPopup
          ? 'flex items-center justify-between px-[14px] py-[12px] text-white'
          : 'flex items-center justify-between px-[14px] py-[12px] bg-white border-b border-[#e0e0e0] text-[#343434]') +
        (temaPopup && onArrastarPointerDown ? ' cursor-grab active:cursor-grabbing select-none' : '')
      }
      style={temaPopup ? { backgroundColor: '#3f7377' } : undefined}
      onPointerDown={temaPopup ? onArrastarPointerDown : undefined}
    >
      <div className="flex items-center gap-[10px] min-w-0">
        {temaPopup ? (
          <IconeAssistente tamanho={28} variante="extenso-branco" />
        ) : (
          <IconeAssistente tamanho={28} variante="extenso" />
        )}
        {mostrarTitulo && (
          <span className="text-[16px] font-semibold tracking-wide">Assistente</span>
        )}
      </div>
      <div className="flex items-center gap-[8px] shrink-0">
        {modo === 'popup' ? (
          <button
            type="button"
            onPointerDown={(e) => e.stopPropagation()}
            onClick={onExpandir}
            className="flex items-center justify-center w-9 h-9 rounded-full border border-transparent text-white hover:bg-white/15 hover:border-white transition-colors"
            aria-label="Expandir assistente"
          >
            <Maximize2 size={18} strokeWidth={2} />
          </button>
        ) : (
          <button
            type="button"
            onPointerDown={(e) => e.stopPropagation()}
            onClick={onMinimizar}
            className="flex items-center justify-center w-9 h-9 rounded-full text-[#3f7377] hover:bg-[#D9D9D9] transition-colors"
            aria-label="Minimizar assistente"
          >
            <Minimize2 size={18} strokeWidth={2} />
          </button>
        )}
        <button
          type="button"
          onPointerDown={(e) => e.stopPropagation()}
          onClick={onFechar}
          className={
            temaPopup
              ? 'flex items-center justify-center w-9 h-9 rounded-full border border-transparent text-white hover:bg-white/15 hover:border-white transition-colors'
              : 'flex items-center justify-center w-9 h-9 rounded-full text-[#3f7377] hover:bg-[#D9D9D9] transition-colors'
          }
          aria-label="Fechar assistente"
        >
          <X size={18} strokeWidth={2} />
        </button>
      </div>
    </header>
  )
}

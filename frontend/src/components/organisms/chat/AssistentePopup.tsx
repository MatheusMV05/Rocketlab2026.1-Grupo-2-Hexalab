import { useCallback, useRef, useState } from 'react'
import type { PointerEvent as ReactPointerEvent } from 'react'
import { CabecalhoAssistente } from '../../molecules/chat/CabecalhoAssistente'
import { ConversaAssistente } from './ConversaAssistente'
import { useAssistente } from './AssistenteProvider'

const LARGURA_POPUP = 513
const ALTURA_POPUP = 650

export function AssistentePopup() {
  const { expandir, minimizar, fechar } = useAssistente()
  const [posicao, setPosicao] = useState<{ x: number; y: number } | null>(null)
  const dialogRef = useRef<HTMLDivElement>(null)
  const arrastandoRef = useRef(false)
  const offsetRef = useRef({ x: 0, y: 0 })

  const aoArrastarPointerDown = useCallback((evento: ReactPointerEvent<HTMLElement>) => {
    if (evento.button !== 0) return
    const dialog = dialogRef.current
    if (!dialog) return

    const rect = dialog.getBoundingClientRect()
    offsetRef.current = {
      x: evento.clientX - rect.left,
      y: evento.clientY - rect.top,
    }
    arrastandoRef.current = true
    evento.currentTarget.setPointerCapture(evento.pointerId)

    const aoMover = (ev: PointerEvent) => {
      if (!arrastandoRef.current) return
      let nx = ev.clientX - offsetRef.current.x
      let ny = ev.clientY - offsetRef.current.y
      nx = Math.max(0, Math.min(window.innerWidth - LARGURA_POPUP, nx))
      ny = Math.max(0, Math.min(window.innerHeight - ALTURA_POPUP, ny))
      setPosicao({ x: nx, y: ny })
    }

    const aoSoltar = (ev: PointerEvent) => {
      arrastandoRef.current = false
      window.removeEventListener('pointermove', aoMover)
      window.removeEventListener('pointerup', aoSoltar)
      try {
        evento.currentTarget.releasePointerCapture(ev.pointerId)
      } catch {
        /* ignorar se já liberado */
      }
    }

    window.addEventListener('pointermove', aoMover)
    window.addEventListener('pointerup', aoSoltar)
  }, [])

  return (
    <div
      ref={dialogRef}
      className={`fixed z-[120] flex flex-col bg-white rounded-[14px] overflow-hidden shadow-[0_10px_30px_rgba(0,0,0,0.18)] ${
        posicao === null ? 'bottom-6 right-6' : ''
      }`}
      style={{
        width: LARGURA_POPUP,
        height: ALTURA_POPUP,
        ...(posicao !== null ? { left: posicao.x, top: posicao.y } : {}),
      }}
      role="dialog"
      aria-label="Assistente IA"
    >
      <CabecalhoAssistente
        modo="popup"
        onExpandir={expandir}
        onMinimizar={minimizar}
        onFechar={fechar}
        onArrastarPointerDown={aoArrastarPointerDown}
      />
      <ConversaAssistente variante="popup" />
    </div>
  )
}

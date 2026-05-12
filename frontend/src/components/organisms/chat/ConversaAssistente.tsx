import { useEffect, useRef, type UIEventHandler } from 'react'
import { BalaoMensagem } from '../../atoms/chat/BalaoMensagem'
import { CaixaPergunta } from '../../molecules/chat/CaixaPergunta'
import { SaudacaoInicial } from '../../molecules/chat/SaudacaoInicial'
import { useAssistente } from './AssistenteProvider'

interface Props {
  variante: 'popup' | 'cheio'
  onScrollChange?: (scrollTop: number) => void
}

export function ConversaAssistente({ variante, onScrollChange }: Props) {
  const {
    mensagens,
    rascunho,
    enviando,
    definirRascunho,
    enviarMensagem,
  } = useAssistente()

  const finalRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    finalRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' })
  }, [mensagens.length])

  const semConversa = mensagens.length === 0

  const aoRolarConversa: UIEventHandler<HTMLDivElement> = (e) => {
    onScrollChange?.(e.currentTarget.scrollTop)
  }

  return (
    <div className="flex flex-col flex-1 min-h-0 bg-white">
      <div
        className="flex-1 min-h-0 overflow-y-auto px-[18px] pt-[18px] pb-[12px]"
        onScroll={aoRolarConversa}
      >
        {semConversa ? (
          <div
            className={`h-full flex flex-col gap-[14px] ${
              variante === 'cheio' ? 'justify-end pb-2' : 'justify-end'
            }`}
          >
            <SaudacaoInicial />
          </div>
        ) : (
          <div className="flex flex-col gap-[10px]">
            {mensagens.map((m) => (
              <BalaoMensagem key={m.id} mensagem={m} />
            ))}
            <div ref={finalRef} />
          </div>
        )}
      </div>
      <div className="px-[18px] pb-[16px] pt-[6px]">
        <CaixaPergunta
          valor={rascunho}
          onChange={definirRascunho}
          onEnviar={(texto) => {
            void enviarMensagem(texto)
          }}
          desabilitado={enviando}
        />
      </div>
    </div>
  )
}

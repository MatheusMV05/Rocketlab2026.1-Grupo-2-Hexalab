import { useState } from 'react'
import { CabecalhoAssistente } from '../../molecules/chat/CabecalhoAssistente'
import { ConversaAssistente } from './ConversaAssistente'
import { PainelHistoricoChats } from './PainelHistoricoChats'
import { useAssistente } from './AssistenteProvider'

export function AssistenteTelaCheia() {
  const { expandir, minimizar, fechar } = useAssistente()
  const [scrollSidebar, setScrollSidebar] = useState(0)
  const [scrollConversa, setScrollConversa] = useState(0)

  const temCurva = scrollSidebar === 0 && scrollConversa === 0

  return (
    <div
      className={
        'fixed z-[120] flex flex-col bg-white overflow-hidden transition-[border-radius] duration-150 ' +
        (temCurva ? 'rounded-tl-[24px]' : '')
      }
      style={{
        left: 104,
        top: 87,
        right: 0,
        bottom: 0,
      }}
      role="dialog"
      aria-label="Assistente IA expandido"
    >
      <CabecalhoAssistente
        modo="cheio"
        onExpandir={expandir}
        onMinimizar={minimizar}
        onFechar={fechar}
        variante="compacto"
      />
      <div className="flex flex-1 min-h-0 bg-white">
        <PainelHistoricoChats onScrollChange={setScrollSidebar} />
        <div className="flex flex-col flex-1 min-w-0">
          <ConversaAssistente variante="cheio" onScrollChange={setScrollConversa} />
        </div>
      </div>
    </div>
  )
}

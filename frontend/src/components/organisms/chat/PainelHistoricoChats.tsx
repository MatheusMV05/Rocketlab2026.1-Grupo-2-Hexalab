import { useMemo, useState } from 'react'
import { Menu, PlusCircle, Search } from 'react-feather'
import type { UIEventHandler } from 'react'
import { ItemHistoricoChat } from '../../molecules/chat/ItemHistoricoChat'
import { useAssistente } from './AssistenteProvider'

interface Props {
  /** Só usa em tela cheia para detectar scroll e atualizar canto superior esquerdo */
  onScrollChange?: (scrollTop: number) => void
}

export function PainelHistoricoChats({ onScrollChange }: Props) {
  const { chats, chatAtivoId, selecionarChat, novoChat } = useAssistente()
  const [busca, setBusca] = useState('')

  const filtrados = useMemo(() => {
    const termo = busca.trim().toLowerCase()
    if (!termo) return chats
    return chats.filter((c) => c.titulo.toLowerCase().includes(termo))
  }, [chats, busca])

  const aoRolarLista: UIEventHandler<HTMLDivElement> = (e) => {
    onScrollChange?.(e.currentTarget.scrollTop)
  }

  return (
    <aside className="flex flex-col h-full bg-white border-r border-[#e0e0e0]" style={{ width: 270 }}>
      <div className="flex items-center justify-between px-[16px] py-[14px]">
        <div className="flex items-center gap-[8px] text-[#343434]">
          <Menu size={18} strokeWidth={1.5} />
          <span className="text-[15px] font-semibold">Assistente</span>
        </div>
        <button
          type="button"
          onClick={novoChat}
          aria-label="Nova conversa"
          className="flex items-center justify-center shrink-0 rounded-full text-[#343434] hover:bg-[#D9D9D9] transition-colors"
        >
          <PlusCircle size={22} strokeWidth={1.5} />
        </button>
      </div>

      <div className="px-[16px] py-[10px]">
        <div className="flex items-center gap-[8px] border border-[#e0e0e0] rounded-full px-[10px] py-[6px] focus-within:border-[#3f7377] transition-colors">
          <input
            type="text"
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            placeholder="Search"
            className="flex-1 text-[13px] bg-transparent focus:outline-none placeholder:text-[#898989] text-[#343434]"
          />
          <Search size={14} strokeWidth={1.5} className="text-[#898989]" />
        </div>
      </div>

      <div className="px-[14px] pb-[10px] text-[12px] font-semibold text-[#898989]">Chats</div>

      <div
        className="flex-1 min-h-0 overflow-y-auto px-[10px] pb-[14px] flex flex-col gap-[2px]"
        onScroll={aoRolarLista}
      >
        {filtrados.length === 0 ? (
          <p className="px-[12px] py-[8px] text-[12px] text-[#898989]">Nenhum chat encontrado.</p>
        ) : (
          filtrados.map((c) => (
            <ItemHistoricoChat
              key={c.id}
              titulo={c.titulo}
              ativo={chatAtivoId === c.id}
              onClick={() => selecionarChat(c.id)}
            />
          ))
        )}
      </div>
    </aside>
  )
}

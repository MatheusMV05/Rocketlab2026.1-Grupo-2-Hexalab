import { Link } from 'react-router-dom'
import { Search, Bell, Settings } from 'lucide-react'
import { Bot } from 'lucide-react'

interface Props {
  titulo: string
}

export function BarraTopo({ titulo }: Props) {
  return (
    <header className="fixed left-[104px] right-0 top-0 h-[87px] bg-[#f6f7f9] z-10 flex items-center px-6 border-b border-[#e0e0e0]">
      {/* Título da página */}
      <h1 className="text-[20px] font-semibold text-[#343434] tracking-wide mr-auto">
        {titulo}
      </h1>

      {/* Ações da direita */}
      <div className="flex items-center gap-4">
        {/* Busca */}
        <button className="flex items-center justify-center w-9 h-9 rounded-[20px] bg-[#f6f7f9] hover:bg-[#e8eef0] transition-colors text-[#4d4d4d]">
          <Search size={18} strokeWidth={1.5} />
        </button>

        <div className="w-px h-10 bg-[#e0e0e0]" />

        {/* Assistente IA */}
        <Link
          to="/chat"
          className="flex items-center gap-2 text-[#343434] hover:text-[#3f7377] transition-colors"
        >
          <Bot size={20} strokeWidth={1.5} className="text-[#3f7377]" />
          <span className="text-[20px] font-semibold">Assistente</span>
        </Link>

        <div className="w-px h-10 bg-[#e0e0e0]" />

        {/* Sino */}
        <button className="text-[#4d4d4d] hover:text-[#3f7377] transition-colors">
          <Bell size={18} strokeWidth={1.5} />
        </button>

        {/* Configurações */}
        <button className="text-[#4d4d4d] hover:text-[#3f7377] transition-colors">
          <Settings size={18} strokeWidth={1.5} />
        </button>

        {/* Avatar */}
        <div className="flex items-center justify-center w-10 h-10 rounded-full bg-[#006733] text-white font-medium text-[16px] select-none">
          V
        </div>
      </div>
    </header>
  )
}

import { Search, Bell, Settings } from 'react-feather'
import logoAgente from '../../../assets/logos/logo-agente.svg'
import { useAssistente } from '../chat/AssistenteProvider'

interface Props {
  titulo: string
}

export function BarraTopo({ titulo }: Props) {
  const { abrir } = useAssistente()

  return (
    <header className="fixed left-[104px] right-0 top-0 h-[87px] bg-[#f6f7f9] z-10 flex items-center pl-[58px] pr-[43px]">
      {/* Título da página */}
      <h1 className="text-[20px] font-semibold text-[#343434] tracking-wide mr-auto">
        {titulo}
      </h1>

      {/* Ações da direita */}
      <div className="flex items-center gap-[20px]">
        {/* Busca */}
        <button className="flex items-center justify-center w-[42px] h-[42px] rounded-[20px] bg-[#f6f7f9] hover:bg-[#e8eef0] transition-colors text-[#4d4d4d]">
          <Search size={20} strokeWidth={1.5} />
        </button>

        <div className="w-px bg-[#e0e0e0]" style={{ height: 64 }} />

        {/* Assistente IA */}
        <Link
          to="/chat"
          className="flex items-center gap-2 text-[#343434] hover:text-[#3f7377] transition-colors"
          style={{ width: 152, height: 40 }}
        >
          <img src={logoAgente} alt="Logo Agente" className="w-[32px] h-[32px] object-contain shrink-0" />
          <span className="text-[20px] font-semibold whitespace-nowrap">Assistente</span>
        </Link>

        <div className="w-px bg-[#e0e0e0]" style={{ height: 64 }} />

        {/* Sino */}
        <button className="text-[#4d4d4d] hover:text-[#3f7377] transition-colors">
          <Bell size={20} strokeWidth={1.5} />
        </button>

        {/* Configurações */}
        <button className="text-[#4d4d4d] hover:text-[#3f7377] transition-colors">
          <Settings size={20} strokeWidth={1.5} />
        </button>

        {/* Avatar */}
        <div className="flex items-center justify-center rounded-full bg-[#006733] text-white font-medium text-[20px] select-none shrink-0" style={{ width: 54, height: 54 }}>
          VC
        </div>
      </div>
    </header>
  )
}
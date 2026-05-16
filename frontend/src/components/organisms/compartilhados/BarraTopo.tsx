import { Search, Bell, Settings } from 'react-feather'
import { useNavigate } from 'react-router-dom'
import logoAgente from '../../../assets/logos/logo-agente.svg'
import { useAssistente } from '../chat/AssistenteProvider'
import { useAuth } from '../../../contexts/AuthContext'

interface Props {
  titulo: string
}

function iniciais(nome: string): string {
  const partes = nome.trim().split(' ')
  if (partes.length === 1) return partes[0][0]?.toUpperCase() ?? '?'
  return (partes[0][0] + partes[partes.length - 1][0]).toUpperCase()
}

export function BarraTopo({ titulo }: Props) {
  const { abrir } = useAssistente()
  const { usuario } = useAuth()
  const navigate = useNavigate()

  return (
    <header className="fixed left-[60px] md:left-[104px] right-0 top-0 h-[60px] md:h-[87px] bg-[#f6f7f9] z-10 flex items-center px-4 md:px-6 border-b border-[#e0e0e0]">
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

        {/* Assistente IA — abre o popup do agente */}
        <button
          type="button"
          onClick={abrir}
          aria-label="Abrir assistente"
          className="flex items-center gap-2 px-3 py-1.5 rounded-[12px] text-[#343434] hover:bg-[#D9D9D9] transition-colors focus:outline-none"
        >
          <img src={logoAgente} alt="Logo Agente" className="w-[32px] h-[32px] object-contain" />
          <span className="text-[20px] font-semibold hidden md:inline">Assistente</span>
        </button>

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
        <button
          onClick={() => navigate('/perfil')}
          className="flex items-center justify-center w-10 h-10 rounded-full bg-[#105453] text-white font-medium text-[16px] select-none hover:opacity-90 transition-opacity"
          title="Perfil do usuário"
        >
          {iniciais(usuario?.nome ?? 'U')}
        </button>
      </div>
    </header>
  )
}
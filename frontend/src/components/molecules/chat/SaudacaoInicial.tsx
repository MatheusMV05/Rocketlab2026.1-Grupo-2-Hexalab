import { LogoChat } from '../../atoms/chat/LogoChat'

export function SaudacaoInicial() {
  return (
    <div className="flex items-start gap-2 text-[#1a1a1a]">
      <LogoChat tamanho={18} className="mt-[2px]" />
      <p className="text-[20px] font-semibold leading-[1.4]">
        Olá! <span aria-hidden>👋</span> Sou sua assistente de dados. Diga adeus às planilhas
        complexas! O que vamos analisar hoje?
      </p>
    </div>
  )
}

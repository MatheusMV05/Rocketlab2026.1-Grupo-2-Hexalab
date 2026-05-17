import type { ReactNode } from 'react'
import { BarraLateral } from '../organisms/compartilhados/BarraLateral'
import { BarraTopo } from '../organisms/compartilhados/BarraTopo'

interface Props {
  titulo: string
  children: ReactNode
}

export function LayoutPrincipal({ titulo, children }: Props) {
  return (
    <div className="min-h-screen bg-[#f6f7f9]">
      <BarraLateral />
      <BarraTopo titulo={titulo} />
      <main className="ml-[104px] mt-[87px] pl-[58px] pr-[56px] pt-[32px] pb-[45px] bg-white rounded-tl-[41px] border-l border-[#e0e0e0] min-h-[calc(100vh-87px)] overflow-y-auto">
        {children}
      </main>
    </div>
  )
}

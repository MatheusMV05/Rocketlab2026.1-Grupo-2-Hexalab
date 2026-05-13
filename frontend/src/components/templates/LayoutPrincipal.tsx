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
      <main className="ml-[60px] md:ml-[104px] mt-[60px] md:mt-[87px] px-4 md:pl-[58px] md:pr-[62px] py-4 md:py-6 bg-white rounded-tl-[20px] md:rounded-tl-[41px] min-h-[calc(100vh-60px)] md:min-h-[calc(100vh-87px)] overflow-y-auto">
        {children}
      </main>
    </div>
  )
}

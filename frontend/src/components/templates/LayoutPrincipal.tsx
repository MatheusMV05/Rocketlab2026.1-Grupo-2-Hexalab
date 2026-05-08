import type { ReactNode } from 'react'
import { BarraLateral } from '../organisms/BarraLateral'
import { BarraTopo } from '../organisms/BarraTopo'

interface Props {
  titulo: string
  children: ReactNode
}

export function LayoutPrincipal({ titulo, children }: Props) {
  return (
    <div className="min-h-screen bg-[#f6f7f9]">
      <BarraLateral />
      <BarraTopo titulo={titulo} />
      <main className="ml-[104px] mt-[87px] pl-[58px] pr-[62px] py-6 bg-white rounded-tl-[41px] min-h-[calc(100vh-87px)] overflow-y-auto">
        {children}
      </main>
    </div>
  )
}

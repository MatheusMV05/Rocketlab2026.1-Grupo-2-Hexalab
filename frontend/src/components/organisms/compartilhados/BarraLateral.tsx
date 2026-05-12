import { NavLink } from 'react-router-dom'
import { PieChart, Users, Box, ShoppingCart, Tag } from 'lucide-react'
import logoVC from '../../../assets/logos/Logo-vc.svg'

const itensNav = [
  { para: '/', icone: PieChart, rotulo: 'Dashboard' },
  { para: '/clientes', icone: Users, rotulo: 'Clientes' },
  { para: '/produtos', icone: Box, rotulo: 'Produtos' },
  { para: '/pedidos', icone: ShoppingCart, rotulo: 'Pedidos' },
  { para: '/tickets', icone: Tag, rotulo: 'Tickets' },
]

export function BarraLateral() {
  return (
    <aside className="fixed left-0 top-0 h-full z-20 flex flex-col" style={{ width: 104 }}>
      {/* Logo VC — quadrado teal no topo */}
      <div
        className="flex items-center justify-center shrink-0 rounded-br-[5px]"
        style={{ backgroundColor: '#3f7377', width: 98, height: 85 }}
      >
        <img src={logoVC} alt="Logo VC" className="w-[52px] h-[52px] object-contain" />
      </div>

      {/* Fundo cinza claro da barra lateral abaixo do logo */}
      <div className="flex flex-col items-center flex-1" style={{ backgroundColor: '#f6f7f9', paddingTop: 36, gap: 21 }}>
        {itensNav.map(({ para, icone: Icone, rotulo }) => (
          <div key={para} className="relative group w-full flex justify-center">
            <NavLink
              to={para}
              end={para === '/'}
              className={({ isActive }) =>
                `flex items-center justify-center w-10 h-10 rounded-[10px] transition-colors ${
                  isActive
                    ? 'bg-[#dde5e6] text-[#3f7377]'
                    : 'text-[#4d4d4d] hover:bg-[#dde5e6] hover:text-[#3f7377]'
                }`
              }
            >
              <Icone size={22} strokeWidth={1.5} />
            </NavLink>

            {/* Balão de tooltip — auto-largura, texto 16px SemiBold conforme design */}
            <div className="absolute left-full top-1/2 -translate-y-1/2 ml-2 flex items-center opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity duration-150 z-50">
              {/* Seta apontando para a esquerda */}
              <div
                className="shrink-0 w-0 h-0"
                style={{
                  borderTop: '10px solid transparent',
                  borderBottom: '10px solid transparent',
                  borderRight: '12px solid #DDE5E6',
                }}
              />
              {/* Caixa que cresce com o texto */}
              <div className="bg-[#DDE5E6] rounded-[10px] h-[39px] px-4 flex items-center text-[#1d5358] font-semibold text-[16px] whitespace-nowrap">
                {rotulo}
              </div>
            </div>
          </div>
        ))}
      </div>
    </aside>
  )
}

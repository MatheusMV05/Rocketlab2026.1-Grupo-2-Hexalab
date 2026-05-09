import { NavLink } from 'react-router-dom'
import { LayoutDashboard, Users, Box, ShoppingCart, Tag } from 'lucide-react'
import logoVC from '../../assets/logos/Logo-vc.svg'

const itensNav = [
  { para: '/', icone: LayoutDashboard, rotulo: 'Dashboard' },
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
        className="flex items-center justify-center shrink-0"
        style={{ backgroundColor: '#3f7377', width: 104, height: 87 }}
      >
        <img src={logoVC} alt="Logo VC" className="w-[52px] h-[52px] object-contain" />
      </div>

      {/* Fundo cinza claro da barra lateral abaixo do logo */}
      <div className="flex flex-col items-center gap-1 pt-3 flex-1" style={{ backgroundColor: '#f6f7f9' }}>
        {itensNav.map(({ para, icone: Icone, rotulo }) => (
          <NavLink
            key={para}
            to={para}
            end={para === '/'}
            title={rotulo}
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
        ))}
      </div>
    </aside>
  )
}

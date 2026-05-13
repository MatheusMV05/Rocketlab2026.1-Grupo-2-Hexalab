import { LayoutPrincipal } from '../../components/templates/LayoutPrincipal'
import { CardKpi } from '../../components/molecules/dashboard/CardKpi'
import { TabelaClientes } from '../../components/organisms/clientes/TabelaClientes'
import { Users, TrendingUp, Smile, ShoppingBag } from 'lucide-react'

export default function Clientes() {
  return (
    <LayoutPrincipal titulo="CLIENTES">
      <div className="flex flex-col gap-6 h-full min-h-[calc(100vh-140px)]">
        {/* KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          <CardKpi
            titulo="Total de Clientes"
            valor="175.258"
            variacao="+158/ABR"
            tipo="bom"
            icone={<Users size={24} strokeWidth={1.5} />}
          />
          <CardKpi
            titulo="Média de receita"
            valor="R$ 148 /cliente"
            variacao="-12%"
            tipo="ruim"
            icone={<TrendingUp size={24} strokeWidth={1.5} />}
          />
          <CardKpi
            titulo="Taxa de satisfação"
            valor="88%"
            variacao="+10%"
            tipo="bom"
            icone={<Smile size={24} strokeWidth={1.5} />}
          />
          <CardKpi
            titulo="Média de compra"
            valor="05 itens /cliente"
            variacao="ABR/2026"
            tipo="bom"
            icone={<ShoppingBag size={24} strokeWidth={1.5} />}
          />
        </div>

        {/* Tabela Principal */}
        <div className="flex-1 flex flex-col min-h-0">
          <TabelaClientes />
        </div>
      </div>
    </LayoutPrincipal>
  )
}

import { LayoutPrincipal } from '../../components/templates/LayoutPrincipal'
import { CardKpi } from '../../components/molecules/dashboard/CardKpi'
import { TabelaClientes } from '../../components/organisms/clientes/TabelaClientes'
import { Users, TrendingUp, Smile, ShoppingBag, Loader2 } from 'lucide-react'
import { useKpisClientes } from '../../hooks/useClientes'

export default function Clientes() {
  const { data: kpis, isLoading } = useKpisClientes()

  if (isLoading) {
    return (
      <LayoutPrincipal titulo="CLIENTES">
        <div className="flex items-center justify-center h-full min-h-[calc(100vh-140px)]">
          <Loader2 className="animate-spin text-[#1c5258]" size={40} />
        </div>
      </LayoutPrincipal>
    )
  }

  return (
    <LayoutPrincipal titulo="CLIENTES">
      <div className="flex flex-col gap-6 h-full min-h-[calc(100vh-140px)]">
        {/* KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-[14px]">
          <CardKpi
            titulo="Total de Clientes"
            valor={kpis?.total_clientes.toLocaleString('pt-BR') || "0"}
            variacao="Total na base"
            tipo="bom"
            icone={<Users size={24} strokeWidth={1.5} />}
          />
          <CardKpi
            titulo="Média de receita"
            valor={`R$ ${kpis?.media_receita.toFixed(2)} /cliente`}
            variacao="Lifetime Value"
            tipo="bom"
            icone={<TrendingUp size={24} strokeWidth={1.5} />}
          />
          <CardKpi
            titulo="Taxa de satisfação"
            valor={`${kpis?.taxa_satisfacao.toFixed(1)}%`}
            variacao="NPS Médio"
            tipo={kpis && kpis.taxa_satisfacao >= 70 ? "bom" : "ruim"}
            icone={<Smile size={24} strokeWidth={1.5} />}
          />
          <CardKpi
            titulo="Média de compra"
            valor={`${kpis?.media_compra.toFixed(1)} itens /cliente`}
            variacao="Frequência"
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

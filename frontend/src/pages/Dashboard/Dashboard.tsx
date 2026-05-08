import { useState } from 'react'
import { TrendingUp, ShoppingCart, DollarSign, Smile } from 'lucide-react'
import { LayoutPrincipal } from '../../components/templates/LayoutPrincipal'
import { CardKpi } from '../../components/molecules/CardKpi'
import { FiltroPeriodo, type FiltrosPeriodo } from '../../components/molecules/FiltroPeriodo'
import { GraficoReceitaMensal } from '../../components/organisms/GraficoReceitaMensal'
import { GraficoTaxaSatisfacao } from '../../components/organisms/GraficoTaxaSatisfacao'
import { GraficoDistribuicaoPedidos } from '../../components/organisms/GraficoDistribuicaoPedidos'
import { GraficoTop5Produtos } from '../../components/organisms/GraficoTop5Produtos'
import { MatrizSatisfacaoPerformance } from '../../components/organisms/MatrizSatisfacaoPerformance'
import { ListaEntregas } from '../../components/organisms/ListaEntregas'
import { useKpis } from '../../hooks/useDashboard'
import { formatarReaisCompleto } from '../../utils/formatadores'

export default function Dashboard() {
  const [filtrosGlobais, setFiltrosGlobais] = useState<FiltrosPeriodo>({
    ano: '',
    mes: '',
    localidade: '',
  })

  const { data: kpis, isLoading: kpisLoading } = useKpis()

  const cardsKpi = [
    {
      titulo: 'Receita Mensal',
      valor: kpisLoading ? '...' : kpis ? formatarReaisCompleto(kpis.receita_total) : '—',
      icone: <TrendingUp size={24} strokeWidth={1.5} />,
      variacao: '+6,6%/ABR',
      tipo: 'bom' as const,
    },
    {
      titulo: 'Volume de Pedidos',
      valor: kpisLoading ? '...' : kpis ? kpis.total_pedidos.toLocaleString('pt-BR') : '—',
      icone: <ShoppingCart size={24} strokeWidth={1.5} />,
      variacao: '+12%/ABR',
      tipo: 'bom' as const,
    },
    {
      titulo: 'Ticket Médio',
      valor: kpisLoading ? '...' : kpis ? formatarReaisCompleto(kpis.ticket_medio) : '—',
      icone: <DollarSign size={24} strokeWidth={1.5} />,
      variacao: '-2%/ABR',
      tipo: 'ruim' as const,
    },
    {
      titulo: 'Taxa de Satisfação',
      valor: '88%',
      icone: <Smile size={24} strokeWidth={1.5} />,
      variacao: '+3%/ABR',
      tipo: 'bom' as const,
    },
  ]

  return (
    <LayoutPrincipal titulo="DASHBOARD">
      {/* Filtro global — alinhado à direita */}
      <div className="flex items-center justify-end gap-3 mb-5">
        <span className="text-[14px] font-medium text-[#666]">Filtros globais:</span>
        <FiltroPeriodo filtros={filtrosGlobais} onChange={setFiltrosGlobais} />
      </div>

      {/* Cards KPI */}
      <div className="flex gap-4 mb-5">
        {cardsKpi.map((card) => (
          <CardKpi
            key={card.titulo}
            titulo={card.titulo}
            valor={card.valor}
            variacao={card.variacao}
            tipo={card.tipo}
            icone={card.icone}
          />
        ))}
      </div>

      {/* Linha 1: Receita Mensal + Taxa de Satisfação */}
      <div className="grid grid-cols-2 gap-[60px] mb-4" style={{ height: 510 }}>
        <GraficoReceitaMensal filtros={filtrosGlobais} onFiltrosChange={setFiltrosGlobais} />
        <GraficoTaxaSatisfacao filtros={filtrosGlobais} onFiltrosChange={setFiltrosGlobais} />
      </div>

      {/* Linha 2: Matriz de Satisfação vs Performance (largura total) */}
      <div className="mb-4" style={{ height: 487 }}>
        <MatrizSatisfacaoPerformance filtros={filtrosGlobais} onFiltrosChange={setFiltrosGlobais} />
      </div>

      {/* Linha 3: Distribuição de Pedidos + Top 5 Produtos */}
      <div className="grid grid-cols-2 gap-[60px] mb-4" style={{ height: 417 }}>
        <GraficoDistribuicaoPedidos filtros={filtrosGlobais} onFiltrosChange={setFiltrosGlobais} />
        <GraficoTop5Produtos filtros={filtrosGlobais} onFiltrosChange={setFiltrosGlobais} />
      </div>

      {/* Linha 4: Lista de Entregas (largura total) */}
      <div className="mb-4">
        <ListaEntregas />
      </div>
    </LayoutPrincipal>
  )
}

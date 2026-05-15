import { useState, useCallback } from 'react'
import { TrendingUp, ShoppingCart, DollarSign, Smile } from 'lucide-react'
import { LayoutPrincipal } from '../../components/templates/LayoutPrincipal'
import { CardKpi } from '../../components/molecules/dashboard/CardKpi'
import { FiltroPeriodo, type FiltrosPeriodo } from '../../components/molecules/compartilhados/FiltroPeriodo'
import { GraficoReceitaMensal } from '../../components/organisms/dashboard/GraficoReceitaMensal'
import { GraficoTaxaSatisfacao } from '../../components/organisms/dashboard/GraficoTaxaSatisfacao'
import { GraficoDistribuicaoPedidos } from '../../components/organisms/dashboard/GraficoDistribuicaoPedidos'
import { GraficoTop5Produtos } from '../../components/organisms/dashboard/GraficoTop5Produtos'
import { MatrizSatisfacaoPerformance } from '../../components/organisms/dashboard/MatrizSatisfacaoPerformance'
import { ListaEntregas } from '../../components/organisms/dashboard/ListaEntregas'
import { useKpis } from '../../hooks/useDashboard'
import { formatarReaisCompleto, formatarVariacao } from '../../utils/formatadores'

const FILTRO_VAZIO: FiltrosPeriodo = { ano: '', mes: '', localidade: '' }
const GRAFICOS = ['receita', 'satisfacao', 'matriz', 'distribuicao', 'top5'] as const
type GraficoKey = typeof GRAFICOS[number]

function filtrosLocaisVazios(): Record<GraficoKey, FiltrosPeriodo> {
  return Object.fromEntries(GRAFICOS.map((g) => [g, FILTRO_VAZIO])) as Record<GraficoKey, FiltrosPeriodo>
}

export default function Dashboard() {
  const [filtrosGlobais, setFiltrosGlobais] = useState<FiltrosPeriodo>(FILTRO_VAZIO)
  const [filtrosLocais, setFiltrosLocais] = useState<Record<GraficoKey, FiltrosPeriodo>>(filtrosLocaisVazios)

  function handleGlobalChange(novosFiltros: FiltrosPeriodo) {
    setFiltrosGlobais(novosFiltros)
    setFiltrosLocais(filtrosLocaisVazios())
  }

  const camposOverrideados = new Set<keyof FiltrosPeriodo>(
    (Object.keys(FILTRO_VAZIO) as (keyof FiltrosPeriodo)[]).filter((campo) =>
      GRAFICOS.some((g) => filtrosLocais[g][campo] !== filtrosGlobais[campo])
    )
  )

  const handleLocalReceita     = useCallback((f: FiltrosPeriodo) => setFiltrosLocais((p) => ({ ...p, receita:      f })), [])
  const handleLocalSatisfacao  = useCallback((f: FiltrosPeriodo) => setFiltrosLocais((p) => ({ ...p, satisfacao:   f })), [])
  const handleLocalMatriz      = useCallback((f: FiltrosPeriodo) => setFiltrosLocais((p) => ({ ...p, matriz:       f })), [])
  const handleLocalDistribuicao= useCallback((f: FiltrosPeriodo) => setFiltrosLocais((p) => ({ ...p, distribuicao: f })), [])
  const handleLocalTop5        = useCallback((f: FiltrosPeriodo) => setFiltrosLocais((p) => ({ ...p, top5:         f })), [])

  const { data: kpis, isLoading: kpisLoading } = useKpis(filtrosGlobais)

  const ref = kpis?.periodo_ref
  const tagReceita  = formatarVariacao(kpis?.variacao_receita,  ref)
  const tagPedidos  = formatarVariacao(kpis?.variacao_pedidos,  ref)
  const tagTicket   = formatarVariacao(kpis?.variacao_ticket,   ref)
  const tagClientes = formatarVariacao(kpis?.variacao_clientes, ref)

  const cardsKpi = [
    {
      titulo: 'Receita Total',
      valor: kpisLoading ? '...' : kpis ? formatarReaisCompleto(kpis.receita_total) : '—',
      icone: <TrendingUp size={24} strokeWidth={1.5} />,
      variacao: tagReceita?.valor,
      tipo: tagReceita?.tipo ?? 'bom',
    },
    {
      titulo: 'Volume de Pedidos',
      valor: kpisLoading ? '...' : kpis ? kpis.total_pedidos.toLocaleString('pt-BR') : '—',
      icone: <ShoppingCart size={24} strokeWidth={1.5} />,
      variacao: tagPedidos?.valor,
      tipo: tagPedidos?.tipo ?? 'bom',
    },
    {
      titulo: 'Ticket Médio',
      valor: kpisLoading ? '...' : kpis ? formatarReaisCompleto(kpis.ticket_medio) : '—',
      icone: <DollarSign size={24} strokeWidth={1.5} />,
      variacao: tagTicket?.valor,
      tipo: tagTicket?.tipo ?? 'bom',
    },
    {
      titulo: 'Total de Clientes',
      valor: kpisLoading ? '...' : kpis ? kpis.total_clientes.toLocaleString('pt-BR') : '—',
      icone: <Smile size={24} strokeWidth={1.5} />,
      variacao: tagClientes?.valor,
      tipo: tagClientes?.tipo ?? 'bom',
    },
  ]

  return (
    <LayoutPrincipal titulo="DASHBOARD">
      {/* Filtros globais — alinhados à direita conforme protótipo */}
      <div className="flex justify-end mb-[17px]">
        <div className="flex items-center gap-3">
          <span className="text-[14px] font-semibold text-[#1d5358]">Filtros globais:</span>
          <FiltroPeriodo filtros={filtrosGlobais} onChange={handleGlobalChange} camposOverrideados={camposOverrideados} />
        </div>
      </div>

      {/* Cards KPI */}
      <div className="flex gap-[14px] mb-[40px]">
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

      {/* Linha 1: Receita Mensal (578×433) + Taxa de Satisfação (578×433) */}
      <div className="grid grid-cols-2 gap-[60px] mb-[46px]" style={{ height: 435 }}>
        <GraficoReceitaMensal filtrosGlobais={filtrosGlobais} onFiltrosLocaisChange={handleLocalReceita} />
        <GraficoTaxaSatisfacao filtrosGlobais={filtrosGlobais} onFiltrosLocaisChange={handleLocalSatisfacao} />
      </div>

      {/* Linha 2: Matriz de Satisfação vs Performance — largura total */}
      <div className="mb-[44px]" style={{ height: 487 }}>
        <MatrizSatisfacaoPerformance filtrosGlobais={filtrosGlobais} onFiltrosLocaisChange={handleLocalMatriz} />
      </div>

      {/* Linha 3: Distribuição de Pedidos (578×417) + Top 5 Produtos (578×417) */}
      <div className="grid grid-cols-2 gap-[60px] mb-[43px]" style={{ height: 418 }}>
        <GraficoDistribuicaoPedidos filtrosGlobais={filtrosGlobais} onFiltrosLocaisChange={handleLocalDistribuicao} />
        <GraficoTop5Produtos filtrosGlobais={filtrosGlobais} onFiltrosLocaisChange={handleLocalTop5} />
      </div>

      {/* Linha 4: Lista de Entregas — largura total */}
      <div>
        <ListaEntregas />
      </div>
    </LayoutPrincipal>
  )
}

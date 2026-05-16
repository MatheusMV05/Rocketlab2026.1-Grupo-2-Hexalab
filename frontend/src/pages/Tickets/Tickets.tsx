import { Tag, AlertCircle, Clock, Calendar } from 'lucide-react'
import { LayoutPrincipal } from '../../components/templates/LayoutPrincipal'
import { CardKpi } from '../../components/molecules/dashboard/CardKpi'
import { TabelaTickets } from '../../components/organisms/tickets/TabelaTickets'
import { GraficoTicketsPorStatus } from '../../components/organisms/tickets/GraficoTicketsPorStatus'
import { GraficoProblemasRecorrentes } from '../../components/organisms/tickets/GraficoProblemasRecorrentes'
import { GraficoTaxaSatisfacaoSuporte } from '../../components/organisms/tickets/GraficoTaxaSatisfacaoSuporte'
import { GraficoAreasIncidencia } from '../../components/organisms/tickets/GraficoAreasIncidencia'
import { useKpisTickets } from '../../hooks/useTickets'

export default function Tickets() {
  const { data: kpis, isLoading } = useKpisTickets()

  const placeholder = isLoading ? '...' : '0'

  return (
    <LayoutPrincipal titulo="TICKETS">
      <div className="flex flex-col gap-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-[14px]">
          <CardKpi
            titulo="Total de tickets"
            valor={kpis ? `${kpis.total_tickets} tickets` : `${placeholder} tickets`}
            icone={<Tag size={24} strokeWidth={1.5} />}
          />
          <CardKpi
            titulo="Tickets atrasados"
            valor={kpis ? `${kpis.tickets_atrasados} tickets` : `${placeholder} tickets`}
            icone={<AlertCircle size={24} strokeWidth={1.5} />}
          />
          <CardKpi
            titulo="Tickets não resolvidos"
            valor={kpis ? `${kpis.tickets_nao_resolvidos} tickets` : `${placeholder} tickets`}
            icone={<Clock size={24} strokeWidth={1.5} />}
          />
          <CardKpi
            titulo="Tempo médio"
            valor={kpis?.tempo_medio ?? (isLoading ? '...' : '0 horas')}
            icone={<Calendar size={24} strokeWidth={1.5} />}
          />
        </div>

        <TabelaTickets />

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-[24px]" style={{ minHeight: 420 }}>
          <GraficoTicketsPorStatus />
          <GraficoProblemasRecorrentes />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-[24px]" style={{ minHeight: 420 }}>
          <GraficoTaxaSatisfacaoSuporte />
          <GraficoAreasIncidencia />
        </div>
      </div>
    </LayoutPrincipal>
  )
}

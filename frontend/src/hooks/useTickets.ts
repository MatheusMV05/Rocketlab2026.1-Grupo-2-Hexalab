import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { ticketsService } from '../services/ticketsService'
import type {
  FiltrosPeriodoTickets,
  TicketEditavel,
  TicketsListaFiltros,
} from '../types/tickets'

export function useKpisTickets() {
  return useQuery({
    queryKey: ['tickets', 'kpis'],
    queryFn: ticketsService.buscarKpis,
  })
}

export function useListaTickets(
  pagina: number,
  filtros?: TicketsListaFiltros,
  porPagina: number = 6,
) {
  return useQuery({
    queryKey: ['tickets', 'lista', pagina, porPagina, filtros],
    queryFn: () => ticketsService.buscarLista(pagina, porPagina, filtros),
  })
}

export function useSugestoesClientes(termo: string) {
  return useQuery({
    queryKey: ['tickets', 'sugestoes-clientes', termo],
    queryFn: () => ticketsService.buscarSugestoesClientes(termo),
    enabled: termo.length >= 1,
  })
}

export function useListaAgentesSuporte(termoDebounced: string, enabled: boolean) {
  const t = termoDebounced.trim()
  return useQuery({
    queryKey: ['tickets', 'agentes-suporte', t],
    queryFn: () => ticketsService.buscarAgentesSuporte(t || undefined),
    enabled,
    staleTime: 45 * 1000,
  })
}
export function useOpcoesFiltro() {
  return useQuery({
    queryKey: ['tickets', 'filtros-opcoes'],
    queryFn: ticketsService.buscarOpcoesFiltro,
    staleTime: 5 * 60 * 1000,
  })
}

export function useTicketsPorStatus(filtros?: FiltrosPeriodoTickets) {
  return useQuery({
    queryKey: ['tickets', 'por-status', filtros],
    queryFn: () => ticketsService.buscarPorStatus(filtros),
  })
}

export function useProblemasRecorrentes(filtros?: FiltrosPeriodoTickets) {
  return useQuery({
    queryKey: ['tickets', 'problemas-recorrentes', filtros],
    queryFn: () => ticketsService.buscarProblemasRecorrentes(filtros),
  })
}

export function useAreasIncidencia(filtros?: FiltrosPeriodoTickets) {
  return useQuery({
    queryKey: ['tickets', 'areas-incidencia', filtros],
    queryFn: () => ticketsService.buscarAreasIncidencia(filtros),
  })
}

export function useTaxaSatisfacaoSuporte(filtros?: FiltrosPeriodoTickets) {
  return useQuery({
    queryKey: ['tickets', 'taxa-satisfacao-suporte', filtros],
    queryFn: () => ticketsService.buscarTaxaSatisfacaoSuporte(filtros),
  })
}

export function useAtualizarTicket() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ sk, dados }: { sk: string; dados: TicketEditavel }) =>
      ticketsService.atualizar(sk, dados),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['tickets'] })
    },
  })
}

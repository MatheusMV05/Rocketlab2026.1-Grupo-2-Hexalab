import { api } from './api'
import type {
  AreasIncidenciaDados,
  FiltrosPeriodoTickets,
  ProblemasRecorrentesDados,
  AgenteSuporteOpcao,
  SugestaoCliente,
  TaxaSatisfacaoSuporteDados,
  Ticket,
  TicketEditavel,
  TicketsFiltrosOpcoes,
  TicketsKpisDados,
  TicketsListaDados,
  TicketsListaFiltros,
  TicketsPorStatusDados,
} from '../types/tickets'

export const ticketsService = {
  buscarKpis: () =>
    api.get<TicketsKpisDados>('/tickets/kpis').then((r) => r.data),

  buscarLista: (
    pagina: number = 1,
    porPagina: number = 6,
    filtros?: TicketsListaFiltros,
  ): Promise<TicketsListaDados> =>
    api
      .get<TicketsListaDados>('/tickets', {
        params: {
          pagina,
          por_pagina: porPagina,
          cliente: filtros?.cliente,
          tipos: filtros?.tipos,
          status: filtros?.status,
          ordenacao: filtros?.ordenacao,
          ano: filtros?.ano,
          mes: filtros?.mes,
          localidade: filtros?.localidade,
          busca: filtros?.busca,
        },
        paramsSerializer: { indexes: null },
      })
      .then((r) => r.data),

  buscarSugestoesClientes: (termo: string): Promise<SugestaoCliente[]> => {
    if (!termo) return Promise.resolve([])
    return api
      .get<SugestaoCliente[]>('/tickets/clientes-sugestoes', { params: { termo } })
      .then((r) => r.data)
  },

  buscarOpcoesFiltro: () =>
    api.get<TicketsFiltrosOpcoes>('/tickets/filtros-opcoes').then((r) => r.data),

  buscarAgentesSuporte: (sugestao?: string): Promise<AgenteSuporteOpcao[]> =>
    api
      .get<AgenteSuporteOpcao[]>('/tickets/agentes-suporte', {
        params: sugestao?.trim() ? { sugestao: sugestao.trim() } : {},
      })
      .then((r) => r.data),

  buscarPorStatus: (filtros?: FiltrosPeriodoTickets) =>
    api
      .get<TicketsPorStatusDados>('/tickets/por-status', { params: filtros })
      .then((r) => r.data),

  buscarProblemasRecorrentes: (filtros?: FiltrosPeriodoTickets) =>
    api
      .get<ProblemasRecorrentesDados>('/tickets/problemas-recorrentes', { params: filtros })
      .then((r) => r.data),

  buscarAreasIncidencia: (filtros?: FiltrosPeriodoTickets) =>
    api
      .get<AreasIncidenciaDados>('/tickets/areas-incidencia', { params: filtros })
      .then((r) => r.data),

  buscarTaxaSatisfacaoSuporte: (filtros?: FiltrosPeriodoTickets) =>
    api
      .get<TaxaSatisfacaoSuporteDados>('/tickets/taxa-satisfacao-suporte', { params: filtros })
      .then((r) => r.data),

  atualizar: (skTicket: string, dados: TicketEditavel): Promise<Ticket> =>
    api.patch<Ticket>(`/tickets/${encodeURIComponent(skTicket)}`, dados).then((r) => r.data),
}

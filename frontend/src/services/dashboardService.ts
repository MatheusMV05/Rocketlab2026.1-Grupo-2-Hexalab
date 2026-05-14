import axios from 'axios'
import type {
  KpiDados,
  VendasMensalDados,
  TopProdutosDados,
  RegiaoDados,
  StatusPedidosDados,
  TaxaSatisfacaoDados,
  MatrizProdutosDados,
  EntregasDados,
  ReceitaGraficoDados,
  LimitesBloco,
} from '../types/dashboard'

const api = axios.create({
  baseURL: 'http://localhost:8080/api',
})

export const dashboardService = {
  buscarFiltrosOpcoes: () =>
    api.get<{ anos: string[]; estados: string[] }>('/dashboard/filtros-opcoes').then((r) => r.data),

  buscarKpis: () =>
    api.get<KpiDados>('/dashboard/kpis').then((r) => r.data),

  buscarVendasMensal: () =>
    api.get<VendasMensalDados>('/dashboard/vendas-mensal').then((r) => r.data),

  buscarTopProdutos: () =>
    api.get<TopProdutosDados>('/dashboard/top-produtos').then((r) => r.data),

  buscarPorRegiao: () =>
    api.get<RegiaoDados>('/dashboard/por-regiao').then((r) => r.data),

  buscarStatusPedidos: () =>
    api.get<StatusPedidosDados>('/dashboard/status-pedidos').then((r) => r.data),

  buscarTaxaSatisfacao: () =>
    api.get<TaxaSatisfacaoDados>('/dashboard/taxa-satisfacao').then((r) => r.data),

  buscarMatrizProdutos: (params: {
    ano?: string
    mes?: string
    localidade?: string
  } & Partial<LimitesBloco> = {}) =>
    api
      .get<MatrizProdutosDados>('/dashboard/matriz-produtos', { params })
      .then((r) => r.data),

  buscarReceitaGrafico: (params: { ano?: string; mes?: string; localidade?: string }) =>
    api
      .get<ReceitaGraficoDados>('/dashboard/receita-grafico', { params })
      .then((r) => r.data),

  buscarEntregas: (
    pagina: number = 1,
    porPagina: number = 7,
    filtros?: { status?: string[]; ano?: string; mes?: string },
  ) => {
    const params = new URLSearchParams()
    params.set('pagina', String(pagina))
    params.set('por_pagina', String(porPagina))
    filtros?.status?.forEach((s) => params.append('status', s))
    if (filtros?.ano) params.set('ano', filtros.ano)
    if (filtros?.mes) params.set('mes', filtros.mes)
    return api.get<EntregasDados>(`/dashboard/entregas?${params}`).then((r) => r.data)
  },

  atualizarEntrega: (id: string, dados: { cliente?: string; status?: string; prazo?: string }) =>
    api.put(`/dashboard/entregas/${encodeURIComponent(id)}`, dados).then((r) => r.data),
}

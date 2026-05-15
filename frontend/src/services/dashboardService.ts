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
import { MES_PARA_NUMERO } from '../constants/opcoesFiltro'

const api = axios.create({
  baseURL: 'http://localhost:8080/api',
})

function normalizarMes(mes?: string): string | undefined {
  if (!mes) return undefined
  return MES_PARA_NUMERO[mes] ?? mes
}

export const dashboardService = {
  buscarFiltrosOpcoes: () =>
    api.get<{ anos: string[]; estados: string[] }>('/dashboard/filtros-opcoes').then((r) => r.data),

  buscarKpis: (params: { ano?: string; mes?: string; localidade?: string } = {}) =>
    api
      .get<KpiDados>('/dashboard/kpis', {
        params: { ...params, mes: normalizarMes(params.mes) },
      })
      .then((r) => r.data),

  buscarVendasMensal: () =>
    api.get<VendasMensalDados>('/dashboard/vendas-mensal').then((r) => r.data),

  buscarTopProdutos: (params: { ano?: string; mes?: string; localidade?: string } = {}) =>
    api
      .get<TopProdutosDados>('/dashboard/top-produtos', {
        params: { ...params, mes: normalizarMes(params.mes) },
      })
      .then((r) => r.data),

  buscarPorRegiao: () =>
    api.get<RegiaoDados>('/dashboard/por-regiao').then((r) => r.data),

  buscarStatusPedidos: (params: { ano?: string; mes?: string; localidade?: string } = {}) =>
    api
      .get<StatusPedidosDados>('/dashboard/status-pedidos', {
        params: { ...params, mes: normalizarMes(params.mes) },
      })
      .then((r) => r.data),

  buscarTaxaSatisfacao: (params: { ano?: string; mes?: string; localidade?: string } = {}) =>
    api
      .get<TaxaSatisfacaoDados>('/dashboard/taxa-satisfacao', {
        params: { ...params, mes: normalizarMes(params.mes) },
      })
      .then((r) => r.data),

  buscarMatrizProdutos: (params: {
    ano?: string
    mes?: string
    localidade?: string
  } & Partial<LimitesBloco> = {}) =>
    api
      .get<MatrizProdutosDados>('/dashboard/matriz-produtos', {
        params: {
          ...params,
          mes: normalizarMes(params.mes),
          corte_volume: params.corte_volume ?? undefined,
        },
      })
      .then((r) => r.data),

  buscarReceitaGrafico: (params: { ano?: string; mes?: string; localidade?: string }) =>
    api
      .get<ReceitaGraficoDados>('/dashboard/receita-grafico', {
        params: { ...params, mes: normalizarMes(params.mes) },
      })
      .then((r) => r.data),

  buscarEntregas: (
    pagina: number = 1,
    porPagina: number = 10,
    filtros?: { status?: string[]; ano?: string; mes?: string; busca?: string },
    ordem: 'recentes' | 'antigos' | 'cliente_az' | 'cliente_za' = 'recentes',
  ) => {
    const params = new URLSearchParams()
    params.set('pagina', String(pagina))
    params.set('por_pagina', String(porPagina))
    const ordemMap: Record<string, string> = { recentes: 'desc', antigos: 'asc', cliente_az: 'cliente_az', cliente_za: 'cliente_za' }
    params.set('ordem', ordemMap[ordem] ?? 'desc')
    filtros?.status?.forEach((s) => params.append('status', s))
    if (filtros?.ano) params.set('ano', filtros.ano)
    const mesNum = normalizarMes(filtros?.mes)
    if (mesNum) params.set('mes', mesNum)
    if (filtros?.busca) params.set('busca', filtros.busca)
    return api.get<EntregasDados>(`/dashboard/entregas?${params}`).then((r) => r.data)
  },

  atualizarEntrega: (id: string, dados: { cliente?: string; status?: string; prazo?: string }) =>
    api.put(`/dashboard/entregas/${encodeURIComponent(id)}`, dados).then((r) => r.data),
}

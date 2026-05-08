import axios from 'axios'
import type {
  KpiDados,
  VendasMensalDados,
  TopProdutosDados,
  RegiaoDados,
  StatusPedidosDados,
} from '../types/dashboard'

const api = axios.create({
  baseURL: 'http://localhost:8000/api',
})

export const dashboardService = {
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
}

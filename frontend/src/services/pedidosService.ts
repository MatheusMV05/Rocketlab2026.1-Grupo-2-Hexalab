import axios from 'axios'
import type { ListaPedidoPaginada, FiltrosPedidos, KpisPedidos, AnaliseFluxo } from '../types/pedidos'

const api = axios.create({
  baseURL: 'http://localhost:8000/api',
})

export const pedidosService = {
  listarPedidos: (filtros: FiltrosPedidos = {}) => {
    const params = new URLSearchParams()
    
    if (filtros.query) params.append('query', filtros.query)
    if (filtros.status) params.append('status', filtros.status)
    if (filtros.categoria) params.append('categoria', filtros.categoria)
    if (filtros.data_inicio) params.append('data_inicio', filtros.data_inicio)
    if (filtros.data_fim) params.append('data_fim', filtros.data_fim)
    if (filtros.ano) params.append('ano', String(filtros.ano))
    if (filtros.mes) params.append('mes', String(filtros.mes))
    if (filtros.pagina) params.append('pagina', String(filtros.pagina))
    if (filtros.tamanho) params.append('tamanho', String(filtros.tamanho))

    return api.get<ListaPedidoPaginada>(`/pedidos/?${params}`).then((r) => r.data)
  },

  obterPedido: (id: string) => 
    api.get<PedidoDetalhe>(`/pedidos/${id}`).then((r) => r.data),

  buscarKpis: () =>
    api.get<KpisPedidos>('/pedidos/kpis').then((r) => r.data),

  buscarAnaliseFluxo: () =>
    api.get<AnaliseFluxo>('/pedidos/analise-fluxo').then((r) => r.data),

  atualizarPedido: (id: string, dados: any) =>
    api.patch(`/pedidos/${id}`, dados).then((r) => r.data),

  deletarPedido: (id: string) =>
    api.delete(`/pedidos/${id}`).then((r) => r.data),
}

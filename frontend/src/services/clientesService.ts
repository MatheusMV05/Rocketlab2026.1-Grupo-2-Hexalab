import axios from 'axios'
import type { 
  ListaClientePaginada, 
  ClientePerfil, 
  PedidoCliente, 
  AvaliacaoCliente, 
  TicketCliente, 
  KpisClientes 
} from '../types/clientes'

const api = axios.create({
  baseURL: 'http://localhost:8000/api',
})

export const clientesService = {
  listar: (params: { query?: string; estado?: string; pagina?: number; tamanho?: number }) =>
    api.get<ListaClientePaginada>('/clientes', { params }).then((r) => r.data),

  buscarKpis: () =>
    api.get<KpisClientes>('/clientes/kpis').then((r) => r.data),

  buscarPerfil: (id: string) =>
    api.get<ClientePerfil>(`/clientes/${id}`).then((r) => r.data),

  buscarPedidos: (id: string) =>
    api.get<PedidoCliente[]>(`/clientes/${id}/pedidos`).then((r) => r.data),

  buscarAvaliacoes: (id: string) =>
    api.get<AvaliacaoCliente[]>(`/clientes/${id}/avaliacoes`).then((r) => r.data),

  buscarTickets: (id: string) =>
    api.get<TicketCliente[]>(`/clientes/${id}/tickets`).then((r) => r.data),

  buscarLocalizacoes: (q: string) =>
    api.get<string[]>('/clientes/localizacoes', { params: { q } }).then((r) => r.data),
}

import { useQuery } from '@tanstack/react-query'
import { pedidosService } from '../services/pedidosService'
import type { FiltrosPedidos } from '../types/pedidos'

export function usePedidos(filtros: FiltrosPedidos = {}) {
  return useQuery({
    queryKey: ['pedidos', 'listagem', filtros],
    queryFn: () => pedidosService.listarPedidos(filtros),
  })
}

export function usePedido(id: number) {
  return useQuery({
    queryKey: ['pedidos', 'detalhe', id],
    queryFn: () => pedidosService.obterPedido(id),
    enabled: !!id,
  })
}

export function useKpisPedidos() {
  return useQuery({
    queryKey: ['pedidos', 'kpis'],
    queryFn: pedidosService.buscarKpis,
  })
}

export function useAnaliseFluxo() {
  return useQuery({
    queryKey: ['pedidos', 'analise-fluxo'],
    queryFn: pedidosService.buscarAnaliseFluxo,
  })
}

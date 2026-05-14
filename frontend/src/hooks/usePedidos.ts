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

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { pedidosService } from '../services/pedidosService'
import type { FiltrosPedidos } from '../types/pedidos'

export function usePedidos(filtros: FiltrosPedidos = {}) {
  return useQuery({
    queryKey: ['pedidos', 'listagem', filtros],
    queryFn: () => pedidosService.listarPedidos(filtros),
  })
}

export function usePedido(id: string | undefined) {
  return useQuery({
    queryKey: ['pedidos', 'detalhe', id],
    queryFn: () => pedidosService.obterPedido(id as string),
    enabled: !!id,
  })
}

export function useUpdatePedido() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, dados }: { id: string; dados: any }) => pedidosService.atualizarPedido(id, dados),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pedidos'] })
    },
  })
}

export function useDeletePedido() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => pedidosService.deletarPedido(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pedidos'] })
    },
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

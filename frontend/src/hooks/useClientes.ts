import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { clientesService } from '../services/clientesService'

export function useListaClientes(params: { query?: string; estado?: string; pagina?: number; tamanho?: number }) {
  return useQuery({
    queryKey: ['clientes', 'lista', params],
    queryFn: () => clientesService.listar(params),
  })
}

export function useKpisClientes() {
  return useQuery({
    queryKey: ['clientes', 'kpis'],
    queryFn: clientesService.buscarKpis,
  })
}

export function usePerfilCliente(id: string) {
  return useQuery({
    queryKey: ['clientes', 'perfil', id],
    queryFn: () => clientesService.buscarPerfil(id),
    enabled: !!id,
  })
}

export function usePedidosCliente(id: string) {
  return useQuery({
    queryKey: ['clientes', 'pedidos', id],
    queryFn: () => clientesService.buscarPedidos(id),
    enabled: !!id,
  })
}

export function useAvaliacoesCliente(id: string) {
  return useQuery({
    queryKey: ['clientes', 'avaliacoes', id],
    queryFn: () => clientesService.buscarAvaliacoes(id),
    enabled: !!id,
  })
}

export function useTicketsCliente(id: string) {
  return useQuery({
    queryKey: ['clientes', 'tickets', id],
    queryFn: () => clientesService.buscarTickets(id),
    enabled: !!id,
  })
}

export function useLocalizacoes(termo: string) {
  return useQuery({
    queryKey: ['clientes', 'localizacoes', termo],
    queryFn: () => clientesService.buscarLocalizacoes(termo),
    enabled: termo.length >= 2,
    staleTime: 1000 * 60 * 5, // Cache de 5 minutos
  })
}

export function useUpdateCliente() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, dados }: { id: string; dados: any }) => 
      clientesService.atualizar(id, dados),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['clientes', 'perfil', id] })
      queryClient.invalidateQueries({ queryKey: ['clientes', 'lista'] })
    },
  })
}

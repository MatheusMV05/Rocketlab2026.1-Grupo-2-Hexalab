import { useQuery } from '@tanstack/react-query'
import { dashboardService } from '../services/dashboardService'

export function useKpis() {
  return useQuery({
    queryKey: ['dashboard', 'kpis'],
    queryFn: dashboardService.buscarKpis,
  })
}

export function useVendasMensal() {
  return useQuery({
    queryKey: ['dashboard', 'vendas-mensal'],
    queryFn: dashboardService.buscarVendasMensal,
  })
}

export function useTopProdutos() {
  return useQuery({
    queryKey: ['dashboard', 'top-produtos'],
    queryFn: dashboardService.buscarTopProdutos,
  })
}

export function usePorRegiao() {
  return useQuery({
    queryKey: ['dashboard', 'por-regiao'],
    queryFn: dashboardService.buscarPorRegiao,
  })
}

export function useStatusPedidos() {
  return useQuery({
    queryKey: ['dashboard', 'status-pedidos'],
    queryFn: dashboardService.buscarStatusPedidos,
  })
}

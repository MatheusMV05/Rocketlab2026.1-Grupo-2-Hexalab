import { useQuery } from '@tanstack/react-query'
import { dashboardService } from '../services/dashboardService'
import type { FiltrosPeriodo } from '../components/molecules/FiltroPeriodo'

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

export function useTaxaSatisfacao() {
  return useQuery({
    queryKey: ['dashboard', 'taxa-satisfacao'],
    queryFn: dashboardService.buscarTaxaSatisfacao,
  })
}

export function useMatrizProdutos() {
  return useQuery({
    queryKey: ['dashboard', 'matriz-produtos'],
    queryFn: dashboardService.buscarMatrizProdutos,
  })
}

export function useReceitaGrafico(filtros: FiltrosPeriodo) {
  return useQuery({
    queryKey: ['dashboard', 'receita-grafico', filtros.ano, filtros.mes, filtros.localidade],
    queryFn: () =>
      dashboardService.buscarReceitaGrafico({
        ano: filtros.ano || undefined,
        mes: filtros.mes || undefined,
        localidade: filtros.localidade || undefined,
      }),
  })
}

export function useEntregas(pagina: number, porPagina: number = 7) {
  return useQuery({
    queryKey: ['dashboard', 'entregas', pagina, porPagina],
    queryFn: () => dashboardService.buscarEntregas(pagina, porPagina),
  })
}

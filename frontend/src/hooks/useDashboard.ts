import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { dashboardService } from '../services/dashboardService'
import type { FiltrosPeriodo } from '../components/molecules/FiltroPeriodo'
import type { LimitesBloco } from '../types/dashboard'

interface FiltrosEntregas {
  status?: string[]
  ano?: string
  mes?: string
  busca?: string
}

export function useKpis(filtros?: FiltrosPeriodo) {
  return useQuery({
    queryKey: ['dashboard', 'kpis', filtros?.ano, filtros?.mes, filtros?.localidade],
    queryFn: () =>
      dashboardService.buscarKpis({
        ano: filtros?.ano || undefined,
        mes: filtros?.mes || undefined,
        localidade: filtros?.localidade || undefined,
      }),
  })
}

export function useVendasMensal() {
  return useQuery({
    queryKey: ['dashboard', 'vendas-mensal'],
    queryFn: dashboardService.buscarVendasMensal,
  })
}

export function useTopProdutos(filtros?: FiltrosPeriodo) {
  return useQuery({
    queryKey: ['dashboard', 'top-produtos', filtros?.ano, filtros?.mes, filtros?.localidade],
    queryFn: () =>
      dashboardService.buscarTopProdutos({
        ano: filtros?.ano || undefined,
        mes: filtros?.mes || undefined,
        localidade: filtros?.localidade || undefined,
      }),
  })
}

export function usePorRegiao() {
  return useQuery({
    queryKey: ['dashboard', 'por-regiao'],
    queryFn: dashboardService.buscarPorRegiao,
  })
}

export function useStatusPedidos(filtros?: FiltrosPeriodo) {
  return useQuery({
    queryKey: ['dashboard', 'status-pedidos', filtros?.ano, filtros?.mes, filtros?.localidade],
    queryFn: () =>
      dashboardService.buscarStatusPedidos({
        ano: filtros?.ano || undefined,
        mes: filtros?.mes || undefined,
        localidade: filtros?.localidade || undefined,
      }),
  })
}

export function useTaxaSatisfacao(filtros?: FiltrosPeriodo) {
  return useQuery({
    queryKey: ['dashboard', 'taxa-satisfacao', filtros?.ano, filtros?.mes, filtros?.localidade],
    queryFn: () =>
      dashboardService.buscarTaxaSatisfacao({
        ano: filtros?.ano || undefined,
        mes: filtros?.mes || undefined,
        localidade: filtros?.localidade || undefined,
      }),
  })
}

export function useMatrizProdutos(filtros: FiltrosPeriodo, limites: LimitesBloco) {
  return useQuery({
    queryKey: [
      'dashboard', 'matriz-produtos',
      filtros.ano, filtros.mes, filtros.localidade,
      limites.limite_estrelas, limites.limite_oportunidades,
      limites.limite_alerta_vermelho, limites.limite_ofensores,
    ],
    queryFn: () =>
      dashboardService.buscarMatrizProdutos({
        ano: filtros.ano || undefined,
        mes: filtros.mes || undefined,
        localidade: filtros.localidade || undefined,
        ...limites,
      }),
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

export function useEntregas(pagina: number, filtros?: FiltrosEntregas, porPagina: number = 10, ordem: 'recentes' | 'antigos' | 'cliente_az' | 'cliente_za' = 'recentes') {
  return useQuery({
    queryKey: ['dashboard', 'entregas', pagina, porPagina, filtros, ordem],
    queryFn: () => dashboardService.buscarEntregas(pagina, porPagina, filtros, ordem),
  })
}

export function useFiltrosOpcoes() {
  return useQuery({
    queryKey: ['dashboard', 'filtros-opcoes'],
    queryFn: dashboardService.buscarFiltrosOpcoes,
    staleTime: Infinity,
  })
}

export function useAtualizarEntrega() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, dados }: { id: string; dados: { cliente?: string; status?: string; prazo?: string } }) =>
      dashboardService.atualizarEntrega(id, dados),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dashboard', 'entregas'] })
    },
  })
}

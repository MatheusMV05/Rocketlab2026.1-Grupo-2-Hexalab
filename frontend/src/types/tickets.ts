export interface Ticket {
  sk: string
  id: string
  cliente_id: string
  cliente_nome: string
  status: string
  resolvido: boolean
  duracao: string
  tipo: string
  responsavel: string
  avaliacao: number | null
}

export interface TicketsKpisDados {
  total_tickets: number
  tickets_atrasados: number
  tickets_nao_resolvidos: number
  tempo_medio: string
}

export interface FiltrosPeriodoTickets {
  ano?: string
  mes?: string
  localidade?: string
}

export interface TicketsListaFiltros extends FiltrosPeriodoTickets {
  ordenacao?: string
  cliente?: string
  tipos?: string[]
  status?: string[]
  busca?: string
}

export interface TicketsListaDados {
  itens: Ticket[]
  total: number
  total_ativos: number
  pagina: number
  paginas: number
}

export interface SugestaoCliente {
  id: string
  nome: string
}

/** Nomes distintos de `fat_tickets.agente_suporte` */
export interface AgenteSuporteOpcao {
  nome: string
}

export interface TicketsPorStatusItem {
  status: string
  total: number
}

export interface TicketsPorStatusDados {
  itens: TicketsPorStatusItem[]
  volume_total: number
}

export interface ProblemaRecorrenteItem {
  posicao: number
  rotulo: string
  total: number
}

export interface ProblemasRecorrentesDados {
  itens: ProblemaRecorrenteItem[]
  volume_total: number
}

export interface AreaIncidenciaItem {
  posicao: number
  rotulo: string
  total: number
}

export interface AreasIncidenciaDados {
  itens: AreaIncidenciaItem[]
  volume_total: number
}

export interface TaxaSatisfacaoSuporteDados {
  valor: number
  meta: number
  total_tickets: number
}

export interface TicketsFiltrosOpcoes {
  tipos: string[]
  status: string[]
}

export interface TicketEditavel {
  sla_status?: string
  tipo_problema?: string
  agente_suporte?: string
  fl_resolvido?: boolean
}

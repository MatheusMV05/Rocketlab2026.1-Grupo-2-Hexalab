export interface KpiDados {
  receita_total: number
  total_pedidos: number
  ticket_medio: number
  total_clientes: number
  variacao_receita?: number | null
  variacao_pedidos?: number | null
  variacao_ticket?: number | null
  variacao_clientes?: number | null
  periodo_ref?: string
}

export interface VendaMensalItem {
  mes_ano: string
  receita_total: number
  total_pedidos: number
}

export interface VendasMensalDados {
  items: VendaMensalItem[]
}

export interface TopProdutoItem {
  nome_produto: string
  categoria: string
  receita_total: number
  total_unidades: number
}

export interface TopProdutosDados {
  items: TopProdutoItem[]
  variacao_receita?: number | null
  variacao_volume?: number | null
  periodo_ref?: string
}

export interface RegiaoItem {
  estado: string
  receita_total: number
  total_pedidos: number
}

export interface RegiaoDados {
  items: RegiaoItem[]
}

export interface StatusPedidoItem {
  status: string
  total: number
  percentual: number
}

export interface StatusPedidosDados {
  items: StatusPedidoItem[]
  variacao_total?: number | null
  periodo_ref?: string
}

export interface TaxaSatisfacaoDados {
  valor: number
  total_avaliacoes: number
  variacao?: number | null
  periodo_ref?: string
}

export interface MatrizProdutoItem {
  nome: string
  categoria: string
  volume: number
  satisfacao: number
  status: string      // "bom" | "neutro" | "ruim"
  quadrante: string   // "estrelas" | "oportunidades" | "alerta_vermelho" | "ofensores"
  bloco_anterior: string
}

export interface MatrizProdutosDados {
  items: MatrizProdutoItem[]
  mediana_volume: number
}

export interface LimitesBloco {
  limite_estrelas: number
  limite_oportunidades: number
  limite_alerta_vermelho: number
  limite_ofensores: number
}

export interface EntregaItem {
  id: string
  cliente: string
  status: string
  prazo: string
}

export interface ReceitaGraficoItem {
  label: string
  receita: number
  meta: number
}

export interface ReceitaGraficoDados {
  items: ReceitaGraficoItem[]
  modo: 'semanal' | 'comparativo' | 'mensal'
}

export interface EntregasDados {
  items: EntregaItem[]
  total: number
  pagina: number
  por_pagina: number
  total_paginas: number
}

export interface KpiDados {
  receita_total: number
  total_pedidos: number
  ticket_medio: number
  total_clientes: number
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
}

export interface TopProdutosDados {
  items: TopProdutoItem[]
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
}

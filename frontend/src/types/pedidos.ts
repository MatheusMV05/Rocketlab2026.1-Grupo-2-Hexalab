export interface PedidoItem {
  id: string
  cod_pedido: string
  nome_cliente: string
  cod_produto: string
  nome_produto: string
  categoria: string
  valor: number
  quantidade: number
  data: string
  metodo_pagamento: string
  status: string
  risco: string
}

export interface ListaPedidoPaginada {
  itens: PedidoItem[]
  total: number
  pagina: number
  tamanho: number
  paginas: number
}

export interface FiltrosPedidos {
  query?: string
  status?: string
  categoria?: string
  data_inicio?: string
  data_fim?: string
  ano?: number
  mes?: number
  pagina?: number
  tamanho?: number
}

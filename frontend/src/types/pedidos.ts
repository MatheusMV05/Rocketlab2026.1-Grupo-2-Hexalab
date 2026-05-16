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

export interface KpisPedidos {
  processando: number
  processando_valor: number
  aprovados: number
  aprovados_valor: number
  recusados: number
  recusados_valor: number
  reembolsados: number
  reembolsados_valor: number
  total: number
  total_valor: number
}

export interface EtapaFluxo {
  id: string
  titulo: string
  total_pedidos: number
  status: string
  problemas: string[]
  gargalos: string[]
}

export interface AnaliseFluxo {
  etapas: EtapaFluxo[]
  total_pedidos: number
}

export interface ProdutoNoPedido {
  cod_produto: string
  nome_produto: string
  categoria: string
  valor: number
  quantidade: number
}

export interface PedidoDetalhe {
  id: string
  cod_pedido: string
  id_cliente: string
  nome_cliente: string
  valor_total: number
  data: string
  metodo_pagamento: string
  status: string
  quantidade_total: number
  produtos: ProdutoNoPedido[]
}

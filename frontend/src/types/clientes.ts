export interface ClienteListagem {
  id: string
  nome_completo: string
  telefone: string
  cidade: string
  estado: string
  total_gasto: number
  total_pedidos: number
  segmento_rfm: string
  origem: string
  data_cadastro: string
}

export interface ListaClientePaginada {
  itens: ClienteListagem[]
  total: number
  pagina: number
  tamanho: number
  paginas: number
}

export interface ClientePerfil {
  id: string
  nome_completo: string
  email: string
  telefone: string
  cidade: string
  estado: string
  genero: string
  idade: number
  data_cadastro: string
  origem: string
  total_gasto: number
  total_pedidos: number
  ticket_medio: number
  ultimo_pedido: string | null
  nps_medio: number | null
  tickets_abertos: number
  segmento_rfm: string
}

export interface PedidoCliente {
  id: string
  nome_produto: string
  categoria: string
  valor: number
  data: string
  status: string
  metodo_pagamento?: string
  quantidade: number
}

export interface AvaliacaoCliente {
  id_pedido: string
  nota_produto: number
  nps: number
  comentario: string | null
}

export interface TicketCliente {
  id: string
  tipo_problema: string
  data_abertura: string
  tempo_resolucao_horas: number | null
  nota_avaliacao: number | null
}

export interface KpisClientes {
  total_clientes: number
  media_receita: number
  taxa_satisfacao: number
  media_compra: number
}

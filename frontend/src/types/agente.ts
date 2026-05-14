// Tipos do assistente IA. Espelha o contrato esperado de `POST /api/agent/chat`
// definido nas user stories US-14 e US-15 do Backlog Centralizado.

export interface ChatRequest {
  message: string
  session_id: string
}

export interface ChatResponse {
  answer: string
  sql_used: string | null
  data: Array<Record<string, unknown>>
  out_of_scope: boolean
  suggestions?: string[]
}

export type AutorMensagem = 'usuario' | 'assistente'

export interface Mensagem {
  id: string
  autor: AutorMensagem
  texto: string
  sqlUsado?: string | null
  dados?: Array<Record<string, unknown>>
  foraDoEscopo?: boolean
  erro?: boolean
  carregando?: boolean
  sugestoes?: string[]
}

export interface ChatHistoricoItem {
  id: string
  titulo: string
}

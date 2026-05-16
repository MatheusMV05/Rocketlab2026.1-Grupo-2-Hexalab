import { api } from './api'
import type { ChatRequest, ChatResponse } from '../types/agente'

export async function enviarPergunta(req: ChatRequest): Promise<ChatResponse> {
  const { data } = await api.post<ChatResponse>('/agent/chat', req, { timeout: 35_000 })
  return data
}

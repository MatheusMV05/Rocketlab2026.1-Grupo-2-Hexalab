import axios from 'axios'
import type { ChatRequest, ChatResponse } from '../types/agente'

const api = axios.create({
  baseURL: 'http://localhost:8000/api',
  timeout: 35_000,
})

export async function enviarPergunta(req: ChatRequest): Promise<ChatResponse> {
  const { data } = await api.post<ChatResponse>('/agent/chat', req)
  return data
}

import { useMutation } from '@tanstack/react-query'
import { enviarPergunta } from '../services/agenteService'
import type { ChatRequest, ChatResponse } from '../types/agente'

export function useEnviarPergunta() {
  return useMutation<ChatResponse, Error, ChatRequest>({
    mutationFn: enviarPergunta,
  })
}

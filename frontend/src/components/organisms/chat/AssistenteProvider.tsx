import { createContext, useCallback, useContext, useMemo, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import { enviarPergunta } from '../../../services/agenteService'
import type { ChatHistoricoItem, Mensagem } from '../../../types/agente'

export type ModoAssistente = 'fechado' | 'popup' | 'cheio'

interface EstadoAssistente {
  modo: ModoAssistente
  mensagens: Mensagem[]
  sessionId: string
  chats: ChatHistoricoItem[]
  chatAtivoId: string | null
  rascunho: string
  enviando: boolean
  abrir: () => void
  fechar: () => void
  expandir: () => void
  minimizar: () => void
  alternar: () => void
  novoChat: () => void
  selecionarChat: (id: string) => void
  enviarMensagem: (texto: string) => Promise<void>
  definirRascunho: (texto: string) => void
}

const AssistenteContext = createContext<EstadoAssistente | null>(null)

function gerarId(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID()
  }
  return `${Date.now()}-${Math.random().toString(36).slice(2)}`
}

interface Props {
  children: ReactNode
}

export function AssistenteProvider({ children }: Props) {
  const [modo, setModo] = useState<ModoAssistente>('fechado')
  const [mensagens, setMensagens] = useState<Mensagem[]>([])
  const [chats] = useState<ChatHistoricoItem[]>([])
  const [chatAtivoId, setChatAtivoId] = useState<string | null>(null)
  const [rascunho, setRascunho] = useState<string>('')
  const [enviando, setEnviando] = useState<boolean>(false)
  const sessionIdRef = useRef<string>(gerarId())

  const abrir = useCallback(() => setModo('popup'), [])
  const fechar = useCallback(() => setModo('fechado'), [])
  const expandir = useCallback(() => setModo('cheio'), [])
  const minimizar = useCallback(() => setModo('popup'), [])
  const alternar = useCallback(() => {
    setModo((atual) => (atual === 'fechado' ? 'popup' : 'fechado'))
  }, [])

  const novoChat = useCallback(() => {
    setMensagens([])
    setChatAtivoId(null)
    setRascunho('')
    sessionIdRef.current = gerarId()
  }, [])

  const selecionarChat = useCallback((id: string) => {
    setChatAtivoId(id)
    setMensagens([])
    setRascunho('')
  }, [])

  const definirRascunho = useCallback((texto: string) => {
    setRascunho(texto)
  }, [])

  const enviarMensagem = useCallback(async (texto: string) => {
    const textoLimpo = texto.trim()
    if (!textoLimpo || enviando) return

    const idUsuario = gerarId()
    const idAssistente = gerarId()
    const mensagemUsuario: Mensagem = { id: idUsuario, autor: 'usuario', texto: textoLimpo }
    const mensagemCarregando: Mensagem = {
      id: idAssistente,
      autor: 'assistente',
      texto: 'Pensando...',
      carregando: true,
    }

    setMensagens((anteriores) => [...anteriores, mensagemUsuario, mensagemCarregando])
    setRascunho('')
    setEnviando(true)

    try {
      const resposta = await enviarPergunta({
        message: textoLimpo,
        session_id: sessionIdRef.current,
      })
      setMensagens((anteriores) =>
        anteriores.map((m) =>
          m.id === idAssistente
            ? {
                ...m,
                texto: resposta.answer,
                sqlUsado: resposta.sql_used,
                dados: resposta.data,
                foraDoEscopo: resposta.out_of_scope,
                carregando: false,
              }
            : m,
        ),
      )
    } catch {
      setMensagens((anteriores) =>
        anteriores.map((m) =>
          m.id === idAssistente
            ? {
                ...m,
                texto:
                  'O agente ainda não está disponível. Tente novamente em alguns instantes.',
                carregando: false,
                erro: true,
              }
            : m,
        ),
      )
    } finally {
      setEnviando(false)
    }
  }, [enviando])

  const valor = useMemo<EstadoAssistente>(
    () => ({
      modo,
      mensagens,
      sessionId: sessionIdRef.current,
      chats,
      chatAtivoId,
      rascunho,
      enviando,
      abrir,
      fechar,
      expandir,
      minimizar,
      alternar,
      novoChat,
      selecionarChat,
      enviarMensagem,
      definirRascunho,
    }),
    [
      modo,
      mensagens,
      chats,
      chatAtivoId,
      rascunho,
      enviando,
      abrir,
      fechar,
      expandir,
      minimizar,
      alternar,
      novoChat,
      selecionarChat,
      enviarMensagem,
      definirRascunho,
    ],
  )

  return <AssistenteContext.Provider value={valor}>{children}</AssistenteContext.Provider>
}

export function useAssistente(): EstadoAssistente {
  const ctx = useContext(AssistenteContext)
  if (!ctx) {
    throw new Error('useAssistente deve ser usado dentro de <AssistenteProvider>.')
  }
  return ctx
}

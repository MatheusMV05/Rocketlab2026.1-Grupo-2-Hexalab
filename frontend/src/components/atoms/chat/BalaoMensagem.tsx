import { useState } from 'react'
import { ChevronDown, ChevronUp, Search } from 'react-feather'
import { LogoChat } from './LogoChat'
import type { Mensagem } from '../../../types/agente'
import { AcoesRespostaAssistente } from '../../molecules/chat/AcoesRespostaAssistente'
import { ListaSugestoes } from '../../molecules/chat/ListaSugestoes'
import { useAssistente } from '../../organisms/chat/AssistenteProvider'

interface Props {
  mensagem: Mensagem
  perguntaOriginal?: string
}

function extrairTabelas(sql: string): string[] {
  const regex = /(?:FROM|JOIN)\s+([a-zA-Z_][a-zA-Z0-9_]*)/gi
  const tabelas = new Set<string>()
  let m: RegExpExecArray | null
  while ((m = regex.exec(sql)) !== null) tabelas.add(m[1])
  return tabelas.size > 0 ? [...tabelas] : ['SQL']
}

export function BalaoMensagem({ mensagem, perguntaOriginal }: Props) {
  const [sqlAberto, setSqlAberto] = useState(false)
  const [liked, setLiked] = useState(false)
  const [disliked, setDisliked] = useState(false)
  const [copiado, setCopiado] = useState(false)
  const { definirRascunho, enviarMensagem } = useAssistente()
  const ehUsuario = mensagem.autor === 'usuario'

  if (ehUsuario) {
    return (
      <div className="flex w-full justify-end">
        <div className="max-w-[80%] rounded-[14px] px-[14px] py-[10px] text-[13px] leading-[1.5] bg-[#e8eaee] text-[#1a1a1a]">
          <p className={mensagem.carregando ? 'italic opacity-70' : ''}>{mensagem.texto}</p>
        </div>
      </div>
    )
  }

  if (mensagem.erro) {
    return (
      <div className="flex w-full justify-start">
        <div className="max-w-[80%] rounded-[14px] px-[14px] py-[10px] text-[13px] leading-[1.5] bg-[#fff1f1] text-[#8a1f1f] border border-[#f1c1c1]">
          <p>{mensagem.texto}</p>
        </div>
      </div>
    )
  }

  const foraEscopo = Boolean(mensagem.foraDoEscopo && !mensagem.carregando)
  const classeEscopo = foraEscopo
    ? 'rounded-[10px] border border-amber-300/80 bg-amber-50/90 px-3 py-2 -mx-1'
    : ''

  const handleLike = () => {
    setLiked((v) => {
      if (!v) setDisliked(false)
      return !v
    })
  }
  const handleDislike = () => {
    setDisliked((v) => {
      if (!v) setLiked(false)
      return !v
    })
  }
  const handleCopiar = () => {
    void navigator.clipboard.writeText(mensagem.texto)
    setCopiado(true)
    setTimeout(() => setCopiado(false), 2000)
  }
  const handleRegenerar = () => {
    if (perguntaOriginal) void enviarMensagem(perguntaOriginal)
  }

  return (
    <div className="flex w-full justify-start">
      <div className="max-w-[85%] min-w-0 flex gap-2 items-start">
        <LogoChat tamanho={18} className="mt-[2px] shrink-0" />
        <div className={`min-w-0 flex-1 text-[13px] leading-[1.5] text-[#343434] ${classeEscopo}`}>
          {foraEscopo && (
            <p className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-amber-900/80">
              Fora do escopo ou não respondido pelo modelo
            </p>
          )}
          <p className={mensagem.carregando ? 'italic opacity-70' : ''}>{mensagem.texto}</p>

          {mensagem.sqlUsado && (
            <div className="mt-2">
              <button
                type="button"
                onClick={() => setSqlAberto((v) => !v)}
                className="flex items-center gap-1 text-[11px] text-[#1d5358] hover:underline"
              >
                <Search size={11} strokeWidth={2} />
                <span>Fontes: {extrairTabelas(mensagem.sqlUsado).join(' | ')}</span>
                {sqlAberto ? <ChevronUp size={11} /> : <ChevronDown size={11} />}
              </button>
              {sqlAberto && (
                <pre className="mt-2 bg-[#f6f7f9] rounded-[6px] p-2 text-[11px] text-[#343434] whitespace-pre-wrap break-words border border-[#e0e0e0]">
                  {mensagem.sqlUsado}
                </pre>
              )}
            </div>
          )}

          {mensagem.dados && mensagem.dados.length > 0 && (
            <div className="mt-3 max-h-[180px] overflow-auto border border-[#e0e0e0] rounded-[6px] bg-white">
              <table className="w-full text-[11px] text-left">
                <thead className="bg-[#f6f7f9] text-[#1d5358]">
                  <tr>
                    {Object.keys(mensagem.dados[0]).map((coluna) => (
                      <th key={coluna} className="px-2 py-1 font-semibold border-b border-[#e0e0e0]">
                        {coluna}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {mensagem.dados.map((linha, idx) => (
                    <tr key={idx} className="border-b border-[#f0f0f0]">
                      {Object.values(linha).map((valor, i) => (
                        <td key={i} className="px-2 py-1 text-[#343434]">
                          {String(valor ?? '—')}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {!mensagem.carregando &&
            mensagem.sugestoes &&
            mensagem.sugestoes.length > 0 && (
              <div className="mt-3">
                <ListaSugestoes
                  sugestoes={mensagem.sugestoes}
                  onSelecionar={(texto) => {
                    definirRascunho(texto)
                    void enviarMensagem(texto)
                  }}
                />
              </div>
            )}

          {!mensagem.carregando && !mensagem.erro && (
            <div className="flex items-center gap-2">
              <AcoesRespostaAssistente
                liked={liked}
                disliked={disliked}
                onLike={handleLike}
                onDislike={handleDislike}
                onRegenerar={perguntaOriginal ? handleRegenerar : undefined}
                onCopiar={handleCopiar}
              />
              {copiado && (
                <span className="text-[10px] text-[#1d5358] font-medium animate-pulse">
                  Copiado!
                </span>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

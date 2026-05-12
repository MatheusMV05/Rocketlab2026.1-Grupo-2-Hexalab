import { useState } from 'react'
import { ChevronDown, ChevronUp } from 'react-feather'
import { LogoChat } from './LogoChat'
import type { Mensagem } from '../../../types/agente'
import { AcoesRespostaAssistente } from '../../molecules/chat/AcoesRespostaAssistente'

interface Props {
  mensagem: Mensagem
}

export function BalaoMensagem({ mensagem }: Props) {
  const [sqlAberto, setSqlAberto] = useState(false)
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

  // Assistente: sem bolha — ícone + texto; extras abaixo
  return (
    <div className="flex w-full justify-start">
      <div className="max-w-[85%] flex gap-2 items-start">
        <LogoChat tamanho={18} className="mt-[2px]" />
        <div className="min-w-0 flex-1 text-[13px] leading-[1.5] text-[#343434]">
          <p className={mensagem.carregando ? 'italic opacity-70' : ''}>{mensagem.texto}</p>

          {!mensagem.carregando && !mensagem.erro && <AcoesRespostaAssistente />}

          {mensagem.sqlUsado && (
            <div className="mt-3 pt-2 border-t border-[#e0e0e0]">
              <button
                type="button"
                onClick={() => setSqlAberto((v) => !v)}
                className="flex items-center gap-1 text-[11px] font-semibold text-[#1d5358] hover:underline"
              >
                {sqlAberto ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                SQL utilizado
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
        </div>
      </div>
    </div>
  )
}

import { useState, useRef, useEffect } from 'react'
import { ChevronDown, X, Circle } from 'lucide-react'

interface Props {
  valor: string
  onChange: (valor: string) => void
}

const OPCOES = [
  { id: 'A-Z', label: 'A-Z' },
  { id: 'Mais recentes', label: 'Mais recentes' },
  { id: 'Mais antigos', label: 'Mais antigos' },
]

export function DropdownOrganizarLista({ valor, onChange }: Props) {
  const [aberto, setAberto] = useState(false)
  const [pendente, setPendente] = useState(valor)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (aberto) setPendente(valor)
  }, [aberto, valor])

  useEffect(() => {
    function fechar(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setAberto(false)
    }
    if (aberto) document.addEventListener('mousedown', fechar)
    return () => document.removeEventListener('mousedown', fechar)
  }, [aberto])

  function aplicar() {
    onChange(pendente)
    setAberto(false)
  }

  function limpar() {
    onChange('')
    setPendente('')
    setAberto(false)
  }

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setAberto((v) => !v)}
        className={`flex items-center gap-2 rounded-full px-4 py-[10px] text-[13px] font-semibold whitespace-nowrap transition-colors ${
          valor
            ? 'bg-[#1c5258] text-white hover:bg-[#154247]' // Filtro ativo (verde escuro)
            : aberto
            ? 'bg-[#e5ebeb] text-[#1c5258]' // Aberto sem filtro
            : 'bg-[#f6f7f9] text-[#262626] hover:bg-[#e5ebeb]' // Padrão
        }`}
      >
        <span>Organizar Lista{valor ? `: ${valor}` : ''}</span>
        {valor ? (
          <X 
            size={14} 
            strokeWidth={2} 
            className="text-red-500 ml-1 hover:text-red-700 transition-colors bg-white rounded-full p-[2px]" 
            onClick={(e) => {
              e.stopPropagation()
              limpar()
            }} 
          />
        ) : (
          <ChevronDown
            size={16}
            strokeWidth={2}
            className={`transition-transform ${aberto ? 'rotate-180' : ''}`}
          />
        )}
      </button>

      {aberto && (
        <div className="absolute top-[calc(100%+8px)] left-0 z-[200] bg-white rounded-[10px] shadow-[0_4px_20px_rgba(0,0,0,0.15)] min-w-[200px] border border-[#e0e0e0] flex flex-col">
          <div className="py-2">
            {OPCOES.map((op) => {
              const selecionado = pendente === op.id
              return (
                <button
                  key={op.id}
                  onClick={() => setPendente(op.id)}
                  className="w-full flex items-center gap-3 px-4 py-[10px] text-[13px] hover:bg-[#f6f7f9] transition-colors text-left"
                >
                  <span className="flex-shrink-0 flex items-center justify-center w-5 h-5">
                    {selecionado ? (
                      <span className="flex items-center justify-center w-[18px] h-[18px] rounded-full border-2 border-[#1c5258]">
                        <span className="w-2.5 h-2.5 rounded-full bg-[#1c5258]" />
                      </span>
                    ) : (
                      <Circle size={18} color="#a0a0a0" strokeWidth={1.5} />
                    )}
                  </span>
                  <span className={selecionado ? 'text-[#1c5258] font-medium' : 'text-[#343434]'}>
                    {op.label}
                  </span>
                </button>
              )
            })}
          </div>

          <div className="flex gap-2 px-3 py-3 border-t border-[#e0e0e0] bg-[#fdfdfd] rounded-b-[10px]">
            <button
              onClick={() => setPendente('')}
              className="flex-1 text-[13px] text-[#343434] bg-[#e5ebeb] hover:bg-[#d1dbdb] rounded-full py-[6px] transition-colors font-medium"
            >
              Limpar
            </button>
            <button
              onClick={aplicar}
              className="flex-1 text-[13px] text-white bg-[#1c5258] hover:bg-[#154247] rounded-full py-[6px] transition-colors font-medium"
            >
              Aplicar
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

import { useState, useRef, useEffect } from 'react'
import { ChevronDown, ListFilter, Search } from 'lucide-react'
import { Circle } from 'lucide-react'

interface Props {
  valor: string
  onChange: (valor: string) => void
  onSearch: (busca: string) => void
}

export function SeletorOrganizarLista({ valor, onChange, onSearch }: Props) {
  const [aberto, setAberto] = useState(false)
  const [pendente, setPendente] = useState(valor)
  const [busca, setBusca] = useState('')
  const ref = useRef<HTMLDivElement>(null)

  const opcoes = [
    'Risco de atraso',
    'Atrasado',
    'Em aberto',
    'Finalizado'
  ]

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

  const aplicar = () => {
    onChange(pendente)
    setAberto(false)
  }

  const limpar = () => {
    setPendente('')
  }

  return (
    <div className="flex items-center gap-4">
      <div ref={ref} className="relative">
        <button
          onClick={() => setAberto(!aberto)}
          className={`flex items-center gap-2 h-[40px] px-4 rounded-[12px] text-[14px] font-semibold transition-all shadow-sm ${
            aberto 
            ? 'bg-[#1d5358] text-white border-transparent' 
            : 'bg-white text-[#343434] border border-[#e0e0e0] hover:border-[#1d5358]'
          }`}
        >
          <ListFilter size={18} />
          <span>Organizar Lista</span>
          {valor && (
            <span className="ml-1 text-[12px] opacity-80">: {valor}</span>
          )}
          <ChevronDown size={16} className={`transition-transform ${aberto ? 'rotate-180' : ''}`} />
        </button>

        {aberto && (
          <div className="absolute left-0 top-full mt-2 bg-white rounded-[12px] z-[50] w-[220px] shadow-xl border border-[#e0e0e0] overflow-hidden">
            <div className="py-2">
              {opcoes.map((op) => (
                <button
                  key={op}
                  onClick={() => setPendente(op)}
                  className="w-full flex items-center gap-3 px-4 py-3 hover:bg-[#f6f7f9] transition-colors text-left"
                >
                  <div className="relative flex items-center justify-center">
                    {pendente === op ? (
                      <div className="w-5 h-5 rounded-full border-2 border-[#1d5358] flex items-center justify-center">
                        <div className="w-2.5 h-2.5 rounded-full bg-[#1d5358]" />
                      </div>
                    ) : (
                      <div className="w-5 h-5 rounded-full border-2 border-[#d1d5db]" />
                    )}
                  </div>
                  <span className={`text-[13px] ${pendente === op ? 'text-[#1d5358] font-semibold' : 'text-[#343434]'}`}>
                    {op}
                  </span>
                </button>
              ))}
            </div>
            <div className="flex gap-2 p-3 bg-[#f6f7f9] border-t border-[#e0e0e0]">
              <button
                onClick={limpar}
                className="flex-1 py-1.5 text-[12px] font-medium text-[#4d4d4d] bg-white border border-[#d1d5db] rounded-[8px] hover:bg-gray-50"
              >
                Limpar
              </button>
              <button
                onClick={aplicar}
                className="flex-1 py-1.5 text-[12px] font-medium text-white bg-[#1d5358] rounded-[8px] hover:bg-[#164246]"
              >
                Aplicar
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="relative flex-1 max-w-[300px]">
        <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#898989]" />
        <input 
          type="text"
          placeholder="Pesquisar pedidos..."
          value={busca}
          onChange={(e) => {
            setBusca(e.target.value)
            onSearch(e.target.value)
          }}
          className="w-full h-[40px] pl-10 pr-4 bg-white border border-[#e0e0e0] rounded-[12px] text-[14px] focus:outline-none focus:border-[#1d5358] transition-colors shadow-sm"
        />
      </div>
    </div>
  )
}

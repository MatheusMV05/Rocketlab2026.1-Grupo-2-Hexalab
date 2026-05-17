import { useState, useRef, useEffect } from 'react'
import { Circle, Search } from 'lucide-react'

interface Props {
  label: string
  opcoes: string[]
  valor: string
  onChange: (valor: string) => void
  rotulo?: string
  pesquisavel?: boolean
  overrideado?: boolean
}

export function DropdownFiltro({ label, opcoes, valor, onChange, rotulo, pesquisavel = false, overrideado = false }: Props) {
  const [aberto, setAberto] = useState(false)
  const [pendente, setPendente] = useState(valor)
  const [busca, setBusca] = useState('')
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (aberto) { setPendente(valor); setBusca('') }
  }, [aberto])

  useEffect(() => {
    function fechar(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setAberto(false)
    }
    if (aberto) document.addEventListener('mousedown', fechar)
    return () => document.removeEventListener('mousedown', fechar)
  }, [aberto])

  const nomeLabel = rotulo ?? label

  function aplicar() {
    onChange(pendente)
    setAberto(false)
  }

  function limpar() {
    setPendente('')
  }

  return (
    <div ref={ref} className="relative">
      {/* ── Botão trigger ── */}
      <button
        onClick={() => setAberto((v) => !v)}
        className="flex items-center gap-[5px] h-[30px] px-[10px] bg-white rounded-[4px] text-[14px] whitespace-nowrap focus:outline-none transition-colors"
        style={{ border: `2px solid ${aberto ? '#3f7377' : '#e0e0e0'}` }}
      >
        <span className="font-semibold text-[#262626]">{nomeLabel}:</span>
        <span className={overrideado ? 'text-[#898989]' : (valor ? 'text-[#1d5358]' : 'text-[#262626]')}>
          {overrideado ? '---' : (valor || 'Todos')}
        </span>
        <svg
          width="10" height="6" viewBox="0 0 10 6"
          className="ml-[2px] flex-shrink-0 transition-transform"
          style={{ transform: aberto ? 'rotate(180deg)' : 'none' }}
        >
          <path d="M5 6L0 0H10L5 6Z" fill="#262626" />
        </svg>
      </button>

      {/* ── Painel dropdown ── */}
      {aberto && (
        <div
          className="absolute right-0 top-full mt-[4px] bg-white rounded-[5px] z-[200] flex flex-col"
          style={{
            border: '1px solid #e0e0e0',
            boxShadow: '0 4px 16px rgba(0,0,0,0.10)',
            minWidth: 180,
          }}
        >
          {/* Campo de pesquisa (apenas quando pesquisavel=true) */}
          {pesquisavel && (
            <div className="px-[14px] pt-[10px] pb-[6px]" style={{ borderBottom: '1px solid #e0e0e0' }}>
              <div className="relative">
                <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[#898989] pointer-events-none" strokeWidth={1.5} />
                <input
                  type="text"
                  value={busca}
                  onChange={(e) => setBusca(e.target.value)}
                  placeholder="Buscar..."
                  className="w-full h-[30px] pl-7 pr-3 border border-[#e0e0e0] rounded-[6px] text-[12px] text-[#343434] placeholder-[#898989] focus:outline-none focus:border-[#3f7377]"
                />
              </div>
            </div>
          )}

          {/* Lista com scroll */}
          <div style={{ maxHeight: 240, overflowY: 'auto' }}>
            {!pesquisavel && (
              <Item
                rotulo="Todos"
                selecionado={pendente === ''}
                onClick={() => setPendente('')}
                comSeparador={opcoes.length > 0}
              />
            )}
            {(pesquisavel
              ? opcoes.filter((op) => op.toLowerCase().includes(busca.toLowerCase()))
              : opcoes
            ).map((op, i, arr) => (
              <Item
                key={op}
                rotulo={op}
                selecionado={pendente === op}
                onClick={() => setPendente(op)}
                comSeparador={i < arr.length - 1}
              />
            ))}
          </div>

          {/* ── Botões Limpar / Aplicar ── */}
          <div
            className="flex gap-[10px] px-[18px] py-[12px]"
            style={{ borderTop: '1px solid #e0e0e0' }}
          >
            <button
              onClick={limpar}
              className="flex-1 text-[12px] text-[#3d3d3d] rounded-[8px] transition-colors hover:bg-[#d4d4d4] focus:outline-none"
              style={{ height: 23, background: '#e0e0e0' }}
            >
              Limpar
            </button>
            <button
              onClick={aplicar}
              className={`flex-1 text-[12px] font-medium rounded-[8px] transition-colors focus:outline-none ${
                pendente !== valor
                  ? 'bg-[#1d5358] text-white hover:bg-[#0f292c]'
                  : 'text-[#3d3d3d] hover:bg-[#3f7377] hover:text-white'
              }`}
              style={{ height: 23, background: pendente !== valor ? undefined : '#e0e0e0' }}
            >
              Aplicar
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

// Item do dropdown
interface ItemProps {
  rotulo: string
  selecionado: boolean
  onClick: () => void
  comSeparador: boolean
}

function Item({ rotulo, selecionado, onClick, comSeparador }: ItemProps) {
  return (
    <button
      onClick={onClick}
      className="w-full flex items-center gap-[10px] px-[14px] text-[12px] hover:bg-[#f6f7f9] transition-colors text-left"
      style={{
        height: 39,
        borderBottom: comSeparador ? '1px solid #e0e0e0' : 'none',
      }}
    >
      <span className="flex-shrink-0 flex items-center justify-center" style={{ width: 20, height: 20 }}>
        {selecionado ? (
          <span style={{
            width: 20, height: 20, borderRadius: '50%',
            border: '2px solid #3f7377',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#3f7377' }} />
          </span>
        ) : (
          <Circle size={20} color="#898989" strokeWidth={1.5} />
        )}
      </span>
      <span style={{ color: selecionado ? '#1d5358' : '#262626', fontWeight: selecionado ? 500 : 400 }}>
        {rotulo}
      </span>
    </button>
  )
}

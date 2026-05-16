import { useState, useEffect } from 'react'
import { Search, X } from 'lucide-react'
import { BotaoFiltro } from '../../atoms/compartilhados/BotaoFiltro'
import { useOpcoesFiltro, useSugestoesClientes } from '../../../hooks/useTickets'

export interface FiltrosTickets {
  cliente: string
  clienteId: string
  tipos: string[]
  status: string[]
}

export const FILTROS_TICKETS_VAZIO: FiltrosTickets = {
  cliente: '',
  clienteId: '',
  tipos: [],
  status: [],
}

function toggle<T>(arr: T[], val: T): T[] {
  return arr.includes(val) ? arr.filter((v) => v !== val) : [...arr, val]
}

interface Props {
  valor: FiltrosTickets
  onAplicar: (filtros: FiltrosTickets) => void
}

export function PainelFiltrosTickets({ valor, onAplicar }: Props) {
  const [temp, setTemp] = useState<FiltrosTickets>(valor)
  const [buscaCliente, setBuscaCliente] = useState(valor.cliente)

  useEffect(() => {
    setTemp(valor)
    setBuscaCliente(valor.cliente)
  }, [valor])

  const { data: sugestoes = [] } = useSugestoesClientes(buscaCliente)
  const { data: opcoes } = useOpcoesFiltro()
  const tipos = opcoes?.tipos ?? []
  const statusOpcoes = opcoes?.status ?? []

  const algumPreenchido =
    !!temp.clienteId || temp.tipos.length > 0 || temp.status.length > 0

  function selecionarCliente(nome: string, id: string) {
    setTemp((f) => ({ ...f, cliente: nome, clienteId: id }))
    setBuscaCliente(`${nome} - #${id}`)
  }

  function limparCliente() {
    setTemp((f) => ({ ...f, cliente: '', clienteId: '' }))
    setBuscaCliente('')
  }

  function limpar() {
    setTemp(FILTROS_TICKETS_VAZIO)
    setBuscaCliente('')
  }

  return (
    <div className="border border-[#e0e0e0] rounded-[10px] mx-3 mb-4 flex flex-col shadow-sm flex-shrink-0">
      {/* Cliente */}
      <div className="p-5 flex flex-col gap-3">
        <div>
          <p className="text-[14px] font-bold text-[#111111]">Cliente</p>
          <p className="text-[11px] text-[#898989] font-medium">Digite o nome do cliente que deseja filtrar</p>
        </div>
        <div className="relative">
          <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#343434]" strokeWidth={1.5} />
          <input
            type="text"
            value={buscaCliente}
            onChange={(e) => {
              setBuscaCliente(e.target.value)
              if (temp.clienteId && !e.target.value.includes(temp.clienteId)) {
                setTemp((f) => ({ ...f, cliente: '', clienteId: '' }))
              }
            }}
            placeholder="Buscar cliente..."
            className="w-full h-[46px] pl-11 pr-11 border border-[#b3b3b3] rounded-[12px] text-[14px] text-[#343434] placeholder-[#898989] focus:outline-none focus:border-[#1c5258]"
          />
          {buscaCliente && (
            <button
              onClick={limparCliente}
              className="absolute right-3 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full flex items-center justify-center text-red-500 hover:bg-red-50 transition-colors"
            >
              <X size={16} strokeWidth={2} />
            </button>
          )}
          {buscaCliente.length >= 1 && !temp.clienteId && sugestoes.length > 0 && (
            <div className="absolute top-[calc(100%+4px)] left-0 w-full bg-white border border-[#e0e0e0] rounded-[12px] flex flex-col py-2 shadow-md z-50">
              {sugestoes.map((s) => (
                <button
                  key={s.id}
                  onClick={() => selecionarCliente(s.nome, s.id)}
                  className="text-[14px] text-[#111] hover:bg-[#f6f7f9] px-5 py-2.5 text-left transition-colors"
                >
                  {s.nome} - #{s.id}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="border-t border-[#e0e0e0]" />

      {/* Tipo */}
      <div className="p-5 flex flex-col gap-3">
        <div>
          <p className="text-[14px] font-bold text-[#111111]">Tipo</p>
          <p className="text-[11px] text-[#898989] font-medium">Selecione o tipo do ticket</p>
        </div>
        <div className="flex flex-wrap gap-[10px]">
          {tipos.length === 0 ? (
            <span className="text-[12px] text-[#898989]">Carregando opções...</span>
          ) : (
            tipos.map((t) => (
              <BotaoFiltro
                key={t}
                label={t}
                ativo={temp.tipos.includes(t)}
                onClick={() => setTemp((f) => ({ ...f, tipos: toggle(f.tipos, t) }))}
                variante="solido"
              />
            ))
          )}
        </div>
      </div>

      <div className="border-t border-[#e0e0e0]" />

      {/* Status */}
      <div className="p-5 flex flex-col gap-3">
        <div>
          <p className="text-[14px] font-bold text-[#111111]">Status</p>
          <p className="text-[11px] text-[#898989] font-medium">Selecione o status do ticket</p>
        </div>
        <div className="flex flex-wrap gap-[10px]">
          {statusOpcoes.length === 0 ? (
            <span className="text-[12px] text-[#898989]">Carregando opções...</span>
          ) : (
            statusOpcoes.map((s) => (
              <BotaoFiltro
                key={s}
                label={s}
                ativo={temp.status.includes(s)}
                onClick={() => setTemp((f) => ({ ...f, status: toggle(f.status, s) }))}
                variante="solido"
              />
            ))
          )}
        </div>
      </div>

      {/* Rodapé */}
      <div className="flex justify-end gap-3 p-5 pt-2">
        <button
          onClick={limpar}
          disabled={!algumPreenchido}
          className={`h-[42px] px-6 border-2 rounded-[100px] text-[14px] font-semibold transition-colors ${
            algumPreenchido
              ? 'border-[#1c5258] text-[#1c5258] hover:bg-[#f6f7f9]'
              : 'border-[#e0e0e0] text-[#b3b3b3] cursor-not-allowed'
          }`}
        >
          Limpar filtros
        </button>
        <button
          onClick={() => onAplicar(temp)}
          disabled={!algumPreenchido}
          className={`h-[42px] px-6 rounded-[100px] text-[14px] font-semibold transition-colors ${
            algumPreenchido
              ? 'bg-[#1c5258] text-white hover:bg-[#154247]'
              : 'bg-[#e5ebeb] text-[#b3b3b3] cursor-not-allowed'
          }`}
        >
          Aplicar filtros
        </button>
      </div>
    </div>
  )
}

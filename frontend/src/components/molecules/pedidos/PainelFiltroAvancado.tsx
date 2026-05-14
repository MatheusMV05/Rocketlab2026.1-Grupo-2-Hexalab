import { useState } from 'react'
import { Search } from 'lucide-react'
import { ANOS_FILTRO, MESES_FILTRO } from '../../../constants/opcoesFiltro'

interface Props {
  filtrosAtuais: {
    query?: string
    ano?: string
    mes?: string
    status?: string
  }
  onAplicar: (novosFiltros: { query?: string; ano?: string; mes?: string; status?: string }) => void
  onLimpar: () => void
}

export function PainelFiltroAvancado({ filtrosAtuais, onAplicar, onLimpar }: Props) {
  const [pendente, setPendente] = useState(filtrosAtuais)

  const anos = [...ANOS_FILTRO].reverse()
  const statusOpcoes = ['Atrasado', 'Em risco de atraso', 'Finalizado', 'Aberto']

  return (
    <div className="bg-white border border-[#e0e0e0] rounded-[24px] p-8 shadow-xl animate-in slide-in-from-top-4 duration-300">
      <div className="flex flex-col gap-8">
        
        {/* Produto */}
        <div className="flex flex-col gap-3">
          <label className="text-[14px] font-bold text-[#1d5358]">Produto</label>
          <span className="text-[12px] text-[#898989]">Digite o nome do produto</span>
          <div className="relative">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#898989]" />
            <input 
              type="text"
              placeholder="Buscar..."
              value={pendente.query || ''}
              onChange={(e) => setPendente(p => ({ ...p, query: e.target.value }))}
              className="w-full h-[40px] pl-10 pr-4 bg-white border border-[#e0e0e0] rounded-[12px] text-[14px] focus:outline-none focus:border-[#1d5358] transition-colors"
            />
          </div>
        </div>

        {/* Período */}
        <div className="flex flex-col gap-6">
          <div className="flex flex-col gap-3">
            <label className="text-[14px] font-bold text-[#1d5358]">Período</label>
            <span className="text-[12px] text-[#898989]">Selecione o ano</span>
            <div className="flex flex-wrap gap-2">
              {anos.map(ano => (
                <button
                  key={ano}
                  onClick={() => setPendente(p => ({ ...p, ano: p.ano === ano ? '' : ano }))}
                  className={`px-4 py-1.5 rounded-[8px] text-[13px] font-medium transition-all border ${
                    pendente.ano === ano 
                    ? 'bg-[#1d5358] text-white border-transparent' 
                    : 'bg-white text-[#343434] border-[#e0e0e0] hover:border-[#1d5358]'
                  }`}
                >
                  {ano}
                </button>
              ))}
            </div>
          </div>

          <div className="flex flex-col gap-3">
            <span className="text-[12px] text-[#898989]">Selecione o mês</span>
            <div className="flex flex-wrap gap-2">
              {MESES_FILTRO.map(mes => (
                <button
                  key={mes}
                  onClick={() => setPendente(p => ({ ...p, mes: p.mes === mes ? '' : mes }))}
                  className={`px-4 py-1.5 rounded-[8px] text-[13px] font-medium transition-all border ${
                    pendente.mes === mes 
                    ? 'bg-[#1d5358] text-white border-transparent' 
                    : 'bg-white text-[#343434] border-[#e0e0e0] hover:border-[#1d5358]'
                  }`}
                >
                  {mes}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Status */}
        <div className="flex flex-col gap-3">
          <label className="text-[14px] font-bold text-[#1d5358]">Status</label>
          <span className="text-[12px] text-[#898989]">Selecione o status do pedido</span>
          <div className="flex flex-wrap gap-2">
            {statusOpcoes.map(st => (
              <button
                key={st}
                onClick={() => setPendente(p => ({ ...p, status: p.status === st ? '' : st }))}
                className={`px-4 py-1.5 rounded-[8px] text-[13px] font-medium transition-all border ${
                  pendente.status === st 
                  ? 'bg-[#1d5358] text-white border-transparent' 
                  : 'bg-white text-[#343434] border-[#e0e0e0] hover:border-[#1d5358]'
                }`}
              >
                {st}
              </button>
            ))}
          </div>
        </div>

        {/* Ações */}
        <div className="flex justify-end gap-4 mt-4">
          <button 
            onClick={onLimpar}
            className="px-6 py-2 rounded-[12px] text-[14px] font-semibold text-[#898989] hover:bg-[#f6f7f9] transition-colors"
          >
            Limpar filtros
          </button>
          <button 
            onClick={() => onAplicar(pendente)}
            className="px-6 py-2 rounded-[12px] text-[14px] font-semibold text-white bg-[#1d5358] hover:bg-[#164246] transition-all shadow-md"
          >
            Aplicar filtros
          </button>
        </div>
      </div>
    </div>
  )
}

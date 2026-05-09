import { useState } from 'react'
import {
  Square,
  Search,
  ChevronDown,
  ChevronUp,
  Filter,
  Edit2,
  Upload,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react'
import { BotaoFiltro } from '../atoms/BotaoFiltro'
import { ANOS_FILTRO, MESES_FILTRO, ESTADOS_NOME } from '../../constants/opcoesFiltro'
import { useEntregas } from '../../hooks/useDashboard'

type StatusEntrega = 'hoje' | 'no_prazo' | 'atrasado'

interface FiltroEntregas {
  ano: string
  mes: string
  localidades: string[]
  status: StatusEntrega[]
}

const STATUS_CONFIG: Record<StatusEntrega, { label: string; cor: string }> = {
  hoje: { label: 'Hoje', cor: '#e37405' },
  no_prazo: { label: 'No prazo', cor: '#1a9a45' },
  atrasado: { label: 'Atrasado', cor: '#c20000' },
}


const STATUS_OPCOES: { valor: StatusEntrega; label: string }[] = [
  { valor: 'atrasado', label: 'Atrasado' },
  { valor: 'no_prazo', label: 'No prazo' },
  { valor: 'hoje', label: 'Hoje' },
]

const FILTRO_VAZIO: FiltroEntregas = { ano: '', mes: '', localidades: [], status: [] }


function toggle<T>(arr: T[], val: T): T[] {
  return arr.includes(val) ? arr.filter((v) => v !== val) : [...arr, val]
}

export function ListaEntregas() {
  const [paginaAtual, setPaginaAtual] = useState(1)
  const [filtroAberto, setFiltroAberto] = useState(false)
  const [filtro, setFiltro] = useState<FiltroEntregas>(FILTRO_VAZIO)
  const [filtroTemp, setFiltroTemp] = useState<FiltroEntregas>(FILTRO_VAZIO)

  const { data, isLoading, isError } = useEntregas(paginaAtual)
  const entregas = data?.items ?? []
  const totalPaginas = data?.total_paginas ?? 1

  function abrirFiltro() {
    setFiltroTemp(filtro)
    setFiltroAberto(true)
  }

  function fecharFiltro() {
    setFiltroAberto(false)
  }

  function limpar() {
    setFiltroTemp(FILTRO_VAZIO)
  }

  function aplicar() {
    setFiltro(filtroTemp)
    setFiltroAberto(false)
  }

  return (
    <div className="bg-white border-2 border-[#e0e0e0] rounded-[10px] p-[10px] flex flex-col gap-3 w-full">
      {/* Título */}
      <div className="py-[10px] px-[6px]">
        <h3 className="text-[18px] font-bold text-[#1d5358]">Entregas</h3>
      </div>

      {/* Barra de ferramentas */}
      <div className="flex items-center justify-between px-[15px]">
        <div className="flex items-center gap-3">
          <button
            onClick={filtroAberto ? fecharFiltro : abrirFiltro}
            className={`flex items-center gap-2 rounded-[24px] px-5 py-3 text-[14px] font-semibold whitespace-nowrap transition-colors ${
              filtroAberto
                ? 'bg-[#dde5e6] text-[#1d5358]'
                : 'bg-[#f6f7f9] text-black hover:bg-[#dde5e6]'
            }`}
          >
            <span>Organizar Lista</span>
            {filtroAberto ? (
              <ChevronUp size={14} strokeWidth={2} />
            ) : (
              <ChevronDown size={14} strokeWidth={2} />
            )}
          </button>
          <button className="flex items-center justify-center w-10 h-10 bg-[#f6f7f9] rounded-full hover:bg-[#dde5e6] transition-colors text-[#4d4d4d]">
            <Search size={18} strokeWidth={1.5} />
          </button>
        </div>

        <div className="flex items-center gap-1">
          <button className="flex items-center justify-center w-10 h-10 bg-[#f6f7f9] rounded-full hover:bg-[#dde5e6] transition-colors text-[#4d4d4d]">
            <Edit2 size={18} strokeWidth={1.5} />
          </button>
          <button className="flex items-center justify-center w-10 h-10 bg-[#f6f7f9] rounded-full hover:bg-[#dde5e6] transition-colors text-[#4d4d4d]">
            <Filter size={18} strokeWidth={1.5} />
          </button>
          <button className="flex items-center justify-center w-10 h-10 bg-[#f6f7f9] rounded-[20px] text-[#4d4d4d] opacity-40 cursor-not-allowed">
            <Upload size={18} strokeWidth={1.5} />
          </button>
        </div>
      </div>

      {/* Painel de filtros (expansível) */}
      {filtroAberto && (
        <div className="border-2 border-[#e0e0e0] rounded-[10px] p-[10px] flex flex-col gap-4">
          {/* Data (Ano + Mês) — agrupados sob o mesmo título conforme Figma */}
          <div className="flex flex-col gap-[10px] p-[10px]">
            <div>
              <p className="text-[14px] font-semibold text-[#343434]">Data</p>
              <p className="text-[10px] text-[#71717a]">Selecione o ano desejado</p>
            </div>
            <div className="flex flex-wrap gap-3">
              {ANOS_FILTRO.map((ano) => (
                <BotaoFiltro
                  key={ano}
                  label={ano}
                  ativo={filtroTemp.ano === ano}
                  onClick={() =>
                    setFiltroTemp((f) => ({ ...f, ano: f.ano === ano ? '' : ano, mes: '' }))
                  }
                />
              ))}
            </div>

            {/* Mês: aparece condicionalmente dentro da seção Data */}
            {filtroTemp.ano && (
              <div className="flex flex-col gap-2">
                <p className="text-[10px] text-[#71717a]">
                  Selecione o mês de "{filtroTemp.ano}"
                </p>
                <div className="flex flex-wrap gap-3">
                  {MESES_FILTRO.map((mes) => (
                    <BotaoFiltro
                      key={mes}
                      label={mes}
                      ativo={filtroTemp.mes === mes}
                      onClick={() =>
                        setFiltroTemp((f) => ({ ...f, mes: f.mes === mes ? '' : mes }))
                      }
                    />
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Divisor */}
          <div className="border-t border-[#e0e0e0] mx-2" />

          {/* Localização */}
          <div className="flex flex-col gap-[10px] p-[10px]">
            <div>
              <p className="text-[14px] font-semibold text-[#343434]">Localização</p>
              <p className="text-[10px] text-[#71717a]">Selecione a localização desejada</p>
            </div>
            <div className="flex flex-wrap gap-3">
              {ESTADOS_NOME.map((estado) => (
                <BotaoFiltro
                  key={estado}
                  label={estado}
                  ativo={filtroTemp.localidades.includes(estado)}
                  onClick={() =>
                    setFiltroTemp((f) => ({
                      ...f,
                      localidades: toggle(f.localidades, estado),
                    }))
                  }
                />
              ))}
            </div>
          </div>

          {/* Divisor */}
          <div className="border-t border-[#e0e0e0] mx-2" />

          {/* Status de entrega */}
          <div className="flex flex-col gap-[10px] p-[10px]">
            <div>
              <p className="text-[14px] font-semibold text-[#343434]">Status de entrega</p>
              <p className="text-[10px] text-[#71717a]">Selecione o status</p>
            </div>
            <div className="flex gap-3">
              {STATUS_OPCOES.map(({ valor, label }) => (
                <BotaoFiltro
                  key={valor}
                  label={label}
                  ativo={filtroTemp.status.includes(valor)}
                  onClick={() =>
                    setFiltroTemp((f) => ({
                      ...f,
                      status: toggle(f.status, valor),
                    }))
                  }
                />
              ))}
            </div>
          </div>

          {/* Divisor */}
          <div className="border-t border-[#e0e0e0] mx-2" />

          {/* Footer: Limpar + Aplicar */}
          <div className="flex gap-[10px] items-center p-2">
            <button
              onClick={limpar}
              className="flex items-center justify-center h-[39px] px-5 bg-[#e0e0e0] rounded-[100px] text-[14px] text-[#3d3d3d] hover:bg-[#c8c8c8] transition-colors"
            >
              Limpar
            </button>
            <button
              onClick={aplicar}
              className="flex items-center justify-center h-[39px] px-5 bg-[#3f7377] rounded-[100px] text-[14px] text-white hover:bg-[#1d5358] transition-colors"
            >
              Aplicar
            </button>
          </div>
        </div>
      )}

      {/* Divisor */}
      <div className="border-t border-[#e0e0e0] mx-1" />

      {/* Cabeçalho da tabela */}
      <div className="bg-[#f6f7f9] rounded-[10px] flex items-center gap-[6px] pl-[6px] pr-5 py-[10px]">
        <div className="w-6 shrink-0">
          <Square size={16} strokeWidth={1.5} className="text-[#1d5358]" />
        </div>
        <span className="text-[14px] font-semibold text-[#1d5358] w-[200px] shrink-0">Pedido</span>
        <span className="text-[14px] font-semibold text-[#1d5358] flex-1">Cliente</span>
        <span className="text-[14px] font-semibold text-[#1d5358] w-[160px] shrink-0">Status</span>
        <span className="text-[14px] font-semibold text-[#1d5358] w-[120px] shrink-0 text-right">Prazo</span>
      </div>

      {/* Divisor */}
      <div className="border-t border-[#e0e0e0] mx-1" />

      {/* Linhas da tabela */}
      {isLoading && (
        <div className="flex items-center justify-center py-8 text-[#4d4d4d] text-sm">
          Carregando...
        </div>
      )}
      {isError && (
        <div className="flex items-center justify-center py-8 text-[#c20000] text-sm">
          Erro ao carregar entregas
        </div>
      )}
      {!isLoading && !isError && entregas.map((entrega, idx) => {
        const cfg = STATUS_CONFIG[entrega.status as StatusEntrega] ?? { label: entrega.status, cor: '#4d4d4d' }
        return (
          <div key={entrega.id}>
            <div className="flex items-center gap-[6px] pl-[6px] py-[10px]">
              <div className="w-6 shrink-0">
                <Square size={16} strokeWidth={1.5} className="text-[#4d4d4d]" />
              </div>
              <span className="text-[14px] font-medium text-[#343434] w-[200px] shrink-0">
                {entrega.id}
              </span>
              <span className="text-[14px] font-medium text-[#343434] flex-1">
                {entrega.cliente}
              </span>
              <div className="flex items-center gap-2 w-[160px] shrink-0">
                <span
                  className="inline-block w-[10px] h-[10px] rounded-full shrink-0"
                  style={{ backgroundColor: cfg.cor }}
                />
                <span className="text-[14px] font-medium text-[#343434]">{cfg.label}</span>
              </div>
              <span className="text-[14px] font-medium text-[#343434] w-[120px] shrink-0 text-right">
                {entrega.prazo}
              </span>
            </div>
            {idx < entregas.length - 1 && (
              <div className="border-t border-[#e0e0e0] mx-1" />
            )}
          </div>
        )
      })}

      {/* Paginação */}
      <div className="flex items-center justify-center gap-[10px] p-[10px]">
        <button
          className="flex items-center justify-center w-6 h-6 text-[#4d4d4d] hover:text-[#3f7377] transition-colors disabled:opacity-30"
          onClick={() => setPaginaAtual((p) => Math.max(1, p - 1))}
          disabled={paginaAtual === 1}
        >
          <ChevronLeft size={18} />
        </button>

        {Array.from({ length: totalPaginas }, (_, i) => i + 1).map((p) => (
          <button
            key={p}
            className={`flex items-center justify-center w-7 h-7 rounded-[5px] text-[14px] font-medium transition-colors ${
              p === paginaAtual
                ? 'bg-[#e0e0e0] text-[#343434]'
                : 'text-[#343434] hover:bg-[#f6f7f9]'
            }`}
            onClick={() => setPaginaAtual(p)}
          >
            {String(p).padStart(2, '0')}
          </button>
        ))}

        <button
          className="flex items-center justify-center w-6 h-6 text-[#4d4d4d] hover:text-[#3f7377] transition-colors disabled:opacity-30"
          onClick={() => setPaginaAtual((p) => Math.min(totalPaginas, p + 1))}
          disabled={paginaAtual === totalPaginas}
        >
          <ChevronRight size={18} />
        </button>
      </div>
    </div>
  )
}

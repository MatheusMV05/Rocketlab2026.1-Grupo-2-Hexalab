import { useState, useRef, useEffect } from 'react'
import {
  Square,
  CheckSquare,
  Search,
  ChevronDown,
  Filter,
  Edit2,
  Upload,
  ArrowRight,
  X,
} from 'lucide-react'
import { BotaoFiltro } from '../../atoms/compartilhados/BotaoFiltro'
import { ANOS_FILTRO, MESES_FILTRO, ESTADOS_NOME } from '../../../constants/opcoesFiltro'
import { useEntregas, useAtualizarEntrega } from '../../../hooks/useDashboard'

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

interface EdicaoEntrega {
  idPedido: string
  cliente: string
  status: string
  dia: string
  mes: string
  ano: string
}

const FILTRO_VAZIO: FiltroEntregas = { ano: '', mes: '', localidades: [], status: [] }

const DIAS = Array.from({ length: 31 }, (_, i) => String(i + 1).padStart(2, '0'))
const MESES_PRAZO = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
]
const ANOS_PRAZO = Array.from({ length: 10 }, (_, i) => String(2025 + i))

function toggle<T>(arr: T[], val: T): T[] {
  return arr.includes(val) ? arr.filter((v) => v !== val) : [...arr, val]
}

export function ListaEntregas() {
  const [paginaAtual, setPaginaAtual] = useState(1)
  const [filtroAberto, setFiltroAberto] = useState(false)
  const [filtro, setFiltro] = useState<FiltroEntregas>(FILTRO_VAZIO)
  const [filtroTemp, setFiltroTemp] = useState<FiltroEntregas>(FILTRO_VAZIO)
  const [buscaLocalidade, setBuscaLocalidade] = useState('')
  const [selecionados, setSelecionados] = useState<string[]>([])
  const [ordenacaoAberta, setOrdenacaoAberta] = useState(false)
  const [ordenacao, setOrdenacao] = useState<'recentes' | 'antigos'>('recentes')
  const [modalEdicaoAberto, setModalEdicaoAberto] = useState(false)
  const [edicao, setEdicao] = useState<EdicaoEntrega>({
    idPedido: '', cliente: '', status: '', dia: '', mes: '', ano: '',
  })
  const ordenacaoRef = useRef<HTMLDivElement>(null)

  const filtrosApi = {
    status: filtro.status.length > 0 ? filtro.status : undefined,
    ano: filtro.ano || undefined,
    mes: filtro.mes || undefined,
  }

  const { data, isLoading, isError } = useEntregas(paginaAtual, filtrosApi)
  const atualizarEntrega = useAtualizarEntrega()
  const entregas = data?.items ?? []
  const totalPaginas = data?.total_paginas ?? 1

  useEffect(() => {
    function handleClickFora(e: MouseEvent) {
      if (ordenacaoRef.current && !ordenacaoRef.current.contains(e.target as Node)) {
        setOrdenacaoAberta(false)
      }
    }
    document.addEventListener('mousedown', handleClickFora)
    return () => document.removeEventListener('mousedown', handleClickFora)
  }, [])

  function abrirFiltro() {
    setFiltroTemp(filtro)
    setFiltroAberto(true)
  }

  function fecharFiltro() {
    setFiltroAberto(false)
    setBuscaLocalidade('')
  }

  function limpar() {
    setFiltroTemp(FILTRO_VAZIO)
    setBuscaLocalidade('')
  }

  function aplicar() {
    setFiltro(filtroTemp)
    setPaginaAtual(1)
    setFiltroAberto(false)
  }

  function toggleSelecionado(id: string) {
    setSelecionados((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    )
  }

  function toggleTodos() {
    if (selecionados.length === entregas.length && entregas.length > 0) {
      setSelecionados([])
    } else {
      setSelecionados(entregas.map((e) => e.id))
    }
  }

  function abrirModalEdicao() {
    if (selecionados.length === 0) return
    const primeira = entregas.find((e) => e.id === selecionados[0])
    setEdicao({
      idPedido: primeira?.id ?? '',
      cliente: primeira?.cliente ?? '',
      status: primeira?.status ?? '',
      dia: '', mes: '', ano: '',
    })
    setModalEdicaoAberto(true)
  }

  const MESES_PRAZO_NUM: Record<string, string> = {
    Janeiro: '01', Fevereiro: '02', Março: '03', Abril: '04',
    Maio: '05', Junho: '06', Julho: '07', Agosto: '08',
    Setembro: '09', Outubro: '10', Novembro: '11', Dezembro: '12',
  }

  function aplicarEdicao() {
    const prazoFormatado =
      edicao.dia && edicao.mes && edicao.ano
        ? `${edicao.dia}/${MESES_PRAZO_NUM[edicao.mes] ?? ''}/${edicao.ano}`
        : undefined

    const dados: { cliente?: string; status?: string; prazo?: string } = {}
    if (edicao.cliente) dados.cliente = edicao.cliente
    if (edicao.status) dados.status = edicao.status
    if (prazoFormatado) dados.prazo = prazoFormatado

    Promise.all(selecionados.map((id) => atualizarEntrega.mutateAsync({ id, dados }))).then(() => {
      setModalEdicaoAberto(false)
      setSelecionados([])
    })
  }

  const todosSelecionados = entregas.length > 0 && selecionados.length === entregas.length

  return (
    <>
    <div className="bg-white border-2 border-[#e0e0e0] rounded-[10px] p-[10px] flex flex-col gap-3 w-full">
      {/* Título */}
      <div className="py-[10px] px-[6px]">
        <h3 className="text-[18px] font-bold text-[#1d5358]">Entregas</h3>
      </div>

      {/* Barra de ferramentas */}
      <div className="flex items-center justify-between px-[15px]">
        <div className="flex items-center gap-3">
          {/* Organizar Lista — apenas ordenação */}
          <div className="relative" ref={ordenacaoRef}>
            <button
              onClick={() => setOrdenacaoAberta((o) => !o)}
              className={`flex items-center gap-2 rounded-[24px] px-5 py-3 text-[14px] font-semibold whitespace-nowrap transition-colors ${
                ordenacaoAberta
                  ? 'bg-[#dde5e6] text-[#1d5358]'
                  : 'bg-[#f6f7f9] text-black hover:bg-[#dde5e6]'
              }`}
            >
              <span>Organizar Lista</span>
              <ChevronDown
                size={14}
                strokeWidth={2}
                className={`transition-transform ${ordenacaoAberta ? 'rotate-180' : ''}`}
              />
            </button>

            {ordenacaoAberta && (
              <div className="absolute top-[calc(100%+6px)] left-0 z-20 bg-white border border-[#e0e0e0] rounded-[10px] shadow-md min-w-[160px] overflow-hidden">
                {(['recentes', 'antigos'] as const).map((tipo) => (
                  <button
                    key={tipo}
                    onClick={() => {
                      setOrdenacao(tipo)
                      setOrdenacaoAberta(false)
                    }}
                    className={`w-full text-left px-4 py-3 text-[13px] transition-colors hover:bg-[#f6f7f9] ${
                      ordenacao === tipo ? 'text-[#1d5358] font-semibold' : 'text-[#343434]'
                    }`}
                  >
                    {tipo === 'recentes' ? 'Mais recentes' : 'Mais antigos'}
                  </button>
                ))}
              </div>
            )}
          </div>

          <button className="flex items-center justify-center w-10 h-10 bg-[#f6f7f9] rounded-full hover:bg-[#dde5e6] transition-colors text-[#4d4d4d]">
            <Search size={18} strokeWidth={1.5} />
          </button>
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={abrirModalEdicao}
            disabled={selecionados.length === 0}
            className={`flex items-center justify-center w-10 h-10 rounded-full transition-colors ${
              selecionados.length > 0
                ? 'bg-[#f6f7f9] text-[#4d4d4d] hover:bg-[#dde5e6]'
                : 'bg-[#f6f7f9] text-[#4d4d4d] opacity-40 cursor-not-allowed'
            }`}
          >
            <Edit2 size={18} strokeWidth={1.5} />
          </button>

          {/* Botão Filtro — muda de cor quando o painel está aberto */}
          <button
            onClick={filtroAberto ? fecharFiltro : abrirFiltro}
            className={`flex items-center justify-center w-10 h-10 rounded-full transition-colors ${
              filtroAberto
                ? 'bg-[#1d5358] text-white'
                : 'bg-[#f6f7f9] text-[#4d4d4d] hover:bg-[#dde5e6]'
            }`}
          >
            <Filter size={18} strokeWidth={1.5} />
          </button>

          <button className="flex items-center justify-center w-10 h-10 bg-[#f6f7f9] rounded-[20px] text-[#4d4d4d] opacity-40 cursor-not-allowed">
            <Upload size={18} strokeWidth={1.5} />
          </button>
        </div>
      </div>

      {/* Chips de filtros ativos */}
      {!filtroAberto && (filtro.ano || filtro.localidades.length > 0 || filtro.status.length > 0) && (
        <div className="flex items-center justify-between gap-3 px-[6px] flex-wrap">
          <div className="flex items-center gap-2 flex-wrap">
            {filtro.ano && (
              <span className="flex items-center gap-[12px] border-2 border-black rounded-[10px] p-[10px] text-[12px] text-black font-normal">
                {filtro.ano}
                <button onClick={() => setFiltro((f) => ({ ...f, ano: '', mes: '' }))}><X size={16} strokeWidth={2} /></button>
              </span>
            )}
            {filtro.mes && (
              <span className="flex items-center gap-[12px] border-2 border-black rounded-[10px] p-[10px] text-[12px] text-black font-normal uppercase">
                {filtro.mes}
                <button onClick={() => setFiltro((f) => ({ ...f, mes: '' }))}><X size={16} strokeWidth={2} /></button>
              </span>
            )}
            {filtro.localidades.map((loc) => (
              <span key={loc} className="flex items-center gap-[12px] border-2 border-black rounded-[10px] p-[10px] text-[12px] text-black font-normal">
                {loc}
                <button onClick={() => setFiltro((f) => ({ ...f, localidades: f.localidades.filter((l) => l !== loc) }))}><X size={16} strokeWidth={2} /></button>
              </span>
            ))}
            {filtro.status.map((s) => (
              <span key={s} className="flex items-center gap-[12px] border-2 border-black rounded-[10px] p-[10px] text-[12px] text-black font-normal">
                {STATUS_CONFIG[s]?.label ?? s}
                <button onClick={() => setFiltro((f) => ({ ...f, status: f.status.filter((x) => x !== s) }))}><X size={16} strokeWidth={2} /></button>
              </span>
            ))}
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => { setFiltro(FILTRO_VAZIO); setPaginaAtual(1) }}
              className="h-[32px] px-4 border border-[#d1d5db] rounded-full text-[12px] text-[#343434] hover:bg-[#f6f7f9] transition-colors whitespace-nowrap"
            >
              Limpar filtros
            </button>
            <button
              onClick={abrirFiltro}
              className="h-[32px] px-4 border border-[#d1d5db] rounded-full text-[12px] text-[#343434] hover:bg-[#f6f7f9] transition-colors whitespace-nowrap"
            >
              Editar filtros
            </button>
          </div>
        </div>
      )}

      {/* Painel de filtros (expansível) */}
      {filtroAberto && (
        <div className="border-2 border-[#e0e0e0] rounded-[10px] p-[10px] flex flex-col gap-4">
          {/* Data */}
          <div className="flex flex-col gap-[10px] p-[10px]">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-[14px] font-semibold text-[#343434]">Data</p>
                <p className="text-[10px] text-[#71717a]">Selecione o ano desejado</p>
              </div>
              {(filtroTemp.ano || filtroTemp.mes) && (
                <button
                  onClick={() => setFiltroTemp((f) => ({ ...f, ano: '', mes: '' }))}
                  className="text-[11px] text-[#3f7377] hover:underline whitespace-nowrap mt-0.5"
                >
                  Limpar
                </button>
              )}
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

          <div className="border-t border-[#e0e0e0] mx-2" />

          {/* Localização */}
          <div className="flex flex-col gap-[10px] p-[10px]">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-[14px] font-semibold text-[#343434]">Localização</p>
                <p className="text-[10px] text-[#71717a]">Escolha a localização desejada</p>
              </div>
              {filtroTemp.localidades.length > 0 && (
                <button
                  onClick={() => setFiltroTemp((f) => ({ ...f, localidades: [] }))}
                  className="text-[11px] text-[#3f7377] hover:underline whitespace-nowrap mt-0.5"
                >
                  Limpar
                </button>
              )}
            </div>
            <div className="relative">
              <Search
                size={16}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-[#898989] pointer-events-none"
                strokeWidth={1.5}
              />
              <input
                type="text"
                value={buscaLocalidade}
                onChange={(e) => setBuscaLocalidade(e.target.value)}
                placeholder="Buscar..."
                className="w-full h-[42px] pl-9 pr-4 border border-[#e0e0e0] rounded-[8px] text-[13px] text-[#343434] placeholder-[#898989] focus:outline-none focus:border-[#3f7377]"
              />
            </div>
            {buscaLocalidade && (
              <div className="flex flex-wrap gap-3 max-h-[140px] overflow-y-auto">
                {ESTADOS_NOME.filter((e) =>
                  e.toLowerCase().includes(buscaLocalidade.toLowerCase())
                ).map((estado) => (
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
            )}
            {filtroTemp.localidades.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {filtroTemp.localidades.map((loc) => (
                  <span
                    key={loc}
                    className="flex items-center gap-1 px-3 py-1 bg-[#dde5e6] text-[#1d5358] text-[12px] rounded-full"
                  >
                    {loc}
                    <button
                      onClick={() =>
                        setFiltroTemp((f) => ({
                          ...f,
                          localidades: f.localidades.filter((l) => l !== loc),
                        }))
                      }
                      className="ml-1 hover:text-[#c20000] transition-colors"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          <div className="border-t border-[#e0e0e0] mx-2" />

          {/* Status de entrega */}
          <div className="flex flex-col gap-[10px] p-[10px]">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-[14px] font-semibold text-[#343434]">Status de entrega</p>
                <p className="text-[10px] text-[#71717a]">Selecione o status</p>
              </div>
              {filtroTemp.status.length > 0 && (
                <button
                  onClick={() => setFiltroTemp((f) => ({ ...f, status: [] }))}
                  className="text-[11px] text-[#3f7377] hover:underline whitespace-nowrap mt-0.5"
                >
                  Limpar
                </button>
              )}
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

          <div className="border-t border-[#e0e0e0] mx-2" />

          {/* Footer */}
          <div className="flex gap-[10px] items-center justify-end p-2">
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
        <button className="w-6 shrink-0" onClick={toggleTodos}>
          {todosSelecionados ? (
            <CheckSquare size={16} strokeWidth={1.5} className="text-[#1d5358]" />
          ) : (
            <Square size={16} strokeWidth={1.5} className="text-[#1d5358]" />
          )}
        </button>
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
      {!isLoading &&
        !isError &&
        entregas.map((entrega, idx) => {
          const cfg = STATUS_CONFIG[entrega.status as StatusEntrega] ?? {
            label: entrega.status,
            cor: '#4d4d4d',
          }
          const selecionado = selecionados.includes(entrega.id)
          return (
            <div key={entrega.id}>
              <div
                className={`flex items-center gap-[6px] pl-[6px] py-[10px] rounded-[8px] cursor-pointer transition-colors ${
                  selecionado ? 'bg-[#f0f5f5]' : 'hover:bg-[#f6f7f9]'
                }`}
                onClick={() => toggleSelecionado(entrega.id)}
              >
                <div className="w-6 shrink-0">
                  {selecionado ? (
                    <CheckSquare size={16} strokeWidth={1.5} className="text-[#1d5358]" />
                  ) : (
                    <Square size={16} strokeWidth={1.5} className="text-[#4d4d4d]" />
                  )}
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
              {idx < entregas.length - 1 && <div className="border-t border-[#e0e0e0] mx-1" />}
            </div>
          )
        })}

      {/* Paginação */}
      <div className="flex items-center justify-center gap-[10px] p-[10px]">
        <button
          className="flex items-center justify-center w-7 h-7 rounded-full border border-[#e0e0e0] text-[#4d4d4d] hover:bg-[#dde5e6] hover:border-[#3f7377] hover:text-[#3f7377] transition-colors disabled:opacity-30"
          onClick={() => setPaginaAtual((p) => Math.max(1, p - 1))}
          disabled={paginaAtual === 1}
        >
          <ArrowRight size={14} strokeWidth={2} className="rotate-180" />
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
          className="flex items-center justify-center w-7 h-7 rounded-full border border-[#e0e0e0] text-[#4d4d4d] hover:bg-[#dde5e6] hover:border-[#3f7377] hover:text-[#3f7377] transition-colors disabled:opacity-30"
          onClick={() => setPaginaAtual((p) => Math.min(totalPaginas, p + 1))}
          disabled={paginaAtual === totalPaginas}
        >
          <ArrowRight size={14} strokeWidth={2} />
        </button>
      </div>
    </div>

      {/* Modal de edição */}
      {modalEdicaoAberto && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-[2px]"
          onClick={(e) => { if (e.target === e.currentTarget) setModalEdicaoAberto(false) }}
        >
          <div className="bg-white rounded-[16px] shadow-xl w-full max-w-[380px] mx-4 flex flex-col gap-5 p-6 relative">
            <button
              onClick={() => setModalEdicaoAberto(false)}
              className="absolute top-4 right-4 w-7 h-7 flex items-center justify-center rounded-full hover:bg-[#f6f7f9] text-[#4d4d4d] transition-colors"
            >
              <X size={16} strokeWidth={2} />
            </button>

            <h2 className="text-[16px] font-semibold text-[#1d5358] text-center pr-6">
              Edição de entregas selecionadas ({String(selecionados.length).padStart(2, '0')})
            </h2>

            <div className="flex flex-col gap-4">
              {/* ID do pedido */}
              <div className="flex flex-col gap-1">
                <label className="text-[12px] font-medium text-[#343434]">ID do pedido</label>
                <input
                  type="text"
                  value={edicao.idPedido}
                  onChange={(e) => setEdicao((ed) => ({ ...ed, idPedido: e.target.value }))}
                  className="h-[42px] px-3 border border-[#d1d5db] rounded-[8px] text-[14px] text-[#343434] focus:outline-none focus:border-[#3f7377]"
                />
              </div>

              {/* Cliente */}
              <div className="flex flex-col gap-1">
                <label className="text-[12px] font-medium text-[#343434]">Cliente</label>
                <input
                  type="text"
                  value={edicao.cliente}
                  onChange={(e) => setEdicao((ed) => ({ ...ed, cliente: e.target.value }))}
                  className="h-[42px] px-3 border border-[#d1d5db] rounded-[8px] text-[14px] text-[#343434] focus:outline-none focus:border-[#3f7377]"
                />
              </div>

              {/* Status */}
              <div className="flex flex-col gap-1">
                <label className="text-[12px] font-medium text-[#343434]">Status</label>
                <div className="relative">
                  <select
                    value={edicao.status}
                    onChange={(e) => setEdicao((ed) => ({ ...ed, status: e.target.value }))}
                    className="appearance-none w-full h-[42px] pl-3 pr-8 border border-[#d1d5db] rounded-[8px] text-[14px] text-[#343434] bg-white focus:outline-none focus:border-[#3f7377] cursor-pointer"
                  >
                    <option value="">Status</option>
                    {STATUS_OPCOES.map(({ valor, label }) => (
                      <option key={valor} value={valor}>{label}</option>
                    ))}
                  </select>
                  <ChevronDown size={14} strokeWidth={2} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#4d4d4d] pointer-events-none" />
                </div>
              </div>

              {/* Prazo */}
              <div className="flex flex-col gap-1">
                <label className="text-[12px] font-medium text-[#343434]">Prazo</label>
                <div className="grid grid-cols-3 gap-2">
                  {/* Dia */}
                  <div className="relative">
                    <select
                      value={edicao.dia}
                      onChange={(e) => setEdicao((ed) => ({ ...ed, dia: e.target.value }))}
                      className="appearance-none w-full h-[38px] pl-3 pr-7 border border-[#d1d5db] rounded-[8px] text-[13px] text-[#343434] bg-white focus:outline-none focus:border-[#3f7377] cursor-pointer"
                    >
                      <option value="">Dia</option>
                      {DIAS.map((d) => <option key={d} value={d}>{d}</option>)}
                    </select>
                    <ChevronDown size={12} strokeWidth={2} className="absolute right-2 top-1/2 -translate-y-1/2 text-[#4d4d4d] pointer-events-none" />
                  </div>
                  {/* Mês */}
                  <div className="relative">
                    <select
                      value={edicao.mes}
                      onChange={(e) => setEdicao((ed) => ({ ...ed, mes: e.target.value }))}
                      className="appearance-none w-full h-[38px] pl-3 pr-7 border border-[#d1d5db] rounded-[8px] text-[13px] text-[#343434] bg-white focus:outline-none focus:border-[#3f7377] cursor-pointer"
                    >
                      <option value="">Mês</option>
                      {MESES_PRAZO.map((m) => <option key={m} value={m}>{m}</option>)}
                    </select>
                    <ChevronDown size={12} strokeWidth={2} className="absolute right-2 top-1/2 -translate-y-1/2 text-[#4d4d4d] pointer-events-none" />
                  </div>
                  {/* Ano */}
                  <div className="relative">
                    <select
                      value={edicao.ano}
                      onChange={(e) => setEdicao((ed) => ({ ...ed, ano: e.target.value }))}
                      className="appearance-none w-full h-[38px] pl-3 pr-7 border border-[#d1d5db] rounded-[8px] text-[13px] text-[#343434] bg-white focus:outline-none focus:border-[#3f7377] cursor-pointer"
                    >
                      <option value="">Ano</option>
                      {ANOS_PRAZO.map((a) => <option key={a} value={a}>{a}</option>)}
                    </select>
                    <ChevronDown size={12} strokeWidth={2} className="absolute right-2 top-1/2 -translate-y-1/2 text-[#4d4d4d] pointer-events-none" />
                  </div>
                </div>
              </div>
            </div>

            {/* Ações */}
            <div className="flex items-center justify-end gap-3 pt-1">
              <button
                onClick={aplicarEdicao}
                className="h-[39px] px-5 bg-[#3f7377] rounded-[100px] text-[14px] font-medium text-white hover:bg-[#1d5358] transition-colors"
              >
                Aplicar
              </button>
              <button
                onClick={() => setModalEdicaoAberto(false)}
                className="h-[39px] px-5 border border-[#d1d5db] rounded-[100px] text-[14px] font-medium text-[#343434] hover:bg-[#f6f7f9] transition-colors"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

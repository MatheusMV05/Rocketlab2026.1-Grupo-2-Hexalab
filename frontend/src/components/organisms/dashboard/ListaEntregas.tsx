import React, { useState, useRef, useEffect } from 'react'
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

type StatusEntrega = 'Entregue' | 'Em Processamento' | 'Reembolsado' | 'Cancelado'

interface FiltroEntregas {
  ano: string
  mes: string
  localidades: string[]
  status: StatusEntrega[]
}

const STATUS_CONFIG: Record<StatusEntrega, { label: string; cor: string }> = {
  'Entregue':        { label: 'Entregue',        cor: '#1a9a45' },
  'Em Processamento':{ label: 'Em Processamento', cor: '#e37405' },
  'Reembolsado':     { label: 'Reembolsado',      cor: '#3f7377' },
  'Cancelado':       { label: 'Cancelado',         cor: '#c20000' },
}

const STATUS_OPCOES: { valor: StatusEntrega; label: string }[] = [
  { valor: 'Entregue',         label: 'Entregue' },
  { valor: 'Em Processamento', label: 'Em Processamento' },
  { valor: 'Reembolsado',      label: 'Reembolsado' },
  { valor: 'Cancelado',        label: 'Cancelado' },
]

interface EdicaoEntrega {
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
  const [ordenacao, setOrdenacao] = useState<'recentes' | 'antigos' | 'cliente_az' | 'cliente_za'>('recentes')
  const [searchAberto, setSearchAberto] = useState(false)
  const [buscaInput, setBuscaInput] = useState('')
  const [buscaCliente, setBuscaCliente] = useState('')
  const [modalEdicaoAberto, setModalEdicaoAberto] = useState(false)
  const [edicao, setEdicao] = useState<EdicaoEntrega>({
    cliente: '', status: '', dia: '', mes: '', ano: '',
  })
  const [exportDropdownAberto, setExportDropdownAberto] = useState(false)
  const ordenacaoRef = useRef<HTMLDivElement>(null)
  const searchInputRef = useRef<HTMLInputElement>(null)
  const exportDropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const t = setTimeout(() => {
      setBuscaCliente(buscaInput.trim())
      setPaginaAtual(1)
    }, 400)
    return () => clearTimeout(t)
  }, [buscaInput])

  useEffect(() => {
    if (searchAberto) searchInputRef.current?.focus()
  }, [searchAberto])

  const filtrosApi = {
    status: filtro.status.length > 0 ? filtro.status : undefined,
    ano: filtro.ano || undefined,
    mes: filtro.mes || undefined,
    busca: buscaCliente || undefined,
  }

  const { data, isLoading, isError } = useEntregas(paginaAtual, filtrosApi, 10, ordenacao)
  const atualizarEntrega = useAtualizarEntrega()

  function exportarCsv() {
    const params = new URLSearchParams()
    const ordemMap: Record<string, string> = { recentes: 'desc', antigos: 'asc', cliente_az: 'cliente_az', cliente_za: 'cliente_za' }
    params.set('ordem', ordemMap[ordenacao] ?? 'desc')
    filtrosApi.status?.forEach((s) => params.append('status', s))
    if (filtrosApi.ano) params.set('ano', filtrosApi.ano)
    if (filtrosApi.mes) params.set('mes', filtrosApi.mes)
    if (filtrosApi.busca) params.set('busca', filtrosApi.busca)
    const url = `http://localhost:8080/api/dashboard/entregas/exportar?${params}`
    const a = document.createElement('a')
    a.href = url
    a.download = 'entregas.csv'
    a.click()
  }

  function exportarSelecao() {
    const linhas = entregas.filter((e) => selecionados.includes(e.id))
    const cabecalho = 'id,cliente,status,prazo'
    const corpo = linhas.map((e) =>
      [e.id, `"${e.cliente}"`, `"${e.status}"`, e.prazo ?? ''].join(',')
    )
    const csv = [cabecalho, ...corpo].join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'entregas-selecao.csv'
    a.click()
    URL.revokeObjectURL(url)
  }
  const entregas = data?.items ?? []
  const totalPaginas = data?.total_paginas ?? 1

  useEffect(() => {
    function handleClickFora(e: MouseEvent) {
      if (ordenacaoRef.current && !ordenacaoRef.current.contains(e.target as Node)) {
        setOrdenacaoAberta(false)
      }
      if (exportDropdownRef.current && !exportDropdownRef.current.contains(e.target as Node)) {
        setExportDropdownAberto(false)
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
    setEdicao({ cliente: '', status: '', dia: '', mes: '', ano: '' })
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
              <div className="absolute top-[calc(100%+6px)] left-0 z-20 bg-white border border-[#e0e0e0] rounded-[10px] shadow-md min-w-[180px] overflow-hidden">
                {(
                  [
                    { valor: 'recentes',    label: 'Mais recentes' },
                    { valor: 'antigos',     label: 'Mais antigos' },
                    { valor: 'cliente_az',  label: 'Cliente A-Z' },
                    { valor: 'cliente_za',  label: 'Cliente Z-A' },
                  ] as const
                ).map(({ valor, label }) => (
                  <button
                    key={valor}
                    onClick={() => {
                      setOrdenacao(valor)
                      setOrdenacaoAberta(false)
                    }}
                    className={`w-full text-left px-4 py-3 text-[13px] transition-colors hover:bg-[#f6f7f9] ${
                      ordenacao === valor ? 'text-[#1d5358] font-semibold' : 'text-[#343434]'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="flex items-center gap-2">
            {searchAberto && (
              <div className="relative">
                <Search
                  size={14}
                  strokeWidth={1.5}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-[#898989] pointer-events-none"
                />
                <input
                  ref={searchInputRef}
                  type="text"
                  value={buscaInput}
                  onChange={(e) => setBuscaInput(e.target.value)}
                  placeholder="Buscar cliente..."
                  className="h-10 w-[200px] pl-8 pr-8 border border-[#e0e0e0] rounded-full text-[13px] text-[#343434] placeholder-[#898989] focus:outline-none focus:border-[#3f7377] bg-[#f6f7f9]"
                />
                {buscaInput && (
                  <button
                    onClick={() => setBuscaInput('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#898989] hover:text-[#343434] transition-colors"
                  >
                    <X size={13} strokeWidth={2} />
                  </button>
                )}
              </div>
            )}
            <button
              onClick={() => {
                setSearchAberto((o) => {
                  if (o) { setBuscaInput(''); }
                  return !o
                })
              }}
              className={`flex items-center justify-center w-10 h-10 rounded-full transition-colors ${
                searchAberto || buscaCliente
                  ? 'bg-[#1d5358] text-white'
                  : 'bg-[#f6f7f9] text-[#4d4d4d] hover:bg-[#dde5e6]'
              }`}
            >
              <Search size={18} strokeWidth={1.5} />
            </button>
          </div>
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

          <div className="relative" ref={exportDropdownRef}>
            <button
              onClick={() => setExportDropdownAberto((o) => !o)}
              title="Exportar"
              className={`flex items-center justify-center w-10 h-10 rounded-[20px] transition-colors ${
                exportDropdownAberto
                  ? 'bg-[#1d5358] text-white'
                  : 'bg-[#f6f7f9] text-[#4d4d4d] hover:bg-[#dde5e6]'
              }`}
            >
              <Upload size={18} strokeWidth={1.5} />
            </button>

            {exportDropdownAberto && (
              <div className="absolute top-[calc(100%+6px)] right-0 z-20 bg-white border border-[#e0e0e0] rounded-[10px] shadow-md min-w-[180px] overflow-hidden">
                <button
                  onClick={() => {
                    exportarSelecao()
                    setExportDropdownAberto(false)
                  }}
                  disabled={selecionados.length === 0}
                  className={`w-full text-left px-4 py-3 text-[13px] transition-colors ${
                    selecionados.length === 0
                      ? 'text-[#c0c0c0] cursor-not-allowed'
                      : 'text-[#343434] hover:bg-[#f6f7f9]'
                  }`}
                >
                  Exportar seleção
                </button>
                <button
                  onClick={() => {
                    exportarCsv()
                    setExportDropdownAberto(false)
                  }}
                  className="w-full text-left px-4 py-3 text-[13px] text-[#343434] hover:bg-[#f6f7f9] transition-colors"
                >
                  Exportar tudo
                </button>
              </div>
            )}
          </div>
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
      <div className="border-t-2 border-[#e0e0e0]" />

      {/* Tabela */}
      {isLoading && (
        <table className="w-full border-collapse table-fixed">
          <thead>
            <tr className="bg-[#f6f7f9]">
              <th className="w-[36px] pl-3 py-[13px] rounded-l-[10px]" />
              <th className="w-[26%] py-[13px] px-2 text-left text-[13px] font-semibold text-[#1d5358] whitespace-nowrap">Pedido</th>
              <th className="py-[13px] pl-8 text-left text-[13px] font-semibold text-[#1d5358]">Cliente</th>
              <th className="w-[22%] py-[13px] pl-3 text-left text-[13px] font-semibold text-[#1d5358]">Status</th>
              <th className="w-[13%] py-[13px] pl-2 pr-3 rounded-r-[10px] text-left text-[13px] font-semibold text-[#1d5358]">Prazo</th>
            </tr>
          </thead>
          <tbody>
            {Array.from({ length: 10 }).map((_, idx) => (
              <React.Fragment key={idx}>
                <tr className="animate-pulse">
                  <td className="pl-3 py-[18px]"><div className="w-4 h-4 bg-[#e0e0e0] rounded" /></td>
                  <td className="py-[18px] px-2"><div className="h-3 w-full bg-[#e0e0e0] rounded" /></td>
                  <td className="py-[18px] pl-8"><div className="h-3 w-36 bg-[#e0e0e0] rounded" /></td>
                  <td className="py-[18px] pl-3"><div className="h-3 w-28 bg-[#e0e0e0] rounded" /></td>
                  <td className="py-[18px] pl-2 pr-3"><div className="h-3 w-16 bg-[#e0e0e0] rounded" /></td>
                </tr>
                {idx < 9 && (
                  <tr><td colSpan={5} className="p-0"><div className="border-t border-[#e0e0e0]/30" /></td></tr>
                )}
              </React.Fragment>
            ))}
          </tbody>
        </table>
      )}
      {isError && (
        <div className="flex items-center justify-center py-8 text-[#c20000] text-sm">
          Erro ao carregar entregas
        </div>
      )}
      {!isLoading && !isError && (
        <table className="w-full border-collapse table-fixed">
          <thead>
            <tr className="bg-[#f6f7f9]">
              <th className="w-[36px] pl-3 py-[13px] rounded-l-[10px] text-left font-normal">
                <button onClick={toggleTodos}>
                  {todosSelecionados ? (
                    <CheckSquare size={16} strokeWidth={1.5} className="text-[#1d5358]" />
                  ) : (
                    <Square size={16} strokeWidth={1.5} className="text-[#1d5358]" />
                  )}
                </button>
              </th>
              <th className="w-[26%] py-[13px] px-2 text-left text-[13px] font-semibold text-[#1d5358] whitespace-nowrap">Pedido</th>
              <th className="py-[13px] pl-8 text-left text-[13px] font-semibold text-[#1d5358]">Cliente</th>
              <th className="w-[22%] py-[13px] pl-3 text-left text-[13px] font-semibold text-[#1d5358]">Status</th>
              <th className="w-[13%] py-[13px] pl-2 pr-3 rounded-r-[10px] text-left text-[13px] font-semibold text-[#1d5358]">Prazo</th>
            </tr>
          </thead>
          <tbody>
            {entregas.map((entrega, idx) => {
              const cfg = STATUS_CONFIG[entrega.status as StatusEntrega] ?? {
                label: entrega.status,
                cor: '#4d4d4d',
              }
              const selecionado = selecionados.includes(entrega.id)
              return (
                <React.Fragment key={entrega.id}>
                  <tr
                    className={`transition-colors rounded-[8px] ${
                      selecionado ? 'bg-[#f0f5f5]' : ''
                    }`}
                  >
                    <td
                      className="pl-3 py-[18px] cursor-pointer"
                      onClick={() => toggleSelecionado(entrega.id)}
                    >
                      {selecionado ? (
                        <CheckSquare size={16} strokeWidth={1.5} className="text-[#1d5358]" />
                      ) : (
                        <Square size={16} strokeWidth={1.5} className="text-[#4d4d4d]" />
                      )}
                    </td>
                    <td className="py-[18px] px-2 text-[13px] font-medium text-[#343434] whitespace-nowrap overflow-hidden">
                      {entrega.id}
                    </td>
                    <td className="py-[18px] pl-8 text-[13px] font-medium text-[#343434] overflow-hidden text-ellipsis">
                      {entrega.cliente}
                    </td>
                    <td className="py-[18px] pl-3">
                      <div className="flex items-center gap-2">
                        <span
                          className="inline-block w-[10px] h-[10px] rounded-full shrink-0"
                          style={{ backgroundColor: cfg.cor }}
                        />
                        <span className="text-[13px] font-medium text-[#343434] truncate">{cfg.label}</span>
                      </div>
                    </td>
                    <td className="py-[18px] pl-2 pr-3 text-[13px] font-medium text-[#343434] whitespace-nowrap">
                      {entrega.prazo}
                    </td>
                  </tr>
                  {idx < entregas.length - 1 && (
                    <tr>
                      <td colSpan={5} className="p-0">
                        <div className="border-t border-[#e0e0e0]/30" />
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              )
            })}
          </tbody>
        </table>
      )}

      {/* Paginação */}
      <div className="flex items-center justify-center gap-[6px] p-[10px] flex-wrap">
        <button
          className={`flex items-center justify-center w-7 h-7 rounded-full border transition-colors ${
            paginaAtual === 1
              ? 'border-[#e0e0e0] text-[#e0e0e0] cursor-not-allowed'
              : 'border-black text-black hover:bg-[#f6f7f9]'
          }`}
          onClick={() => setPaginaAtual((p) => Math.max(1, p - 1))}
          disabled={paginaAtual === 1}
        >
          <ArrowRight size={14} strokeWidth={2} className="rotate-180" />
        </button>

        {(() => {
          const JANELA = 6
          const inicio = Math.max(1, Math.min(paginaAtual - 3, Math.max(1, totalPaginas - JANELA + 1)))
          const fim = Math.min(totalPaginas, inicio + JANELA - 1)
          return Array.from({ length: fim - inicio + 1 }, (_, i) => inicio + i).map((p) => (
            <button
              key={p}
              className={`flex items-center justify-center w-8 h-7 rounded-[5px] text-[13px] font-medium transition-colors ${
                p === paginaAtual
                  ? 'bg-[#e0e0e0] text-[#343434]'
                  : 'text-[#343434] hover:bg-[#f6f7f9]'
              }`}
              onClick={() => setPaginaAtual(p)}
            >
              {String(p).padStart(2, '0')}
            </button>
          ))
        })()}

        <button
          className={`flex items-center justify-center w-7 h-7 rounded-full border transition-colors ${
            paginaAtual === totalPaginas
              ? 'border-[#e0e0e0] text-[#e0e0e0] cursor-not-allowed'
              : 'border-black text-black hover:bg-[#f6f7f9]'
          }`}
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
          <div className="bg-[#F6F7F9] rounded-[10px] shadow-xl w-full max-w-[480px] mx-4 flex flex-col gap-5 p-6 relative">
            <button
              onClick={() => setModalEdicaoAberto(false)}
              className="absolute top-4 right-4 w-7 h-7 flex items-center justify-center rounded-full hover:bg-white text-[#262626] transition-colors"
            >
              <X size={16} strokeWidth={2} />
            </button>

            <h2 className="text-[16px] font-semibold text-[#1d5358] text-center pr-6">
              Edição de entregas selecionadas ({String(selecionados.length).padStart(2, '0')})
            </h2>

            <div className="flex flex-col gap-4">
              {/* Lista de pedidos selecionados — somente leitura */}
              <div className="flex flex-col gap-1">
                <label className="text-[12px] font-medium text-[#262626]">
                  Pedidos selecionados
                </label>
                <div className="border border-black rounded-[4px] bg-white max-h-[152px] overflow-y-auto divide-y divide-[#e0e0e0]">
                  {selecionados.map((id) => (
                    <div key={id} className="px-3 py-2 font-mono text-[11px] text-[#C2C2C2] select-all whitespace-nowrap">
                      {id}
                    </div>
                  ))}
                </div>
              </div>

              {/* Cliente */}
              <div className="flex flex-col gap-1">
                <label className="text-[12px] font-medium text-[#262626]">Cliente</label>
                <input
                  type="text"
                  value={edicao.cliente}
                  onChange={(e) => setEdicao((ed) => ({ ...ed, cliente: e.target.value }))}
                  className="h-[38px] px-3 border border-black rounded-[4px] bg-white text-[14px] text-[#262626] focus:outline-none focus:border-[#1D5358]"
                />
              </div>

              {/* Status */}
              <div className="flex flex-col gap-1">
                <label className="text-[12px] font-medium text-[#262626]">Status</label>
                <div className="relative">
                  <select
                    value={edicao.status}
                    onChange={(e) => setEdicao((ed) => ({ ...ed, status: e.target.value }))}
                    className="appearance-none w-full h-[38px] pl-3 pr-8 border border-[#666666] rounded-[4px] text-[14px] text-[#262626] bg-white focus:outline-none focus:border-[#1D5358] cursor-pointer"
                  >
                    <option value="">Status</option>
                    {STATUS_OPCOES.map(({ valor, label }) => (
                      <option key={valor} value={label}>{label}</option>
                    ))}
                  </select>
                  <ChevronDown size={14} strokeWidth={2} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#262626] pointer-events-none" />
                </div>
              </div>

              {/* Prazo */}
              <div className="flex flex-col gap-1">
                <label className="text-[12px] font-medium text-[#262626]">Prazo</label>
                <div className="grid grid-cols-3 gap-2">
                  {/* Dia */}
                  <div className="relative">
                    <select
                      value={edicao.dia}
                      onChange={(e) => setEdicao((ed) => ({ ...ed, dia: e.target.value }))}
                      className="appearance-none w-full h-[28px] pl-3 pr-7 border border-[#666666] rounded-[4px] text-[13px] text-[#262626] bg-white focus:outline-none focus:border-[#1D5358] cursor-pointer"
                    >
                      <option value="">Dia</option>
                      {DIAS.map((d) => <option key={d} value={d}>{d}</option>)}
                    </select>
                    <ChevronDown size={12} strokeWidth={2} className="absolute right-2 top-1/2 -translate-y-1/2 text-[#262626] pointer-events-none" />
                  </div>
                  {/* Mês */}
                  <div className="relative">
                    <select
                      value={edicao.mes}
                      onChange={(e) => setEdicao((ed) => ({ ...ed, mes: e.target.value }))}
                      className="appearance-none w-full h-[28px] pl-3 pr-7 border border-[#666666] rounded-[4px] text-[13px] text-[#262626] bg-white focus:outline-none focus:border-[#1D5358] cursor-pointer"
                    >
                      <option value="">Mês</option>
                      {MESES_PRAZO.map((m) => <option key={m} value={m}>{m}</option>)}
                    </select>
                    <ChevronDown size={12} strokeWidth={2} className="absolute right-2 top-1/2 -translate-y-1/2 text-[#262626] pointer-events-none" />
                  </div>
                  {/* Ano */}
                  <div className="relative">
                    <select
                      value={edicao.ano}
                      onChange={(e) => setEdicao((ed) => ({ ...ed, ano: e.target.value }))}
                      className="appearance-none w-full h-[28px] pl-3 pr-7 border border-[#666666] rounded-[4px] text-[13px] text-[#262626] bg-white focus:outline-none focus:border-[#1D5358] cursor-pointer"
                    >
                      <option value="">Ano</option>
                      {ANOS_PRAZO.map((a) => <option key={a} value={a}>{a}</option>)}
                    </select>
                    <ChevronDown size={12} strokeWidth={2} className="absolute right-2 top-1/2 -translate-y-1/2 text-[#262626] pointer-events-none" />
                  </div>
                </div>
              </div>
            </div>

            {/* Ações */}
            <div className="flex items-center justify-end gap-3 pt-1">
              <button
                onClick={() => setModalEdicaoAberto(false)}
                className="h-[34px] px-5 border border-black rounded-[100px] text-[14px] font-medium text-[#262626] hover:bg-white transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={aplicarEdicao}
                className="h-[35px] px-5 bg-[#1D5358] rounded-[100px] text-[14px] font-medium text-white hover:bg-[#163f43] transition-colors"
              >
                Aplicar
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

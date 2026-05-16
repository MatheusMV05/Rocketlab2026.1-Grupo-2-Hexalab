import { useState, useEffect, useMemo } from 'react'
import {
  Search,
  Filter,
  Upload,
  Edit2,
  Square,
  CheckSquare,
  MinusSquare,
  X,
  Loader2,
  ChevronDown,
  Check,
} from 'lucide-react'
import { DropdownOrganizarListaStatus } from '../../molecules/tickets/DropdownOrganizarListaStatus'
import {
  PainelFiltrosTickets,
  FILTROS_TICKETS_VAZIO,
  type FiltrosTickets,
} from '../../molecules/tickets/PainelFiltrosTickets'
import { Paginacao } from '../../molecules/tickets/Paginacao'
import { ResolvidoTicket } from '../../atoms/tickets/ResolvidoTicket'
import { AvaliacaoTicket } from '../../atoms/tickets/AvaliacaoTicket'
import { ModalSucesso } from '../../molecules/compartilhados/ModalSucesso'
import {
  useAtualizarTicket,
  useListaAgentesSuporte,
  useListaTickets,
  useOpcoesFiltro,
} from '../../../hooks/useTickets'
import type { Ticket, TicketEditavel } from '../../../types/tickets'

const COLS_GRID =
  'grid grid-cols-[32px_70px_70px_140px_90px_110px_90px_90px_140px] gap-x-[72px]'
const TABELA_MIN_W = 'min-w-[1480px]'
const INPUT_MODAL_CLASS =
  'w-full h-[44px] px-4 border-2 border-[#dcdcdc] rounded-[10px] text-[14px] text-[#111111] font-medium bg-white focus:outline-none focus:border-[#1c5258] focus:ring-2 focus:ring-[#1c5258]/10'

interface EdicaoForm {
  status: string
  tipo: string
  responsavel: string
  resolvido: 'sim' | 'nao' | ''
}

const EDICAO_VAZIA: EdicaoForm = { status: '', tipo: '', responsavel: '', resolvido: '' }

function classePillResolvido(opcao: '' | 'sim' | 'nao', selecionado: '' | 'sim' | 'nao'): string {
  const base =
    'flex-1 h-[40px] rounded-full text-[13px] font-semibold border-2 transition-colors'
  if (selecionado !== opcao) {
    return `${base} border-[#dcdcdc] bg-white text-[#343434] hover:border-[#1c5258]`
  }
  if (opcao === 'sim') return `${base} border-[#12632f] bg-[#12632f] text-white`
  if (opcao === 'nao') return `${base} border-[#c20000] bg-[#c20000] text-white`
  return `${base} border-[#1c5258] bg-[#1c5258] text-white`
}

function montarCsv(tickets: Ticket[]): string {
  const escapar = (val: string) => {
    const limpo = String(val ?? '').replace(/"/g, '""')
    return `"${limpo}"`
  }
  const cabecalho = [
    'Ticket',
    'Cliente',
    'Status',
    'Resolvido',
    'Avaliação',
    'Duração',
    'Tipo',
    'Responsável',
  ]
  const linhas = tickets.map((t) =>
    [
      t.id,
      `${t.cliente_nome} (${t.cliente_id})`,
      t.status,
      t.resolvido ? 'Sim' : 'Não',
      t.avaliacao != null ? String(t.avaliacao) : '—',
      t.duracao,
      t.tipo,
      t.responsavel,
    ].map(escapar).join(','),
  )
  return [cabecalho.map(escapar).join(','), ...linhas].join('\r\n')
}

function baixarCsv(conteudo: string, nomeArquivo: string) {
  const blob = new Blob(['\ufeff' + conteudo], { type: 'text/csv;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = nomeArquivo
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

export function TabelaTickets() {
  const [paginaAtual, setPaginaAtual] = useState(1)
  const [termoBusca, setTermoBusca] = useState('')
  const [buscaAberta, setBuscaAberta] = useState(false)
  const [ordenacao, setOrdenacao] = useState<string>('')
  const [filtro, setFiltro] = useState<FiltrosTickets>(FILTROS_TICKETS_VAZIO)
  const [filtroAberto, setFiltroAberto] = useState(false)
  const [selecionados, setSelecionados] = useState<string[]>([])
  const [modalEditar, setModalEditar] = useState(false)
  const [edicao, setEdicao] = useState<EdicaoForm>(EDICAO_VAZIA)
  const [toastSucesso, setToastSucesso] = useState<string | null>(null)
  const [buscaDebounced, setBuscaDebounced] = useState('')
  const [inputBuscaRespModal, setInputBuscaRespModal] = useState('')
  const [debBuscaRespModal, setDebBuscaRespModal] = useState('')
  const [dropdownRespAberto, setDropdownRespAberto] = useState(false)

  const { data: opcoes } = useOpcoesFiltro()
  const atualizar = useAtualizarTicket()

  useEffect(() => {
    const id = window.setTimeout(() => setBuscaDebounced(termoBusca.trim()), 300)
    return () => window.clearTimeout(id)
  }, [termoBusca])

  useEffect(() => {
    const id = window.setTimeout(() => setDebBuscaRespModal(inputBuscaRespModal.trim()), 280)
    return () => window.clearTimeout(id)
  }, [inputBuscaRespModal])

  const {
    data: listaAgentes = [],
    isFetching: carregandoAgentesModal,
  } = useListaAgentesSuporte(debBuscaRespModal, modalEditar)

  const filtrosApi = useMemo(
    () => ({
      ordenacao: ordenacao || undefined,
      cliente: filtro.cliente || filtro.clienteId || undefined,
      tipos: filtro.tipos.length > 0 ? filtro.tipos : undefined,
      status: filtro.status.length > 0 ? filtro.status : undefined,
      busca: buscaDebounced ? buscaDebounced : undefined,
    }),
    [ordenacao, filtro, buscaDebounced],
  )

  const { data, isLoading } = useListaTickets(paginaAtual, filtrosApi)

  const tickets = data?.itens || []
  const totalPaginas = data?.paginas || 1
  const totalRegistros = data?.total ?? 0
  const totalAtivos = data?.total_ativos ?? 0

  useEffect(() => {
    setPaginaAtual(1)
    setSelecionados([])
  }, [ordenacao, filtro, buscaDebounced])

  const ticketsPorSk = useMemo(() => {
    const map = new Map<string, Ticket>()
    tickets.forEach((t) => map.set(t.sk, t))
    return map
  }, [tickets])

  const temFiltroAtivo =
    !!filtro.clienteId || filtro.tipos.length > 0 || filtro.status.length > 0 || buscaDebounced.length > 0

  const skVisiveis = tickets.map((t) => t.sk)
  const todosSelecionados =
    tickets.length > 0 && skVisiveis.every((sk) => selecionados.includes(sk))
  const algunsSelecionados =
    selecionados.length > 0 && !todosSelecionados && skVisiveis.some((sk) => selecionados.includes(sk))

  function toggleSelecionado(sk: string) {
    setSelecionados((prev) => (prev.includes(sk) ? prev.filter((x) => x !== sk) : [...prev, sk]))
  }

  function toggleTodos() {
    if (todosSelecionados) setSelecionados([])
    else setSelecionados(skVisiveis)
  }

  function abrirFiltro() {
    setFiltroAberto(true)
  }

  function aplicarFiltros(novo: FiltrosTickets) {
    setFiltro(novo)
    setFiltroAberto(false)
  }

  function limparChip(campo: 'cliente' | 'tipo' | 'status', valor?: string) {
    setFiltro((f) => {
      if (campo === 'cliente') return { ...f, cliente: '', clienteId: '' }
      if (campo === 'tipo') return { ...f, tipos: f.tipos.filter((t) => t !== valor) }
      return { ...f, status: f.status.filter((s) => s !== valor) }
    })
  }

  function abrirModalEdicao() {
    if (selecionados.length === 0) return
    setDropdownRespAberto(false)
    if (selecionados.length === 1) {
      const t = ticketsPorSk.get(selecionados[0])
      if (t) {
        const respTxt = t.responsavel !== '—' ? String(t.responsavel).trim() : ''
        setEdicao({
          status: t.status === '—' ? '' : t.status,
          tipo: t.tipo === '—' ? '' : t.tipo,
          responsavel: respTxt,
          resolvido: '',
        })
        setInputBuscaRespModal(respTxt)
      }
    } else {
      setEdicao(EDICAO_VAZIA)
      setInputBuscaRespModal('')
    }
    setModalEditar(true)
  }

  function escolherResponsavelModal(nome: string) {
    const n = nome.trim()
    setEdicao((e) => ({ ...e, responsavel: n }))
    setInputBuscaRespModal(n)
    setDropdownRespAberto(false)
  }

  function limparResponsavelModal() {
    setEdicao((e) => ({ ...e, responsavel: '' }))
    setInputBuscaRespModal('')
  }

  async function aplicarEdicao() {
    const dados: TicketEditavel = {}
    if (edicao.status) dados.sla_status = edicao.status
    if (edicao.tipo) dados.tipo_problema = edicao.tipo
    const respLimpo = edicao.responsavel.trim()
    if (respLimpo) dados.agente_suporte = respLimpo
    if (edicao.resolvido === 'sim') dados.fl_resolvido = true
    if (edicao.resolvido === 'nao') dados.fl_resolvido = false

    if (Object.keys(dados).length === 0) {
      setModalEditar(false)
      return
    }

    await Promise.all(selecionados.map((sk) => atualizar.mutateAsync({ sk, dados })))
    setModalEditar(false)
    setSelecionados([])
    setToastSucesso(`${selecionados.length === 1 ? 'Ticket editado' : 'Tickets editados'} com sucesso!`)
    setTimeout(() => setToastSucesso(null), 2500)
  }

  function exportarCsv() {
    if (selecionados.length === 0) return
    const linhas = selecionados
      .map((sk) => ticketsPorSk.get(sk))
      .filter((t): t is Ticket => !!t)
    if (linhas.length === 0) return
    const csv = montarCsv(linhas)
    const ts = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19)
    baixarCsv(csv, `tickets-${ts}.csv`)
    setToastSucesso(`${linhas.length} ${linhas.length === 1 ? 'ticket exportado' : 'tickets exportados'} com sucesso!`)
    setTimeout(() => setToastSucesso(null), 2500)
  }

  const semResultados = !isLoading && tickets.length === 0 && temFiltroAtivo

  return (
    <div className="bg-white border-2 border-[#e0e0e0] rounded-[10px] p-[10px] flex flex-col w-full relative">
      {/* Cabeçalho */}
      <div className="pt-2 pb-4 px-3 border-b border-[#e0e0e0]">
        <h3 className="text-[18px] font-bold text-[#1c5258] leading-tight">Tickets</h3>
        <p className="text-[13px] text-[#898989] font-medium mt-0.5">
          {totalRegistros} tickets no total | {totalAtivos} tickets ativos
        </p>
      </div>

      {/* Chips de filtros ativos */}
      {!filtroAberto && temFiltroAtivo && (
        <div className="pt-4 px-3 flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-2 flex-wrap">
            {filtro.clienteId && (
              <span className="flex items-center gap-2 px-3 py-[6px] border border-[#b3b3b3] rounded-full text-[13px] text-[#343434] bg-white">
                {filtro.cliente} - #{filtro.clienteId}
                <button onClick={() => limparChip('cliente')} className="text-red-500 hover:text-red-700">
                  <X size={14} />
                </button>
              </span>
            )}
            {filtro.tipos.map((t) => (
              <span
                key={t}
                className="flex items-center gap-2 px-3 py-[6px] border border-[#b3b3b3] rounded-full text-[13px] text-[#343434] bg-white"
              >
                {t}
                <button onClick={() => limparChip('tipo', t)} className="text-red-500 hover:text-red-700">
                  <X size={14} />
                </button>
              </span>
            ))}
            {filtro.status.map((s) => (
              <span
                key={s}
                className="flex items-center gap-2 px-3 py-[6px] border border-[#b3b3b3] rounded-full text-[13px] text-[#343434] bg-white"
              >
                {s}
                <button onClick={() => limparChip('status', s)} className="text-red-500 hover:text-red-700">
                  <X size={14} />
                </button>
              </span>
            ))}
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => setFiltro(FILTROS_TICKETS_VAZIO)}
              className="h-[34px] px-4 border border-[#1c5258] rounded-full text-[13px] font-semibold text-[#1c5258] hover:bg-[#f6f7f9] transition-colors"
            >
              Limpar filtros
            </button>
            <button
              onClick={abrirFiltro}
              className="h-[34px] px-4 border border-[#1c5258] rounded-full text-[13px] font-semibold text-[#1c5258] hover:bg-[#f6f7f9] transition-colors"
            >
              Editar filtros
            </button>
          </div>
        </div>
      )}

      {/* Barra de ferramentas */}
      <div className="flex items-center justify-between py-4 px-3 relative z-20">
        <div className="flex items-center gap-3">
          <DropdownOrganizarListaStatus valor={ordenacao} onChange={setOrdenacao} />
          {buscaAberta ? (
            <div className="relative">
              <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#4d4d4d]" strokeWidth={2} />
              <input
                type="text"
                value={termoBusca}
                onChange={(e) => setTermoBusca(e.target.value)}
                onBlur={() => !termoBusca && setBuscaAberta(false)}
                autoFocus
                placeholder="Buscar cliente..."
                className="h-[42px] pl-10 pr-4 bg-[#f6f7f9] rounded-full text-[13px] font-medium text-[#111111] outline-none placeholder:text-[#898989] border border-transparent focus:border-[#1c5258] transition-all min-w-[220px] w-[240px]"
              />
            </div>
          ) : (
            <button
              onClick={() => setBuscaAberta(true)}
              className="flex items-center justify-center w-[42px] h-[42px] bg-[#f6f7f9] rounded-full hover:bg-[#e5ebeb] transition-colors text-[#4d4d4d]"
            >
              <Search size={18} strokeWidth={2} />
            </button>
          )}
        </div>

        <div className="flex items-center gap-[6px]">
          <button
            onClick={abrirModalEdicao}
            disabled={selecionados.length === 0}
            className={`flex items-center justify-center w-[42px] h-[42px] rounded-full transition-colors ${
              selecionados.length > 0
                ? 'bg-[#f6f7f9] text-[#4d4d4d] hover:bg-[#e5ebeb]'
                : 'bg-[#f6f7f9] text-[#4d4d4d] opacity-40 cursor-not-allowed'
            }`}
          >
            <Edit2 size={18} strokeWidth={2} />
          </button>
          <button
            onClick={() => setFiltroAberto((v) => !v)}
            className={`flex items-center justify-center w-[42px] h-[42px] rounded-full transition-colors ${
              filtroAberto
                ? 'bg-[#1c5258] text-white hover:bg-[#154247]'
                : 'bg-[#f6f7f9] text-[#4d4d4d] hover:bg-[#e5ebeb]'
            }`}
          >
            <Filter size={18} strokeWidth={2} />
          </button>
          <button
            onClick={exportarCsv}
            disabled={selecionados.length === 0}
            className={`flex items-center justify-center w-[42px] h-[42px] rounded-full transition-colors ${
              selecionados.length > 0
                ? 'bg-[#f6f7f9] text-[#4d4d4d] hover:bg-[#e5ebeb]'
                : 'bg-[#f6f7f9] text-[#4d4d4d] opacity-40 cursor-not-allowed'
            }`}
          >
            <Upload size={18} strokeWidth={2} />
          </button>
        </div>
      </div>

      {/* Painel de filtros expansível */}
      {filtroAberto && <PainelFiltrosTickets valor={filtro} onAplicar={aplicarFiltros} />}

      {/* Tabela */}
      <div className="flex flex-col overflow-x-auto relative">
        {isLoading && (
          <div className="absolute inset-0 bg-white/50 z-20 flex items-center justify-center">
            <Loader2 className="animate-spin text-[#1c5258]" size={32} />
          </div>
        )}

        <div className={`${COLS_GRID} ${TABELA_MIN_W} items-center px-4 py-3 mx-1 shrink-0 border-b border-[#e0e0e0]`}>
          <div className="flex items-center justify-center cursor-pointer" onClick={toggleTodos}>
            {todosSelecionados ? (
              <CheckSquare size={18} strokeWidth={2} className="text-[#1c5258]" />
            ) : algunsSelecionados ? (
              <MinusSquare size={18} strokeWidth={2} className="text-[#1c5258]" />
            ) : (
              <Square size={18} strokeWidth={2} className="text-[#898989]" />
            )}
          </div>
          <span className="text-[13px] font-semibold text-[#1c5258]">Ticket</span>
          <span className="text-[13px] font-semibold text-[#1c5258]">Cliente</span>
          <span className="text-[13px] font-semibold text-[#1c5258]">Status</span>
          <span className="text-[13px] font-semibold text-[#1c5258]">Resolvido</span>
          <span className="text-[13px] font-semibold text-[#1c5258]">Avaliação</span>
          <span className="text-[13px] font-semibold text-[#1c5258]">Duração</span>
          <span className="text-[13px] font-semibold text-[#1c5258]">Tipo</span>
          <span className="text-[13px] font-semibold text-[#1c5258]">Responsável</span>
        </div>

        <div className={`flex flex-col ${TABELA_MIN_W}`}>
          {semResultados && (
            <div className="flex items-center justify-center py-10 text-[#898989] text-[14px] font-medium">
              Não há tickets que correspondam à sua busca
            </div>
          )}

          {tickets.map((ticket, idx) => {
            const selecionado = selecionados.includes(ticket.sk)
            const corFundo = selecionado ? 'bg-[#e5ebeb]' : 'hover:bg-[#fcfdfd]'
            return (
              <div key={ticket.sk}>
                <div className={`${COLS_GRID} items-center px-4 py-4 transition-colors rounded-[8px] ${corFundo}`}>
                  <div
                    className="flex items-center justify-center cursor-pointer"
                    onClick={() => toggleSelecionado(ticket.sk)}
                  >
                    {selecionado ? (
                      <CheckSquare size={18} strokeWidth={2} className="text-[#1c5258]" />
                    ) : (
                      <Square size={18} strokeWidth={2} className="text-[#4d4d4d]" />
                    )}
                  </div>
                  <span className="text-[14px] text-[#343434] font-medium truncate" title={ticket.id}>{ticket.id}</span>
                  <span className="text-[14px] text-[#343434] font-medium truncate" title={ticket.cliente_nome}>
                    {ticket.cliente_nome || `#${ticket.cliente_id?.slice(0, 5)}`}
                  </span>
                  <span className="text-[14px] text-[#343434] font-medium truncate" title={ticket.status}>
                    {ticket.status}
                  </span>
                  <span>
                    <ResolvidoTicket resolvido={ticket.resolvido} />
                  </span>
                  <span className="min-w-[110px]">
                    <AvaliacaoTicket nota={ticket.avaliacao ?? null} />
                  </span>
                  <span className="text-[14px] text-[#343434] font-medium">{ticket.duracao}</span>
                  <span className="text-[14px] text-[#343434] font-medium truncate" title={ticket.tipo}>
                    {ticket.tipo}
                  </span>
                  <span className="text-[14px] text-[#343434] font-medium truncate" title={ticket.responsavel}>
                    {ticket.responsavel}
                  </span>
                </div>
                {idx < tickets.length - 1 && <div className="border-t border-[#f0f0f0] mx-4" />}
              </div>
            )
          })}
        </div>
      </div>

      {/* Paginação */}
      <Paginacao
        paginaAtual={paginaAtual}
        totalPaginas={totalPaginas}
        onMudar={setPaginaAtual}
        carregando={isLoading}
      />

      {/* Modal de edição */}
      {modalEditar && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-[2px]"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setDropdownRespAberto(false)
              setModalEditar(false)
            }
          }}
        >
          <div className="bg-white rounded-[20px] shadow-[0_12px_40px_rgba(0,0,0,0.18)] border border-[#e8e8e8] w-[520px] max-w-[calc(100vw-32px)] flex flex-col overflow-hidden relative max-h-[90vh]">
            <button
              type="button"
              onClick={() => {
                setDropdownRespAberto(false)
                setModalEditar(false)
              }}
              className="absolute top-4 right-4 z-10 rounded-full p-1.5 text-[#898989] hover:bg-[#f6f7f9] hover:text-[#111111] transition-colors"
              aria-label="Fechar"
            >
              <X size={18} strokeWidth={2} />
            </button>

            <div className="px-8 pt-8 pb-5 border-b border-[#f0f0f0]">
              <div className="flex gap-4 items-start pr-10">
                <div className="flex h-[52px] w-[52px] shrink-0 items-center justify-center rounded-full bg-[#e8eef0] text-[#1c5258]">
                  <Edit2 size={24} strokeWidth={1.75} />
                </div>
                <div>
                  <h2 className="text-[18px] font-bold text-[#111111] leading-tight">
                    Editar tickets ({String(selecionados.length).padStart(2, '0')} selecionados)
                  </h2>
                  <p className="text-[13px] font-medium text-[#6b6b6b] mt-2 leading-snug">
                    Defina os novos valores. Campos em branco permanecem inalterados.
                  </p>
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-5 px-8 py-6 overflow-y-auto">
              <div className="flex flex-col gap-2">
                <label className="text-[12px] font-semibold text-[#6b6b6b]">Status</label>
                <div className="relative">
                  <select
                    value={edicao.status}
                    onChange={(e) => setEdicao({ ...edicao, status: e.target.value })}
                    className={`${INPUT_MODAL_CLASS} appearance-none cursor-pointer pr-11 w-full`}
                  >
                    <option value="">Manter inalterado</option>
                    {(opcoes?.status ?? []).map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                  <ChevronDown
                    size={18}
                    className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[#4d4d4d]"
                    strokeWidth={2}
                  />
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-[12px] font-semibold text-[#6b6b6b]">Tipo</label>
                <div className="relative">
                  <select
                    value={edicao.tipo}
                    onChange={(e) => setEdicao({ ...edicao, tipo: e.target.value })}
                    className={`${INPUT_MODAL_CLASS} appearance-none cursor-pointer pr-11 w-full`}
                  >
                    <option value="">Manter inalterado</option>
                    {(opcoes?.tipos ?? []).map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </select>
                  <ChevronDown
                    size={18}
                    className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[#4d4d4d]"
                    strokeWidth={2}
                  />
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-[12px] font-semibold text-[#6b6b6b]">Responsável</label>
                <p className="text-[11px] font-medium text-[#898989] -mt-0.5 mb-1">
                  Apenas agentes já cadastrados na base — escolha na lista ou busque pelo nome.
                </p>
                <div className="relative">
                  <Search
                    size={18}
                    className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[#3f7377]"
                    strokeWidth={1.85}
                  />
                  <input
                    type="text"
                    autoComplete="off"
                    id="ticket-modal-responsavel"
                    value={inputBuscaRespModal}
                    onChange={(e) => {
                      const v = e.target.value
                      setInputBuscaRespModal(v)
                      setEdicao((prev) => ({ ...prev, responsavel: '' }))
                      setDropdownRespAberto(true)
                    }}
                    onFocus={() => setDropdownRespAberto(true)}
                    onBlur={() => window.setTimeout(() => setDropdownRespAberto(false), 200)}
                    placeholder="Buscar responsável..."
                    className={`${INPUT_MODAL_CLASS} pl-11 ${inputBuscaRespModal.trim() ? 'pr-11' : 'pr-4'} w-full`}
                  />
                  {inputBuscaRespModal.trim().length > 0 && (
                    <button
                      type="button"
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() => {
                        limparResponsavelModal()
                        const el = document.getElementById('ticket-modal-responsavel')
                        el?.focus()
                      }}
                      className="absolute right-3 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full flex items-center justify-center text-red-500 hover:bg-red-50 transition-colors"
                      aria-label="Limpar responsável"
                    >
                      <X size={15} strokeWidth={2} />
                    </button>
                  )}
                  {dropdownRespAberto && (
                    <div className="absolute top-[calc(100%+6px)] left-0 w-full bg-white border border-[#e0e0e0] rounded-[10px] max-h-[220px] overflow-y-auto shadow-md z-[220] py-2">
                      {carregandoAgentesModal && (
                        <div className="flex items-center justify-center gap-2 py-6 text-[#4d4d4d] text-[13px]">
                          <Loader2 size={16} className="animate-spin" />
                          Buscando…
                        </div>
                      )}
                      {!carregandoAgentesModal &&
                        listaAgentes.map(({ nome }) => (
                          <button
                            key={nome}
                            type="button"
                            onMouseDown={(e) => e.preventDefault()}
                            onClick={() => escolherResponsavelModal(nome)}
                            className="w-full text-left text-[14px] text-[#111111] hover:bg-[#f6f7f9] px-4 py-2.5 transition-colors font-medium"
                          >
                            {nome}
                          </button>
                        ))}
                      {!carregandoAgentesModal && listaAgentes.length === 0 && (
                        <div className="py-5 px-4 text-[13px] text-[#898989] text-center leading-snug">
                          Nenhum responsável encontrado para essa pesquisa. Ajuste o texto ou liste sem filtro ao
                          abrir este campo.
                        </div>
                      )}
                    </div>
                  )}
                </div>
                {Boolean(edicao.responsavel.trim()) && (
                  <p className="text-[11px] font-semibold text-[#1c5258] mt-1">
                    Selecionado: <span className="font-normal text-[#343434]">{edicao.responsavel}</span>
                  </p>
                )}
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-[12px] font-semibold text-[#6b6b6b]">Resolvido</label>
                <div className="flex gap-2">
                  {(['', 'sim', 'nao'] as const).map((v) => (
                    <button
                      type="button"
                      key={v || 'manter'}
                      onClick={() => setEdicao({ ...edicao, resolvido: v })}
                      className={classePillResolvido(v, edicao.resolvido)}
                    >
                      {v === '' ? 'Manter' : v === 'sim' ? 'Sim' : 'Não'}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 px-8 py-5 border-t border-[#eeeeee] bg-[#fcfcfc]">
              <button
                type="button"
                onClick={() => {
                  setDropdownRespAberto(false)
                  setModalEditar(false)
                }}
                className="h-[44px] px-6 rounded-full text-[14px] font-semibold text-[#343434] border-2 border-transparent hover:bg-[#f0f0f0] transition-colors"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={aplicarEdicao}
                disabled={atualizar.isPending}
                className="h-[44px] px-7 rounded-full text-[14px] font-semibold text-white bg-[#1c5258] hover:bg-[#154247] transition-colors disabled:opacity-60 disabled:cursor-not-allowed inline-flex items-center gap-2 shadow-sm"
              >
                {atualizar.isPending ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  <Check size={18} strokeWidth={2.5} />
                )}
                Aplicar alterações
              </button>
            </div>
          </div>
        </div>
      )}

      {toastSucesso && <ModalSucesso mensagem={toastSucesso} />}
    </div>
  )
}

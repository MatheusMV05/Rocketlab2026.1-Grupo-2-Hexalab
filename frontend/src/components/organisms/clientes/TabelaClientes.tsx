import { useState, useRef, useEffect } from 'react'
import { 
  Search, 
  Filter, 
  Upload, 
  Edit2, 
  Square, 
  CheckSquare, 
  MinusSquare,
  X,
  Check,
  ChevronLeft,
  ChevronRight
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { DropdownOrganizarLista } from '../../molecules/clientes/DropdownOrganizarLista'
import { BotaoFiltro } from '../../atoms/compartilhados/BotaoFiltro'
import { MESES_FILTRO } from '../../../constants/opcoesFiltro'
import { CIDADES_MOCK, ESTADOS_MAP } from '../../../constants/cidades'

import { GET_MOCK_POR_PAGINA, CLIENTES_MOCK_ALL } from '../../../constants/mockClientes'
const CLIENTES_MOCK_INICIAL = GET_MOCK_POR_PAGINA(1)

const ANOS_CLIENTES = ['2026', '2025', '2024', '2023', '2022', '2021', '2020', '2019', '2018', '2017', '2016', '2015', '2014']
const SOURCES = ['WEB', 'APP', 'REFERRAL']

interface FiltroClientes {
  localizacao: string
  ano: string
  mes: string
  source: string[]
}

const FILTRO_VAZIO: FiltroClientes = { localizacao: '', ano: '', mes: '', source: [] }

function toggle<T>(arr: T[], val: T): T[] {
  return arr.includes(val) ? arr.filter((v) => v !== val) : [...arr, val]
}

export function TabelaClientes() {
  const [clientes, setClientes] = useState(CLIENTES_MOCK_INICIAL)

  const [ordenacao, setOrdenacao] = useState('')
  const [selecionados, setSelecionados] = useState<string[]>([])
  const [paginaAtual, setPaginaAtual] = useState(1)
  const [filtroAberto, setFiltroAberto] = useState(false)
  const [filtro, setFiltro] = useState<FiltroClientes>(FILTRO_VAZIO)
  const [filtroTemp, setFiltroTemp] = useState<FiltroClientes>(FILTRO_VAZIO)

  const navigate = useNavigate()

  // Calcula os clientes filtrados
  const clientesFiltrados = CLIENTES_MOCK_ALL.filter(cliente => {
    let match = true
    if (filtro.localizacao) {
      match = match && cliente.uf.toLowerCase().includes(filtro.localizacao.toLowerCase())
    }
    if (filtro.ano) {
      match = match && cliente.cadastro.includes(filtro.ano)
    }
    if (filtro.mes) {
      const mesIndex = MESES_FILTRO.findIndex(m => m.label === filtro.mes) + 1
      const mesStr = mesIndex.toString().padStart(2, '0')
      match = match && cliente.cadastro.split('/')[1] === mesStr
    }
    if (filtro.source.length > 0) {
      match = match && filtro.source.includes(cliente.source)
    }
    return match
  })

  const totalPaginas = Math.max(1, Math.ceil(clientesFiltrados.length / 9))
  
  // Garante que a página atual não passe do total após um filtro
  const paginaValida = Math.min(paginaAtual, totalPaginas)

  useEffect(() => {
    const inicio = (paginaValida - 1) * 9
    const fim = inicio + 9
    setClientes(clientesFiltrados.slice(inicio, fim))
    setSelecionados([])
  }, [paginaValida, filtro])



  const [modalEditar, setModalEditar] = useState(false)
  const [edicao, setEdicao] = useState<any>(null)
  const [clienteOriginal, setClienteOriginal] = useState<any>(null)
  const [modalConfirmarEdicao, setModalConfirmarEdicao] = useState(false)
  const [modalSucessoEdicao, setModalSucessoEdicao] = useState(false)
  const [buscaLocalizacaoEdicao, setBuscaLocalizacaoEdicao] = useState('')
  const [buscaLocalizacaoFiltro, setBuscaLocalizacaoFiltro] = useState('')

  const [hoverExportar, setHoverExportar] = useState(false)
  const [modalExportar, setModalExportar] = useState(false)
  const [modalSucesso, setModalSucesso] = useState(false)
  
  const uploadRef = useRef<HTMLDivElement>(null)

  const todosSelecionados = selecionados.length === clientes.length && clientes.length > 0
  const algunsSelecionados = selecionados.length > 0 && selecionados.length < clientes.length
  const temFiltroAtivo = filtro.localizacao || filtro.ano || filtro.mes || filtro.source.length > 0

  useEffect(() => {
    function fecharExportMenu(e: MouseEvent) {
      if (uploadRef.current && !uploadRef.current.contains(e.target as Node)) {
        setHoverExportar(false)
      }
    }
    document.addEventListener('mousedown', fecharExportMenu)
    return () => document.removeEventListener('mousedown', fecharExportMenu)
  }, [])

  function obterSugestoesLocalizacao(busca: string) {
    if (!busca || busca.trim().length < 2) return []
    
    const termo = busca.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    
    let ufBuscada = ''
    for (const [estado, sigla] of Object.entries(ESTADOS_MAP)) {
      const estadoNorm = estado.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
      if (estadoNorm.includes(termo) || sigla.toLowerCase() === termo) {
        ufBuscada = sigla
        break
      }
    }

    return CIDADES_MOCK.filter(cidade => {
      const cidadeNorm = cidade.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
      if (ufBuscada) {
         return cidade.endsWith(ufBuscada)
      }
      return cidadeNorm.includes(termo)
    }).slice(0, 5)
  }

  function toggleSelecionado(id: string) {
    setSelecionados((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    )
  }

  function toggleTodos() {
    if (todosSelecionados) {
      setSelecionados([])
    } else {
      setSelecionados(clientes.map((c) => c.id))
    }
  }

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
    setPaginaAtual(1)
    setFiltroAberto(false)
  }

  function abrirModalEdicao() {
    if (selecionados.length === 0) return
    const primeira = clientes.find((c) => c.id === selecionados[0])
    if (primeira) {
      setClienteOriginal({ ...primeira })
      setEdicao({
        uuid: '0d244537-8164-4b84-bcf2-0e43766f3221', // Mock do UUID do Figma
        nome: primeira.nome,
        telefone: primeira.telefone,
        localizacao: primeira.uf,
        cadastro: primeira.cadastro,
        source: primeira.source,
      })
      setModalEditar(true)
    }
  }

  function handleExportarLinhas() {
    if (selecionados.length === 0) return
    setModalExportar(true)
    setHoverExportar(false)
  }

  function confirmarExportacao() {
    setModalExportar(false)
    setModalSucesso(true)
    setTimeout(() => setModalSucesso(false), 3000)
  }

  function abrirConfirmacaoEdicao() {
    setModalEditar(false)
    setModalConfirmarEdicao(true)
  }

  function confirmarEdicao() {
    setClientes((prev) =>
      prev.map((c) =>
        c.id === selecionados[0]
          ? { ...c, nome: edicao.nome, telefone: edicao.telefone, uf: edicao.localizacao, cadastro: edicao.cadastro, source: edicao.source }
          : c
      )
    )
    setModalConfirmarEdicao(false)
    setModalSucessoEdicao(true)
    setTimeout(() => setModalSucessoEdicao(false), 3000)
  }

  return (
    <div className="bg-white border-2 border-[#e0e0e0] rounded-[10px] p-[10px] flex flex-col w-full min-h-0 relative">
      {/* Título e Subtítulo */}
      <div className="pt-2 pb-4 px-3 border-b border-[#e0e0e0] flex-shrink-0">
        <h3 className="text-[18px] font-bold text-[#1c5258] leading-tight">Lista de Clientes</h3>
        <p className="text-[13px] text-[#898989] font-medium mt-0.5">122 clientes ativos no total</p>
      </div>

      {/* Seção de Filtros Ativos */}
      {!filtroAberto && temFiltroAtivo && (
        <div className="pt-4 px-3 flex flex-col gap-2 flex-shrink-0">
          <p className="text-[10px] text-[#898989] uppercase font-semibold tracking-wider">Filtros aplicados</p>
          <div className="flex items-center justify-between pb-4 border-b border-[#e0e0e0]">
            <div className="flex flex-wrap gap-2">
              {filtro.localizacao && (
                <span className="flex items-center gap-2 px-3 py-1 border border-[#1c5258] rounded-full text-[13px] text-[#1c5258] font-medium">
                  {filtro.localizacao}
                  <button onClick={() => setFiltro((f) => ({ ...f, localizacao: '' }))} className="hover:bg-[#1c5258] hover:text-white rounded-full transition-colors"><X size={14} /></button>
                </span>
              )}
              {filtro.ano && (
                <span className="flex items-center gap-2 px-3 py-1 border border-[#1c5258] rounded-full text-[13px] text-[#1c5258] font-medium">
                  {filtro.ano}
                  <button onClick={() => setFiltro((f) => ({ ...f, ano: '', mes: '' }))} className="hover:bg-[#1c5258] hover:text-white rounded-full transition-colors"><X size={14} /></button>
                </span>
              )}
              {filtro.mes && (
                <span className="flex items-center gap-2 px-3 py-1 border border-[#1c5258] rounded-full text-[13px] text-[#1c5258] font-medium uppercase">
                  {filtro.mes}
                  <button onClick={() => setFiltro((f) => ({ ...f, mes: '' }))} className="hover:bg-[#1c5258] hover:text-white rounded-full transition-colors"><X size={14} /></button>
                </span>
              )}
              {filtro.source.map((s) => (
                <span key={s} className="flex items-center gap-2 px-3 py-1 border border-[#1c5258] rounded-full text-[13px] text-[#1c5258] font-medium">
                  {s}
                  <button onClick={() => setFiltro((f) => ({ ...f, source: f.source.filter((x) => x !== s) }))} className="hover:bg-[#1c5258] hover:text-white rounded-full transition-colors"><X size={14} /></button>
                </span>
              ))}
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={() => { setFiltro(FILTRO_VAZIO); setPaginaAtual(1) }}
                className="h-[32px] px-4 border border-[#343434] rounded-full text-[13px] font-semibold text-[#343434] hover:bg-[#f6f7f9] transition-colors whitespace-nowrap"
              >
                Limpar filtros
              </button>
              <button
                onClick={abrirFiltro}
                className="h-[32px] px-4 border-2 border-[#343434] rounded-full text-[13px] font-semibold text-[#343434] hover:bg-[#f6f7f9] transition-colors whitespace-nowrap"
              >
                Editar filtros
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Barra de Ferramentas */}
      <div className="flex items-center justify-between py-4 px-3 flex-shrink-0 relative z-20">
        <div className="flex items-center gap-3">
          <DropdownOrganizarLista valor={ordenacao} onChange={setOrdenacao} />
          <button className="flex items-center justify-center w-[42px] h-[42px] bg-[#f6f7f9] rounded-full hover:bg-[#e5ebeb] transition-colors text-[#4d4d4d]">
            <Search size={18} strokeWidth={2} />
          </button>
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
            onClick={filtroAberto ? fecharFiltro : abrirFiltro}
            className={`flex items-center justify-center w-[42px] h-[42px] rounded-full transition-colors ${
              filtroAberto ? 'bg-[#1c5258] text-white hover:bg-[#154247]' : 'bg-[#f6f7f9] text-[#4d4d4d] hover:bg-[#e5ebeb]'
            }`}
          >
            <Filter size={18} strokeWidth={2} />
          </button>
          
          <div className="relative" ref={uploadRef} onMouseEnter={() => setHoverExportar(true)} onMouseLeave={() => setHoverExportar(false)}>
            <button className="flex items-center justify-center w-[42px] h-[42px] bg-[#f6f7f9] rounded-full hover:bg-[#e5ebeb] transition-colors text-[#4d4d4d]">
              <Upload size={18} strokeWidth={2} />
            </button>
            
            {/* Tooltip de Exportação */}
            {hoverExportar && (
              <div className="absolute right-0 top-[calc(100%+6px)] bg-[#e5ebeb] rounded-[8px] flex flex-col py-1 shadow-md w-[140px] z-50">
                <div className="absolute top-[-6px] right-4 w-3 h-3 bg-[#e5ebeb] rotate-45"></div>
                <button className="text-[11px] text-[#343434] hover:bg-[#d1dbdb] px-3 py-2 text-left transition-colors relative z-10 font-medium">
                  Exportar lista
                </button>
                <button 
                  onClick={handleExportarLinhas}
                  disabled={selecionados.length === 0}
                  className="text-[11px] text-[#343434] hover:bg-[#d1dbdb] px-3 py-2 text-left transition-colors disabled:opacity-50 disabled:cursor-not-allowed relative z-10 font-medium"
                >
                  Exportar linhas ({String(selecionados.length).padStart(2, '0')})
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Painel de Filtros Expansível */}
      {filtroAberto && (
        <div className="border border-[#e0e0e0] rounded-[10px] mx-3 mb-4 flex flex-col shadow-sm flex-shrink-0">
          
          {/* Localização */}
          <div className="p-5 flex flex-col gap-3">
            <div>
              <p className="text-[14px] font-bold text-[#111111]">Localização</p>
              <p className="text-[11px] text-[#898989] font-medium">Selecione a localização do cliente</p>
            </div>
            <div className="relative max-w-full mt-2">
              <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#343434]" strokeWidth={1.5} />
              <input
                type="text"
                value={buscaLocalizacaoFiltro}
                onChange={(e) => setBuscaLocalizacaoFiltro(e.target.value)}
                placeholder="Buscar (ex: Recife ou Pernambuco)..."
                className="w-full h-[46px] pl-11 pr-4 border border-[#b3b3b3] rounded-[12px] text-[14px] text-[#343434] placeholder-[#898989] focus:outline-none focus:border-[#1c5258]"
              />
              {buscaLocalizacaoFiltro.length >= 2 && obterSugestoesLocalizacao(buscaLocalizacaoFiltro).length > 0 && (
                <div className="absolute top-[calc(100%+4px)] left-0 w-full bg-[#fcfdfd] border border-[#e0e0e0] rounded-[12px] flex flex-col py-2 shadow-sm z-50">
                  {obterSugestoesLocalizacao(buscaLocalizacaoFiltro).map((sugestao) => (
                    <button
                      key={sugestao}
                      onClick={() => {
                        setFiltroTemp((f) => ({ ...f, localizacao: sugestao }))
                        setBuscaLocalizacaoFiltro('')
                      }}
                      className="text-[14px] text-[#111] hover:bg-[#f6f7f9] px-5 py-2.5 text-left transition-colors"
                    >
                      {sugestao}
                    </button>
                  ))}
                </div>
              )}
            </div>
            {filtroTemp.localizacao && (
              <div className="mt-2">
                <span className="inline-flex items-center gap-2 px-3 py-1.5 border border-[#1c5258] rounded-full text-[13px] font-semibold text-[#1c5258] bg-[#f6f7f9]">
                  {filtroTemp.localizacao}
                  <button onClick={() => setFiltroTemp((f) => ({ ...f, localizacao: '' }))} className="hover:bg-[#1c5258] hover:text-white rounded-full transition-colors"><X size={14} /></button>
                </span>
              </div>
            )}
          </div>

          <div className="border-t border-[#e0e0e0]" />

          {/* Data - Cadastro */}
          <div className="p-5 flex flex-col gap-4">
            <div>
              <p className="text-[14px] font-bold text-[#111111]">Data - Cadastro</p>
              <p className="text-[11px] text-[#898989] font-medium">Selecione o ano do cadastro do cliente</p>
            </div>
            <div className="flex flex-wrap gap-[10px]">
              {ANOS_CLIENTES.map((ano) => (
                <BotaoFiltro
                  key={ano}
                  label={ano}
                  ativo={filtroTemp.ano === ano}
                  onClick={() => setFiltroTemp((f) => ({ ...f, ano: f.ano === ano ? '' : ano, mes: '' }))}
                />
              ))}
            </div>

            <p className="text-[11px] text-[#898989] font-medium mt-2">Selecione o mês</p>
            <div className="flex flex-wrap gap-[10px]">
              {MESES_FILTRO.map((mes) => (
                <BotaoFiltro
                  key={mes}
                  label={mes}
                  ativo={filtroTemp.mes === mes}
                  onClick={() => setFiltroTemp((f) => ({ ...f, mes: f.mes === mes ? '' : mes }))}
                />
              ))}
            </div>
          </div>

          <div className="border-t border-[#e0e0e0]" />

          {/* Source */}
          <div className="p-5 flex flex-col gap-3">
            <div>
              <p className="text-[14px] font-bold text-[#111111]">Source</p>
              <p className="text-[11px] text-[#898989] font-medium">Selecione o tipo de source</p>
            </div>
            <div className="flex gap-[10px] mt-2">
              {SOURCES.map((s) => (
                <BotaoFiltro
                  key={s}
                  label={s}
                  ativo={filtroTemp.source.includes(s)}
                  onClick={() => setFiltroTemp((f) => ({ ...f, source: toggle(f.source, s) }))}
                />
              ))}
            </div>
          </div>

          {/* Footer Botões */}
          <div className="flex justify-end gap-3 p-5 pt-2">
            <button
              onClick={limpar}
              className="h-[42px] px-6 border-2 border-[#1c5258] rounded-[100px] text-[14px] font-semibold text-[#1c5258] hover:bg-[#f6f7f9] transition-colors"
            >
              Limpar filtros
            </button>
            <button
              onClick={aplicar}
              className="h-[42px] px-6 bg-[#1c5258] rounded-[100px] text-[14px] font-semibold text-white hover:bg-[#154247] transition-colors"
            >
              Aplicar filtros
            </button>
          </div>
        </div>
      )}

      {/* Tabela (Com scroll caso estoure a altura) */}
      <div className="flex flex-col flex-1 min-h-0 overflow-y-auto">
        <div className="bg-[#f6f7f9] rounded-[8px] flex items-center px-4 py-3 mx-1 shrink-0 sticky top-0 z-10">
          <div
            className="w-8 shrink-0 flex items-center justify-center cursor-pointer"
            onClick={toggleTodos}
          >
            {todosSelecionados ? (
              <CheckSquare size={18} strokeWidth={2} className="text-[#343434]" />
            ) : algunsSelecionados ? (
              <MinusSquare size={18} strokeWidth={2} className="text-[#343434]" />
            ) : (
              <Square size={18} strokeWidth={2} className="text-[#898989]" />
            )}
          </div>
          <span className="text-[13px] font-semibold text-[#1c5258] w-[100px] shrink-0">ID</span>
          <span className="text-[13px] font-semibold text-[#1c5258] flex-[1.5]">Nome</span>
          <span className="text-[13px] font-semibold text-[#1c5258] flex-[1.2]">Telefone</span>
          <span className="text-[13px] font-semibold text-[#1c5258] flex-[1.5]">UF</span>
          <span className="text-[13px] font-semibold text-[#1c5258] flex-1">Cadastro</span>
          <span className="text-[13px] font-semibold text-[#1c5258] flex-1">Source</span>
        </div>

        <div className="mt-2 flex flex-col pb-2">
          {clientes.map((cliente, idx) => {
            const selecionado = selecionados.includes(cliente.id)
            return (
              <div key={cliente.id} className="flex flex-col">
                <div
                  className={`flex items-center px-4 py-4 cursor-pointer transition-colors ${
                    selecionado ? 'bg-[#e5ebeb]' : 'hover:bg-[#fcfdfd]'
                  }`}
                  onClick={() => navigate(`/clientes/${cliente.id.replace('#', '')}`)}
                >
                  <div 
                    className="w-8 shrink-0 flex items-center justify-center cursor-pointer"
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleSelecionado(cliente.id);
                    }}
                  >
                    {selecionado ? (
                      <CheckSquare size={18} strokeWidth={2} className="text-[#1c5258]" />
                    ) : (
                      <Square size={18} strokeWidth={2} className="text-[#4d4d4d]" />
                    )}
                  </div>
                  <span className="text-[14px] text-[#343434] font-medium w-[100px] shrink-0">{cliente.id}</span>
                  <span className="text-[14px] text-[#111111] font-semibold flex-[1.5]">{cliente.nome}</span>
                  <span className="text-[14px] text-[#343434] font-medium flex-[1.2]">{cliente.telefone}</span>
                  <span className="text-[14px] text-[#343434] font-medium flex-[1.5]">{cliente.uf}</span>
                  <span className="text-[14px] text-[#343434] font-medium flex-1">{cliente.cadastro}</span>
                  <span className="text-[14px] text-[#111111] font-semibold flex-1">{cliente.source}</span>
                </div>
                {idx < clientes.length - 1 && <div className="border-t border-[#f0f0f0] mx-4" />}
              </div>
            )
          })}
        </div>
      </div>

      {/* Paginação */}
      <div className="flex items-center justify-center gap-[6px] py-4 border-t border-[#f0f0f0] mt-auto">
        <button
          onClick={() => setPaginaAtual(prev => Math.max(1, prev - 1))}
          disabled={paginaAtual === 1}
          className={`w-[26px] h-[26px] flex items-center justify-center rounded-full border border-[#e0e0e0] text-[#898989] transition-colors ${
            paginaAtual === 1 ? 'opacity-30 cursor-not-allowed' : 'hover:bg-[#f6f7f9]'
          }`}
        >
          <ChevronLeft size={16} strokeWidth={2.5} />
        </button>

        <div className="flex items-center gap-[4px]">
          {Array.from({ length: totalPaginas }, (_, i) => i + 1).map((p) => (
            <button
              key={p}
              onClick={() => setPaginaAtual(p)}
              className={`w-[26px] h-[26px] flex items-center justify-center rounded-full text-[11px] font-bold transition-colors ${
                paginaAtual === p 
                  ? 'bg-[#e0e0e0] text-[#343434]' 
                  : 'text-[#898989] hover:bg-[#f6f7f9]'
              }`}
            >
              {p.toString().padStart(2, '0')}
            </button>
          ))}
        </div>

        <button
          onClick={() => setPaginaAtual(prev => Math.min(totalPaginas, prev + 1))}
          disabled={paginaAtual === totalPaginas}
          className={`w-[26px] h-[26px] flex items-center justify-center rounded-full border border-[#e0e0e0] text-[#898989] transition-colors ${
            paginaAtual === totalPaginas ? 'opacity-30 cursor-not-allowed' : 'hover:bg-[#f6f7f9]'
          }`}
        >
          <ChevronRight size={16} strokeWidth={2.5} />
        </button>
      </div>

      {/* Modais Baseados no Design */}

      {/* Modal de Edição */}
      {modalEditar && edicao && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-[2px]">
          <div className="bg-[#fcfdfd] rounded-[16px] shadow-[0_8px_30px_rgba(0,0,0,0.15)] border border-[#e0e0e0] w-[640px] p-6 flex flex-col gap-5 relative max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setModalEditar(false)}
              className="absolute top-5 right-5 text-[#898989] hover:text-[#111111] transition-colors"
            >
              <X size={18} strokeWidth={2} />
            </button>
            
            <h2 className="text-[15px] font-bold text-[#111111] text-center w-full pb-2">
              Edição de linhas selecionadas ({String(selecionados.length).padStart(2, '0')})
            </h2>

            <div className="flex flex-col gap-4 px-2">
              {/* ID */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[12px] font-semibold text-[#b3b3b3]">ID</label>
                <input
                  type="text"
                  value={edicao.uuid}
                  readOnly
                  className="w-full h-[40px] px-3 border border-[#343434] rounded-[8px] text-[13px] text-[#111] font-medium bg-white focus:outline-none"
                />
              </div>

              {/* Nome */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[12px] font-semibold text-[#b3b3b3]">Nome</label>
                <input
                  type="text"
                  value={edicao.nome}
                  onChange={(e) => setEdicao({ ...edicao, nome: e.target.value })}
                  className="w-full h-[40px] px-3 border border-[#343434] rounded-[8px] text-[13px] text-[#111] font-medium bg-white focus:outline-none"
                />
              </div>

              {/* Telefone */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[12px] font-semibold text-[#b3b3b3]">Telefone</label>
                <input
                  type="text"
                  value={edicao.telefone}
                  onChange={(e) => setEdicao({ ...edicao, telefone: e.target.value })}
                  className="w-full h-[40px] px-3 border border-[#343434] rounded-[8px] text-[13px] text-[#111] font-medium bg-white focus:outline-none"
                />
              </div>

              {/* Localização */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[12px] font-semibold text-[#b3b3b3]">Localização</label>
                <div className="relative">
                  <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#898989]" strokeWidth={1.5} />
                  <input
                    type="text"
                    value={buscaLocalizacaoEdicao}
                    onChange={(e) => setBuscaLocalizacaoEdicao(e.target.value)}
                    placeholder="Buscar (ex: Recife ou Pernambuco)..."
                    className="w-full h-[40px] pl-9 pr-3 border border-[#b3b3b3] rounded-[8px] text-[13px] text-[#343434] placeholder-[#898989] bg-white focus:outline-none"
                  />
                  {buscaLocalizacaoEdicao.length >= 2 && obterSugestoesLocalizacao(buscaLocalizacaoEdicao).length > 0 && (
                    <div className="absolute top-[calc(100%+4px)] left-0 w-full bg-[#fcfdfd] border border-[#e0e0e0] rounded-[8px] flex flex-col py-2 shadow-sm z-50">
                      {obterSugestoesLocalizacao(buscaLocalizacaoEdicao).map((sugestao) => (
                        <button
                          key={sugestao}
                          onClick={() => {
                            setEdicao({ ...edicao, localizacao: sugestao })
                            setBuscaLocalizacaoEdicao('')
                          }}
                          className="text-[13px] text-[#111] hover:bg-[#f6f7f9] px-4 py-2 text-left transition-colors"
                        >
                          {sugestao}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                {edicao.localizacao && (
                  <div className="mt-1">
                    <span className="inline-flex items-center gap-2 px-3 py-1.5 border border-[#343434] rounded-[8px] text-[12px] font-semibold text-[#111] bg-white">
                      {edicao.localizacao}
                      <button onClick={() => setEdicao({ ...edicao, localizacao: '' })} className="hover:text-red-500 transition-colors"><X size={14} /></button>
                    </span>
                  </div>
                )}
              </div>

              {/* Data de Cadastro */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[12px] font-semibold text-[#b3b3b3]">Data de Cadastro</label>
                <input
                  type="text"
                  value={edicao.cadastro}
                  onChange={(e) => setEdicao({ ...edicao, cadastro: e.target.value })}
                  className="w-full h-[40px] px-3 border border-[#343434] rounded-[8px] text-[13px] text-[#111] font-medium bg-white focus:outline-none"
                />
              </div>

              {/* Source (Figma diz Data de Cadastro, mas é o Source) */}
              <div className="flex flex-col gap-1.5 mt-1">
                <label className="text-[12px] font-semibold text-[#b3b3b3]">Data de Cadastro</label>
                <div className="flex gap-2">
                  {SOURCES.map((s) => (
                    <button
                      key={s}
                      onClick={() => setEdicao({ ...edicao, source: s })}
                      className={`border px-4 py-1.5 rounded-[8px] text-[12px] font-bold transition-colors ${
                        edicao.source === s
                          ? 'border-[#1c5258] text-[#1c5258]'
                          : 'border-[#e0e0e0] text-[#343434] hover:border-[#b3b3b3]'
                      }`}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Footer Botões */}
            <div className="flex items-center justify-end gap-3 mt-4 pr-2">
              <button
                onClick={abrirConfirmacaoEdicao}
                className="h-[36px] px-6 bg-[#1c5258] rounded-[100px] text-[13px] font-semibold text-white hover:bg-[#154247] transition-colors"
              >
                Aplicar
              </button>
              <button
                onClick={() => setModalEditar(false)}
                className="h-[36px] px-6 border border-[#343434] rounded-[100px] text-[13px] font-semibold text-[#343434] hover:bg-[#f6f7f9] transition-colors"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Confirmar Exportação */}
      {modalExportar && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-[#f6f7f9]/80 backdrop-blur-[2px]">
          <div className="bg-white rounded-[16px] shadow-[0_8px_30px_rgba(0,0,0,0.12)] border border-[#e0e0e0] w-[320px] p-6 flex flex-col items-center gap-6 relative">
            <h2 className="text-[16px] font-semibold text-[#111111] text-center px-4 leading-tight">
              Deseja exportar<br />linhas selecionadas ({String(selecionados.length).padStart(2, '0')})?
            </h2>
            <div className="flex items-center gap-3">
              <button
                onClick={confirmarExportacao}
                className="h-[38px] px-5 bg-[#1c5258] rounded-[100px] text-[13px] font-semibold text-white hover:bg-[#154247] transition-colors"
              >
                Confirmar
              </button>
              <button
                onClick={() => setModalExportar(false)}
                className="h-[38px] px-5 border border-[#343434] rounded-[100px] text-[13px] font-semibold text-[#343434] hover:bg-[#f6f7f9] transition-colors"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast Sucesso Exportação */}
      {modalSucesso && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-[2px] animate-in fade-in duration-200">
          <div className="bg-white rounded-[16px] shadow-[0_8px_30px_rgba(0,0,0,0.15)] w-[300px] p-8 flex flex-col items-center gap-4">
            <div className="w-12 h-12 rounded-full border-2 border-[#1a9a45] flex items-center justify-center">
              <Check size={28} strokeWidth={2.5} className="text-[#1a9a45]" />
            </div>
            <h2 className="text-[18px] font-semibold text-[#111111] text-center leading-snug">
              Lista exportada com<br />sucesso!
            </h2>
          </div>
        </div>
      )}

      {/* Modal Confirmar Alterações (Edição) */}
      {modalConfirmarEdicao && clienteOriginal && edicao && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-[#f6f7f9]/80 backdrop-blur-[2px]">
          <div className="bg-[#fcfdfd] rounded-[16px] shadow-[0_8px_30px_rgba(0,0,0,0.12)] border border-[#e0e0e0] w-[460px] p-8 flex flex-col items-center gap-6 relative">
            <h2 className="text-[16px] font-semibold text-[#111111] text-center px-4 leading-relaxed">
              Confirmar alterações em<br />
              <span className="font-normal">
                "Localidade" ({clienteOriginal.uf} → {edicao.localizacao}) e<br />
                "Telefone" ({clienteOriginal.telefone} → {edicao.telefone})
              </span>
            </h2>
            <div className="flex items-center gap-3">
              <button
                onClick={confirmarEdicao}
                className="h-[38px] px-6 bg-[#1c5258] rounded-[100px] text-[13px] font-semibold text-white hover:bg-[#154247] transition-colors"
              >
                Confirmar
              </button>
              <button
                onClick={() => setModalConfirmarEdicao(false)}
                className="h-[38px] px-6 border border-[#343434] rounded-[100px] text-[13px] font-semibold text-[#343434] hover:bg-[#f6f7f9] transition-colors"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast Sucesso Edição */}
      {modalSucessoEdicao && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-[2px] animate-in fade-in duration-200">
          <div className="bg-white rounded-[16px] shadow-[0_8px_30px_rgba(0,0,0,0.15)] w-[300px] p-8 flex flex-col items-center gap-4">
            <div className="w-12 h-12 rounded-full border-2 border-[#1a9a45] flex items-center justify-center">
              <Check size={28} strokeWidth={2.5} className="text-[#1a9a45]" />
            </div>
            <h2 className="text-[18px] font-semibold text-[#111111] text-center leading-snug">
              Lista editada com<br />sucesso!
            </h2>
          </div>
        </div>
      )}

    </div>
  )
}

import { useState, useRef, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { LayoutPrincipal } from '../../components/templates/LayoutPrincipal'
import { CardKpi } from '../../components/molecules/dashboard/CardKpi'
import { 
  Smile, 
  ShoppingBag, 
  Tag, 
  TrendingUp, 
  ArrowLeft, 
  Edit2, 
  Upload,
  Search,
  Check,
  X,
  Square,
  CheckSquare,
  MinusSquare,
  ChevronLeft,
  ChevronRight,
  Filter,
  User,
  Loader2
} from 'lucide-react'
import { CIDADES_MOCK, ESTADOS_MAP } from '../../constants/cidades'
import { DropdownOrganizarLista } from '../../components/molecules/clientes/DropdownOrganizarLista'
import { ModalSucesso } from '../../components/molecules/compartilhados/ModalSucesso'
import { usePerfilCliente, usePedidosCliente } from '../../hooks/useClientes'

export default function ClientePerfil() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()

  // Hooks de Dados Reais
  const { data: cliente, isLoading: loadingPerfil } = usePerfilCliente(id || '')
  const { data: pedidos = [], isLoading: loadingPedidos } = usePedidosCliente(id || '')

  // Modais (Mantidos para UI, mas agora sem lógica de persistência mock)
  const [modalEditar, setModalEditar] = useState(false)
  const [edicao, setEdicao] = useState<any>(null)
  const [modalConfirmar, setModalConfirmar] = useState(false)
  const [modalSucesso, setModalSucesso] = useState(false)
  
  const [modalExportar, setModalExportar] = useState(false)
  const [modalExportarSucesso, setModalExportarSucesso] = useState(false)
  
  const [buscaEndereco, setBuscaEndereco] = useState('')
  const [selecionados, setSelecionados] = useState<string[]>([])

  // Sincroniza estado de edição quando o cliente carrega
  useEffect(() => {
    if (cliente) setEdicao({ ...cliente })
  }, [cliente])

  if (loadingPerfil || !cliente) {
    return (
      <LayoutPrincipal titulo="CLIENTES > PERFIL DO CLIENTE">
        <div className="flex items-center justify-center h-[400px]">
          <Loader2 className="animate-spin text-[#1c5258]" size={40} />
        </div>
      </LayoutPrincipal>
    )
  }
  
  const todosSelecionados = selecionados.length === pedidos.length && pedidos.length > 0
  const algunsSelecionados = selecionados.length > 0 && selecionados.length < pedidos.length

  function toggleSelecionado(pid: string) {
    setSelecionados(prev => prev.includes(pid) ? prev.filter(p => p !== pid) : [...prev, pid])
  }

  function toggleTodos() {
    if (todosSelecionados) setSelecionados([])
    else setSelecionados(pedidos.map(p => p.id))
  }

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
      if (ufBuscada) return cidade.endsWith(ufBuscada)
      return cidadeNorm.includes(termo)
    }).slice(0, 5)
  }

  const sugestoesLocalizacao = obterSugestoesLocalizacao(buscaEndereco)

  function abrirConfirmacao() {
    setModalEditar(false)
    setModalConfirmar(true)
  }

  function confirmarEdicao() {
    setModalConfirmar(false)
    setModalSucesso(true)
    setTimeout(() => setModalSucesso(false), 3000)
  }

  function confirmarExportacao() {
    setModalExportar(false)
    setModalExportarSucesso(true)
    setTimeout(() => setModalExportarSucesso(false), 3000)
  }

  return (
    <LayoutPrincipal titulo="CLIENTES > PERFIL DO CLIENTE">
      <div className="flex flex-col gap-6 h-full pb-8">
        {/* Voltar */}
        <button 
          onClick={() => navigate('/clientes')}
          className="flex items-center gap-2 text-[13px] font-semibold text-[#898989] hover:text-[#343434] transition-colors self-start"
        >
          <ArrowLeft size={16} />
          Todos os clientes
        </button>

        {/* Card Perfil */}
        <div className="bg-white rounded-[16px] shadow-[0px_8px_30px_0px_rgba(0,0,0,0.05)] p-6 md:p-8 flex flex-col lg:flex-row items-center gap-6 md:gap-8 relative">
          <div className="absolute top-4 right-4 md:top-6 md:right-6 flex gap-2">
            <button 
              onClick={() => { setEdicao({...cliente}); setModalEditar(true) }}
              className="w-[36px] h-[36px] rounded-[8px] flex items-center justify-center text-[#343434] hover:bg-[#f6f7f9] transition-colors"
            >
              <Edit2 size={18} strokeWidth={2} />
            </button>
            <button 
              onClick={() => setModalExportar(true)}
              className="w-[36px] h-[36px] rounded-[8px] flex items-center justify-center text-[#343434] hover:bg-[#f6f7f9] transition-colors"
            >
              <Upload size={18} strokeWidth={2} />
            </button>
          </div>

          <div className="w-[120px] h-[120px] shrink-0 rounded-full bg-[#f6f7f9] overflow-hidden flex items-center justify-center border border-[#e0e0e0]">
            <User size={60} className="text-[#b3b3b3]" />
          </div>

          <div className="flex flex-col gap-6 flex-1 w-full">
            <div className="flex flex-col gap-1.5 items-center lg:items-start text-center lg:text-left mt-4 lg:mt-0">
              <div className="flex flex-wrap items-center justify-center lg:justify-start gap-3">
                <h1 className="text-[20px] font-bold text-[#111111] leading-none">{cliente.nome_completo}</h1>
                <span className="px-2.5 py-1 bg-white text-[#1a9a45] rounded-full text-[11px] font-bold border border-[#1a9a45] rounded-full text-[11px] font-bold border border-[#1a9a45] leading-none whitespace-nowrap">
                  {cliente.segmento_rfm}
                </span>
                {cliente.tickets_abertos > 0 && (
                  <span className="px-2.5 py-1 bg-white text-[#e67a00] rounded-full text-[11px] font-bold border border-[#e67a00] leading-none whitespace-nowrap">
                    {cliente.tickets_abertos} tickets abertos
                  </span>
                )}
              </div>
              <p className="text-[12px] font-medium text-[#898989]">
                Cliente desde {cliente.data_cadastro} • Última compra em {cliente.ultimo_pedido || 'N/A'}
              </p>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-4 w-full">
              <div className="flex flex-col gap-1">
                <span className="text-[11px] font-semibold text-[#b3b3b3]">Origem</span>
                <span className="text-[13px] font-medium text-[#343434] uppercase">{cliente.origem}</span>
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-[11px] font-semibold text-[#b3b3b3]">E-mail</span>
                <span className="text-[13px] font-medium text-[#343434]">{cliente.email}</span>
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-[11px] font-semibold text-[#b3b3b3]">Gênero / Idade</span>
                <span className="text-[13px] font-medium text-[#343434]">{cliente.genero} / {cliente.idade} anos</span>
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-[11px] font-semibold text-[#b3b3b3]">Localização</span>
                <span className="text-[13px] font-medium text-[#343434]">{cliente.cidade} - {cliente.estado}</span>
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-[11px] font-semibold text-[#b3b3b3]">ID do cliente</span>
                <span className="text-[12px] font-medium text-[#343434] truncate" title={cliente.id}>{cliente.id}</span>
              </div>
            </div>
          </div>
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-[14px]">
          <CardKpi 
            titulo="NPS Médio" 
            valor={cliente.nps_medio ? cliente.nps_medio.toFixed(1) : "—"} 
            variacao="Avaliação" 
            tipo="bom" 
            icone={<Smile size={24} />} 
          />
          <CardKpi 
            titulo="Total Pedidos" 
            valor={cliente.total_pedidos.toString()} 
            variacao="Histórico" 
            tipo="bom" 
            icone={<ShoppingBag size={24} />} 
          />
          <CardKpi 
            titulo="Ticket Médio" 
            valor={`R$ ${cliente.ticket_medio.toFixed(2)}`} 
            variacao="Média" 
            tipo="bom" 
            icone={<Tag size={24} className="rotate-90" />} 
          />
          <CardKpi 
            titulo="Total Gasto" 
            valor={`R$ ${cliente.total_gasto.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`} 
            variacao="Lifetime Value" 
            tipo="bom" 
            icone={<TrendingUp size={24} />} 
          />
        </div>

        {/* Histórico de Pedidos */}
        <div className="bg-white rounded-[16px] shadow-[0px_8px_30px_0px_rgba(0,0,0,0.05)] p-6 flex flex-col gap-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-[16px] font-bold text-[#1c5258] leading-none mb-1">Histórico de pedidos</h2>
              <p className="text-[12px] font-medium text-[#b3b3b3]">{pedidos.length.toString().padStart(2, '0')} pedidos no total</p>
            </div>
            {loadingPedidos && <Loader2 className="animate-spin text-[#1c5258]" size={20} />}
          </div>

          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex flex-col sm:flex-row gap-2 sm:items-center">
              <DropdownOrganizarLista />
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Search size={16} className="text-[#898989]" />
                </div>
                <input 
                  type="text" 
                  placeholder="Pesquisar pedido..." 
                  className="h-[36px] pl-9 pr-4 rounded-[100px] bg-[#f6f7f9] border-none text-[13px] font-medium text-[#111111] outline-none placeholder:text-[#898989] w-full sm:w-[200px]"
                />
              </div>
            </div>
            
            <div className="flex gap-2">
              <button 
                disabled={selecionados.length === 0}
                className="w-[36px] h-[36px] rounded-[100px] flex items-center justify-center bg-[#f6f7f9] text-[#343434] transition-colors disabled:opacity-40"
              >
                <Edit2 size={16} strokeWidth={2.5} />
              </button>
              <button className="w-[36px] h-[36px] rounded-[100px] flex items-center justify-center bg-[#f6f7f9] text-[#343434] hover:bg-[#e0e0e0] transition-colors">
                <Filter size={16} strokeWidth={2.5} />
              </button>
              <button 
                disabled={selecionados.length === 0}
                className="w-[36px] h-[36px] rounded-[100px] flex items-center justify-center bg-[#f6f7f9] text-[#343434] transition-colors disabled:opacity-40"
              >
                <Upload size={16} strokeWidth={2.5} />
              </button>
            </div>
          </div>

          {/* Tabela Pedidos */}
          <div className="flex flex-col overflow-x-auto">
            <div className="min-w-[800px] flex items-center px-4 py-3 bg-[#f6f7f9] border-b border-[#e0e0e0] rounded-t-[8px]">
              <div className="w-8 shrink-0 flex items-center justify-center cursor-pointer" onClick={toggleTodos}>
                {todosSelecionados ? <CheckSquare size={18} strokeWidth={2} className="text-[#343434]" /> : algunsSelecionados ? <MinusSquare size={18} strokeWidth={2} className="text-[#343434]" /> : <Square size={18} strokeWidth={2} className="text-[#898989]" />}
              </div>
              <span className="text-[13px] font-semibold text-[#1c5258] flex-1">Pedido</span>
              <span className="text-[13px] font-semibold text-[#1c5258] flex-[1.5]">Produto</span>
              <span className="text-[13px] font-semibold text-[#1c5258] flex-1">Valor</span>
              <span className="text-[13px] font-semibold text-[#1c5258] flex-1">Data</span>
              <span className="text-[13px] font-semibold text-[#1c5258] flex-1">Pgto.</span>
              <span className="text-[13px] font-semibold text-[#1c5258] flex-[1.5]">Status</span>
              <span className="text-[13px] font-semibold text-[#1c5258] w-[50px] shrink-0 text-right pr-2">Qtd.</span>
            </div>

            <div className="flex flex-col pb-2 min-w-[800px]">
              {pedidos.map((pedido, idx) => {
                const isSelected = selecionados.includes(pedido.id)
                return (
                  <div key={pedido.id} className="flex flex-col">
                    <div 
                      className={`flex items-center px-4 py-4 cursor-pointer transition-colors ${isSelected ? 'bg-[#e5ebeb]' : 'hover:bg-[#fcfdfd]'}`}
                      onClick={() => toggleSelecionado(pedido.id)}
                    >
                      <div className="w-8 shrink-0 flex items-center justify-center">
                        {isSelected ? <CheckSquare size={18} strokeWidth={2} className="text-[#1c5258]" /> : <Square size={18} strokeWidth={2} className="text-[#4d4d4d]" />}
                      </div>
                      <span className="text-[12px] text-[#898989] font-medium flex-1 truncate pr-2" title={pedido.id}>{pedido.id}</span>
                      <span className="text-[14px] text-[#111111] font-semibold flex-[1.5]">{pedido.nome_produto}</span>
                      <span className="text-[14px] text-[#343434] font-medium flex-1">R$ {pedido.valor.toFixed(2)}</span>
                      <span className="text-[14px] text-[#343434] font-medium flex-1">{pedido.data}</span>
                      <span className="text-[14px] text-[#343434] font-medium flex-1 uppercase">{pedido.metodo_pagamento || '—'}</span>
                      <div className="flex-[1.5] flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${pedido.status === 'aprovado' ? 'bg-[#1a9a45]' : 'bg-[#e67a00]'}`} />
                        <span className="text-[13px] font-semibold text-[#111111] capitalize">{pedido.status}</span>
                      </div>
                      <span className="text-[14px] text-[#343434] font-medium w-[50px] shrink-0 text-right pr-2">{pedido.quantidade.toString().padStart(2, '0')}</span>
                    </div>
                    {idx < pedidos.length - 1 && <div className="border-t border-[#f0f0f0] mx-4" />}
                  </div>
                )
              })}
              {!loadingPedidos && pedidos.length === 0 && (
                <div className="py-10 text-center text-[#898989] text-[14px]">Nenhum pedido encontrado para este cliente.</div>
              )}
            </div>
          </div>
        </div>

        {/* Modal Sucesso */}
        {modalSucesso && <ModalSucesso mensagem="Ação realizada com sucesso!" />}
      </div>
    </LayoutPrincipal>
  )
}

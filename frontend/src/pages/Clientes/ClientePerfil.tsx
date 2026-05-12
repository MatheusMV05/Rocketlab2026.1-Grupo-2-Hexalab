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
  Filter
} from 'lucide-react'
import { CIDADES_MOCK, ESTADOS_MAP } from '../../constants/cidades'
import { DropdownOrganizarLista } from '../../components/molecules/clientes/DropdownOrganizarLista'

import { CLIENTES_MOCK_ALL } from '../../constants/mockClientes'

const MOCK_PEDIDOS = [
  { id: '#2c209', produto: 'PROD-0060', valor: 'R$473,82', periodo: '2025-07-29', pgto: 'wall-et', status: 'Em atendimento', qtd: '01' },
  { id: '#2c210', produto: 'PROD-0060', valor: 'R$473,82', periodo: '2025-07-29', pgto: 'wall-et', status: 'Em atendimento', qtd: '01' },
  { id: '#2c211', produto: 'PROD-0060', valor: 'R$473,82', periodo: '2025-07-29', pgto: 'wall-et', status: 'Em atendimento', qtd: '01' },
  { id: '#2c212', produto: 'PROD-0060', valor: 'R$473,82', periodo: '2025-07-29', pgto: 'wall-et', status: 'Em atendimento', qtd: '01' },
  { id: '#2c213', produto: 'PROD-0060', valor: 'R$473,82', periodo: '2025-07-29', pgto: 'wall-et', status: 'Em atendimento', qtd: '01' },
  { id: '#2c214', produto: 'PROD-0060', valor: 'R$473,82', periodo: '2025-07-29', pgto: 'wall-et', status: 'Em atendimento', qtd: '01' },
]

export default function ClientePerfil() {
  const { id } = useParams()
  const navigate = useNavigate()

  // Busca o cliente pelo ID (removendo o # se necessário)
  const clienteEncontrado = CLIENTES_MOCK_ALL.find(c => c.id.replace('#', '') === id) || CLIENTES_MOCK_ALL[0]

  const [cliente, setCliente] = useState(clienteEncontrado)

  // Atualiza o estado se o ID na URL mudar
  useEffect(() => {
    const novoCliente = CLIENTES_MOCK_ALL.find(c => c.id.replace('#', '') === id)
    if (novoCliente) {
      setCliente(novoCliente)
      setEdicao(novoCliente)
    }
  }, [id])

  // Modais
  const [modalEditar, setModalEditar] = useState(false)
  const [edicao, setEdicao] = useState({...cliente})
  const [modalConfirmar, setModalConfirmar] = useState(false)
  const [modalSucesso, setModalSucesso] = useState(false)
  
  const [modalExportar, setModalExportar] = useState(false)
  const [modalExportarSucesso, setModalExportarSucesso] = useState(false)
  
  // Busca Endereço
  const [buscaEndereco, setBuscaEndereco] = useState('')

  // Tabela Pedidos
  const [selecionados, setSelecionados] = useState<string[]>([])
  
  const todosSelecionados = selecionados.length === MOCK_PEDIDOS.length && MOCK_PEDIDOS.length > 0
  const algunsSelecionados = selecionados.length > 0 && selecionados.length < MOCK_PEDIDOS.length

  function toggleSelecionado(pid: string) {
    setSelecionados(prev => prev.includes(pid) ? prev.filter(p => p !== pid) : [...prev, pid])
  }

  function toggleTodos() {
    if (todosSelecionados) setSelecionados([])
    else setSelecionados(MOCK_PEDIDOS.map(p => p.id))
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

  // Lógica para detectar qual campo mudou para o modal de confirmação
  const [campoAlterado, setCampoAlterado] = useState<{label: string, de: string, para: string} | null>(null)

  function abrirConfirmacao() {
    const labels: Record<string, string> = {
      nome: 'Nome',
      telefone: 'Telefone',
      email: 'E-mail',
      endereco: 'Endereço',
      cadastro: 'Data de Cadastro'
    }

    for (const key in labels) {
      if ((edicao as any)[key] !== (cliente as any)[key]) {
        setCampoAlterado({
          label: labels[key],
          de: (cliente as any)[key],
          para: (edicao as any)[key]
        })
        break
      }
    }
    
    setModalEditar(false)
    setModalConfirmar(true)
  }

  function confirmarEdicao() {
    setCliente(edicao)
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
        <div className="bg-white rounded-[16px] shadow-[0px_8px_30px_0px_rgba(0,0,0,0.05)] p-8 flex items-center gap-8 relative">
          <div className="absolute top-6 right-6 flex gap-2">
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

          <div className="w-[120px] h-[120px] shrink-0 rounded-full bg-gray-200 overflow-hidden">
            {/* Foto de placeholder fiel ao mockup */}
            <img src="https://i.pravatar.cc/300?img=47" alt="Perfil" className="w-full h-full object-cover" />
          </div>

          <div className="flex flex-col gap-6 flex-1">
            <div className="flex flex-col gap-1.5">
              <div className="flex items-center gap-3">
                <h1 className="text-[20px] font-bold text-[#111111] leading-none">{cliente.nome}</h1>
                <span className="px-2.5 py-1 bg-white text-[#1a9a45] rounded-full text-[11px] font-bold border border-[#1a9a45] leading-none">Cliente ativo</span>
                <span className="px-2.5 py-1 bg-white text-[#e67a00] rounded-full text-[11px] font-bold border border-[#e67a00] leading-none">Tickets em aberto</span>
              </div>
              <p className="text-[12px] font-medium text-[#898989]">Cliente desde {cliente.clienteDesde} • Última compra a {cliente.ultimaCompra}</p>
            </div>

            <div className="flex items-center justify-between gap-4 max-w-[800px]">
              <div className="flex flex-col gap-1">
                <span className="text-[11px] font-semibold text-[#b3b3b3]">Telefone</span>
                <span className="text-[13px] font-medium text-[#343434]">{cliente.telefone}</span>
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-[11px] font-semibold text-[#b3b3b3]">E-mail</span>
                <span className="text-[13px] font-medium text-[#343434]">{cliente.email}</span>
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-[11px] font-semibold text-[#b3b3b3]">Cadastro</span>
                <span className="text-[13px] font-medium text-[#343434]">{cliente.cadastro}</span>
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-[11px] font-semibold text-[#b3b3b3]">Endereço</span>
                <span className="text-[13px] font-medium text-[#343434]">{cliente.endereco}</span>
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-[11px] font-semibold text-[#b3b3b3]">ID do cliente</span>
                <span className="text-[13px] font-medium text-[#343434]">{cliente.id}</span>
              </div>
            </div>
          </div>
        </div>

        {/* KPIs */}
        <div className="flex gap-4">
          <CardKpi titulo="Taxa de satisfação" valor="68%" variacao="+10%" tipo="bom" icone={<Smile size={24} />} />
          <CardKpi titulo="Média de compra" valor="05 itens /cliente" variacao="ABR/2026" tipo="bom" icone={<ShoppingBag size={24} />} />
          <CardKpi titulo="Ticket Médio" valor="R$ 335" variacao="+12%" tipo="bom" icone={<Tag size={24} className="rotate-90" />} />
          <CardKpi titulo="Média de receita" valor="R$ 148 /cliente" variacao="-12%" tipo="ruim" icone={<TrendingUp size={24} />} />
        </div>

        {/* Histórico de Pedidos */}
        <div className="bg-white rounded-[16px] shadow-[0px_8px_30px_0px_rgba(0,0,0,0.05)] p-6 flex flex-col gap-6">
          <div>
            <h2 className="text-[16px] font-bold text-[#1c5258] leading-none mb-1">Histórico de pedidos</h2>
            <p className="text-[12px] font-medium text-[#b3b3b3]">{MOCK_PEDIDOS.length.toString().padStart(2, '0')} pedidos no total</p>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex gap-2 items-center">
              <DropdownOrganizarLista />
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Search size={16} className="text-[#898989]" />
                </div>
                <input 
                  type="text" 
                  placeholder="Pesquisar..." 
                  className="h-[36px] pl-9 pr-4 rounded-[100px] bg-[#f6f7f9] border-none text-[13px] font-medium text-[#111111] outline-none placeholder:text-[#898989] w-[200px]"
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
          <div className="flex flex-col">
            <div className="flex items-center px-4 py-3 bg-[#f6f7f9] border-b border-[#e0e0e0] rounded-t-[8px]">
              <div className="w-8 shrink-0 flex items-center justify-center cursor-pointer" onClick={toggleTodos}>
                {todosSelecionados ? <CheckSquare size={18} strokeWidth={2} className="text-[#343434]" /> : algunsSelecionados ? <MinusSquare size={18} strokeWidth={2} className="text-[#343434]" /> : <Square size={18} strokeWidth={2} className="text-[#898989]" />}
              </div>
              <span className="text-[13px] font-semibold text-[#1c5258] flex-1">Pedido</span>
              <span className="text-[13px] font-semibold text-[#1c5258] flex-[1.5]">Produto</span>
              <span className="text-[13px] font-semibold text-[#1c5258] flex-1">Valor</span>
              <span className="text-[13px] font-semibold text-[#1c5258] flex-1">Período</span>
              <span className="text-[13px] font-semibold text-[#1c5258] flex-1">Pgto.</span>
              <span className="text-[13px] font-semibold text-[#1c5258] flex-[1.5]">Status</span>
              <span className="text-[13px] font-semibold text-[#1c5258] w-[50px] shrink-0 text-right pr-2">Qtd.</span>
            </div>

            <div className="flex flex-col pb-2">
              {MOCK_PEDIDOS.map((pedido, idx) => {
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
                      <span className="text-[14px] text-[#343434] font-medium flex-1">{pedido.id}</span>
                      <span className="text-[14px] text-[#111111] font-semibold flex-[1.5]">{pedido.produto}</span>
                      <span className="text-[14px] text-[#343434] font-medium flex-1">{pedido.valor}</span>
                      <span className="text-[14px] text-[#343434] font-medium flex-1">{pedido.periodo}</span>
                      <span className="text-[14px] text-[#343434] font-medium flex-1">{pedido.pgto}</span>
                      <div className="flex-[1.5] flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-[#e67a00]" />
                        <span className="text-[13px] font-semibold text-[#111111]">{pedido.status}</span>
                      </div>
                      <span className="text-[14px] text-[#343434] font-medium w-[50px] shrink-0 text-right pr-2">{pedido.qtd}</span>
                    </div>
                    {idx < MOCK_PEDIDOS.length - 1 && <div className="border-t border-[#f0f0f0] mx-4" />}
                  </div>
                )
              })}
            </div>
            
            {/* Paginação da Tabela de Pedidos */}
            <div className="flex items-center justify-center gap-[6px] py-4 border-t border-[#f0f0f0]">
              <button disabled className="w-[26px] h-[26px] flex items-center justify-center rounded-full border border-[#e0e0e0] text-[#898989] opacity-30 cursor-not-allowed">
                <ChevronLeft size={16} strokeWidth={2.5} />
              </button>
              <button className="w-[26px] h-[26px] flex items-center justify-center rounded-full text-[11px] font-bold bg-[#e0e0e0] text-[#343434]">01</button>
              <button disabled className="w-[26px] h-[26px] flex items-center justify-center rounded-full border border-[#e0e0e0] text-[#898989] opacity-30 cursor-not-allowed">
                <ChevronRight size={16} strokeWidth={2.5} />
              </button>
            </div>
          </div>
        </div>

        {/* Modal Editar Perfil */}
        {modalEditar && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-[#f6f7f9]/80 backdrop-blur-[2px]">
            <div className="bg-[#fcfdfd] rounded-[16px] shadow-[0_8px_30px_rgba(0,0,0,0.12)] border border-[#e0e0e0] w-[500px] relative overflow-hidden flex flex-col">
              <button onClick={() => setModalEditar(false)} className="absolute top-4 right-4 text-[#898989] hover:text-[#343434] transition-colors">
                <X size={20} />
              </button>
              
              <div className="pt-8 pb-4 px-8 border-b border-[#e0e0e0]">
                <h2 className="text-[16px] font-semibold text-[#111111] text-center">Edição de perfil do cliente</h2>
              </div>
              
              <div className="p-8 flex flex-col gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-[12px] font-semibold text-[#b3b3b3]">Nome</label>
                  <input value={edicao.nome} onChange={e => setEdicao({...edicao, nome: e.target.value})} className="w-full h-[40px] px-3 border border-[#343434] rounded-[8px] text-[13px] text-[#111] font-medium bg-white focus:outline-none" />
                </div>
                
                <div className="flex flex-col gap-1.5">
                  <label className="text-[12px] font-semibold text-[#b3b3b3]">Telefone</label>
                  <input value={edicao.telefone} onChange={e => setEdicao({...edicao, telefone: e.target.value})} className="w-full h-[40px] px-3 border border-[#343434] rounded-[8px] text-[13px] text-[#111] font-medium bg-white focus:outline-none" />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-[12px] font-semibold text-[#b3b3b3]">E-mail</label>
                  <input value={edicao.email} onChange={e => setEdicao({...edicao, email: e.target.value})} className="w-full h-[40px] px-3 border border-[#343434] rounded-[8px] text-[13px] text-[#111] font-medium bg-white focus:outline-none" />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-[12px] font-semibold text-[#b3b3b3]">Endereço</label>
                  {edicao.endereco ? (
                    <div className="relative">
                      <div className="w-max h-[40px] pl-3 pr-2 border border-[#343434] rounded-[8px] text-[13px] text-[#111] font-medium bg-white flex items-center justify-between gap-3">
                        <span>{edicao.endereco}</span>
                        <button onClick={() => setEdicao({...edicao, endereco: ''})} className="text-[#898989] hover:text-[#343434]">
                          <X size={16} />
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Search size={16} className="text-[#898989]" />
                      </div>
                      <input 
                        type="text" 
                        value={buscaEndereco}
                        onChange={(e) => setBuscaEndereco(e.target.value)}
                        placeholder="Buscar..." 
                        className="w-full h-[40px] pl-9 pr-3 border border-[#e0e0e0] rounded-[8px] text-[13px] text-[#111] font-medium bg-white focus:border-[#1c5258] focus:outline-none transition-colors"
                      />
                      {buscaEndereco.length >= 2 && sugestoesLocalizacao.length > 0 && (
                        <div className="absolute top-[44px] left-0 w-full bg-white border border-[#e0e0e0] rounded-[8px] shadow-[0px_4px_20px_rgba(0,0,0,0.08)] z-10 py-2">
                          {sugestoesLocalizacao.map((cidade) => (
                            <button
                              key={cidade}
                              onClick={() => {
                                setEdicao({ ...edicao, endereco: cidade })
                                setBuscaEndereco('')
                              }}
                              className="w-full text-left px-4 py-2 text-[13px] font-medium text-[#343434] hover:bg-[#f6f7f9] transition-colors"
                            >
                              {cidade}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-[12px] font-semibold text-[#b3b3b3]">Data de Cadastro</label>
                  <input value={edicao.cadastro} onChange={e => setEdicao({...edicao, cadastro: e.target.value})} className="w-full h-[40px] px-3 border border-[#343434] rounded-[8px] text-[13px] text-[#111] font-medium bg-white focus:outline-none" />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-[12px] font-semibold text-[#b3b3b3]">ID do cliente</label>
                  <input readOnly value={edicao.id} className="w-full h-[40px] px-3 border border-[#e0e0e0] rounded-[8px] text-[13px] text-[#898989] font-medium bg-[#f6f7f9] focus:outline-none cursor-not-allowed" />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 px-8 pb-8">
                <button onClick={abrirConfirmacao} className="h-[36px] px-6 bg-[#1c5258] rounded-[100px] text-[13px] font-semibold text-white hover:bg-[#154247] transition-colors">
                  Aplicar
                </button>
                <button onClick={() => setModalEditar(false)} className="h-[36px] px-6 border border-[#343434] rounded-[100px] text-[13px] font-semibold text-[#343434] hover:bg-[#f6f7f9] transition-colors">
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Modal Confirmar Edição */}
        {modalConfirmar && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-[#f6f7f9]/80 backdrop-blur-[2px]">
            <div className="bg-[#fcfdfd] rounded-[16px] shadow-[0_8px_30px_rgba(0,0,0,0.12)] border border-[#e0e0e0] w-[460px] p-8 flex flex-col items-center gap-6 relative">
              <h2 className="text-[16px] font-semibold text-[#111111] text-center px-4 leading-relaxed">
                Confirmar alterações em<br />
                <span className="font-normal">
                  "{campoAlterado?.label || 'Informações'}" ({campoAlterado?.de} → {campoAlterado?.para})?
                </span>
              </h2>
              <div className="flex items-center gap-3">
                <button onClick={confirmarEdicao} className="h-[38px] px-6 bg-[#1c5258] rounded-[100px] text-[13px] font-semibold text-white hover:bg-[#154247] transition-colors">
                  Confirmar
                </button>
                <button onClick={() => setModalConfirmar(false)} className="h-[38px] px-6 border border-[#343434] rounded-[100px] text-[13px] font-semibold text-[#343434] hover:bg-[#f6f7f9] transition-colors">
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Toast Sucesso Edição */}
        {modalSucesso && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-[2px] animate-in fade-in duration-200">
            <div className="bg-white rounded-[16px] shadow-[0_8px_30px_rgba(0,0,0,0.15)] w-[300px] p-8 flex flex-col items-center gap-4">
              <div className="w-12 h-12 rounded-full border-2 border-[#1a9a45] flex items-center justify-center">
                <Check size={28} strokeWidth={2.5} className="text-[#1a9a45]" />
              </div>
              <h2 className="text-[18px] font-semibold text-[#111111] text-center leading-snug">
                Perfil editado com<br />sucesso!
              </h2>
            </div>
          </div>
        )}

        {/* Modal Exportar */}
        {modalExportar && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-[2px] animate-in fade-in duration-200">
            <div className="bg-white rounded-[16px] shadow-[0_8px_30px_rgba(0,0,0,0.15)] w-[400px] p-8 flex flex-col items-center gap-6 relative">
              <h2 className="text-[16px] font-semibold text-[#111111] text-center px-4 leading-relaxed">
                Deseja exportar informações<br />
                do perfil do cliente ({cliente.nome})?
              </h2>
              <div className="flex items-center gap-3">
                <button onClick={confirmarExportacao} className="h-[38px] px-6 bg-[#1c5258] rounded-[100px] text-[13px] font-semibold text-white hover:bg-[#154247] transition-colors">
                  Confirmar
                </button>
                <button onClick={() => setModalExportar(false)} className="h-[38px] px-6 border border-[#343434] rounded-[100px] text-[13px] font-semibold text-[#343434] hover:bg-[#f6f7f9] transition-colors">
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Toast Sucesso Exportação */}
        {modalExportarSucesso && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-[2px] animate-in fade-in duration-200">
            <div className="bg-white rounded-[16px] shadow-[0_8px_30px_rgba(0,0,0,0.15)] w-[300px] p-8 flex flex-col items-center gap-4">
              <div className="w-12 h-12 rounded-full border-2 border-[#1a9a45] flex items-center justify-center">
                <Check size={28} strokeWidth={2.5} className="text-[#1a9a45]" />
              </div>
              <h2 className="text-[18px] font-semibold text-[#111111] text-center leading-snug">
                Perfil exportado com<br />sucesso!
              </h2>
            </div>
          </div>
        )}

      </div>
    </LayoutPrincipal>
  )
}

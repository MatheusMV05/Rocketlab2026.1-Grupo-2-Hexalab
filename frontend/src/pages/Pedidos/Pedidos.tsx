import { useState, useMemo } from 'react'
import { LayoutPrincipal } from '../../components/templates/LayoutPrincipal'
import { usePedidos, useKpisPedidos } from '../../hooks/usePedidos'
import { Box, CheckCircle, DollarSign, RefreshCcw, FileEdit, Filter, Upload } from 'lucide-react'
import { CardKpi } from '../../components/molecules/dashboard/CardKpi'
import { SeletorOrganizarLista } from '../../components/molecules/pedidos/SeletorOrganizarLista'
import { TabelaPedidosPremium } from '../../components/organisms/pedidos/TabelaPedidosPremium'
import { PainelFiltroAvancado } from '../../components/molecules/pedidos/PainelFiltroAvancado'
import { FiltroTag } from '../../components/atoms/compartilhados/FiltroTag'
import { Paginacao } from '../../components/molecules/compartilhados/Paginacao'
import { SecaoAnaliseFluxo } from '../../components/organisms/pedidos/SecaoAnaliseFluxo'
import { PedidoPerfilView } from '../../components/organisms/pedidos/PedidoPerfilView'
import { ModalEdicaoLote } from '../../components/molecules/pedidos/ModalEdicaoLote'
import { usePedido } from '../../hooks/usePedidos'
import { MESES_FILTRO } from '../../constants/opcoesFiltro'
import type { PedidoItem } from '../../types/pedidos'

export default function Pedidos() {
  const [pagina, setPagina] = useState(1)
  const [painelAberto, setPainelAberto] = useState(false)
  const [pedidoSelecionadoId, setPedidoSelecionadoId] = useState<string | null>(null)
  const [exibindoPerfil, setExibindoPerfil] = useState(false)
  const [selecionados, setSelecionados] = useState<string[]>([])
  const [modalEdicaoAberto, setModalEdicaoAberto] = useState(false)
  const [filtros, setFiltros] = useState({
    query: '',
    status: '',
    categoria: '',
    ano: '',
    mes: '',
  })

  // Converte mês nome para número para o backend
  const filtrosApi = useMemo(() => {
    const mesNum = filtros.mes ? MESES_FILTRO.indexOf(filtros.mes) + 1 : undefined
    return {
      ...filtros,
      ano: filtros.ano ? parseInt(filtros.ano) : undefined,
      mes: mesNum,
    }
  }, [filtros])

  const { data, isLoading, isError } = usePedidos({
    ...filtrosApi,
    pagina,
    tamanho: 10,
  })

  const { data: pedidoDetalhe, isLoading: isLoadingDetalhe } = usePedido(pedidoSelecionadoId || undefined)
  const { data: kpis } = useKpisPedidos()

  const pedidos = data?.itens ?? []
  const totalPaginas = data?.paginas ?? 1
  const totalResultados = data?.total ?? 0

  const handleFiltroChange = (novosFiltros: Partial<typeof filtros>) => {
    setFiltros(prev => ({ ...prev, ...novosFiltros }))
    setPagina(1)
  }

  const removerFiltro = (chave: keyof typeof filtros) => {
    setFiltros(prev => ({ ...prev, [chave]: '' }))
    setPagina(1)
  }

  const limparTodos = () => {
    setFiltros({
      query: '',
      status: '',
      categoria: '',
      ano: '',
      mes: '',
    })
    setPagina(1)
    setPainelAberto(false)
  }

  return (
    <LayoutPrincipal titulo={exibindoPerfil ? "PERFIL DO PEDIDO" : "PEDIDOS"}>
      <div className="flex flex-col gap-8">
        {exibindoPerfil ? (
          <PedidoPerfilView 
            pedidoId={pedidoSelecionadoId!}
            pedido={pedidoDetalhe}
            isLoading={isLoadingDetalhe}
            onClose={() => {
              setExibindoPerfil(false)
              setPedidoSelecionadoId(null)
            }}
          />
        ) : (
          <>
            {/* KPI Grid */}
        <div className="flex gap-4 overflow-x-auto pb-2">
          <CardKpi 
            titulo="Em andamento" 
            valor={`${(kpis?.processando ?? 0).toLocaleString('pt-BR')} pedidos`}
            variacao="+12%"
            tipo="bom"
            icone={<Box size={24} />} 
          />
          <CardKpi 
            titulo="Finalizados" 
            valor={`${(kpis?.aprovados ?? 0).toLocaleString('pt-BR')} pedidos`}
            variacao="-10%"
            tipo="ruim"
            icone={<CheckCircle size={24} />} 
          />
          <CardKpi 
            titulo="Total receita retida" 
            valor={kpis ? `R$ ${kpis.recusados_valor.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : '—'}
            variacao="-12%"
            tipo="ruim"
            icone={<DollarSign size={24} />} 
          />
          <CardKpi 
            titulo="Reembolsados" 
            valor={`${(kpis?.reembolsados ?? 0).toLocaleString('pt-BR')} pedidos`}
            variacao="+12%"
            tipo="bom"
            icone={<RefreshCcw size={24} />} 
          />
        </div>

        {/* Section Title */}
        <div className="flex flex-col gap-1">
          <h2 className="text-[18px] font-bold text-[#1d5358]">Pedidos</h2>
          <span className="text-[13px] text-[#898989]">{totalResultados} pedidos no total</span>
        </div>

        {/* Filters and Actions */}
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <SeletorOrganizarLista 
              valor={filtros.status} 
              onChange={(status) => handleFiltroChange({ status })} 
              onSearch={(query) => handleFiltroChange({ query })}
            />
            
            <div className="flex items-center gap-2">
              <button 
                onClick={() => selecionados.length > 0 && setModalEdicaoAberto(true)}
                disabled={selecionados.length === 0}
                className={`p-2.5 rounded-[10px] transition-all shadow-sm border ${
                  selecionados.length > 0
                  ? 'bg-white border-[#1d5358] text-[#1d5358] hover:bg-[#f6fbfb]'
                  : 'bg-gray-50 border-[#e0e0e0] text-gray-300 cursor-not-allowed'
                }`}
              >
                <FileEdit size={18} />
              </button>
              <button 
                onClick={() => setPainelAberto(!painelAberto)}
                className={`p-2.5 rounded-[10px] transition-all shadow-sm border ${
                  painelAberto 
                  ? 'bg-[#1d5358] text-white border-transparent' 
                  : 'bg-white text-[#898989] border-[#e0e0e0] hover:text-[#1d5358] hover:border-[#1d5358]'
                }`}
              >
                <Filter size={18} />
              </button>
              <button className="p-2.5 bg-white border border-[#e0e0e0] rounded-[10px] text-[#898989] hover:text-[#1d5358] hover:border-[#1d5358] transition-colors shadow-sm">
                <Upload size={18} />
              </button>
            </div>
          </div>
        

          {/* Active Tags */}
          <div className="flex flex-wrap gap-2">
            {filtros.query && (
              <FiltroTag label="Busca" valor={filtros.query} onRemove={() => removerFiltro('query')} />
            )}
            {filtros.status && (
              <FiltroTag label="Status" valor={filtros.status} onRemove={() => removerFiltro('status')} />
            )}
            {filtros.ano && (
              <FiltroTag label="Ano" valor={filtros.ano} onRemove={() => removerFiltro('ano')} />
            )}
            {filtros.mes && (
              <FiltroTag label="Mês" valor={filtros.mes} onRemove={() => removerFiltro('mes')} />
            )}
            {(filtros.query || filtros.status || filtros.ano || filtros.mes) && (
              <button 
                onClick={limparTodos}
                className="text-[13px] text-[#c20000] font-semibold hover:underline ml-2"
              >
                Limpar todos
              </button>
            )}
          </div>
        </div>

        {/* Advanced Filter Panel */}
        {painelAberto && (
          <PainelFiltroAvancado 
            filtrosAtuais={filtros}
            onAplicar={(f) => {
              handleFiltroChange(f)
              setPainelAberto(false)
            }}
            onLimpar={limparTodos}
          />
        )}

        {/* Main Table */}
        <TabelaPedidosPremium 
          pedidos={pedidos} 
          isLoading={isLoading} 
          isError={isError} 
          selecionados={selecionados}
          onSelecionadosChange={setSelecionados}
          onRowClick={(p) => {
            setPedidoSelecionadoId(p.id)
            setExibindoPerfil(true)
          }}
        />

        {/* Pagination */}
        <Paginacao 
          paginaAtual={pagina} 
          totalPaginas={totalPaginas} 
          onPaginaChange={setPagina} 
        />

        {/* Workflow Analysis Section */}
        <SecaoAnaliseFluxo />
      </>
    )}

        {/* Bulk Edit Modal */}
        <ModalEdicaoLote 
          isOpen={modalEdicaoAberto}
          onClose={() => setModalEdicaoAberto(false)}
          selectedCount={selecionados.length}
          onConfirm={(data) => {
            console.log('Bulk update data:', data, 'IDs:', selecionados)
            // Aqui chamariamos o service de bulk update
            setSelecionados([]) // Limpa seleção após sucesso
          }}
        />
      </div>
    </LayoutPrincipal>
  )
}

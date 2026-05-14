import { useState, useMemo } from 'react'
import { LayoutPrincipal } from '../../components/templates/LayoutPrincipal'
import { usePedidos } from '../../hooks/usePedidos'
import { Box, CheckCircle, Clock, RefreshCcw, FileEdit, Filter, Upload } from 'lucide-react'
import { CardKpi } from '../../components/molecules/dashboard/CardKpi'
import { SeletorOrganizarLista } from '../../components/molecules/pedidos/SeletorOrganizarLista'
import { TabelaPedidosPremium } from '../../components/organisms/pedidos/TabelaPedidosPremium'
import { PainelFiltroAvancado } from '../../components/molecules/pedidos/PainelFiltroAvancado'
import { FiltroTag } from '../../components/atoms/compartilhados/FiltroTag'
import { Paginacao } from '../../components/molecules/compartilhados/Paginacao'
import { MESES_FILTRO } from '../../constants/opcoesFiltro'

export default function Pedidos() {
  const [pagina, setPagina] = useState(1)
  const [painelAberto, setPainelAberto] = useState(false)
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
    <LayoutPrincipal titulo="PEDIDOS">
      <div className="flex flex-col gap-8">
        {/* KPI Grid */}
        <div className="flex gap-4 overflow-x-auto pb-2">
          <CardKpi 
            titulo="Em andamento" 
            valor="124 pedidos" 
            variacao="+12%" 
            tipo="bom"
            icone={<Box size={24} />} 
          />
          <CardKpi 
            titulo="Finalizados" 
            valor="124 pedidos" 
            variacao="-10%" 
            tipo="ruim"
            icone={<CheckCircle size={24} />} 
          />
          <CardKpi 
            titulo="Atrasados" 
            valor="124 pedidos" 
            variacao="-12%" 
            tipo="ruim"
            icone={<Clock size={24} />} 
          />
          <CardKpi 
            titulo="Reembolsados" 
            valor="124 pedidos" 
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
              <button className="p-2.5 bg-white border border-[#e0e0e0] rounded-[10px] text-[#898989] hover:text-[#1d5358] hover:border-[#1d5358] transition-colors shadow-sm">
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
        />

        {/* Pagination */}
        <Paginacao 
          paginaAtual={pagina} 
          totalPaginas={totalPaginas} 
          onPaginaChange={setPagina} 
        />

        {/* Analysis Sections (Simplified) */}
        <div className="mt-8 p-6 bg-white border border-[#e0e0e0] rounded-[24px] shadow-sm">
           <h3 className="text-[16px] font-bold text-[#1d5358] mb-1">Análise de Fluxo das etapas dos Pedidos</h3>
           <span className="text-[12px] text-[#898989] mb-6 block">{totalResultados} pedidos no total</span>
           
           <div className="flex gap-4 overflow-x-auto pb-4">
              {[
                { step: 'Recebimento do pedido', status: 'Atraso', color: '#c20000' },
                { step: 'Pagamento do pedido', status: 'Risco de atraso', color: '#e37405' },
                { step: 'Preparo do pedido', status: 'Dentro do SLA', color: '#1a9a45' },
                { step: 'Transporte de pedido', status: 'Dentro do SLA', color: '#1a9a45' },
                { step: 'Entrega do pedido', status: 'Risco de atraso', color: '#e37405' },
              ].map((flow, i) => (
                <div key={i} className="min-w-[200px] flex-1 bg-white border border-[#f0f0f0] rounded-[16px] p-4 relative">
                  <div className={`absolute top-2 right-2 px-2 py-0.5 rounded-[4px] text-[10px] font-bold uppercase border`} style={{ color: flow.color, borderColor: flow.color, backgroundColor: `${flow.color}10` }}>
                    {flow.status}
                  </div>
                  <div className="mt-4 flex flex-col gap-1">
                    <span className="text-[11px] text-[#898989] uppercase font-bold">Etapa</span>
                    <span className="text-[14px] font-bold text-[#343434] leading-tight">{flow.step}</span>
                  </div>
                  <div className="mt-4 flex flex-col gap-1">
                    <span className="text-[20px] font-bold text-[#343434]">125 pedidos</span>
                    <div className="flex items-center gap-1 text-[11px] text-[#898989]">
                      <Clock size={12} />
                      <span>22 Horas</span>
                    </div>
                  </div>
                  <div className="mt-4 h-6 w-full rounded-[4px]" style={{ backgroundColor: flow.color }}></div>
                </div>
              ))}
           </div>
        </div>
      </div>
    </LayoutPrincipal>
  )
}

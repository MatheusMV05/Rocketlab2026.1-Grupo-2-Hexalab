import { useState } from 'react'
import { FileText, DollarSign, Box, Truck, UserCheck, Sparkles, Loader2, Info } from 'lucide-react'
import { useAnaliseFluxo, useKpisPedidos } from '../../../hooks/usePedidos'

type EtapaId = 'recebimento' | 'pagamento' | 'preparo' | 'transporte' | 'entrega'

export function SecaoAnaliseFluxo() {
  const { data: dataFluxo, isLoading: loadingFluxo } = useAnaliseFluxo()
  const { data: kpis, isLoading: loadingKpis } = useKpisPedidos()
  const [selecionadaId, setSelecionadaId] = useState<EtapaId>('recebimento')

  if (loadingFluxo || loadingKpis) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="animate-spin text-[#1c5258]" size={32} />
      </div>
    )
  }

  // Mapeamento Real baseado nos dados existentes no banco
  const getValorEtapa = (id: EtapaId) => {
    if (!kpis) return 0
    switch (id) {
      case 'recebimento': 
        return kpis.total_valor // Todos os pedidos
      case 'pagamento': 
        return kpis.aprovados_valor + kpis.processando_valor // Pedidos que não foram recusados
      case 'preparo': 
        return kpis.processando_valor // Apenas o que está "processando"
      case 'transporte': 
        return 0 // Dado inexistente no banco
      case 'entrega': 
        return 0 // Dado inexistente no banco
      default: return 0
    }
  }

  const getQtdEtapa = (id: EtapaId) => {
    if (!kpis) return 0
    switch (id) {
      case 'recebimento': return kpis.total
      case 'pagamento': return kpis.aprovados + kpis.processando
      case 'preparo': return kpis.processando
      case 'transporte': return 0
      case 'entrega': return 0
      default: return 0
    }
  }

  const ETAPAS_CONFIG = [
    { id: 'recebimento', titulo: 'Recebimento do pedido', icone: FileText, status: 'Dentro do SLA', cor: '#1a9a45', textoRodape: 'Total de Pedidos Criados' },
    { id: 'pagamento', titulo: 'Pagamento do pedido', icone: DollarSign, status: 'Dentro do SLA', cor: '#1a9a45', textoRodape: 'Pedidos Aprovados/Em Processamento' },
    { id: 'preparo', titulo: 'Preparo do pedido', icone: Box, status: 'Risco de atraso', cor: '#e37405', textoRodape: 'Pedidos em Processamento' },
    { id: 'transporte', titulo: 'Transporte de pedido', icone: Truck, status: 'Sem Dados', cor: '#898989', textoRodape: 'Status não mapeado no banco' },
    { id: 'entrega', titulo: 'Entrega do pedido', icone: UserCheck, status: 'Sem Dados', cor: '#898989', textoRodape: 'Status não mapeado no banco' },
  ]

  const etapaConfig = ETAPAS_CONFIG.find(e => e.id === selecionadaId)!
  const valorEtapa = getValorEtapa(selecionadaId)
  const qtdEtapa = getQtdEtapa(selecionadaId)

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <h3 className="text-[18px] font-bold text-[#1d5358]">Análise Financeira do Fluxo</h3>
        <div className="flex items-center gap-2">
          <span className="text-[13px] text-[#898989]">
            {etapaConfig.titulo} | {qtdEtapa.toLocaleString('pt-BR')} pedidos
          </span>
          {(selecionadaId === 'transporte' || selecionadaId === 'entrega') && (
            <div className="flex items-center gap-1 text-[#c20000] text-[11px] font-bold">
              <Info size={12} />
              Inexistente no Banco
            </div>
          )}
        </div>
      </div>

      <div className="bg-white border border-[#e0e0e0] rounded-[24px] p-6 shadow-sm flex flex-col gap-6">
        <div className="flex gap-4 overflow-x-auto pb-2 custom-scrollbar">
          {ETAPAS_CONFIG.map((e) => {
            const Icone = e.icone
            const selecionado = selecionadaId === e.id
            const valor = getValorEtapa(e.id as EtapaId)
            const statusCor = e.status === 'Dentro do SLA' ? 'text-[#1a9a45] border-[#1a9a45]' : e.status === 'Sem Dados' ? 'text-[#898989] border-[#898989]' : 'text-[#e37405] border-[#e37405]'
            const bgRodape = e.status === 'Dentro do SLA' ? 'bg-[#1a9a45]' : e.status === 'Sem Dados' ? 'bg-[#898989]' : 'bg-[#e37405]'

            return (
              <div
                key={e.id}
                onClick={() => setSelecionadaId(e.id as EtapaId)}
                className={`flex-shrink-0 w-[220px] bg-white border rounded-[16px] overflow-hidden flex flex-col transition-all cursor-pointer ${
                  selecionado ? 'border-[#1d5358] border-2 shadow-lg scale-[1.02]' : 'border-[#e0e0e0] hover:border-[#b3b3b3]'
                }`}
              >
                <div className="p-5 flex flex-col gap-4">
                  <div className="flex justify-between items-start">
                    <div className={`p-2 rounded-lg ${selecionado ? 'bg-[#1d5358] text-white' : 'bg-gray-50 text-[#898989]'}`}>
                      <Icone size={22} strokeWidth={1.5} />
                    </div>
                    <span className={`text-[9px] font-bold px-2 py-1 rounded-full border ${statusCor} uppercase`}>
                      {e.status}
                    </span>
                  </div>
                  
                  <div className="flex flex-col gap-1">
                    <span className="text-[11px] text-[#898989] font-medium uppercase">Etapa</span>
                    <h4 className="text-[14px] font-bold text-[#343434] leading-tight h-[40px]">{e.titulo}</h4>
                  </div>

                  <div className="flex flex-col gap-3">
                    <span className="text-[20px] font-bold text-[#111]">
                      {valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                    </span>
                    
                    <div className="flex flex-col gap-1">
                      <span className="text-[10px] text-[#898989] font-medium uppercase">Volume</span>
                      <div className="flex items-center gap-1.5 text-[13px] font-bold text-[#343434]">
                        {getQtdEtapa(e.id as EtapaId).toLocaleString('pt-BR')} Pedidos
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className={`mt-auto py-2 px-4 text-center ${bgRodape}`}>
                  <span className="text-[10px] font-bold text-white uppercase">{e.textoRodape}</span>
                </div>
              </div>
            )
          })}
        </div>

        <div className="bg-[#e2e2e2] rounded-[16px] p-5 flex items-start gap-4">
          <div className="mt-1">
            <Sparkles size={18} className="text-[#1d5358]" />
          </div>
          <div className="flex flex-col gap-2">
            <p className="text-[14px] font-bold text-[#111]">
              Principais detalhes financeiros da fase de "{etapaConfig.titulo}":
            </p>
            <ul className="flex flex-col gap-2">
              <li className="flex items-start gap-2 text-[13px] text-[#343434]">
                <span className="mt-2 w-1.5 h-1.5 bg-[#111] rounded-full shrink-0" />
                Valor médio por pedido nesta fase: {(valorEtapa / (qtdEtapa || 1)).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
              </li>
              <li className="flex items-start gap-2 text-[13px] text-[#343434]">
                <span className="mt-2 w-1.5 h-1.5 bg-[#111] rounded-full shrink-0" />
                Esta métrica reflete o montante financeiro total paralisado ou processado neste estágio.
              </li>
              {selecionadaId === 'recebimento' && (
                <li className="flex items-start gap-2 text-[13px] text-[#343434]">
                  <span className="mt-2 w-1.5 h-1.5 bg-[#111] rounded-full shrink-0" />
                  Total acumulado de todas as transações na base: {kpis?.total_valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                </li>
              )}
            </ul>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white border border-[#e0e0e0] rounded-[24px] p-8 shadow-sm flex flex-col gap-6">
          <div className="flex flex-col gap-1">
            <h4 className="text-[16px] font-bold text-[#1d5358]">Distribuição Financeira (R$)</h4>
            <span className="text-[12px] text-[#898989]">Volume total em BRL por status do banco</span>
          </div>

          <div className="flex flex-col gap-8 mt-4">
            <div className="flex flex-col gap-2">
              <div className="flex justify-between items-center px-1">
                <span className="text-[11px] text-[#898989] font-bold uppercase">Aprovados</span>
                <span className="text-[12px] font-bold text-[#111]">{kpis?.aprovados_valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span>
              </div>
              <div className="h-10 w-full bg-[#f6f7f9] rounded-[4px] overflow-hidden">
                <div className="h-full bg-[#1a9a45] rounded-r-[4px]" style={{ width: `${(kpis?.aprovados_valor || 0) / (kpis?.total_valor || 1) * 100}%` }} />
              </div>
            </div>
            
            <div className="flex flex-col gap-2">
              <div className="flex justify-between items-center px-1">
                <span className="text-[11px] text-[#898989] font-bold uppercase">Em Processamento</span>
                <span className="text-[12px] font-bold text-[#111]">{kpis?.processando_valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span>
              </div>
              <div className="h-10 w-full bg-[#f6f7f9] rounded-[4px] overflow-hidden">
                <div className="h-full bg-[#e37405] rounded-r-[4px]" style={{ width: `${(kpis?.processando_valor || 0) / (kpis?.total_valor || 1) * 100}%` }} />
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <div className="flex justify-between items-center px-1">
                <span className="text-[11px] text-[#898989] font-bold uppercase">Recusados / Reembolsados</span>
                <span className="text-[12px] font-bold text-[#111]">{((kpis?.recusados_valor || 0) + (kpis?.reembolsados_valor || 0)).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span>
              </div>
              <div className="h-10 w-full bg-[#f6f7f9] rounded-[4px] overflow-hidden">
                <div className="h-full bg-[#c20000] rounded-r-[4px]" style={{ width: `${((kpis?.recusados_valor || 0) + (kpis?.reembolsados_valor || 0)) / (kpis?.total_valor || 1) * 100}%` }} />
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white border border-[#e0e0e0] rounded-[24px] p-8 shadow-sm flex flex-col gap-6">
          <div className="flex flex-col gap-1">
            <h4 className="text-[16px] font-bold text-[#1d5358]">Aviso de Integridade de Dados</h4>
            <span className="text-[12px] text-[#898989]">Informações sobre o mapeamento banco x design</span>
          </div>

          <div className="flex flex-col gap-8 mt-4">
            <div className="flex items-start gap-4 py-4 border-b border-[#f0f0f0]">
              <span className="text-[18px] font-bold text-[#c20000]">!</span>
              <span className="text-[14px] font-medium text-[#343434]">As etapas de **Transporte** e **Entrega** estão marcadas com R$ 0,00 pois o banco de dados atual não possui essas distinções de status.</span>
            </div>
            <div className="flex items-start gap-4 py-4 border-b border-[#f0f0f0]">
              <span className="text-[18px] font-bold text-[#1a9a45]">✓</span>
              <span className="text-[14px] font-medium text-[#343434]">Os valores de **Recebimento**, **Pagamento** e **Preparo** são calculados em tempo real somando a coluna `valor_pedido_brl`.</span>
            </div>
            <div className="mt-auto bg-[#fff8e1] border border-[#ffe082] rounded-[12px] p-4">
              <p className="text-[12px] text-[#795548] leading-normal">
                **Sugestão:** Para habilitar o Transporte/Entrega, adicione uma tabela de histórico de status ou novas colunas de data de envio/entrega no banco.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

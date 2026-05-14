import { useState } from 'react'
import { FileText, DollarSign, Box, Truck, UserCheck, AlertCircle } from 'lucide-react'
import { CardEtapaFluxo } from '../../molecules/pedidos/CardEtapaFluxo'

type EtapaId = 'recebimento' | 'pagamento' | 'preparo' | 'transporte' | 'entrega'

interface EtapaData {
  id: EtapaId
  titulo: string
  icone: any
  status: 'Atraso' | 'Risco de atraso' | 'Dentro do SLA'
  valor: string
  tempoMedio: string
  textoRodape: string
  problemas: string[]
  gargalos: string[]
}

const ETAPAS: EtapaData[] = [
  {
    id: 'recebimento',
    titulo: 'Recebimento do pedido',
    icone: <FileText size={20} />,
    status: 'Atraso',
    valor: '125 pedidos',
    tempoMedio: '22 Horas',
    textoRodape: '32% acima do SLA',
    problemas: [
      'Tickets de atraso estão concentrados em pedidos que dependem do setor logístico, indicando falha de comunicação com o atendimento.',
      'Tickets de atraso estão concentrados em pedidos que dependem do setor logístico, indicando falha de comunicação com o atendimento.'
    ],
    gargalos: [
      '1. Dados incompletos do cliente',
      '2. Lentidão operacional',
      '3. Baixa eficiência operacional'
    ]
  },
  {
    id: 'pagamento',
    titulo: 'Pagamento do pedido',
    icone: <DollarSign size={20} />,
    status: 'Risco de atraso',
    valor: '125 pedidos',
    tempoMedio: '22 Horas',
    textoRodape: 'Risco de atraso em 56% dos pedidos',
    problemas: [
      'Divergência de valores entre o gateway de pagamento e o sistema interno, causando retenção de pedidos para análise manual.',
      'Aumento no tempo de resposta das operadoras de cartão de crédito nas últimas 4 horas.'
    ],
    gargalos: [
      '1. Fraude detectada em massa',
      '2. Timeout do gateway de pagamento',
      '3. Cartões recusados por limite'
    ]
  },
  {
    id: 'preparo',
    titulo: 'Preparo do pedido',
    icone: <Box size={20} />,
    status: 'Dentro do SLA',
    valor: '125 pedidos',
    tempoMedio: '22 Horas',
    textoRodape: 'Etapa dentro do SLA',
    problemas: [
      'Falta de embalagens de tamanho médio no estoque principal, forçando o uso de embalagens maiores e aumentando o custo de frete.',
      'Equipe reduzida no turno da noite afetando o tempo de picking.'
    ],
    gargalos: [
      '1. Falta de embalagem específica',
      '2. Erro de separação de SKU',
      '3. Layout do armazém ineficiente'
    ]
  },
  {
    id: 'transporte',
    titulo: 'Transporte de pedido',
    icone: <Truck size={20} />,
    status: 'Dentro do SLA',
    valor: '125 pedidos',
    tempoMedio: '22 Horas',
    textoRodape: 'Etapa dentro do SLA',
    problemas: [
      'Problemas climáticos na região Sul afetando as rotas de transferência entre CDs.',
      'Manutenção preventiva não programada em 15% da frota própria.'
    ],
    gargalos: [
      '1. Congestionamento em rotas principais',
      '2. Greve pontual de transportadora externa',
      '3. Atraso na emissão de CT-e'
    ]
  },
  {
    id: 'entrega',
    titulo: 'Entrega do pedido',
    icone: <UserCheck size={20} />,
    status: 'Risco de atraso',
    valor: '125 pedidos',
    tempoMedio: '22 Horas',
    textoRodape: "Aumento de tickets de 'atraso na entrega'",
    problemas: [
      "Aumento de tickets de 'ausência de morador' no período da tarde em áreas residenciais.",
      'Dificuldade de acesso em áreas de risco reportada por parceiros logísticos.'
    ],
    gargalos: [
      '1. Tentativas frustradas de entrega',
      '2. Devolução forçada por endereço errado',
      '3. Extravio em trânsito local'
    ]
  }
]

export function SecaoAnaliseFluxo() {
  const [selecionadaId, setSelecionadaId] = useState<EtapaId>('recebimento')

  const etapa = ETAPAS.find(e => e.id === selecionadaId)!

  return (
    <div className="flex flex-col gap-6">
      {/* Container Principal */}
      <div className="bg-white border border-[#e0e0e0] rounded-[24px] p-6 shadow-sm flex flex-col gap-6">
        <div className="flex flex-col gap-1">
          <h3 className="text-[16px] font-bold text-[#1d5358]">Análise de Fluxo das etapas dos Pedidos</h3>
          <span className="text-[12px] text-[#898989]">Etapa: {etapa.titulo} | 125 pedidos no total</span>
        </div>

        {/* Grid de Cards */}
        <div className="flex gap-4 overflow-x-auto pb-4 custom-scrollbar">
          {ETAPAS.map(e => (
            <CardEtapaFluxo
              key={e.id}
              titulo={e.titulo}
              icone={e.icone}
              status={e.status}
              valor={e.valor}
              tempoMedio={e.tempoMedio}
              textoRodape={e.textoRodape}
              selecionado={selecionadaId === e.id}
              onClick={() => setSelecionadaId(e.id)}
            />
          ))}
        </div>

        {/* Painel de Problemas */}
        <div className="bg-[#f6f7f9] border border-[#f0f0f0] rounded-[16px] p-5 animate-in fade-in slide-in-from-top-2 duration-300">
          <div className="flex items-start gap-3">
            <div className="p-1.5 bg-[#1d5358]/10 rounded-full mt-0.5">
              <AlertCircle size={14} className="text-[#1d5358]" />
            </div>
            <div className="flex flex-col gap-3">
              <p className="text-[13px] font-bold text-[#343434]">
                Principais problemas detectados na fase de "{etapa.titulo}":
              </p>
              <ul className="flex flex-col gap-2">
                {etapa.problemas.map((prob, i) => (
                  <li key={i} className="flex items-start gap-2 text-[12px] text-[#343434] leading-relaxed">
                    <span className="mt-1.5 w-1.5 h-1.5 bg-[#1d5358] rounded-full shrink-0" />
                    {prob}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Grid de Gráficos de Apoio */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Gráfico de Barras de Status */}
        <div className="bg-white border border-[#e0e0e0] rounded-[24px] p-6 shadow-sm flex flex-col gap-6">
          <div className="flex flex-col gap-1">
            <h4 className="text-[14px] font-bold text-[#1d5358]">Análise de Fluxo dos Pedidos</h4>
            <span className="text-[12px] text-[#898989]">608 pedidos no total | Todas as etapas</span>
          </div>

          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-2 overflow-x-auto pb-2 no-scrollbar">
              {['Pedido recebido', 'Pagamento', 'Preparando pedido', 'Transporte', 'Entregue'].map(tab => (
                <button 
                  key={tab}
                  className={`px-3 py-1.5 rounded-[8px] text-[11px] font-medium border whitespace-nowrap transition-colors ${
                    tab.includes(etapa.titulo.split(' ')[0]) 
                    ? 'bg-[#f6f7f9] border-[#1d5358] text-[#1d5358]' 
                    : 'bg-white border-[#f0f0f0] text-[#898989] hover:border-[#1d5358]/30'
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>

            <div className="flex flex-col gap-6 py-4">
              <div className="flex flex-col gap-2">
                <div className="flex justify-between items-end">
                  <span className="text-[10px] text-[#898989] font-bold uppercase">Risco de atraso</span>
                  <span className="text-[12px] font-bold text-[#343434]">350 un.</span>
                </div>
                <div className="h-6 w-full bg-[#f6f7f9] rounded-[4px] overflow-hidden">
                  <div className="h-full bg-[#e37405]" style={{ width: '60%' }} />
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <div className="flex justify-between items-end">
                  <span className="text-[10px] text-[#898989] font-bold uppercase">Atrasado</span>
                  <span className="text-[12px] font-bold text-[#343434]">230 un.</span>
                </div>
                <div className="h-6 w-full bg-[#f6f7f9] rounded-[4px] overflow-hidden">
                  <div className="h-full bg-[#c20000]" style={{ width: '45%' }} />
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <div className="flex justify-between items-end">
                  <span className="text-[10px] text-[#898989] font-bold uppercase">Dentro do SLA</span>
                  <span className="text-[12px] font-bold text-[#343434]">125 un.</span>
                </div>
                <div className="h-6 w-full bg-[#f6f7f9] rounded-[4px] overflow-hidden">
                  <div className="h-full bg-[#1a9a45]" style={{ width: '30%' }} />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Lista de Gargalos */}
        <div className="bg-white border border-[#e0e0e0] rounded-[24px] p-6 shadow-sm flex flex-col gap-6">
          <div className="flex flex-col gap-1">
            <h4 className="text-[14px] font-bold text-[#1d5358]">Principais gargalos por etapa</h4>
            <span className="text-[12px] text-[#898989]">608 pedidos no total | Todas as etapas</span>
          </div>

          <div className="flex flex-col gap-6">
            <div className="flex items-center gap-2 overflow-x-auto pb-2 no-scrollbar">
              {['Pedido recebido', 'Pagamento', 'Preparando pedido', 'Transporte', 'Entregue'].map(tab => (
                <button 
                  key={tab}
                  className={`px-3 py-1.5 rounded-[8px] text-[11px] font-medium border whitespace-nowrap transition-colors ${
                    tab.includes(etapa.titulo.split(' ')[0]) 
                    ? 'bg-[#f6f7f9] border-[#1d5358] text-[#1d5358]' 
                    : 'bg-white border-[#f0f0f0] text-[#898989] hover:border-[#1d5358]/30'
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>

            <div className="flex flex-col divide-y divide-[#f0f0f0] mb-4">
              {etapa.gargalos.map((gargalo, i) => (
                <div key={i} className="py-4 text-[14px] text-[#343434] font-medium animate-in slide-in-from-left duration-200" style={{ animationDelay: `${i * 50}ms` }}>
                  {gargalo}
                </div>
              ))}
            </div>

            {/* Insight Alert Box */}
            <div className="mt-auto bg-[#eef6f7] border border-[#d1e9eb] rounded-[12px] p-3 flex items-start gap-3">
              <div className="mt-0.5 text-[#1d5358]">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                  <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"/>
                </svg>
              </div>
              <p className="text-[10px] text-[#1d5358] leading-normal font-medium">
                <span className="font-bold">ATENÇÃO:</span> O aumento na frequência de compra sugere maior proximidade com a marca, representando uma oportunidade para fortalecer retenção e fidelização.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

import { useState, useEffect } from 'react'
import { TagVariacao } from '../../atoms/dashboard/TagVariacao'
import { FiltroPeriodo, type FiltrosPeriodo } from '../../molecules/compartilhados/FiltroPeriodo'
import { useTaxaSatisfacao } from '../../../hooks/useDashboard'

// Constantes do gauge (espelham o medidor-dashboard de referência)
const GCX = 280
const GCY = 200
const OUTER_R = 155
const INNER_R = 132

// Paths originais do Seta.svg (viewBox "0 0 162 50")
const SETA_HUB_PATH =
  'M18 40.5C18 45.4706 13.9706 49.5 9 49.5C4.02944 49.5 0 45.4706 0 40.5C0 35.5294 4.02944 31.5 9 31.5C13.9706 31.5 18 35.5294 18 40.5Z'
const SETA_NEEDLE_PATH = 'M12 49L6 32L162 0L12 49Z'
const SETA_HUB_X = 9
const SETA_HUB_Y = 40.5
const SETA_TIP_X = 162
const SETA_TIP_Y = 0

function pctToRad(pct: number): number {
  return Math.PI * (1 - pct / 100)
}

function needleTransform(value: number): string {
  const dx = SETA_TIP_X - SETA_HUB_X
  const dy = SETA_TIP_Y - SETA_HUB_Y
  const hubToTipDist = Math.sqrt(dx * dx + dy * dy)
  const scale = OUTER_R / hubToTipDist
  const naturalAngleDeg = Math.atan2(dy, dx) * (180 / Math.PI)
  const targetAngleDeg = -(pctToRad(value) * (180 / Math.PI))
  const rotDeg = targetAngleDeg - naturalAngleDeg
  return [
    `translate(${GCX}, ${GCY})`,
    `rotate(${rotDeg.toFixed(4)})`,
    `scale(${scale.toFixed(6)})`,
    `translate(${-SETA_HUB_X}, ${-SETA_HUB_Y})`,
  ].join(' ')
}

function arcSegment(startPct: number, endPct: number): string {
  const sa = pctToRad(startPct)
  const ea = pctToRad(endPct)
  const f = (n: number) => n.toFixed(3)
  return [
    `M ${f(GCX + OUTER_R * Math.cos(sa))} ${f(GCY - OUTER_R * Math.sin(sa))}`,
    `A ${OUTER_R} ${OUTER_R} 0 0 1 ${f(GCX + OUTER_R * Math.cos(ea))} ${f(GCY - OUTER_R * Math.sin(ea))}`,
    `L ${f(GCX + INNER_R * Math.cos(ea))} ${f(GCY - INNER_R * Math.sin(ea))}`,
    `A ${INNER_R} ${INNER_R} 0 0 0 ${f(GCX + INNER_R * Math.cos(sa))} ${f(GCY - INNER_R * Math.sin(sa))}`,
    'Z',
  ].join(' ')
}

// Props
interface Props {
  filtrosGlobais: FiltrosPeriodo
}

export function GraficoTaxaSatisfacao({ filtrosGlobais }: Props) {
  const [filtros, setFiltros] = useState(filtrosGlobais)

  useEffect(() => { setFiltros(filtrosGlobais) }, [filtrosGlobais])

  const { data, isLoading } = useTaxaSatisfacao()

  const VALOR = data?.valor ?? 88
  const META = data?.meta ?? 90
  const TOTAL_AVALIACOES = data?.total_avaliacoes ?? 0

  const metaAngle = pctToRad(META)
  const mcos = Math.cos(metaAngle)
  const msin = Math.sin(metaAngle)
  const f = (n: number) => n.toFixed(3)

  const mLineX1 = f(GCX + (INNER_R - 4) * mcos)
  const mLineY1 = f(GCY - (INNER_R - 4) * msin)
  const mLineX2 = f(GCX + (OUTER_R + 4) * mcos)
  const mLineY2 = f(GCY - (OUTER_R + 4) * msin)

  const boxW = 53
  const boxH = 17
  const metaBoxX = GCX + (OUTER_R + 9) * mcos
  const metaBoxY = GCY - (OUTER_R + 9) * msin

  return (
    <div className="relative bg-white border-2 border-[#e0e0e0] rounded-[5px] h-full flex flex-col">
      {/* Filtros: absoluto y=13 do card, alinhado à direita — conforme SVG */}
      <div className="absolute top-[5px] left-[28px]">
        <FiltroPeriodo filtros={filtros} onChange={setFiltros} />
      </div>

      {/* Título: abaixo dos filtros — pt-[50px] posiciona abaixo do filtro (y=41) */}
      <div className="px-4 pt-[50px] pb-1">
        <h3 className="text-[18px] font-bold text-[#1d5358] leading-snug">
          Taxa de satisfação (sentimento positivo)
        </h3>
      </div>

      {/* Gauge SVG */}
      <div className="flex-1 flex flex-col items-center justify-center min-h-0 px-4 pb-4">
        <svg
          viewBox="0 0 560 215"
          width="100%"
          style={{ display: 'block', overflow: 'visible' }}
          aria-hidden="true"
        >
          <defs>
            <filter id="meta-shadow" x="-20%" y="-40%" width="160%" height="200%">
              <feFlood floodOpacity="0" result="BackgroundImageFix" />
              <feColorMatrix in="SourceAlpha" result="hardAlpha" type="matrix"
                values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0" />
              <feOffset />
              <feColorMatrix type="matrix"
                values="0 0 0 0 0.851 0 0 0 0 0.851 0 0 0 0 0.855 0 0 0 0.25 0" />
              <feBlend in2="BackgroundImageFix" result="effect1_dropShadow" />
              <feBlend in="SourceGraphic" in2="effect1_dropShadow" result="shape" />
            </filter>
          </defs>

          {/* Arcos coloridos */}
          <path d={arcSegment(0, 68)}   fill="#FDC5C4" />
          <path d={arcSegment(68, 82)}  fill="#FEF1BD" />
          <path d={arcSegment(82, 100)} fill="#C4EDCD" />

          {/* Linha da meta */}
          <line
            x1={mLineX1} y1={mLineY1}
            x2={mLineX2} y2={mLineY2}
            stroke="#4D4D4D" strokeWidth="1.5" strokeLinecap="round"
          />

          {/* Label da meta com seta */}
          <g filter="url(#meta-shadow)">
            <path
              d={`
                M ${f(metaBoxX + 5.5)} ${f(metaBoxY - boxH / 2)}
                H ${f(metaBoxX + boxW)}
                a 2 2 0 0 1 2 2
                V ${f(metaBoxY + boxH / 2 - 2)}
                a 2 2 0 0 1 -2 2
                H ${f(metaBoxX + 5.5)}
                V ${f(metaBoxY + boxH / 2 - 2.8)}
                a 1 1 0 0 0 -0.92 -0.68
                L ${f(metaBoxX - 5)} ${f(metaBoxY + 0.5)}
                L ${f(metaBoxX + 4.58)} ${f(metaBoxY - boxH / 2 + 2.8)}
                a 1 1 0 0 0 0.92 -0.68
                Z
              `}
              fill="white"
              stroke="#C5C5C5"
              strokeWidth="0.75"
            />
            <text
              x={f(metaBoxX + (boxW + 5.5) / 2 + 2)}
              y={f(metaBoxY + 4.5)}
              textAnchor="middle"
              fontSize="6.5"
              fill="black"
              fontFamily="Inter, sans-serif"
            >
              Meta: {META}%
            </text>
          </g>

          {/* Agulha */}
          <g transform={needleTransform(VALOR)} fill="#757575">
            <path d={SETA_HUB_PATH} />
            <path d={SETA_NEEDLE_PATH} />
          </g>

          {/* Labels 0% / 100% */}
          <text
            x={f(GCX - OUTER_R - 10)} y="213"
            textAnchor="middle" fontSize="12" fill="#4d4d4d"
            fontFamily="Inter, sans-serif" fontWeight="500"
          >
            0%
          </text>
          <text
            x={f(GCX + OUTER_R + 20)} y="213"
            textAnchor="middle" fontSize="12" fill="#4d4d4d"
            fontFamily="Inter, sans-serif" fontWeight="500"
          >
            100%
          </text>
        </svg>

        {/* Estatísticas */}
        <div className="flex flex-col items-center -mt-2">
          <span className="text-[48px] font-bold text-black leading-none">
            {isLoading ? '...' : `${VALOR}%`}
          </span>
          <div className="mt-2">
            <TagVariacao valor="+3%/ABR" tipo="bom" />
          </div>
          <span className="text-[12px] font-medium text-[#4d4d4d] mt-2">
            {isLoading ? '' : `Baseado em ${TOTAL_AVALIACOES} avaliações`}
          </span>
        </div>
      </div>
    </div>
  )
}

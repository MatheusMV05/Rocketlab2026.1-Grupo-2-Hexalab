import { X } from 'lucide-react'
import { DropdownFiltro } from '../../atoms/compartilhados/DropdownFiltro'
import { ANOS_FILTRO, MESES_FILTRO, ESTADOS_NOME } from '../../../constants/opcoesFiltro'

export interface FiltrosPeriodo {
  ano: string
  mes: string
  localidade: string
}

const FILTRO_VAZIO: FiltrosPeriodo = { ano: '', mes: '', localidade: '' }

interface Props {
  filtros: FiltrosPeriodo
  onChange: (filtros: FiltrosPeriodo) => void
}

export function FiltroPeriodo({ filtros, onChange }: Props) {
  const temFiltro = !!(filtros.ano || filtros.mes || filtros.localidade)

  return (
    <div className="flex items-center gap-[21px]">
      <DropdownFiltro
        label="Ano"
        opcoes={ANOS_FILTRO}
        valor={filtros.ano}
        onChange={(v) => onChange({ ...filtros, ano: v })}
        rotulo="Ano"
      />
      <DropdownFiltro
        label="Mês"
        opcoes={MESES_FILTRO}
        valor={filtros.mes}
        onChange={(v) => onChange({ ...filtros, mes: v })}
        rotulo="Mês"
      />
      <DropdownFiltro
        label="Localidade"
        opcoes={ESTADOS_NOME}
        valor={filtros.localidade}
        onChange={(v) => onChange({ ...filtros, localidade: v })}
        rotulo="Localidade"
        pesquisavel
      />
      <button
        onClick={() => onChange(FILTRO_VAZIO)}
        disabled={!temFiltro}
        className={`flex items-center gap-[6px] h-[30px] px-[8px] text-[14px] transition-colors whitespace-nowrap ${
          temFiltro
            ? 'text-[#666666] hover:text-[#c20000] cursor-pointer'
            : 'text-[#b8b8b8] cursor-default'
        }`}
      >
        <X size={14} strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" />
        <span>Limpar</span>
      </button>
    </div>
  )
}

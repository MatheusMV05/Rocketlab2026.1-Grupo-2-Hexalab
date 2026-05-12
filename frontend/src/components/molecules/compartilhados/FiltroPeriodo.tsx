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
      />
      <button
        onClick={() => onChange(FILTRO_VAZIO)}
        disabled={!temFiltro}
        className={`flex items-center gap-[5px] h-[30px] px-[10px] text-[14px] transition-colors whitespace-nowrap ${
          temFiltro
            ? 'text-[#343434] hover:text-[#c20000] cursor-pointer'
            : 'text-[#b0b0b0] cursor-default'
        }`}
      >
        <span className="leading-none">&times;</span>
        <span>Limpar</span>
      </button>
    </div>
  )
}

import { DropdownFiltro } from '../atoms/DropdownFiltro'
import { ANOS_FILTRO, MESES_FILTRO, ESTADOS_SIGLA } from '../../constants/opcoesFiltro'

export interface FiltrosPeriodo {
  ano: string
  mes: string
  localidade: string
}

interface Props {
  filtros: FiltrosPeriodo
  onChange: (filtros: FiltrosPeriodo) => void
}

export function FiltroPeriodo({ filtros, onChange }: Props) {
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
        opcoes={ESTADOS_SIGLA}
        valor={filtros.localidade}
        onChange={(v) => onChange({ ...filtros, localidade: v })}
        rotulo="Localidade"
      />
    </div>
  )
}

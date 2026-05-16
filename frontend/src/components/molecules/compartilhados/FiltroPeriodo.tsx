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

/** Exibe nome do mês no dropdown; filtros.mes deve ser '', '01', … , '12' para a API */
function etiquetaMes(mesCodigo: string): string {
  if (!mesCodigo?.trim()) return ''
  const n = Number.parseInt(mesCodigo, 10)
  if (!Number.isFinite(n) || n < 1 || n > 12) return ''
  return MESES_FILTRO[n - 1] ?? ''
}

export function FiltroPeriodo({ filtros, onChange }: Props) {
  const temFiltro = !!(filtros.ano || filtros.mes || filtros.localidade)
  const etiquetaMesAtual = etiquetaMes(filtros.mes)

  function definirMes(nomeOuVazio: string) {
    if (!nomeOuVazio) {
      onChange({ ...filtros, mes: '' })
      return
    }
    const idx = MESES_FILTRO.indexOf(nomeOuVazio)
    if (idx < 0) {
      onChange({ ...filtros, mes: '' })
      return
    }
    onChange({ ...filtros, mes: String(idx + 1).padStart(2, '0') })
  }

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
        valor={etiquetaMesAtual}
        onChange={definirMes}
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

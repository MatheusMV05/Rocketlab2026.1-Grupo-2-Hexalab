import { ChevronDown } from 'lucide-react'

interface Props {
  label: string
  opcoes: string[]
  valor: string
  onChange: (valor: string) => void
  rotulo?: string
}

export function DropdownFiltro({ label, opcoes, valor, onChange, rotulo }: Props) {
  const textoExibido = valor || label

  return (
    <div className="relative">
      <select
        value={valor}
        onChange={(e) => onChange(e.target.value)}
        className="appearance-none bg-white border-2 border-[#e0e0e0] rounded-[5px] h-[30px] pl-[10px] pr-8 text-[14px] text-[#262626] cursor-pointer focus:outline-none focus:border-[#3f7377] w-full"
        aria-label={label}
      >
        <option value="">{rotulo ? `${rotulo}: Todos` : label}</option>
        {opcoes.map((op) => (
          <option key={op} value={op}>
            {rotulo ? `${rotulo}: ${op}` : op}
          </option>
        ))}
      </select>
      <ChevronDown
        size={16}
        className="absolute right-2 top-1/2 -translate-y-1/2 text-[#262626] pointer-events-none"
      />
    </div>
  )
}

import logoAgente from '../../../assets/logos/logo-agente.svg'
import logoAgenteExtenso from '../../../assets/logos/Logo-agente-2.svg'
import logoAgenteExtensoBranco from '../../../assets/logos/logo-agente-3.svg'

interface Props {
  tamanho?: number
  /** escuro = caixa teal; claro = caixa branca (header popup); transparente = só o logo */
  fundo?: 'escuro' | 'claro' | 'transparente'
  /** padrao = circular gradiente; extenso = horizontal teal (Logo-agente-2); extenso-branco = horizontal branco (logo-agente-3, header popup) */
  variante?: 'padrao' | 'extenso' | 'extenso-branco'
}

export function IconeAssistente({
  tamanho = 32,
  fundo = 'escuro',
  variante = 'padrao',
}: Props) {
  if (variante === 'extenso') {
    return (
      <img
        src={logoAgenteExtenso}
        alt="Assistente"
        className="object-contain shrink-0"
        style={{ height: tamanho, width: 'auto' }}
      />
    )
  }

  if (variante === 'extenso-branco') {
    return (
      <img
        src={logoAgenteExtensoBranco}
        alt="Assistente"
        className="object-contain shrink-0"
        style={{ height: tamanho, width: 'auto' }}
      />
    )
  }

  if (fundo === 'transparente') {
    return (
      <img
        src={logoAgente}
        alt="Assistente"
        className="object-contain shrink-0"
        style={{ width: tamanho * 0.9, height: tamanho * 0.9 }}
      />
    )
  }

  const cor = fundo === 'escuro' ? '#3f7377' : '#ffffff'

  return (
    <span
      className="flex items-center justify-center rounded-[10px]"
      style={{ width: tamanho, height: tamanho, backgroundColor: cor }}
    >
      <img
        src={logoAgente}
        alt="Assistente"
        className="object-contain"
        style={{ width: tamanho * 0.7, height: tamanho * 0.7 }}
      />
    </span>
  )
}

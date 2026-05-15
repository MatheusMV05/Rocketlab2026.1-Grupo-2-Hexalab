import logoChat from '../../../assets/logos/logo-chat.svg'

interface Props {
  /** Altura em px; largura segue a proporção do SVG (21×28) */
  tamanho?: number
  className?: string
}

export function LogoChat({ tamanho = 18, className = '' }: Props) {
  return (
    <img
      src={logoChat}
      alt=""
      aria-hidden
      className={`object-contain shrink-0 ${className}`}
      style={{ height: tamanho, width: 'auto' }}
    />
  )
}

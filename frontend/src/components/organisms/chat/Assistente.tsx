import { useAssistente } from './AssistenteProvider'
import { AssistentePopup } from './AssistentePopup'
import { AssistenteTelaCheia } from './AssistenteTelaCheia'

export function Assistente() {
  const { modo } = useAssistente()

  if (modo === 'fechado') return null
  if (modo === 'popup') return <AssistentePopup />
  return <AssistenteTelaCheia />
}

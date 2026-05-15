import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAssistente } from '../../components/organisms/chat/AssistenteProvider'

// A rota /chat existe apenas como atalho para abrir o Assistente em tela cheia
// sobre a página inicial (Dashboard). Não tem UI própria — o overlay global cuida da renderização.
export default function Chat() {
  const navigate = useNavigate()
  const { expandir } = useAssistente()

  useEffect(() => {
    expandir()
    navigate('/', { replace: true })
  }, [expandir, navigate])

  return null
}

import { Navigate } from 'react-router-dom'
import { useAuth } from '../../../contexts/AuthContext'

export function RotaProtegida({ children }: { children: React.ReactNode }) {
  const { usuario, carregando } = useAuth()

  if (carregando) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ backgroundColor: '#EFEFEF' }}
      >
        <div className="animate-spin w-8 h-8 border-4 border-[#105453] border-t-transparent rounded-full" />
      </div>
    )
  }

  if (!usuario) return <Navigate to="/login" replace />

  if (usuario.primeiro_acesso) return <Navigate to="/definir-senha" replace />

  return <>{children}</>
}

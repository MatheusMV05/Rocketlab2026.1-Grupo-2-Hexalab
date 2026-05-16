import { createContext, useContext, useState, useEffect, type ReactNode } from 'react'
import { api } from '../services/api'

interface Usuario {
  id: string
  nome: string
  email: string
  perfil: string
  primeiro_acesso: boolean
}

interface AuthContextType {
  usuario: Usuario | null
  token: string | null
  carregando: boolean
  login: (token: string, usuario: Usuario) => void
  logout: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [usuario, setUsuario] = useState<Usuario | null>(null)
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('access_token'))
  const [carregando, setCarregando] = useState(true)

  // Ao montar, valida o token salvo e carrega dados do usuário
  useEffect(() => {
    async function validar() {
      const tokenSalvo = localStorage.getItem('access_token')
      if (!tokenSalvo) {
        setCarregando(false)
        return
      }
      try {
        const { data } = await api.get<Usuario>('/auth/me')
        setUsuario(data)
        setToken(tokenSalvo)
      } catch {
        localStorage.removeItem('access_token')
        setToken(null)
      } finally {
        setCarregando(false)
      }
    }
    validar()
  }, [])

  function login(novoToken: string, novoUsuario: Usuario) {
    localStorage.setItem('access_token', novoToken)
    setToken(novoToken)
    setUsuario(novoUsuario)
  }

  async function logout() {
    try {
      await api.post('/auth/logout')
    } finally {
      localStorage.removeItem('access_token')
      setToken(null)
      setUsuario(null)
    }
  }

  return (
    <AuthContext.Provider value={{ usuario, token, carregando, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth deve ser usado dentro de AuthProvider')
  return ctx
}

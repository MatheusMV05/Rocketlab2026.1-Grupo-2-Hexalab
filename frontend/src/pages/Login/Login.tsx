import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { GoogleLogin, type CredentialResponse } from '@react-oauth/google'
import { authService } from '../../services/authService'
import { useAuth } from '../../contexts/AuthContext'

export default function Login() {
  const navigate = useNavigate()
  const { login } = useAuth()
  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')
  const [mostrarSenha, setMostrarSenha] = useState(false)
  const [lembrar, setLembrar] = useState(false)
  const [erro, setErro] = useState('')
  const [carregando, setCarregando] = useState(false)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setErro('')
    setCarregando(true)
    try {
      const dados = await authService.loginEmailSenha(email, senha)
      login(dados.access_token, {
        id: '',
        nome: dados.nome,
        email: dados.email,
        perfil: dados.perfil,
        primeiro_acesso: dados.primeiro_acesso,
      })
      if (dados.primeiro_acesso) {
        navigate('/definir-senha')
      } else {
        navigate('/')
      }
    } catch (err: any) {
      setErro(err.response?.data?.detail ?? 'Credenciais inválidas')
    } finally {
      setCarregando(false)
    }
  }

  async function handleGoogle(credentialResponse: CredentialResponse) {
    if (!credentialResponse.credential) return
    setErro('')
    setCarregando(true)
    try {
      const dados = await authService.loginGoogle(credentialResponse.credential)
      login(dados.access_token, {
        id: '',
        nome: dados.nome,
        email: dados.email,
        perfil: dados.perfil,
        primeiro_acesso: dados.primeiro_acesso,
      })
      if (dados.primeiro_acesso) {
        navigate('/definir-senha')
      } else {
        navigate('/')
      }
    } catch (err: any) {
      setErro(err.response?.data?.detail ?? 'Acesso não autorizado')
    } finally {
      setCarregando(false)
    }
  }

  return (
    <div
      className="min-h-screen flex flex-col"
      style={{ backgroundColor: '#EFEFEF', fontFamily: 'Poppins, sans-serif' }}
    >
      {/* Logo */}
      <div className="p-6">
        <span className="text-xl font-semibold" style={{ color: '#105453' }}>
          V-Commerce
        </span>
      </div>

      {/* Card centralizado */}
      <div className="flex flex-1 items-center justify-center">
        <div className="w-full max-w-[580px] px-4">
          {/* Título */}
          <h1
            className="text-center text-2xl font-semibold mb-6"
            style={{ color: '#1D1D1D' }}
          >
            Login
          </h1>

          {/* Botão Google */}
          <div className="flex justify-center mb-5">
            <GoogleLogin
              onSuccess={handleGoogle}
              onError={() => setErro('Falha na autenticação com Google')}
              width={580}
              shape="pill"
              text="continue_with"
            />
          </div>

          {/* Divisor OU */}
          <div className="flex items-center gap-3 mb-5">
            <div className="flex-1 h-px" style={{ backgroundColor: '#CFCFCF' }} />
            <span className="text-xs font-medium" style={{ color: '#6B6B6B' }}>
              OU
            </span>
            <div className="flex-1 h-px" style={{ backgroundColor: '#CFCFCF' }} />
          </div>

          {/* Formulário */}
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            {/* Email */}
            <div className="flex flex-col gap-1.5">
              <label className="text-sm" style={{ color: '#6B6B6B' }}>
                Email institucional
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full h-12 px-4 rounded-lg border outline-none bg-white focus:ring-2 focus:ring-[#105453]/30"
                style={{ borderColor: '#CFCFCF' }}
                placeholder="maria.silva@vcommerce.com"
              />
            </div>

            {/* Senha */}
            <div className="flex flex-col gap-1.5">
              <div className="flex justify-between">
                <label className="text-sm" style={{ color: '#6B6B6B' }}>
                  Senha
                </label>
                <button
                  type="button"
                  onClick={() => setMostrarSenha(!mostrarSenha)}
                  className="text-sm"
                  style={{ color: '#6B6B6B' }}
                >
                  {mostrarSenha ? 'Esconder' : 'Mostrar'}
                </button>
              </div>
              <input
                type={mostrarSenha ? 'text' : 'password'}
                value={senha}
                onChange={(e) => setSenha(e.target.value)}
                required
                className="w-full h-12 px-4 rounded-lg border outline-none bg-white focus:ring-2 focus:ring-[#105453]/30"
                style={{ borderColor: '#CFCFCF' }}
              />
            </div>

            {/* Lembrar + Esqueceu */}
            <div className="flex items-center justify-between">
              <label
                className="flex items-center gap-2 text-sm cursor-pointer"
                style={{ color: '#1D1D1D' }}
              >
                <input
                  type="checkbox"
                  checked={lembrar}
                  onChange={(e) => setLembrar(e.target.checked)}
                  className="w-4 h-4 rounded accent-[#105453]"
                />
                Deixar salvo
              </label>
              <button
                type="button"
                className="text-sm underline"
                style={{ color: '#1D1D1D' }}
              >
                Esqueceu a senha?
              </button>
            </div>

            {/* Erro */}
            {erro && (
              <p className="text-sm text-red-600 text-center">{erro}</p>
            )}

            {/* Botão Entrar */}
            <button
              type="submit"
              disabled={carregando}
              className="w-full h-[52px] rounded-full text-base font-semibold text-white transition-opacity disabled:opacity-70"
              style={{ backgroundColor: '#105453' }}
            >
              {carregando ? 'Entrando...' : 'Entrar'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}

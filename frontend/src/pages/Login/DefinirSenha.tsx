import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { authService } from '../../services/authService'
import { useAuth } from '../../contexts/AuthContext'

export default function DefinirSenha() {
  const navigate = useNavigate()
  const { login, token } = useAuth()
  const [novaSenha, setNovaSenha] = useState('')
  const [confirmar, setConfirmar] = useState('')
  const [mostrar1, setMostrar1] = useState(false)
  const [mostrar2, setMostrar2] = useState(false)
  const [erro, setErro] = useState('')
  const [carregando, setCarregando] = useState(false)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setErro('')

    if (novaSenha !== confirmar) {
      setErro('As senhas não conferem')
      return
    }
    if (novaSenha.length < 6) {
      setErro('A senha deve ter no mínimo 6 caracteres')
      return
    }

    setCarregando(true)
    try {
      const dados = await authService.definirSenha(novaSenha, confirmar, token!)
      login(dados.access_token, {
        id: '',
        nome: dados.nome,
        email: dados.email,
        perfil: dados.perfil,
        primeiro_acesso: false,
      })
      navigate('/')
    } catch (err: any) {
      setErro(err.response?.data?.detail ?? 'Erro ao definir senha')
    } finally {
      setCarregando(false)
    }
  }

  const senhasNaoConferem = confirmar.length > 0 && novaSenha !== confirmar

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

      <div className="flex flex-1 items-center justify-center">
        <div className="w-full max-w-[580px] px-4">
          <h1
            className="text-center text-2xl font-semibold mb-2"
            style={{ color: '#1D1D1D' }}
          >
            Crie sua senha
          </h1>
          <p
            className="text-center text-sm mb-8"
            style={{ color: '#6B6B6B' }}
          >
            Você foi convidado para acessar o sistema.
            <br />
            Defina uma senha segura para continuar.
          </p>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            {/* Nova senha */}
            <div className="flex flex-col gap-1.5">
              <div className="flex justify-between">
                <label className="text-sm" style={{ color: '#6B6B6B' }}>
                  Crie uma senha
                </label>
                <button
                  type="button"
                  onClick={() => setMostrar1(!mostrar1)}
                  className="text-sm"
                  style={{ color: '#6B6B6B' }}
                >
                  {mostrar1 ? 'Esconder' : 'Mostrar'}
                </button>
              </div>
              <input
                type={mostrar1 ? 'text' : 'password'}
                value={novaSenha}
                onChange={(e) => setNovaSenha(e.target.value)}
                required
                className="w-full h-12 px-4 rounded-lg border outline-none bg-white focus:ring-2 focus:ring-[#105453]/30"
                style={{ borderColor: '#CFCFCF' }}
              />
              <p className="text-xs" style={{ color: '#6B6B6B' }}>
                Use 6 ou mais caracteres com no mínimo 1 letra maiúscula e números
              </p>
            </div>

            {/* Confirmar senha */}
            <div className="flex flex-col gap-1.5">
              <div className="flex justify-between">
                <label className="text-sm" style={{ color: '#6B6B6B' }}>
                  Confirme sua senha
                </label>
                <button
                  type="button"
                  onClick={() => setMostrar2(!mostrar2)}
                  className="text-sm"
                  style={{ color: '#6B6B6B' }}
                >
                  {mostrar2 ? 'Esconder' : 'Mostrar'}
                </button>
              </div>
              <input
                type={mostrar2 ? 'text' : 'password'}
                value={confirmar}
                onChange={(e) => setConfirmar(e.target.value)}
                required
                className="w-full h-12 px-4 rounded-lg border outline-none bg-white focus:ring-2 focus:ring-[#105453]/30"
                style={{
                  borderColor: senhasNaoConferem ? '#CC2727' : '#CFCFCF',
                }}
              />
              {senhasNaoConferem && (
                <p className="text-xs text-red-600">A senha não é igual</p>
              )}
            </div>

            {erro && (
              <p className="text-sm text-red-600 text-center">{erro}</p>
            )}

            {/* Botão */}
            <button
              type="submit"
              disabled={carregando}
              className="w-full h-[52px] rounded-full text-base font-semibold text-white transition-opacity disabled:opacity-70"
              style={{ backgroundColor: '#105453' }}
            >
              {carregando ? 'Salvando...' : 'Criar conta'}
            </button>
          </form>

          <p
            className="text-center text-sm mt-6"
            style={{ color: '#6B6B6B' }}
          >
            Já tem uma conta?{' '}
            <button
              onClick={() => navigate('/login')}
              className="font-semibold"
              style={{ color: '#105453' }}
            >
              Fazer login
            </button>
          </p>
        </div>
      </div>
    </div>
  )
}

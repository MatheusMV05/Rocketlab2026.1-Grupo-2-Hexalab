import axios from 'axios'  // axios puro, sem interceptors, para não criar loop no refresh

const authApi = axios.create({
  baseURL: 'http://localhost:8000/api',
  withCredentials: true,
})

export interface TokenResponse {
  access_token: string
  token_type: string
  perfil: string
  nome: string
  email: string
  primeiro_acesso: boolean
}

export const authService = {
  loginEmailSenha: (email: string, senha: string) =>
    authApi.post<TokenResponse>('/auth/login', { email, senha }).then((r) => r.data),

  loginGoogle: (credential: string) =>
    authApi.post<TokenResponse>('/auth/google', { credential }).then((r) => r.data),

  definirSenha: (nova_senha: string, confirmar_senha: string, accessToken: string) =>
    authApi
      .post<TokenResponse>(
        '/auth/definir-senha',
        { nova_senha, confirmar_senha },
        { headers: { Authorization: `Bearer ${accessToken}` } }
      )
      .then((r) => r.data),

  logout: () => authApi.post('/auth/logout'),
}

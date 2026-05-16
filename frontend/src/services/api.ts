import axios from 'axios'

export const api = axios.create({
  baseURL: 'http://localhost:8080/api',
  withCredentials: true, // envia/recebe cookies HttpOnly para refresh token
})

// Injeta Bearer token em cada requisição
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// Em 401, tenta renovar via refresh token e repete a requisição original
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config

    if (error.response?.status === 401 && !original._retried) {
      original._retried = true
      try {
        const { data } = await axios.post(
          'http://localhost:8080/api/auth/refresh',
          {},
          { withCredentials: true }
        )
        localStorage.setItem('access_token', data.access_token)
        original.headers.Authorization = `Bearer ${data.access_token}`
        return api(original)
      } catch {
        localStorage.removeItem('access_token')
        window.location.href = '/login'
      }
    }
    return Promise.reject(error)
  }
)

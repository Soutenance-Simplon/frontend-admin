import axios from 'axios'

export const API_BASE_URL = 'http://localhost:8090/api'

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json'
  }
})

// Intercepteur pour injecter automatiquement le token JWT dans chaque requête
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('admin_token')
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Intercepteur de réponse pour gérer les erreurs globales
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      // Si non autorisé et qu'on n'est pas déjà sur /login, déconnecter
      if (!window.location.pathname.includes('/login')) {
        localStorage.removeItem('admin_token')
        localStorage.removeItem('admin_user')
        window.location.href = '/login'
      }
    }
    return Promise.reject(error)
  }
)

export default api

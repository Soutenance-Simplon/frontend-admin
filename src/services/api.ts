/**
 * ====================================================================================================
 * CLIENT HTTP AXIOS : COUCHE DE COMMUNICATION REST DU DASHBOARD (API.TS)
 * ====================================================================================================
 * 
 * 🎓 CONCEPTS DE SÉCURITÉ WEB & CLIENT HTTP POUR LA SOUTENANCE :
 * Comment sécuriser les requêtes HTTP envoyées par l'interface d'administration vers l'API Gateway ?
 * 
 * 🛡️ MÉCANIQUE DES INTERCEPTEURS AXIOS (AXIOS INTERCEPTORS) :
 * 1. Intercepteur de Requête (Request Interceptor) :
 *    - Extrait le jeton administrateur depuis le localStorage (`admin_token`).
 *    - Injecte dynamiquement l'en-tête standard `Authorization: Bearer <token>` sur chaque appel HTTP.
 * 
 * 2. Intercepteur de Réponse (Response Interceptor) & Déconnexion Automatique :
 *    - Si l'API Gateway ou auth-service renvoie un code HTTP 401 Unauthorized (session expirée ou révoquée),
 *      l'intercepteur purge immédiatement le stockage local et redirige le navigateur vers `/login`.
 *    - Évite que l'administrateur reste sur un écran avec des données désynchronisées ou des boutons inopérants.
 * 
 * 3. Configuration Centralisée de l'URL de Base (Vite Environment Variables) :
 *    - Utilisation de `import.meta.env.VITE_API_BASE_URL` pour cibler l'API Gateway (port 8080 ou 8090)
 *      sans modifier le code source entre le développement et la production Docker.
 * ====================================================================================================
 */

// Importation du module ou composant
import axios from 'axios'

// Exportation
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8090/api'

// Déclaration de variable
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
    // Déclaration de variable
    const token = localStorage.getItem('admin_token')
    // Condition logique
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`
    }
    // Retourne la valeur
    return config
  },
  (error) => {
    // Retourne la valeur
    return Promise.reject(error)
  }
)


// Intercepteur de réponse pour gérer les erreurs globales
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Condition logique
    if (error.response && error.response.status === 401) {
      // Si non autorisé et qu'on n'est pas déjà sur /login, déconnecter
      if (!window.location.pathname.includes('/login')) {
        localStorage.removeItem('admin_token')
        localStorage.removeItem('admin_user')
        window.location.href = '/login'
      }
    }
    // Retourne la valeur
    return Promise.reject(error)
  }
)

// Exportation
export default api

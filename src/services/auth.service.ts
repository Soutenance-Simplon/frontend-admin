/**
 * ====================================================================================================
 * SERVICE MÉTIER D'AUTHENTIFICATION ADMINISTRATEUR (AUTH.SERVICE.TS)
 * ====================================================================================================
 * 
 * 🎓 CONCEPTS DE SÉCURITÉ CLIENT RBAC POUR LA SOUTENANCE :
 * Pourquoi vérifier le rôle côté client (Vue.js) en plus de la vérification côté Gateway ?
 * 
 * 🛡️ DÉFENSE EN PROFONDEUR (DEFENSE IN DEPTH) :
 * 1. Blocage Immédiat à la Connexion :
 *    Même si un utilisateur avec le rôle PATIENT ou MEDECIN saisit de bons identifiants,
 *    la méthode `login()` vérifie que `role == 'ADMIN' || 'SUPERADMIN'`.
 *    Si ce n'est pas le cas, aucun jeton n'est enregistré dans le stockage local et une erreur
 *    explicite est renvoyée, empêchant l'accès à l'interface d'administration.
 * 
 * 2. Persistance Sécurisée de Session :
 *    - `admin_token` : Access Token pour les en-têtes Authorization Bearer.
 *    - `admin_user` : Objet sérialisé contenant l'identité de l'administrateur connecté.
 * ====================================================================================================
 */

// Importation du module ou composant
import api from './api'

/**
 * Interface TypeScript modélisant l'utilisateur administrateur connecté.
 */
// Exportation
export interface AdminUser {
  userId: string
  telephone: string
  firstName: string
  lastName: string
  role: string
  accountStatus: string
  photoProfil?: string
}

// Exportation
export const authService = {
  /**
   * Tente une connexion administrative et vérifie les privilèges RBAC.
   * 
   * @param telephone Numéro de téléphone de l'administrateur
   * @param password Mot de passe en clair
   * @returns Promesse résolue avec l'objet AdminUser
   */
  async login(telephone: string, password: string): Promise<AdminUser> {
    // Déclaration de variable
    const res = await api.post('/auth/login', {
      telephone,
      password
    })

    // Déclaration de variable
    const data = res.data?.data
    // Condition logique
    if (!data || !data.accessToken) {
      throw new Error(res.data?.message || 'Réponse de connexion invalide')
    }

    // Vérifier que le compte a bien les droits d'administration (RBAC)
    const role = data.role ? data.role.toUpperCase() : ''
    // Condition logique
    if (role !== 'ADMIN' && role !== 'SUPERADMIN') {
      throw new Error("Accès refusé : Ce compte ne possède pas les privilèges d'administrateur.")
    }


    // Déclaration de variable
    const user: AdminUser = {
      userId: data.userId,
      telephone: data.telephone,
      firstName: data.firstName,
      lastName: data.lastName,
      role: data.role,
      accountStatus: data.accountStatus,
      photoProfil: data.photoProfil
    }

    localStorage.setItem('admin_token', data.accessToken)
    localStorage.setItem('admin_refresh_token', data.refreshToken || '')
    localStorage.setItem('admin_user', JSON.stringify(user))

    // Retourne la valeur
    return user
  },

  logout(): void {
    localStorage.removeItem('admin_token')
    localStorage.removeItem('admin_refresh_token')
    localStorage.removeItem('admin_user')
  },

  getCurrentUser(): AdminUser | null {
    // Déclaration de variable
    const raw = localStorage.getItem('admin_user')
    // Condition logique
    if (!raw) return null
    // Bloc d'essai pour gérer les erreurs
    try {
      // Retourne la valeur
      return JSON.parse(raw) as AdminUser
    } catch {
      // Retourne la valeur
      return null
    }
  },

  isAuthenticated(): boolean {
    // Déclaration de variable
    const token = localStorage.getItem('admin_token')
    // Déclaration de variable
    const user = this.getCurrentUser()
    // Retourne la valeur
    return !!token && !!user && (user.role === 'ADMIN' || user.role === 'SUPERADMIN')
  },

  getToken(): string | null {
    // Retourne la valeur
    return localStorage.getItem('admin_token')
  },

  async getUserDetails(userId: string): Promise<any> {
    // Déclaration de variable
    const res = await api.get(`/auth/admin/users/${userId}`)
    // Retourne la valeur
    return res.data?.data
  },

  async changePassword(userId: string, data: { ancienMotDePasse?: string; nouveauMotDePasse: string; confirmationMotDePasse: string }): Promise<void> {
    // Attente de la promesse (asynchrone)
    await api.put(`/auth/admin/users/${userId}/password`, data)
  },

  async updateProfile(userId: string, data: { firstName: string; lastName: string; telephone: string; email?: string; photoProfil?: string }): Promise<AdminUser> {
    // Déclaration de variable
    const res = await api.put(`/auth/admin/users/${userId}/profile`, data)
    // Déclaration de variable
    const updated = res.data?.data
    // Condition logique
    if (updated) {
      // Déclaration de variable
      const user: AdminUser = {
        userId: updated.id || userId,
        telephone: updated.telephone,
        firstName: updated.firstName,
        lastName: updated.lastName,
        role: updated.role || 'ADMIN',
        accountStatus: updated.accountStatus || 'ACTIF',
        photoProfil: updated.photoProfil
      }
      this.updateLocalCurrentUser(user)
      // Retourne la valeur
      return user
    }
    // Retourne la valeur
    return this.getCurrentUser()!
  },

  updateLocalCurrentUser(user: AdminUser): void {
    localStorage.setItem('admin_user', JSON.stringify(user))
  }
}

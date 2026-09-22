import api from './api'

export interface AdminUser {
  userId: string
  telephone: string
  firstName: string
  lastName: string
  role: string
  accountStatus: string
  photoProfil?: string
}

export const authService = {
  async login(telephone: string, password: string): Promise<AdminUser> {
    const res = await api.post('/auth/login', {
      telephone,
      password
    })

    const data = res.data?.data
    if (!data || !data.accessToken) {
      throw new Error(res.data?.message || 'Réponse de connexion invalide')
    }

    // Vérifier que le compte a bien les droits d'administration
    const role = data.role ? data.role.toUpperCase() : ''
    if (role !== 'ADMIN' && role !== 'SUPERADMIN') {
      throw new Error("Accès refusé : Ce compte ne possède pas les privilèges d'administrateur.")
    }

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

    return user
  },

  logout(): void {
    localStorage.removeItem('admin_token')
    localStorage.removeItem('admin_refresh_token')
    localStorage.removeItem('admin_user')
  },

  getCurrentUser(): AdminUser | null {
    const raw = localStorage.getItem('admin_user')
    if (!raw) return null
    try {
      return JSON.parse(raw) as AdminUser
    } catch {
      return null
    }
  },

  isAuthenticated(): boolean {
    const token = localStorage.getItem('admin_token')
    const user = this.getCurrentUser()
    return !!token && !!user && (user.role === 'ADMIN' || user.role === 'SUPERADMIN')
  },

  getToken(): string | null {
    return localStorage.getItem('admin_token')
  },

  async getUserDetails(userId: string): Promise<any> {
    const res = await api.get(`/auth/admin/users/${userId}`)
    return res.data?.data
  },

  async changePassword(userId: string, data: { ancienMotDePasse?: string; nouveauMotDePasse: string; confirmationMotDePasse: string }): Promise<void> {
    await api.put(`/auth/admin/users/${userId}/password`, data)
  },

  async updateProfile(userId: string, data: { firstName: string; lastName: string; telephone: string; email?: string; photoProfil?: string }): Promise<AdminUser> {
    const res = await api.put(`/auth/admin/users/${userId}/profile`, data)
    const updated = res.data?.data
    if (updated) {
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
      return user
    }
    return this.getCurrentUser()!
  },

  updateLocalCurrentUser(user: AdminUser): void {
    localStorage.setItem('admin_user', JSON.stringify(user))
  }
}

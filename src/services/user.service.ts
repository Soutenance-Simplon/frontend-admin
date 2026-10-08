// Importation du module ou composant
import api from './api'

// Exportation
export interface UserItem {
  id: string
  firstName: string
  lastName: string
  telephone: string
  email?: string
  dateNaissance?: string
  genre?: string
  photoProfil?: string
  role: string
  accountStatus: 'ACTIF' | 'SUSPENDU' | 'BLOQUE' | 'EN_ATTENTE' | 'SUPPRIME'
  phoneVerified: boolean
  failedLoginAttempts: number
  lockedUntil?: string
  isStaff: boolean
  isSuperuser: boolean
  createdAt: string
  updatedAt: string
}

// Exportation
export interface UserStats {
  totalUsers: number
  totalPatients: number
  totalMedecins: number
  totalAdmins: number
  statusActif: number
  statusSuspendu: number
  statusBloque: number
  statusEnAttente: number
}

// Exportation
export const userService = {
  async getAllUsers(params?: { search?: string; role?: string; status?: string }): Promise<UserItem[]> {
    // Déclaration de variable
    const res = await api.get('/auth/admin/users', { params })
    // Retourne la valeur
    return res.data?.data || []
  },

  async getUserById(id: string): Promise<UserItem> {
    // Déclaration de variable
    const res = await api.get(`/auth/admin/users/${id}`)
    // Retourne la valeur
    return res.data?.data
  },

  async updateStatus(id: string, status: string): Promise<UserItem> {
    // Déclaration de variable
    const res = await api.put(`/auth/admin/users/${id}/status`, null, {
      params: { status }
    })
    // Retourne la valeur
    return res.data?.data
  },

  async updateRole(id: string, role: string): Promise<UserItem> {
    // Déclaration de variable
    const res = await api.put(`/auth/admin/users/${id}/role`, null, {
      params: { role }
    })
    // Retourne la valeur
    return res.data?.data
  },

  async unlockUser(id: string): Promise<UserItem> {
    // Déclaration de variable
    const res = await api.put(`/auth/admin/users/${id}/unlock`)
    // Retourne la valeur
    return res.data?.data
  },

  async createUser(payload: {
    telephone: string
    firstName: string
    lastName: string
    email?: string
    password?: string
    role?: string
  }): Promise<UserItem> {
    // Déclaration de variable
    const res = await api.post('/auth/admin/users', payload)
    // Retourne la valeur
    return res.data?.data
  },

  async deleteUser(id: string): Promise<void> {
    // Attente de la promesse (asynchrone)
    await api.delete(`/auth/admin/users/${id}`)
  },

  async getStats(): Promise<UserStats> {
    // Déclaration de variable
    const res = await api.get('/auth/admin/stats')
    // Retourne la valeur
    return res.data?.data
  }
}

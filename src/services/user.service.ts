import api from './api'

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

export const userService = {
  async getAllUsers(params?: { search?: string; role?: string; status?: string }): Promise<UserItem[]> {
    const res = await api.get('/auth/admin/users', { params })
    return res.data?.data || []
  },

  async getUserById(id: string): Promise<UserItem> {
    const res = await api.get(`/auth/admin/users/${id}`)
    return res.data?.data
  },

  async updateStatus(id: string, status: string): Promise<UserItem> {
    const res = await api.put(`/auth/admin/users/${id}/status`, null, {
      params: { status }
    })
    return res.data?.data
  },

  async updateRole(id: string, role: string): Promise<UserItem> {
    const res = await api.put(`/auth/admin/users/${id}/role`, null, {
      params: { role }
    })
    return res.data?.data
  },

  async unlockUser(id: string): Promise<UserItem> {
    const res = await api.put(`/auth/admin/users/${id}/unlock`)
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
    const res = await api.post('/auth/admin/users', payload)
    return res.data?.data
  },

  async deleteUser(id: string): Promise<void> {
    await api.delete(`/auth/admin/users/${id}`)
  },

  async getStats(): Promise<UserStats> {
    const res = await api.get('/auth/admin/stats')
    return res.data?.data
  }
}

import api from './api'

export interface OnmsDoctor {
  id?: number
  numeroOrdre: string
  section: string
  nom: string
  prenom: string
  specialite: string
  etablissement: string
  region: string
  telephone: string
  statutProfessionnel: 'ACTIF' | 'SUSPENDU' | 'RADIE'
  dateInscription?: string
}

export interface PlatformDoctor {
  id: string
  userId: string
  nomComplet: string
  specialite: string
  etablissement: string
  region: string
  photoProfessionnelle?: string
  biographie?: string
  languesParlees?: string
  teleconsultationActive: boolean
  tarifConsultation?: number
  dureeConsultationMinutes: number
  statutMedecin: string
  verified: boolean
}

export const medecinService = {
  // ----- REGISTRE OFFICIEL ONMS -----
  async getAllOnms(): Promise<OnmsDoctor[]> {
    const res = await api.get('/admin/onms')
    return res.data?.data || []
  },

  async addOnms(doctor: Partial<OnmsDoctor>): Promise<OnmsDoctor> {
    const res = await api.post('/admin/onms', doctor)
    return res.data?.data
  },

  async updateOnms(numeroOrdre: string, doctor: Partial<OnmsDoctor>): Promise<OnmsDoctor> {
    const res = await api.put(`/admin/onms/${numeroOrdre}`, doctor)
    return res.data?.data
  },

  async deleteOnms(numeroOrdre: string): Promise<void> {
    await api.delete(`/admin/onms/${numeroOrdre}`)
  },

  // ----- MÉDECINS DE LA PLATEFORME -----
  async getAllPlatformMedecins(): Promise<PlatformDoctor[]> {
    const res = await api.get('/medecins/admin/all')
    return res.data?.data || []
  },

  async updateMedecinStatus(id: string, statut: string, isVerified?: boolean): Promise<PlatformDoctor> {
    const res = await api.put(`/medecins/admin/${id}/status`, null, {
      params: { statut, isVerified }
    })
    return res.data?.data
  }
}

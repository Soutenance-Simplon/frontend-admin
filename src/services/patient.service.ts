import api from './api'

export interface PatientProfile {
  id: string
  userId: string
  contactUrgenceNom?: string
  contactUrgenceTelephone?: string
  contactUrgenceLien?: string
  adresse?: string
  ville?: string
  region?: string
  consentAnalyseIa: boolean
  consentPartageFamille: boolean
  nfcId?: string
  createdAt: string
  updatedAt: string
}

export interface DossierMedical {
  id: string
  patientId: string
  groupeSanguin?: string
  taille?: number
  poids?: number
  groupeSanguinValide: boolean
  statutDossier: string
  codeQrSecurise?: string
}

export const patientService = {
  async getAllPatients(): Promise<PatientProfile[]> {
    const res = await api.get('/patients/admin/all')
    return res.data?.data || []
  },

  async getPatientById(patientId: string): Promise<PatientProfile> {
    const res = await api.get(`/patients/${patientId}`)
    return res.data?.data
  },

  async getDossierByPatientId(patientId: string): Promise<DossierMedical | null> {
    try {
      const res = await api.get(`/dossiers/patient/${patientId}`)
      return res.data?.data || null
    } catch {
      return null
    }
  },

  async getAllergies(patientId: string): Promise<any[]> {
    try {
      const res = await api.get(`/dossiers/patient/${patientId}/allergies`)
      return res.data?.data || []
    } catch {
      return []
    }
  },

  async getAntecedents(patientId: string): Promise<any[]> {
    try {
      const res = await api.get(`/dossiers/patient/${patientId}/antecedents`)
      return res.data?.data || []
    } catch {
      return []
    }
  },

  async getMaladies(patientId: string): Promise<any[]> {
    try {
      const res = await api.get(`/dossiers/patient/${patientId}/maladies`)
      return res.data?.data || []
    } catch {
      return []
    }
  },

  async getConsultations(patientId: string): Promise<any[]> {
    try {
      const res = await api.get(`/dossiers/patient/${patientId}/consultations`)
      return res.data?.data || []
    } catch {
      return []
    }
  },

  async getPrescriptions(patientId: string): Promise<any[]> {
    try {
      const res = await api.get(`/dossiers/patient/${patientId}/prescriptions`)
      return res.data?.data || []
    } catch {
      return []
    }
  },

  async getMembresFamille(userId: string): Promise<any[]> {
    try {
      const res = await api.get(`/patients/user/${userId}/famille`)
      return res.data?.data || []
    } catch {
      return []
    }
  }
}

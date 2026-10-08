// Importation du module ou composant
import api from './api'

// Exportation
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

// Exportation
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

// Exportation
export const patientService = {
  async getAllPatients(): Promise<PatientProfile[]> {
    // Déclaration de variable
    const res = await api.get('/patients/admin/all')
    // Retourne la valeur
    return res.data?.data || []
  },

  async getPatientById(patientId: string): Promise<PatientProfile> {
    // Déclaration de variable
    const res = await api.get(`/patients/${patientId}`)
    // Retourne la valeur
    return res.data?.data
  },

  async getDossierByPatientId(patientId: string): Promise<DossierMedical | null> {
    // Bloc d'essai pour gérer les erreurs
    try {
      // Déclaration de variable
      const res = await api.get(`/dossiers/patient/${patientId}`)
      // Retourne la valeur
      return res.data?.data || null
    } catch {
      // Retourne la valeur
      return null
    }
  },

  async getAllergies(patientId: string): Promise<any[]> {
    // Bloc d'essai pour gérer les erreurs
    try {
      // Déclaration de variable
      const res = await api.get(`/dossiers/patient/${patientId}/allergies`)
      // Retourne la valeur
      return res.data?.data || []
    } catch {
      // Retourne la valeur
      return []
    }
  },

  async getAntecedents(patientId: string): Promise<any[]> {
    // Bloc d'essai pour gérer les erreurs
    try {
      // Déclaration de variable
      const res = await api.get(`/dossiers/patient/${patientId}/antecedents`)
      // Retourne la valeur
      return res.data?.data || []
    } catch {
      // Retourne la valeur
      return []
    }
  },

  async getMaladies(patientId: string): Promise<any[]> {
    // Bloc d'essai pour gérer les erreurs
    try {
      // Déclaration de variable
      const res = await api.get(`/dossiers/patient/${patientId}/maladies`)
      // Retourne la valeur
      return res.data?.data || []
    } catch {
      // Retourne la valeur
      return []
    }
  },

  async getConsultations(patientId: string): Promise<any[]> {
    // Bloc d'essai pour gérer les erreurs
    try {
      // Déclaration de variable
      const res = await api.get(`/dossiers/patient/${patientId}/consultations`)
      // Retourne la valeur
      return res.data?.data || []
    } catch {
      // Retourne la valeur
      return []
    }
  },

  async getPrescriptions(patientId: string): Promise<any[]> {
    // Bloc d'essai pour gérer les erreurs
    try {
      // Déclaration de variable
      const res = await api.get(`/dossiers/patient/${patientId}/prescriptions`)
      // Retourne la valeur
      return res.data?.data || []
    } catch {
      // Retourne la valeur
      return []
    }
  },

  async getMembresFamille(userId: string): Promise<any[]> {
    // Bloc d'essai pour gérer les erreurs
    try {
      // Déclaration de variable
      const res = await api.get(`/patients/user/${userId}/famille`)
      // Retourne la valeur
      return res.data?.data || []
    } catch {
      // Retourne la valeur
      return []
    }
  }
}

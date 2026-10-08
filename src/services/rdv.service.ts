// Importation du module ou composant
import api from './api'

// Exportation
export interface RendezVousItem {
  id: string
  patientId: string
  medecinId: string
  dossierMedicalId?: string
  creneauId?: string
  motif: string
  dateHeure?: string
  dateHeureSouhaitee?: string
  dateHeureConfirmee?: string
  estUrgent?: boolean
  statut: 'DEMANDE' | 'ACCEPTE' | 'CONFIRME' | 'EN_COURS' | 'TERMINE' | 'ANNULE' | 'ABSENT' | 'EN_ATTENTE'
  typeConsultation: 'PRESENTIEL' | 'PRESENTIELLE' | 'TELECONSULTATION' | 'DOMICILE'
  refPaiement?: string
  referencePaiement?: string
  statutPaiement?: string
  montant?: number
  tarifApplique?: number
  paiementValide?: boolean
  notesMedecin?: string
  createdAt?: string
  updatedAt?: string
}

// Exportation
export interface RdvStats {
  totalRdv: number
  confirmes: number
  termines: number
  demandes: number
  annules: number
  teleconsultations: number
  presentiel: number
}

// Exportation
export const rdvService = {
  async getAllRendezVous(): Promise<RendezVousItem[]> {
    // Déclaration de variable
    const res = await api.get('/rdv/admin/all')
    // Retourne la valeur
    return res.data?.data || []
  },

  async getAdminStats(): Promise<RdvStats> {
    // Déclaration de variable
    const res = await api.get('/rdv/admin/stats')
    // Retourne la valeur
    return res.data?.data
  },

  async changerStatut(id: string, statut: string, raison?: string): Promise<RendezVousItem> {
    // Déclaration de variable
    const res = await api.put(`/rdv/${id}/statut`, { statut, raison }, {
      params: { nouveauStatut: statut, raison }
    })
    // Retourne la valeur
    return res.data?.data
  },

  async supprimerRendezVous(id: string): Promise<void> {
    // Attente de la promesse (asynchrone)
    await api.delete(`/rdv/${id}`)
  }
}

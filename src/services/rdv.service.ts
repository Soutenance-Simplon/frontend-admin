import api from './api'

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

export interface RdvStats {
  totalRdv: number
  confirmes: number
  termines: number
  demandes: number
  annules: number
  teleconsultations: number
  presentiel: number
}

export const rdvService = {
  async getAllRendezVous(): Promise<RendezVousItem[]> {
    const res = await api.get('/rdv/admin/all')
    return res.data?.data || []
  },

  async getAdminStats(): Promise<RdvStats> {
    const res = await api.get('/rdv/admin/stats')
    return res.data?.data
  },

  async changerStatut(id: string, statut: string, raison?: string): Promise<RendezVousItem> {
    const res = await api.put(`/rdv/${id}/statut`, { statut, raison }, {
      params: { nouveauStatut: statut, raison }
    })
    return res.data?.data
  },

  async supprimerRendezVous(id: string): Promise<void> {
    await api.delete(`/rdv/${id}`)
  }
}

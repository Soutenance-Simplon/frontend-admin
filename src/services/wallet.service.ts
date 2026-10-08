// Importation du module ou composant
import api from './api'

// Exportation
export interface WalletItem {
  id: string
  userId: string
  solde: number
  devise: string
  statut: 'ACTIF' | 'SUSPENDU' | 'BLOQUE'
  createdAt: string
  updatedAt: string
}

// Exportation
export interface TransactionItem {
  id: string
  typeTransaction: string
  montant: number
  statut: string
  moyenPaiement: string
  referencePaiement?: string
  description?: string
  dateTransaction: string
  beneficiaireUserId?: string
  portefeuille?: {
    id: string
    userId: string
  }
}

// Exportation
export interface WalletStats {
  totalWallets: number
  soldeTotalPlateforme: number
  volumeTotalTransactions: number
  nombreTransactions: number
}

// Exportation
export const walletService = {
  async getAllWallets(): Promise<WalletItem[]> {
    // Déclaration de variable
    const res = await api.get('/wallet/admin/all-wallets')
    // Retourne la valeur
    return res.data?.data || []
  },

  async getAllTransactions(): Promise<TransactionItem[]> {
    // Déclaration de variable
    const res = await api.get('/wallet/admin/all-transactions')
    // Retourne la valeur
    return res.data?.data || []
  },

  async getWalletStats(): Promise<WalletStats> {
    // Déclaration de variable
    const res = await api.get('/wallet/admin/stats')
    // Retourne la valeur
    return res.data?.data
  },

  async ajusterPortefeuille(payload: {
    userId: string
    montant: number
    type: 'CREDIT' | 'DEBIT'
    justification: string
  }): Promise<TransactionItem> {
    // Déclaration de variable
    const res = await api.post('/wallet/admin/ajuster', payload)
    // Retourne la valeur
    return res.data?.data
  }
}

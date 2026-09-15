import api from './api'

export interface WalletItem {
  id: string
  userId: string
  solde: number
  devise: string
  statut: 'ACTIF' | 'SUSPENDU' | 'BLOQUE'
  createdAt: string
  updatedAt: string
}

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

export interface WalletStats {
  totalWallets: number
  soldeTotalPlateforme: number
  volumeTotalTransactions: number
  nombreTransactions: number
}

export const walletService = {
  async getAllWallets(): Promise<WalletItem[]> {
    const res = await api.get('/wallet/admin/all-wallets')
    return res.data?.data || []
  },

  async getAllTransactions(): Promise<TransactionItem[]> {
    const res = await api.get('/wallet/admin/all-transactions')
    return res.data?.data || []
  },

  async getWalletStats(): Promise<WalletStats> {
    const res = await api.get('/wallet/admin/stats')
    return res.data?.data
  },

  async ajusterPortefeuille(payload: {
    userId: string
    montant: number
    type: 'CREDIT' | 'DEBIT'
    justification: string
  }): Promise<TransactionItem> {
    const res = await api.post('/wallet/admin/ajuster', payload)
    return res.data?.data
  }
}

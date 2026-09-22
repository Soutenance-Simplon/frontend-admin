<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import Modal from '../components/common/Modal.vue'
import StatCard from '../components/common/StatCard.vue'
import Pagination from '../components/common/Pagination.vue'
import {
  walletService,
  type WalletItem,
  type TransactionItem,
  type WalletStats
} from '../services/wallet.service'
import { useToast } from '../composables/useToast'
import {
  Search,
  Wallet,
  TrendingUp,
  ReceiptText,
  SlidersHorizontal,
  CreditCard
} from 'lucide-vue-next'

const toast = useToast()

const activeTab = ref<'wallets' | 'transactions'>('wallets')
const loading = ref(true)

const wallets = ref<WalletItem[]>([])
const transactions = ref<TransactionItem[]>([])
const stats = ref<WalletStats | null>(null)

const searchQuery = ref('')

// Adjustment Modal
const isAjusterModalOpen = ref(false)
const ajusterForm = ref({
  userId: '',
  montant: 5000,
  type: 'CREDIT' as 'CREDIT' | 'DEBIT',
  justification: 'Régularisation administrative'
})

const fetchData = async () => {
  loading.value = true
  try {
    const [wRes, tRes, sRes] = await Promise.allSettled([
      walletService.getAllWallets(),
      walletService.getAllTransactions(),
      walletService.getWalletStats()
    ])
    if (wRes.status === 'fulfilled') wallets.value = wRes.value
    if (tRes.status === 'fulfilled') transactions.value = tRes.value
    if (sRes.status === 'fulfilled') stats.value = sRes.value
  } catch {
    toast.error('Erreur lors du chargement des finances')
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  fetchData()
})

const openAjusterModal = (wallet?: WalletItem) => {
  if (wallet) {
    ajusterForm.value.userId = wallet.userId
  } else {
    ajusterForm.value.userId = wallets.value[0]?.userId || ''
  }
  ajusterForm.value.montant = 5000
  ajusterForm.value.type = 'CREDIT'
  ajusterForm.value.justification = 'Régularisation administrative'
  isAjusterModalOpen.value = true
}

const handleAjuster = async () => {
  if (!ajusterForm.value.userId || !ajusterForm.value.montant) {
    toast.warning('Veuillez renseigner tous les champs obligatoires')
    return
  }
  try {
    await walletService.ajusterPortefeuille(ajusterForm.value)
    toast.success(`Portefeuille ${ajusterForm.value.type === 'CREDIT' ? 'crédité' : 'débité'} avec succès.`)
    isAjusterModalOpen.value = false
    fetchData()
  } catch (err: any) {
    toast.error(err.response?.data?.message || 'Erreur lors de l’ajustement')
  }
}

const formatCurrency = (amount?: number) => {
  if (amount === undefined || amount === null) return '0 FCFA'
  return new Intl.NumberFormat('fr-FR').format(amount) + ' FCFA'
}

const formatDate = (dateStr?: string) => {
  if (!dateStr) return '-'
  try {
    return new Date(dateStr).toLocaleString('fr-FR', {
      dateStyle: 'short',
      timeStyle: 'short'
    })
  } catch {
    return dateStr
  }
}

// Wallets Pagination
const walletCurrentPage = ref(1)
const walletPageSize = ref(8)

const filteredWalletsList = computed(() => {
  if (!searchQuery.value.trim()) return wallets.value
  const q = searchQuery.value.toLowerCase()
  return wallets.value.filter(w =>
    w.id?.toLowerCase().includes(q) ||
    w.userId?.toLowerCase().includes(q)
  )
})

const paginatedWallets = computed(() => {
  const start = (walletCurrentPage.value - 1) * walletPageSize.value
  return filteredWalletsList.value.slice(start, start + walletPageSize.value)
})

// Transactions Pagination
const txCurrentPage = ref(1)
const txPageSize = ref(8)

const filteredTransactionsList = computed(() => {
  if (!searchQuery.value.trim()) return transactions.value
  const q = searchQuery.value.toLowerCase()
  return transactions.value.filter(t =>
    t.id?.toLowerCase().includes(q) ||
    t.description?.toLowerCase().includes(q) ||
    t.typeTransaction?.toLowerCase().includes(q) ||
    t.moyenPaiement?.toLowerCase().includes(q)
  )
})

const paginatedTransactions = computed(() => {
  const start = (txCurrentPage.value - 1) * txPageSize.value
  return filteredTransactionsList.value.slice(start, start + txPageSize.value)
})

const handleSearch = () => {
  walletCurrentPage.value = 1
  txCurrentPage.value = 1
}
</script>

<template>
  <div class="finances-view">
    <!-- Top KPI cards -->
    <div class="stats-grid" v-if="stats">
      <StatCard
        title="Solde Déposé Cumulé"
        :value="formatCurrency(stats.soldeTotalPlateforme)"
        :subText="`${stats.totalWallets} portefeuilles de santé sous gestion`"
        :icon="Wallet"
        themeColor="vert"
      />

      <StatCard
        title="Volume Total Transactions"
        :value="formatCurrency(stats.volumeTotalTransactions)"
        :subText="`${stats.nombreTransactions} opérations financières enregistrées`"
        :icon="TrendingUp"
        themeColor="noir"
      />
    </div>

    <div class="card-panel">
      <!-- Tabs Navigation -->
      <div class="tabs-nav">
        <button
          class="tab-btn"
          :class="{ active: activeTab === 'wallets' }"
          @click="activeTab = 'wallets'"
        >
          <Wallet :size="15" :stroke-width="1.8" />
          <span>Portefeuilles de Santé ({{ wallets.length }})</span>
        </button>
        <button
          class="tab-btn"
          :class="{ active: activeTab === 'transactions' }"
          @click="activeTab = 'transactions'"
        >
          <ReceiptText :size="15" :stroke-width="1.8" />
          <span>Grand Livre des Transactions ({{ transactions.length }})</span>
        </button>
      </div>

      <!-- Tab 1: Wallets -->
      <div v-if="activeTab === 'wallets'">
        <div class="panel-header">
          <div class="toolbar">
            <div class="search-input-wrapper">
              <span class="search-icon-inside"><Search :size="15" :stroke-width="1.8" /></span>
              <input
                type="text"
                v-model="searchQuery"
                @input="handleSearch"
                placeholder="Rechercher par ID portefeuille ou User ID..."
              />
            </div>
          </div>
          <button class="btn btn-primary" @click="openAjusterModal()">
            <SlidersHorizontal :size="14" :stroke-width="1.8" />
            <span>Régulariser un Solde</span>
          </button>
        </div>

        <div class="table-responsive">
          <div v-if="loading" class="loading-state">
            <div class="spinner"></div>
            <p>Chargement des portefeuilles...</p>
          </div>

          <div v-else-if="filteredWalletsList.length === 0" class="empty-state">
            <Wallet :size="32" class="empty-icon" />
            <p>Aucun portefeuille ne correspond à votre recherche.</p>
          </div>

          <table v-else class="data-table">
            <thead>
              <tr>
                <th>Réf. Portefeuille</th>
                <th>Bénéficiaire / Compte</th>
                <th>Solde Disponible</th>
                <th>État du Compte</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="w in paginatedWallets" :key="w.id">
                <td>
                  <strong>Portefeuille #{{ w.id.substring(0, 6).toUpperCase() }}</strong>
                </td>
                <td>
                  <span class="user-ref-tag">Compte #{{ w.userId.substring(0, 8).toUpperCase() }}</span>
                </td>
                <td>
                  <span class="solde-badge">
                    {{ formatCurrency(w.solde) }}
                  </span>
                </td>
                <td>
                  <span :class="['badge', w.statut === 'ACTIF' ? 'badge-actif' : 'badge-suspendu']">
                    <span class="badge-dot"></span>
                    {{ w.statut }}
                  </span>
                </td>
                <td>
                  <button class="btn btn-secondary btn-sm" @click="openAjusterModal(w)">
                    Ajuster
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Pagination Wallets -->
        <Pagination
          v-if="filteredWalletsList.length > 0"
          v-model:currentPage="walletCurrentPage"
          :totalItems="filteredWalletsList.length"
          v-model:pageSize="walletPageSize"
        />
      </div>

      <!-- Tab 2: Transactions -->
      <div v-if="activeTab === 'transactions'">
        <div class="panel-header">
          <div class="toolbar">
            <div class="search-input-wrapper">
              <span class="search-icon-inside"><Search :size="15" :stroke-width="1.8" /></span>
              <input
                type="text"
                v-model="searchQuery"
                @input="handleSearch"
                placeholder="Filtrer les opérations financières..."
              />
            </div>
          </div>
        </div>

        <div class="table-responsive">
          <div v-if="loading" class="loading-state">
            <div class="spinner"></div>
            <p>Chargement du journal des transactions...</p>
          </div>

          <div v-else-if="filteredTransactionsList.length === 0" class="empty-state">
            <CreditCard :size="32" class="empty-icon" />
            <p>Aucune transaction financière enregistrée.</p>
          </div>

          <table v-else class="data-table">
            <thead>
              <tr>
                <th>Horodatage</th>
                <th>Type d'Opération</th>
                <th>Montant</th>
                <th>Canal de Paiement</th>
                <th>Détails & Justification</th>
                <th>Statut</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="tx in paginatedTransactions" :key="tx.id">
                <td class="text-muted">{{ formatDate(tx.dateTransaction) }}</td>
                <td>
                  <span class="fw-bold">{{ tx.typeTransaction }}</span>
                </td>
                <td>
                  <span class="fw-bold" :class="tx.typeTransaction?.includes('DEPOT') ? 'text-success' : ''">
                    {{ tx.typeTransaction?.includes('DEPOT') ? '+' : '-' }}{{ formatCurrency(tx.montant) }}
                  </span>
                </td>
                <td>
                  <span class="badge badge-role-medecin">
                    {{ tx.moyenPaiement }}
                  </span>
                </td>
                <td>{{ tx.description || 'Transaction plateforme' }}</td>
                <td>
                  <span :class="['badge', tx.statut === 'VALIDE' ? 'badge-actif' : 'badge-suspendu']">
                    <span class="badge-dot"></span>
                    {{ tx.statut }}
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Pagination Transactions -->
        <Pagination
          v-if="filteredTransactionsList.length > 0"
          v-model:currentPage="txCurrentPage"
          :totalItems="filteredTransactionsList.length"
          v-model:pageSize="txPageSize"
        />
      </div>
    </div>

    <!-- Ajustement Manuel Modal -->
    <Modal :isOpen="isAjusterModalOpen" title="Régularisation & Ajustement de Solde" @close="isAjusterModalOpen = false">
      <form @submit.prevent="handleAjuster" class="form-grid">
        <div class="form-group full-width">
          <label>Référence / Identifiant du Titulaire *</label>
          <input type="text" v-model="ajusterForm.userId" required placeholder="Identifiant ou compte du titulaire" />
        </div>

        <div class="form-group">
          <label>Sens de l'Opération</label>
          <select v-model="ajusterForm.type">
            <option value="CREDIT">CRÉDIT (+ Ajouter des fonds)</option>
            <option value="DEBIT">DÉBIT (- Prélever des fonds)</option>
          </select>
        </div>

        <div class="form-group">
          <label>Montant (FCFA) *</label>
          <input type="number" v-model.number="ajusterForm.montant" min="100" required />
        </div>

        <div class="form-group full-width">
          <label>Motif de régularisation *</label>
          <input type="text" v-model="ajusterForm.justification" required placeholder="Ex: Compensation suite à report de téléconsultation" />
        </div>

        <div class="modal-actions full-width">
          <button type="button" class="btn btn-secondary" @click="isAjusterModalOpen = false">Annuler</button>
          <button type="submit" class="btn btn-primary">Valider l'Écriture</button>
        </div>
      </form>
    </Modal>
  </div>
</template>

<style scoped>
.text-primary { color: var(--primary); }
.text-success { color: var(--success); }

.solde-badge {
  background: var(--success-light);
  color: var(--success);
  font-weight: 700;
  padding: 3px 8px;
  border-radius: 4px;
  font-size: 0.88rem;
  border: 1px solid var(--success-border);
}

.fw-bold {
  font-weight: 600;
}

.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  margin-top: 8px;
}
</style>

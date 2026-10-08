<script setup lang="ts">
/**
 * ============================================================================
 * VUE DE GESTION FINANCIÈRE & AUDIT COMPTABLE DES PORTEFEUILLES (FCFA)
 * ============================================================================
 * RÔLE ARCHITECTURAL (POINT CLÉ POUR LA SOUTENANCE) :
 * Ce module offre à l'administrateur financier une vue d'ensemble sur tous les
 * portefeuilles électroniques (praticiens et patients) et sur le journal
 * général des écritures de transactions.
 *
 * RIGUEUR COMPTABLE & AUDITABILITÉ :
 * 1. Double onglet : Portefeuilles Actifs (Soldes consolidés) vs Journal des Transactions.
 * 2. Modèle de régularisation administrative : Tout ajustement manuel (crédit ou débit)
 *    exige obligatoirement une justification textuelle pour archivage légal.
 * 3. Suivi de la volumétrie financière globale et des commissions générées (10%).
 * ============================================================================
 */
// Importation du module ou composant
import { ref, computed, onMounted } from 'vue'
// Importation du module ou composant
import Modal from '../components/common/Modal.vue'
// Importation du module ou composant
import StatCard from '../components/common/StatCard.vue'
// Importation du module ou composant
import Pagination from '../components/common/Pagination.vue'
// Importation du module ou composant
import {
  walletService,
  type WalletItem,
  type TransactionItem,
  type WalletStats
} from '../services/wallet.service'
// Importation du module ou composant
import { useToast } from '../composables/useToast'
// Importation du module ou composant
import {
  Search,
  Wallet,
  TrendingUp,
  ReceiptText,
  SlidersHorizontal,
  CreditCard
} from 'lucide-vue-next'

// Déclaration de variable
const toast = useToast()

// --- Navigation et état d'affichage ---
const activeTab = ref<'wallets' | 'transactions'>('wallets')
// Déclaration de variable
const loading = ref(true)

// --- Données financières ---
const wallets = ref<WalletItem[]>([])                   // Liste de tous les comptes de portefeuille
// Déclaration de variable
const transactions = ref<TransactionItem[]>([])         // Historique global des flux monétaires
// Déclaration de variable
const stats = ref<WalletStats | null>(null)             // Agréats statistiques de volumétrie

// Déclaration de variable
const searchQuery = ref('')

// --- Formulaire d'ajustement ou régularisation exceptionnelle ---
const isAjusterModalOpen = ref(false)
// Déclaration de variable
const ajusterForm = ref({
  userId: '',
  montant: 5000,
  type: 'CREDIT' as 'CREDIT' | 'DEBIT',
  justification: 'Régularisation administrative'
})

// Déclaration de variable
const fetchData = async () => {
  loading.value = true
  // Bloc d'essai pour gérer les erreurs
  try {
    // Déclaration de variable
    const [wRes, tRes, sRes] = await Promise.allSettled([
      walletService.getAllWallets(),
      walletService.getAllTransactions(),
      walletService.getWalletStats()
    ])
    // Condition logique
    if (wRes.status === 'fulfilled') wallets.value = wRes.value
    // Condition logique
    if (tRes.status === 'fulfilled') transactions.value = tRes.value
    // Condition logique
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

// Déclaration de variable
const openAjusterModal = (wallet?: WalletItem) => {
  // Condition logique
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

// Déclaration de variable
const handleAjuster = async () => {
  // Condition logique
  if (!ajusterForm.value.userId || !ajusterForm.value.montant) {
    toast.warning('Veuillez renseigner tous les champs obligatoires')
    return
  }
  // Bloc d'essai pour gérer les erreurs
  try {
    // Attente de la promesse (asynchrone)
    await walletService.ajusterPortefeuille(ajusterForm.value)
    toast.success(`Portefeuille ${ajusterForm.value.type === 'CREDIT' ? 'crédité' : 'débité'} avec succès.`)
    isAjusterModalOpen.value = false
    fetchData()
  } catch (err: any) {
    toast.error(err.response?.data?.message || 'Erreur lors de l’ajustement')
  }
}

// Déclaration de variable
const formatCurrency = (amount?: number) => {
  // Condition logique
  if (amount === undefined || amount === null) return '0 FCFA'
  // Retourne la valeur
  return new Intl.NumberFormat('fr-FR').format(amount) + ' FCFA'
}

// Déclaration de variable
const formatDate = (dateStr?: string) => {
  // Condition logique
  if (!dateStr) return '-'
  // Bloc d'essai pour gérer les erreurs
  try {
    // Retourne la valeur
    return new Date(dateStr).toLocaleString('fr-FR', {
      dateStyle: 'short',
      timeStyle: 'short'
    })
  } catch {
    // Retourne la valeur
    return dateStr
  }
}

// Wallets Pagination
const walletCurrentPage = ref(1)
// Déclaration de variable
const walletPageSize = ref(8)

// Déclaration de variable
const filteredWalletsList = computed(() => {
  // Condition logique
  if (!searchQuery.value.trim()) return wallets.value
  // Déclaration de variable
  const q = searchQuery.value.toLowerCase()
  // Retourne la valeur
  return wallets.value.filter(w =>
    w.id?.toLowerCase().includes(q) ||
    w.userId?.toLowerCase().includes(q)
  )
})

// Déclaration de variable
const paginatedWallets = computed(() => {
  // Déclaration de variable
  const start = (walletCurrentPage.value - 1) * walletPageSize.value
  // Retourne la valeur
  return filteredWalletsList.value.slice(start, start + walletPageSize.value)
})

// Transactions Pagination
const txCurrentPage = ref(1)
// Déclaration de variable
const txPageSize = ref(8)

// Déclaration de variable
const filteredTransactionsList = computed(() => {
  // Condition logique
  if (!searchQuery.value.trim()) return transactions.value
  // Déclaration de variable
  const q = searchQuery.value.toLowerCase()
  // Retourne la valeur
  return transactions.value.filter(t =>
    t.id?.toLowerCase().includes(q) ||
    t.description?.toLowerCase().includes(q) ||
    t.typeTransaction?.toLowerCase().includes(q) ||
    t.moyenPaiement?.toLowerCase().includes(q)
  )
})

// Déclaration de variable
const paginatedTransactions = computed(() => {
  // Déclaration de variable
  const start = (txCurrentPage.value - 1) * txPageSize.value
  // Retourne la valeur
  return filteredTransactionsList.value.slice(start, start + txPageSize.value)
})

// Déclaration de variable
const handleSearch = () => {
  walletCurrentPage.value = 1
  txCurrentPage.value = 1
}
</script>

<template>
  <!-- Conteneur de bloc (div) -->
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

    <!-- Conteneur de bloc (div) -->
    <div class="card-panel">
      <!-- Tabs Navigation -->
      <div class="tabs-nav">
        <!-- Bouton cliquable -->
        <button
          class="tab-btn"
          :class="{ active: activeTab === 'wallets' }"
          @click="activeTab = 'wallets'"
        >
          <Wallet :size="15" :stroke-width="1.8" />
          <!-- Conteneur en ligne (span) -->
          <span>Portefeuilles de Santé ({{ wallets.length }})</span>
        </button>
        <!-- Bouton cliquable -->
        <button
          class="tab-btn"
          :class="{ active: activeTab === 'transactions' }"
          @click="activeTab = 'transactions'"
        >
          <ReceiptText :size="15" :stroke-width="1.8" />
          <!-- Conteneur en ligne (span) -->
          <span>Grand Livre des Transactions ({{ transactions.length }})</span>
        </button>
      </div>

      <!-- Tab 1: Wallets -->
      <div v-if="activeTab === 'wallets'">
        <!-- Conteneur de bloc (div) -->
        <div class="panel-header">
          <!-- Conteneur de bloc (div) -->
          <div class="toolbar">
            <!-- Conteneur de bloc (div) -->
            <div class="search-input-wrapper">
              <!-- Conteneur en ligne (span) -->
              <span class="search-icon-inside"><Search :size="15" :stroke-width="1.8" /></span>
              <!-- Champ de saisie utilisateur -->
              <input
                type="text"
                v-model="searchQuery"
                @input="handleSearch"
                placeholder="Rechercher par ID portefeuille ou User ID..."
              />
            </div>
          </div>
          <!-- Bouton cliquable -->
          <button class="btn btn-primary" @click="openAjusterModal()">
            <SlidersHorizontal :size="14" :stroke-width="1.8" />
            <!-- Conteneur en ligne (span) -->
            <span>Régulariser un Solde</span>
          </button>
        </div>

        <!-- Conteneur de bloc (div) -->
        <div class="table-responsive">
          <!-- Conteneur de bloc (div) -->
          <div v-if="loading" class="loading-state">
            <!-- Conteneur de bloc (div) -->
            <div class="spinner"></div>
            <!-- Paragraphe de texte -->
            <p>Chargement des portefeuilles...</p>
          </div>

          <!-- Conteneur de bloc (div) -->
          <div v-else-if="filteredWalletsList.length === 0" class="empty-state">
            <Wallet :size="32" class="empty-icon" />
            <!-- Paragraphe de texte -->
            <p>Aucun portefeuille ne correspond à votre recherche.</p>
          </div>

          <!-- Élément de tableau de données -->
          <table v-else class="data-table">
            <thead>
              <!-- Élément de tableau de données -->
              <tr>
                <th>Réf. Portefeuille</th>
                <th>Bénéficiaire / Compte</th>
                <th>Solde Disponible</th>
                <th>État du Compte</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              <!-- Élément de tableau de données -->
              <tr v-for="w in paginatedWallets" :key="w.id">
                <!-- Élément de tableau de données -->
                <td>
                  <strong>Portefeuille #{{ w.id.substring(0, 6).toUpperCase() }}</strong>
                </td>
                <!-- Élément de tableau de données -->
                <td>
                  <!-- Conteneur en ligne (span) -->
                  <span class="user-ref-tag">Compte #{{ w.userId.substring(0, 8).toUpperCase() }}</span>
                </td>
                <!-- Élément de tableau de données -->
                <td>
                  <!-- Conteneur en ligne (span) -->
                  <span class="solde-badge">
                    {{ formatCurrency(w.solde) }}
                  </span>
                </td>
                <!-- Élément de tableau de données -->
                <td>
                  <!-- Conteneur en ligne (span) -->
                  <span :class="['badge', w.statut === 'ACTIF' ? 'badge-actif' : 'badge-suspendu']">
                    <!-- Conteneur en ligne (span) -->
                    <span class="badge-dot"></span>
                    {{ w.statut }}
                  </span>
                </td>
                <!-- Élément de tableau de données -->
                <td>
                  <!-- Bouton cliquable -->
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
        <!-- Conteneur de bloc (div) -->
        <div class="panel-header">
          <!-- Conteneur de bloc (div) -->
          <div class="toolbar">
            <!-- Conteneur de bloc (div) -->
            <div class="search-input-wrapper">
              <!-- Conteneur en ligne (span) -->
              <span class="search-icon-inside"><Search :size="15" :stroke-width="1.8" /></span>
              <!-- Champ de saisie utilisateur -->
              <input
                type="text"
                v-model="searchQuery"
                @input="handleSearch"
                placeholder="Filtrer les opérations financières..."
              />
            </div>
          </div>
        </div>

        <!-- Conteneur de bloc (div) -->
        <div class="table-responsive">
          <!-- Conteneur de bloc (div) -->
          <div v-if="loading" class="loading-state">
            <!-- Conteneur de bloc (div) -->
            <div class="spinner"></div>
            <!-- Paragraphe de texte -->
            <p>Chargement du journal des transactions...</p>
          </div>

          <!-- Conteneur de bloc (div) -->
          <div v-else-if="filteredTransactionsList.length === 0" class="empty-state">
            <CreditCard :size="32" class="empty-icon" />
            <!-- Paragraphe de texte -->
            <p>Aucune transaction financière enregistrée.</p>
          </div>

          <!-- Élément de tableau de données -->
          <table v-else class="data-table">
            <thead>
              <!-- Élément de tableau de données -->
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
              <!-- Élément de tableau de données -->
              <tr v-for="tx in paginatedTransactions" :key="tx.id">
                <!-- Élément de tableau de données -->
                <td class="text-muted">{{ formatDate(tx.dateTransaction) }}</td>
                <!-- Élément de tableau de données -->
                <td>
                  <!-- Conteneur en ligne (span) -->
                  <span class="fw-bold">{{ tx.typeTransaction }}</span>
                </td>
                <!-- Élément de tableau de données -->
                <td>
                  <!-- Conteneur en ligne (span) -->
                  <span class="fw-bold" :class="tx.typeTransaction?.includes('DEPOT') ? 'text-success' : ''">
                    {{ tx.typeTransaction?.includes('DEPOT') ? '+' : '-' }}{{ formatCurrency(tx.montant) }}
                  </span>
                </td>
                <!-- Élément de tableau de données -->
                <td>
                  <!-- Conteneur en ligne (span) -->
                  <span class="badge badge-role-medecin">
                    {{ tx.moyenPaiement }}
                  </span>
                </td>
                <!-- Élément de tableau de données -->
                <td>{{ tx.description || 'Transaction plateforme' }}</td>
                <!-- Élément de tableau de données -->
                <td>
                  <!-- Conteneur en ligne (span) -->
                  <span :class="['badge', tx.statut === 'VALIDE' ? 'badge-actif' : 'badge-suspendu']">
                    <!-- Conteneur en ligne (span) -->
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
      <!-- Formulaire de saisie -->
      <form @submit.prevent="handleAjuster" class="form-grid">
        <!-- Conteneur de bloc (div) -->
        <div class="form-group full-width">
          <label>Référence / Identifiant du Titulaire *</label>
          <!-- Champ de saisie utilisateur -->
          <input type="text" v-model="ajusterForm.userId" required placeholder="Identifiant ou compte du titulaire" />
        </div>

        <!-- Conteneur de bloc (div) -->
        <div class="form-group">
          <label>Sens de l'Opération</label>
          <select v-model="ajusterForm.type">
            <option value="CREDIT">CRÉDIT (+ Ajouter des fonds)</option>
            <option value="DEBIT">DÉBIT (- Prélever des fonds)</option>
          </select>
        </div>

        <!-- Conteneur de bloc (div) -->
        <div class="form-group">
          <label>Montant (FCFA) *</label>
          <!-- Champ de saisie utilisateur -->
          <input type="number" v-model.number="ajusterForm.montant" min="100" required />
        </div>

        <!-- Conteneur de bloc (div) -->
        <div class="form-group full-width">
          <label>Motif de régularisation *</label>
          <!-- Champ de saisie utilisateur -->
          <input type="text" v-model="ajusterForm.justification" required placeholder="Ex: Compensation suite à report de téléconsultation" />
        </div>

        <!-- Conteneur de bloc (div) -->
        <div class="modal-actions full-width">
          <!-- Bouton cliquable -->
          <button type="button" class="btn btn-secondary" @click="isAjusterModalOpen = false">Annuler</button>
          <!-- Bouton cliquable -->
          <button type="submit" class="btn btn-primary">Valider l'Écriture</button>
        </div>
      </form>
    </Modal>
  </div>
</template>

<style scoped>
/* Sélecteur de classe CSS */
.text-primary { color: var(--primary); }
/* Sélecteur de classe CSS */
.text-success { color: var(--success); }

/* Sélecteur de classe CSS */
.solde-badge {
  background: var(--success-light);
  color: var(--success);
  font-weight: 700;
  padding: 3px 8px;
  border-radius: 4px;
  font-size: 0.88rem;
  border: 1px solid var(--success-border);
}

/* Sélecteur de classe CSS */
.fw-bold {
  font-weight: 600;
}

/* Sélecteur de classe CSS */
.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  margin-top: 8px;
}
</style>

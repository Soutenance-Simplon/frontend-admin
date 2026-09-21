<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import StatCard from '../components/common/StatCard.vue'
import Pagination from '../components/common/Pagination.vue'
import {
  systemService,
  type AuditLogItem
} from '../services/system.service'
import { useToast } from '../composables/useToast'
import {
  Search,
  RefreshCw,
  ShieldCheck,
  FileText,
  AlertTriangle,
  CheckCircle2,
  Stethoscope,
  TrendingUp,
  Filter
} from 'lucide-vue-next'

const toast = useToast()

const auditLogs = ref<AuditLogItem[]>([])
const loadingLogs = ref(true)

const searchQuery = ref('')
const selectedCategory = ref('TOUS')
const selectedRole = ref('TOUS')

const fetchAuditLogs = async () => {
  loadingLogs.value = true
  try {
    auditLogs.value = await systemService.getRecentAuditLogs()
  } catch {
    toast.error('Erreur lors du chargement du journal d’audit')
  } finally {
    loadingLogs.value = false
  }
}

onMounted(() => {
  fetchAuditLogs()
})

// Administrative KPI metrics derived from full audit trail
const totalEvents = computed(() => auditLogs.value.length)
const totalFinances = computed(() =>
  auditLogs.value.filter(l => l.actionCategory === 'FINANCE').length
)
const totalOnms = computed(() =>
  auditLogs.value.filter(l => l.actionCategory === 'ONMS').length
)
const totalAlerts = computed(() =>
  auditLogs.value.filter(l => l.status === 'ALERTE' || l.actionCategory === 'SECURITE').length
)

// Formatting helpers
const formatExactTime = (dateStr?: string) => {
  if (!dateStr) return '--:--:--'
  try {
    return new Date(dateStr).toLocaleTimeString('fr-FR', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    })
  } catch {
    return '--:--:--'
  }
}

const formatExactDate = (dateStr?: string) => {
  if (!dateStr) return '-'
  try {
    return new Date(dateStr).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    })
  } catch {
    return dateStr
  }
}

const formatRelativeTime = (dateStr?: string) => {
  if (!dateStr) return ''
  try {
    const diffMs = Date.now() - new Date(dateStr).getTime()
    const diffMins = Math.floor(diffMs / 60000)
    if (diffMins < 1) return 'À l’instant'
    if (diffMins < 60) return `Il y a ${diffMins} min`
    const diffHours = Math.floor(diffMins / 60)
    if (diffHours < 24) return `Il y a ${diffHours}h`
    return 'Aujourd’hui'
  } catch {
    return ''
  }
}

const getRoleBadge = (role?: string) => {
  switch (role) {
    case 'ADMIN': return { label: 'Admin', class: 'role-admin' }
    case 'MEDECIN': return { label: 'Médecin', class: 'role-medecin' }
    case 'PATIENT': return { label: 'Patient', class: 'role-patient' }
    case 'SYSTEME': return { label: 'Système', class: 'role-systeme' }
    default: return { label: 'Utilisateur', class: 'role-patient' }
  }
}

const getCategoryBadge = (cat?: string) => {
  switch (cat) {
    case 'FINANCE': return { label: 'Finance (10%)', class: 'cat-finance' }
    case 'ONMS': return { label: 'Ordre ONMS', class: 'cat-onms' }
    case 'MEDICAL': return { label: 'Consultation', class: 'cat-medical' }
    case 'DOSSIER': return { label: 'Dossier Patient', class: 'cat-dossier' }
    case 'SECURITE': return { label: 'Sécurité', class: 'cat-securite' }
    case 'CONNEXION': return { label: 'Connexion', class: 'cat-connexion' }
    default: return { label: 'Activité', class: 'cat-general' }
  }
}

// Pagination
const currentPage = ref(1)
const pageSize = ref(10)

const filteredLogsList = computed(() => {
  return auditLogs.value.filter(l => {
    // Filtre Catégorie
    const matchCategory = selectedCategory.value === 'TOUS' || l.actionCategory === selectedCategory.value

    // Filtre Rôle
    const matchRole = selectedRole.value === 'TOUS' || l.actorRole === selectedRole.value

    // Recherche plein texte
    const q = searchQuery.value.trim().toLowerCase()
    const matchQuery = !q ||
      l.actorName?.toLowerCase().includes(q) ||
      l.actorTelephone?.includes(q) ||
      l.actionTitle?.toLowerCase().includes(q) ||
      l.description?.toLowerCase().includes(q) ||
      l.targetResource?.toLowerCase().includes(q)

    return matchCategory && matchRole && matchQuery
  })
})

const paginatedLogs = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value
  return filteredLogsList.value.slice(start, start + pageSize.value)
})

const handleSearch = () => {
  currentPage.value = 1
}

const handleFilterChange = () => {
  currentPage.value = 1
}
</script>

<template>
  <div class="system-view">
    <!-- Top Administrative Stats Grid -->
    <div class="stats-grid">
      <StatCard
        title="Total Opérations Tracées"
        :value="totalEvents"
        trend="Traçabilité continue certifiée"
        trendType="neutral"
        :icon="FileText"
        themeColor="noir"
      />
      <StatCard
        title="Paiements & Règle 10%"
        :value="totalFinances"
        trend="Flux financiers et commissions"
        trendType="positive"
        :icon="TrendingUp"
        themeColor="vert"
      />
      <StatCard
        title="Homologations ONMS"
        :value="totalOnms"
        trend="Vérifications ordinales tracées"
        trendType="positive"
        :icon="Stethoscope"
        themeColor="noir"
      />
      <StatCard
        title="Alertes & Sécurité"
        :value="totalAlerts"
        trend="Tentatives erronées ou consignées"
        :trendType="totalAlerts > 0 ? 'negative' : 'positive'"
        :icon="AlertTriangle"
        themeColor="vert"
      />
    </div>

    <!-- Security & Activity Audit Journal -->
    <div class="card-panel">
      <div class="panel-header">
        <div class="toolbar-wrap">
          <div class="search-input-wrapper">
            <span class="search-icon-inside"><Search :size="15" :stroke-width="1.8" /></span>
            <input
              type="text"
              v-model="searchQuery"
              @input="handleSearch"
              placeholder="Rechercher par auteur (qui), action (quoi), cible, téléphone..."
            />
          </div>

          <select class="filter-select" v-model="selectedCategory" @change="handleFilterChange">
            <option value="TOUS">Toutes les catégories</option>
            <option value="FINANCE">Paiements & Règle 10%</option>
            <option value="ONMS">Ordre National ONMS</option>
            <option value="MEDICAL">Consultations Médicales</option>
            <option value="DOSSIER">Dossiers Patients</option>
            <option value="CONNEXION">Connexions Sécurisées</option>
            <option value="SECURITE">Alertes & Sécurité</option>
          </select>

          <select class="filter-select" v-model="selectedRole" @change="handleFilterChange">
            <option value="TOUS">Tous les auteurs (Qui)</option>
            <option value="ADMIN">Administrateurs</option>
            <option value="MEDECIN">Médecins Praticiens</option>
            <option value="PATIENT">Patients Adhérents</option>
            <option value="SYSTEME">Système Automatisé</option>
          </select>
        </div>

        <button class="btn btn-secondary btn-sm" @click="fetchAuditLogs" :disabled="loadingLogs">
          <RefreshCw :size="13" :class="{ 'spin-icon': loadingLogs }" />
          <span>{{ loadingLogs ? 'Actualisation...' : 'Actualiser le Journal' }}</span>
        </button>
      </div>

      <div class="table-responsive">
        <div v-if="loadingLogs" class="loading-state">
          <div class="spinner"></div>
          <p>Chargement du journal d'activité...</p>
        </div>

        <div v-else-if="filteredLogsList.length === 0" class="empty-state">
          <ShieldCheck :size="32" class="empty-icon" />
          <p>Aucune trace d'opération ne correspond à vos critères de recherche.</p>
        </div>

        <table v-else class="data-table">
          <thead>
            <tr>
              <th style="min-width: 140px;">Quand & Moment</th>
              <th style="min-width: 210px;">Qui (Auteur de l'acte)</th>
              <th style="min-width: 170px;">Quoi (Action & Catégorie)</th>
              <th>Détail de l'Opération & Cible Impactée</th>
              <th style="min-width: 100px;">Résultat</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="log in paginatedLogs" :key="log.id">
              <!-- QUAND & MOMENT -->
              <td>
                <div class="time-cell">
                  <div class="time-exact">{{ formatExactTime(log.createdAt) }}</div>
                  <div class="date-exact">{{ formatExactDate(log.createdAt) }}</div>
                  <span class="time-relative-pill">{{ formatRelativeTime(log.createdAt) }}</span>
                </div>
              </td>

              <!-- QUI (AUTEUR) -->
              <td>
                <div class="actor-cell">
                  <div class="actor-avatar" :class="log.actorRole?.toLowerCase()">
                    {{ log.actorName?.[0] || 'U' }}
                  </div>
                  <div class="actor-details">
                    <div class="actor-name">{{ log.actorName }}</div>
                    <div class="actor-meta">
                      <span class="actor-role-badge" :class="getRoleBadge(log.actorRole).class">
                        {{ getRoleBadge(log.actorRole).label }}
                      </span>
                      <span v-if="log.actorTelephone" class="actor-phone">{{ log.actorTelephone }}</span>
                    </div>
                  </div>
                </div>
              </td>

              <!-- QUOI (ACTION & CATÉGORIE) -->
              <td>
                <div class="action-cell">
                  <span class="cat-badge" :class="getCategoryBadge(log.actionCategory).class">
                    {{ getCategoryBadge(log.actionCategory).label }}
                  </span>
                  <div class="action-title">{{ log.actionTitle || log.action }}</div>
                </div>
              </td>

              <!-- DÉTAIL & CIBLE -->
              <td>
                <div class="detail-cell">
                  <p class="detail-desc">{{ log.description }}</p>
                  <div v-if="log.targetResource" class="target-chip">
                    <span class="target-label">Cible :</span>
                    <span class="target-val">{{ log.targetResource }}</span>
                  </div>
                </div>
              </td>

              <!-- RÉSULTAT -->
              <td>
                <span
                  class="badge"
                  :class="log.status === 'ALERTE' ? 'badge-bloque' : 'badge-actif'"
                >
                  <span class="badge-dot"></span>
                  {{ log.status === 'ALERTE' ? 'Alerte' : 'Conforme' }}
                </span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Pagination Audit Logs -->
      <Pagination
        v-if="filteredLogsList.length > 0"
        v-model:currentPage="currentPage"
        :totalItems="filteredLogsList.length"
        v-model:pageSize="pageSize"
      />
    </div>
  </div>
</template>

<style scoped>
.system-view {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(230px, 1fr));
  gap: 16px;
}

.toolbar-wrap {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
  flex: 1;
}

/* ========================================= */
/* TRACEABILITY TABLE STYLES (QUI, QUOI, QUAND) */
/* ========================================= */
.time-cell {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.time-exact {
  font-weight: 700;
  font-size: 0.85rem;
  color: var(--text-dark);
}

.date-exact {
  font-size: 0.72rem;
  color: var(--text-muted);
}

.time-relative-pill {
  display: inline-block;
  font-size: 0.65rem;
  font-weight: 600;
  background: var(--bg-alt);
  padding: 1px 6px;
  border-radius: 4px;
  border: 1px solid var(--border-color);
  color: var(--text-muted);
  width: fit-content;
  margin-top: 2px;
}

.actor-cell {
  display: flex;
  align-items: center;
  gap: 10px;
}

.actor-avatar {
  width: 32px;
  height: 32px;
  border-radius: var(--radius-full);
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  font-size: 0.8rem;
  flex-shrink: 0;
  border: 1px solid var(--border-color);
}

.actor-avatar.admin {
  background: #090D14;
  color: #FFFFFF;
}

.actor-avatar.medecin {
  background: var(--primary-light);
  color: var(--primary);
  border-color: var(--primary-border);
}

.actor-avatar.patient {
  background: #F1F5F9;
  color: #334155;
}

.actor-avatar.systeme {
  background: #F8FAFC;
  color: var(--primary);
  border-color: var(--primary-border);
}

.actor-details {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
}

.actor-name {
  font-weight: 700;
  font-size: 0.82rem;
  color: var(--text-dark);
}

.actor-meta {
  display: flex;
  align-items: center;
  gap: 6px;
  flex-wrap: wrap;
}

.actor-role-badge {
  font-size: 0.62rem;
  font-weight: 700;
  padding: 1px 5px;
  border-radius: 3px;
  text-transform: uppercase;
  letter-spacing: 0.02em;
}

.actor-role-badge.role-admin {
  background: #090D14;
  color: #FFFFFF;
}

.actor-role-badge.role-medecin {
  background: var(--primary-light);
  color: var(--primary);
  border: 1px solid var(--primary-border);
}

.actor-role-badge.role-patient {
  background: #F1F5F9;
  color: #475569;
}

.actor-role-badge.role-systeme {
  background: #F8FAFC;
  color: #090D14;
  border: 1px solid #CBD5E1;
}

.actor-phone {
  font-size: 0.7rem;
  color: var(--text-muted);
}

.action-cell {
  display: flex;
  flex-direction: column;
  gap: 3px;
}

.cat-badge {
  display: inline-block;
  font-size: 0.64rem;
  font-weight: 700;
  padding: 1px 6px;
  border-radius: 3px;
  width: fit-content;
}

.cat-badge.cat-finance {
  background: var(--primary-light);
  color: var(--primary);
  border: 1px solid var(--primary-border);
}

.cat-badge.cat-onms {
  background: #090D14;
  color: #FFFFFF;
}

.cat-badge.cat-medical {
  background: var(--primary-light);
  color: var(--primary);
}

.cat-badge.cat-dossier {
  background: #F1F5F9;
  color: #334155;
  border: 1px solid #CBD5E1;
}

.cat-badge.cat-securite {
  background: #FEF2F2;
  color: #DC2626;
  border: 1px solid #FCA5A5;
}

.cat-badge.cat-connexion {
  background: #F8FAFC;
  color: #475569;
  border: 1px solid #E2E8F0;
}

.cat-badge.cat-general {
  background: #F1F5F9;
  color: #64748B;
}

.action-title {
  font-weight: 700;
  font-size: 0.8rem;
  color: var(--text-dark);
}

.detail-cell {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.detail-desc {
  font-size: 0.8rem;
  color: var(--text-dark);
  line-height: 1.4;
  margin: 0;
}

.target-chip {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: 0.72rem;
  background: var(--bg-alt);
  padding: 2px 7px;
  border-radius: 4px;
  border: 1px solid var(--border-color);
  width: fit-content;
}

.target-label {
  font-weight: 600;
  color: var(--text-muted);
}

.target-val {
  font-weight: 600;
  color: var(--text-dark);
}

.spin-icon {
  animation: spin 1s linear infinite;
}
</style>

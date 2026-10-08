<script setup lang="ts">
// Importation du module ou composant
import { ref, onMounted, computed } from 'vue'
// Importation du module ou composant
import StatCard from '../components/common/StatCard.vue'
// Importation du module ou composant
import Pagination from '../components/common/Pagination.vue'
// Importation du module ou composant
import {
  systemService,
  type AuditLogItem
} from '../services/system.service'
// Importation du module ou composant
import { useToast } from '../composables/useToast'
// Importation du module ou composant
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

// Déclaration de variable
const toast = useToast()

// Déclaration de variable
const auditLogs = ref<AuditLogItem[]>([])
// Déclaration de variable
const loadingLogs = ref(true)

// Déclaration de variable
const searchQuery = ref('')
// Déclaration de variable
const selectedCategory = ref('TOUS')
// Déclaration de variable
const selectedRole = ref('TOUS')

// Déclaration de variable
const fetchAuditLogs = async () => {
  loadingLogs.value = true
  // Bloc d'essai pour gérer les erreurs
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
// Déclaration de variable
const totalFinances = computed(() =>
  auditLogs.value.filter(l => l.actionCategory === 'FINANCE').length
)
// Déclaration de variable
const totalOnms = computed(() =>
  auditLogs.value.filter(l => l.actionCategory === 'ONMS').length
)
// Déclaration de variable
const totalAlerts = computed(() =>
  auditLogs.value.filter(l => l.status === 'ALERTE' || l.actionCategory === 'SECURITE').length
)

// Formatting helpers
const formatExactTime = (dateStr?: string) => {
  // Condition logique
  if (!dateStr) return '--:--:--'
  // Bloc d'essai pour gérer les erreurs
  try {
    // Retourne la valeur
    return new Date(dateStr).toLocaleTimeString('fr-FR', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    })
  } catch {
    // Retourne la valeur
    return '--:--:--'
  }
}

// Déclaration de variable
const formatExactDate = (dateStr?: string) => {
  // Condition logique
  if (!dateStr) return '-'
  // Bloc d'essai pour gérer les erreurs
  try {
    // Retourne la valeur
    return new Date(dateStr).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    })
  } catch {
    // Retourne la valeur
    return dateStr
  }
}

// Déclaration de variable
const formatRelativeTime = (dateStr?: string) => {
  // Condition logique
  if (!dateStr) return ''
  // Bloc d'essai pour gérer les erreurs
  try {
    // Déclaration de variable
    const diffMs = Date.now() - new Date(dateStr).getTime()
    // Déclaration de variable
    const diffMins = Math.floor(diffMs / 60000)
    // Condition logique
    if (diffMins < 1) return 'À l’instant'
    // Condition logique
    if (diffMins < 60) return `Il y a ${diffMins} min`
    // Déclaration de variable
    const diffHours = Math.floor(diffMins / 60)
    // Condition logique
    if (diffHours < 24) return `Il y a ${diffHours}h`
    // Retourne la valeur
    return 'Aujourd’hui'
  } catch {
    // Retourne la valeur
    return ''
  }
}

// Déclaration de variable
const getRoleBadge = (role?: string) => {
  switch (role) {
    case 'ADMIN': return { label: 'Admin', class: 'role-admin' }
    case 'MEDECIN': return { label: 'Médecin', class: 'role-medecin' }
    case 'PATIENT': return { label: 'Patient', class: 'role-patient' }
    case 'SYSTEME': return { label: 'Système', class: 'role-systeme' }
    default: return { label: 'Utilisateur', class: 'role-patient' }
  }
}

// Déclaration de variable
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
// Déclaration de variable
const pageSize = ref(10)

// Déclaration de variable
const filteredLogsList = computed(() => {
  // Retourne la valeur
  return auditLogs.value.filter(l => {
    // Filtre Catégorie
    const matchCategory = selectedCategory.value === 'TOUS' || l.actionCategory === selectedCategory.value

    // Filtre Rôle
    const matchRole = selectedRole.value === 'TOUS' || l.actorRole === selectedRole.value

    // Recherche plein texte
    const q = searchQuery.value.trim().toLowerCase()
    // Déclaration de variable
    const matchQuery = !q ||
      l.actorName?.toLowerCase().includes(q) ||
      l.actorTelephone?.includes(q) ||
      l.actionTitle?.toLowerCase().includes(q) ||
      l.description?.toLowerCase().includes(q) ||
      l.targetResource?.toLowerCase().includes(q)

    // Retourne la valeur
    return matchCategory && matchRole && matchQuery
  })
})

// Déclaration de variable
const paginatedLogs = computed(() => {
  // Déclaration de variable
  const start = (currentPage.value - 1) * pageSize.value
  // Retourne la valeur
  return filteredLogsList.value.slice(start, start + pageSize.value)
})

// Déclaration de variable
const handleSearch = () => {
  currentPage.value = 1
}

// Déclaration de variable
const handleFilterChange = () => {
  currentPage.value = 1
}
</script>

<template>
  <!-- Conteneur de bloc (div) -->
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
      <!-- Conteneur de bloc (div) -->
      <div class="panel-header">
        <!-- Conteneur de bloc (div) -->
        <div class="toolbar-wrap">
          <!-- Conteneur de bloc (div) -->
          <div class="search-input-wrapper">
            <!-- Conteneur en ligne (span) -->
            <span class="search-icon-inside"><Search :size="15" :stroke-width="1.8" /></span>
            <!-- Champ de saisie utilisateur -->
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

        <!-- Bouton cliquable -->
        <button class="btn btn-secondary btn-sm" @click="fetchAuditLogs" :disabled="loadingLogs">
          <RefreshCw :size="13" :class="{ 'spin-icon': loadingLogs }" />
          <!-- Conteneur en ligne (span) -->
          <span>{{ loadingLogs ? 'Actualisation...' : 'Actualiser le Journal' }}</span>
        </button>
      </div>

      <!-- Conteneur de bloc (div) -->
      <div class="table-responsive">
        <!-- Conteneur de bloc (div) -->
        <div v-if="loadingLogs" class="loading-state">
          <!-- Conteneur de bloc (div) -->
          <div class="spinner"></div>
          <!-- Paragraphe de texte -->
          <p>Chargement du journal d'activité...</p>
        </div>

        <!-- Conteneur de bloc (div) -->
        <div v-else-if="filteredLogsList.length === 0" class="empty-state">
          <ShieldCheck :size="32" class="empty-icon" />
          <!-- Paragraphe de texte -->
          <p>Aucune trace d'opération ne correspond à vos critères de recherche.</p>
        </div>

        <!-- Élément de tableau de données -->
        <table v-else class="data-table">
          <thead>
            <!-- Élément de tableau de données -->
            <tr>
              <th style="min-width: 140px;">Quand & Moment</th>
              <th style="min-width: 210px;">Qui (Auteur de l'acte)</th>
              <th style="min-width: 170px;">Quoi (Action & Catégorie)</th>
              <th>Détail de l'Opération & Cible Impactée</th>
              <th style="min-width: 100px;">Résultat</th>
            </tr>
          </thead>
          <tbody>
            <!-- Élément de tableau de données -->
            <tr v-for="log in paginatedLogs" :key="log.id">
              <!-- QUAND & MOMENT -->
              <td>
                <!-- Conteneur de bloc (div) -->
                <div class="time-cell">
                  <!-- Conteneur de bloc (div) -->
                  <div class="time-exact">{{ formatExactTime(log.createdAt) }}</div>
                  <!-- Conteneur de bloc (div) -->
                  <div class="date-exact">{{ formatExactDate(log.createdAt) }}</div>
                  <!-- Conteneur en ligne (span) -->
                  <span class="time-relative-pill">{{ formatRelativeTime(log.createdAt) }}</span>
                </div>
              </td>

              <!-- QUI (AUTEUR) -->
              <td>
                <!-- Conteneur de bloc (div) -->
                <div class="actor-cell">
                  <!-- Conteneur de bloc (div) -->
                  <div class="actor-avatar" :class="log.actorRole?.toLowerCase()">
                    {{ log.actorName?.[0] || 'U' }}
                  </div>
                  <!-- Conteneur de bloc (div) -->
                  <div class="actor-details">
                    <!-- Conteneur de bloc (div) -->
                    <div class="actor-name">{{ log.actorName }}</div>
                    <!-- Conteneur de bloc (div) -->
                    <div class="actor-meta">
                      <!-- Conteneur en ligne (span) -->
                      <span class="actor-role-badge" :class="getRoleBadge(log.actorRole).class">
                        {{ getRoleBadge(log.actorRole).label }}
                      </span>
                      <!-- Conteneur en ligne (span) -->
                      <span v-if="log.actorTelephone" class="actor-phone">{{ log.actorTelephone }}</span>
                    </div>
                  </div>
                </div>
              </td>

              <!-- QUOI (ACTION & CATÉGORIE) -->
              <td>
                <!-- Conteneur de bloc (div) -->
                <div class="action-cell">
                  <!-- Conteneur en ligne (span) -->
                  <span class="cat-badge" :class="getCategoryBadge(log.actionCategory).class">
                    {{ getCategoryBadge(log.actionCategory).label }}
                  </span>
                  <!-- Conteneur de bloc (div) -->
                  <div class="action-title">{{ log.actionTitle || log.action }}</div>
                </div>
              </td>

              <!-- DÉTAIL & CIBLE -->
              <td>
                <!-- Conteneur de bloc (div) -->
                <div class="detail-cell">
                  <!-- Paragraphe de texte -->
                  <p class="detail-desc">{{ log.description }}</p>
                  <!-- Conteneur de bloc (div) -->
                  <div v-if="log.targetResource" class="target-chip">
                    <!-- Conteneur en ligne (span) -->
                    <span class="target-label">Cible :</span>
                    <!-- Conteneur en ligne (span) -->
                    <span class="target-val">{{ log.targetResource }}</span>
                  </div>
                </div>
              </td>

              <!-- RÉSULTAT -->
              <td>
                <!-- Conteneur en ligne (span) -->
                <span
                  class="badge"
                  :class="log.status === 'ALERTE' ? 'badge-bloque' : 'badge-actif'"
                >
                  <!-- Conteneur en ligne (span) -->
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
/* Sélecteur de classe CSS */
.system-view {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

/* Sélecteur de classe CSS */
.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(230px, 1fr));
  gap: 16px;
}

/* Sélecteur de classe CSS */
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

/* Sélecteur de classe CSS */
.time-exact {
  font-weight: 700;
  font-size: 0.85rem;
  color: var(--text-dark);
}

/* Sélecteur de classe CSS */
.date-exact {
  font-size: 0.72rem;
  color: var(--text-muted);
}

/* Sélecteur de classe CSS */
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

/* Sélecteur de classe CSS */
.actor-cell {
  display: flex;
  align-items: center;
  gap: 10px;
}

/* Sélecteur de classe CSS */
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

/* Sélecteur de classe CSS */
.actor-avatar.admin {
  background: #090D14;
  color: #FFFFFF;
}

/* Sélecteur de classe CSS */
.actor-avatar.medecin {
  background: var(--primary-light);
  color: var(--primary);
  border-color: var(--primary-border);
}

/* Sélecteur de classe CSS */
.actor-avatar.patient {
  background: #F1F5F9;
  color: #334155;
}

/* Sélecteur de classe CSS */
.actor-avatar.systeme {
  background: #F8FAFC;
  color: var(--primary);
  border-color: var(--primary-border);
}

/* Sélecteur de classe CSS */
.actor-details {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
}

/* Sélecteur de classe CSS */
.actor-name {
  font-weight: 700;
  font-size: 0.82rem;
  color: var(--text-dark);
}

/* Sélecteur de classe CSS */
.actor-meta {
  display: flex;
  align-items: center;
  gap: 6px;
  flex-wrap: wrap;
}

/* Sélecteur de classe CSS */
.actor-role-badge {
  font-size: 0.62rem;
  font-weight: 700;
  padding: 1px 5px;
  border-radius: 3px;
  text-transform: uppercase;
  letter-spacing: 0.02em;
}

/* Sélecteur de classe CSS */
.actor-role-badge.role-admin {
  background: #090D14;
  color: #FFFFFF;
}

/* Sélecteur de classe CSS */
.actor-role-badge.role-medecin {
  background: var(--primary-light);
  color: var(--primary);
  border: 1px solid var(--primary-border);
}

/* Sélecteur de classe CSS */
.actor-role-badge.role-patient {
  background: #F1F5F9;
  color: #475569;
}

/* Sélecteur de classe CSS */
.actor-role-badge.role-systeme {
  background: #F8FAFC;
  color: #090D14;
  border: 1px solid #CBD5E1;
}

/* Sélecteur de classe CSS */
.actor-phone {
  font-size: 0.7rem;
  color: var(--text-muted);
}

/* Sélecteur de classe CSS */
.action-cell {
  display: flex;
  flex-direction: column;
  gap: 3px;
}

/* Sélecteur de classe CSS */
.cat-badge {
  display: inline-block;
  font-size: 0.64rem;
  font-weight: 700;
  padding: 1px 6px;
  border-radius: 3px;
  width: fit-content;
}

/* Sélecteur de classe CSS */
.cat-badge.cat-finance {
  background: var(--primary-light);
  color: var(--primary);
  border: 1px solid var(--primary-border);
}

/* Sélecteur de classe CSS */
.cat-badge.cat-onms {
  background: #090D14;
  color: #FFFFFF;
}

/* Sélecteur de classe CSS */
.cat-badge.cat-medical {
  background: var(--primary-light);
  color: var(--primary);
}

/* Sélecteur de classe CSS */
.cat-badge.cat-dossier {
  background: #F1F5F9;
  color: #334155;
  border: 1px solid #CBD5E1;
}

/* Sélecteur de classe CSS */
.cat-badge.cat-securite {
  background: #FEF2F2;
  color: #DC2626;
  border: 1px solid #FCA5A5;
}

/* Sélecteur de classe CSS */
.cat-badge.cat-connexion {
  background: #F8FAFC;
  color: #475569;
  border: 1px solid #E2E8F0;
}

/* Sélecteur de classe CSS */
.cat-badge.cat-general {
  background: #F1F5F9;
  color: #64748B;
}

/* Sélecteur de classe CSS */
.action-title {
  font-weight: 700;
  font-size: 0.8rem;
  color: var(--text-dark);
}

/* Sélecteur de classe CSS */
.detail-cell {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

/* Sélecteur de classe CSS */
.detail-desc {
  font-size: 0.8rem;
  color: var(--text-dark);
  line-height: 1.4;
  margin: 0;
}

/* Sélecteur de classe CSS */
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

/* Sélecteur de classe CSS */
.target-label {
  font-weight: 600;
  color: var(--text-muted);
}

/* Sélecteur de classe CSS */
.target-val {
  font-weight: 600;
  color: var(--text-dark);
}

/* Sélecteur de classe CSS */
.spin-icon {
  animation: spin 1s linear infinite;
}
</style>

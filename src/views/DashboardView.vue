<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import StatCard from '../components/common/StatCard.vue'
import { userService, type UserStats } from '../services/user.service'
import { rdvService, type RdvStats } from '../services/rdv.service'
import { walletService, type WalletStats } from '../services/wallet.service'
import { medecinService } from '../services/medecin.service'
import { systemService, type AuditLogItem } from '../services/system.service'
import {
  Users,
  Stethoscope,
  CalendarClock,
  Wallet,
  TrendingUp,
  UserCog,
  Calendar,
  CreditCard,
  ChevronRight,
  ShieldCheck,
  FileText,
  RefreshCw,
  CheckCircle2,
  Info
} from 'lucide-vue-next'

const router = useRouter()

const loading = ref(true)
const userStats = ref<UserStats | null>(null)
const rdvStats = ref<RdvStats | null>(null)
const walletStats = ref<WalletStats | null>(null)
const onmsCount = ref(0)
const recentLogs = ref<AuditLogItem[]>([])

const fetchDashboardData = async () => {
  loading.value = true
  try {
    const [uStats, rStats, wStats, onmsList, logs] = await Promise.allSettled([
      userService.getStats(),
      rdvService.getAdminStats(),
      walletService.getWalletStats(),
      medecinService.getAllOnms(),
      systemService.getRecentAuditLogs()
    ])

    if (uStats.status === 'fulfilled') userStats.value = uStats.value
    if (rStats.status === 'fulfilled') rdvStats.value = rStats.value
    if (wStats.status === 'fulfilled') walletStats.value = wStats.value
    if (onmsList.status === 'fulfilled') onmsCount.value = onmsList.value.length
    if (logs.status === 'fulfilled') recentLogs.value = logs.value.slice(0, 6)
  } catch (error) {
    console.error('Erreur chargement dashboard', error)
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  fetchDashboardData()
})

const formatCurrency = (val?: number) => {
  if (val === undefined || val === null) return '0 FCFA'
  return new Intl.NumberFormat('fr-FR').format(val) + ' FCFA'
}

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

// ==========================================
// RÈGLE MÉTIER & CALCULS FINANCIERS :
// Pour chaque consultation payée :
// - 10% pour la plateforme Diam-Yaraam (Commission / Chiffre d'affaires net)
// - 90% pour le médecin praticien (Honoraires)
// ==========================================
const chiffreAffairesTotal = computed(() => {
  return walletStats.value?.volumeTotalTransactions || 0
})

const revenuPlateforme = computed(() => {
  return Math.round(chiffreAffairesTotal.value * 0.10)
})

const partMedecins = computed(() => {
  return Math.round(chiffreAffairesTotal.value * 0.90)
})

// ==========================================
// CALCULS GRAPHES CIRCULAIRES (SVG DONUT) :
// Circonférence pour r = 70 : C = 2 * PI * 70 ≈ 439.82
// ==========================================
const C = 439.82

// Graphe 1 : Répartition Financière (10% Plateforme / 90% Médecins)
const finMedecinLen = computed(() => (90 / 100) * C)
const finPlateformeLen = computed(() => (10 / 100) * C)

// Graphe 2 : Modalités des Consultations
const totalConsultations = computed(() => rdvStats.value?.totalRdv || 0)
const teleconsultationsCount = computed(() => rdvStats.value?.teleconsultations || 0)
const presentielCount = computed(() => {
  const diff = totalConsultations.value - teleconsultationsCount.value
  return diff > 0 ? diff : (rdvStats.value?.presentiel || 0)
})

const teleconsultationPct = computed(() => {
  const tot = totalConsultations.value
  if (!tot) return 0
  return Math.round((teleconsultationsCount.value / tot) * 100)
})

const presentielPct = computed(() => {
  if (!totalConsultations.value) return 0
  return Math.max(0, 100 - teleconsultationPct.value)
})

const rdvTeleLen = computed(() => (teleconsultationPct.value / 100) * C)
const rdvPresLen = computed(() => (presentielPct.value / 100) * C)

// Graphe 3 : Répartition de la Communauté
const totalUsersCount = computed(() => userStats.value?.totalUsers || 0)
const patientsCount = computed(() => userStats.value?.totalPatients || 0)
const medecinsCount = computed(() => userStats.value?.totalMedecins || 0)
const adminsCount = computed(() => userStats.value?.totalAdmins || 0)

const patientPct = computed(() => {
  const tot = totalUsersCount.value
  if (!tot) return 0
  return Math.round((patientsCount.value / tot) * 100)
})

const medecinPct = computed(() => {
  const tot = totalUsersCount.value
  if (!tot) return 0
  return Math.round((medecinsCount.value / tot) * 100)
})

const adminPct = computed(() => {
  if (!totalUsersCount.value) return 0
  return Math.max(0, 100 - patientPct.value - medecinPct.value)
})

const userPatientLen = computed(() => (patientPct.value / 100) * C)
const userMedecinLen = computed(() => (medecinPct.value / 100) * C)
const userAdminLen = computed(() => (adminPct.value / 100) * C)
</script>

<template>
  <div class="dashboard-view">
    <!-- Executive Dashboard Header -->
    <div class="dashboard-header-bar">
      <div>
        <h2 class="dashboard-title">Vue d'Ensemble des Indicateurs</h2>
        <p class="dashboard-subtitle">Supervision financière, activité médicale et répartition des revenus Diam-Yaraam</p>
      </div>
      <div class="dashboard-header-actions">
        <button class="btn btn-secondary btn-sm" @click="fetchDashboardData" :disabled="loading" title="Actualiser les données">
          <RefreshCw :size="13" :class="{ 'spin-icon': loading }" />
          <span>{{ loading ? 'Actualisation...' : 'Actualiser les données' }}</span>
        </button>
        <button class="btn btn-primary btn-sm" @click="router.push('/medecins')">
          <Stethoscope :size="14" />
          <span>Registre ONMS</span>
        </button>
      </div>
    </div>

    <!-- Stat Cards Grid (4 KPIs) -->
    <div class="stats-grid">
      <StatCard
        title="Utilisateurs Enregistrés"
        :value="userStats?.totalUsers ?? 0"
        :subText="`${userStats?.totalPatients ?? 0} Patients • ${userStats?.totalMedecins ?? 0} Médecins`"
        :icon="Users"
        themeColor="noir"
      />
      <StatCard
        title="Praticiens Inscrits ONMS"
        :value="onmsCount"
        subText="Médecins certifiés par l'Ordre National"
        :icon="Stethoscope"
        themeColor="vert"
      />
      <StatCard
        title="Consultations Médicales"
        :value="totalConsultations"
        :subText="`${teleconsultationsCount} Téléconsultations • ${presentielCount} Cabinet`"
        :icon="CalendarClock"
        themeColor="vert"
      />
      <StatCard
        title="Chiffre d'Affaires Global"
        :value="formatCurrency(chiffreAffairesTotal)"
        :subText="`Part Médecins (90%) : ${formatCurrency(partMedecins)} • Revenu (10%) : ${formatCurrency(revenuPlateforme)}`"
        :icon="TrendingUp"
        themeColor="noir"
      />
    </div>

    <!-- Section Graphes Circulaires (Donuts) -->
    <div class="charts-section-header">
      <h3 class="section-title">Analyses Circulaires & Modèle Économique</h3>
      <span class="section-subtitle">Visualisation en temps réel de la répartition des revenus, soins et utilisateurs</span>
    </div>

    <div class="dashboard-charts-grid">
      <!-- Graphe Circulaire 1 : Répartition Financière (10% Plateforme / 90% Médecins) -->
      <div class="chart-card">
        <div class="chart-card-header">
          <div>
            <h4 class="chart-card-title">Répartition du Chiffre d'Affaires</h4>
            <p class="chart-card-subtitle">Modèle 10% Commission / 90% Médecins</p>
          </div>
          <span class="chart-badge vert">10% / 90%</span>
        </div>

        <div class="donut-container">
          <svg class="donut-svg" viewBox="0 0 200 200">
            <!-- Track -->
            <circle class="donut-track" cx="100" cy="100" r="70" />
            <!-- Segment 1: Médecins 90% (Noir) -->
            <circle
              class="donut-segment segment-noir"
              cx="100"
              cy="100"
              r="70"
              :stroke-dasharray="`${finMedecinLen} ${C}`"
              stroke-dashoffset="0"
              transform="rotate(-90 100 100)"
            />
            <!-- Segment 2: Plateforme 10% (Vert) -->
            <circle
              class="donut-segment segment-vert"
              cx="100"
              cy="100"
              r="70"
              :stroke-dasharray="`${finPlateformeLen} ${C}`"
              :stroke-dashoffset="`${-finMedecinLen}`"
              transform="rotate(-90 100 100)"
            />
            <!-- Center Total -->
            <text x="100" y="93" text-anchor="middle" class="donut-val">
              {{ formatCurrency(chiffreAffairesTotal) }}
            </text>
            <text x="100" y="112" text-anchor="middle" class="donut-sub">
              Chiffre d'Affaires
            </text>
          </svg>
        </div>

        <div class="donut-legend">
          <div class="legend-row">
            <div class="legend-info">
              <span class="legend-marker vert"></span>
              <span class="legend-label">Revenu Diam-Yaraam (10%)</span>
            </div>
            <div class="legend-values">
              <span class="legend-amount">{{ formatCurrency(revenuPlateforme) }}</span>
              <span class="legend-tag vert">10%</span>
            </div>
          </div>

          <div class="legend-row">
            <div class="legend-info">
              <span class="legend-marker noir"></span>
              <span class="legend-label">Honoraires Médecins (90%)</span>
            </div>
            <div class="legend-values">
              <span class="legend-amount">{{ formatCurrency(partMedecins) }}</span>
              <span class="legend-tag noir">90%</span>
            </div>
          </div>
        </div>

        <div class="rule-box">
          <Info :size="14" class="rule-icon" />
          <span>Sur chaque consultation payée, <strong>10%</strong> sont retenus pour la plateforme et <strong>90%</strong> sont versés au médecin.</span>
        </div>
      </div>

      <!-- Graphe Circulaire 2 : Modalités des Consultations -->
      <div class="chart-card">
        <div class="chart-card-header">
          <div>
            <h4 class="chart-card-title">Modalités des Consultations</h4>
            <p class="chart-card-subtitle">Téléconsultations en ligne vs Présentiel</p>
          </div>
          <span class="chart-badge noir">Soins Réalisés</span>
        </div>

        <div class="donut-container">
          <svg class="donut-svg" viewBox="0 0 200 200">
            <!-- Track -->
            <circle class="donut-track" cx="100" cy="100" r="70" />
            <!-- Segment 1: Téléconsultation (Vert) -->
            <circle
              class="donut-segment segment-vert"
              cx="100"
              cy="100"
              r="70"
              :stroke-dasharray="`${rdvTeleLen} ${C}`"
              stroke-dashoffset="0"
              transform="rotate(-90 100 100)"
            />
            <!-- Segment 2: Présentiel (Noir) -->
            <circle
              class="donut-segment segment-noir"
              cx="100"
              cy="100"
              r="70"
              :stroke-dasharray="`${rdvPresLen} ${C}`"
              :stroke-dashoffset="`${-rdvTeleLen}`"
              transform="rotate(-90 100 100)"
            />
            <!-- Center Total -->
            <text x="100" y="93" text-anchor="middle" class="donut-val">
              {{ totalConsultations }}
            </text>
            <text x="100" y="112" text-anchor="middle" class="donut-sub">
              Consultations
            </text>
          </svg>
        </div>

        <div class="donut-legend">
          <div class="legend-row">
            <div class="legend-info">
              <span class="legend-marker vert"></span>
              <span class="legend-label">Téléconsultations (Visio)</span>
            </div>
            <div class="legend-values">
              <span class="legend-amount">{{ teleconsultationsCount }} séances</span>
              <span class="legend-tag vert">{{ teleconsultationPct }}%</span>
            </div>
          </div>

          <div class="legend-row">
            <div class="legend-info">
              <span class="legend-marker noir"></span>
              <span class="legend-label">Consultations en Cabinet</span>
            </div>
            <div class="legend-values">
              <span class="legend-amount">{{ presentielCount }} séances</span>
              <span class="legend-tag noir">{{ presentielPct }}%</span>
            </div>
          </div>
        </div>

        <div class="rule-box">
          <CheckCircle2 :size="14" class="rule-icon" />
          <span>{{ rdvStats?.confirmes ?? totalConsultations }} consultations confirmées sur le planning des praticiens.</span>
        </div>
      </div>

      <!-- Graphe Circulaire 3 : Écosystème des Utilisateurs -->
      <div class="chart-card">
        <div class="chart-card-header">
          <div>
            <h4 class="chart-card-title">Répartition des Utilisateurs</h4>
            <p class="chart-card-subtitle">Patients adhérents, médecins et gestion</p>
          </div>
          <span class="chart-badge noir">Communauté</span>
        </div>

        <div class="donut-container">
          <svg class="donut-svg" viewBox="0 0 200 200">
            <!-- Track -->
            <circle class="donut-track" cx="100" cy="100" r="70" />
            <!-- Segment 1: Patients (Vert) -->
            <circle
              class="donut-segment segment-vert"
              cx="100"
              cy="100"
              r="70"
              :stroke-dasharray="`${userPatientLen} ${C}`"
              stroke-dashoffset="0"
              transform="rotate(-90 100 100)"
            />
            <!-- Segment 2: Médecins (Noir) -->
            <circle
              class="donut-segment segment-noir"
              cx="100"
              cy="100"
              r="70"
              :stroke-dasharray="`${userMedecinLen} ${C}`"
              :stroke-dashoffset="`${-userPatientLen}`"
              transform="rotate(-90 100 100)"
            />
            <!-- Segment 3: Staff/Admins (Gris) -->
            <circle
              class="donut-segment segment-gris"
              cx="100"
              cy="100"
              r="70"
              :stroke-dasharray="`${userAdminLen} ${C}`"
              :stroke-dashoffset="`${-(userPatientLen + userMedecinLen)}`"
              transform="rotate(-90 100 100)"
            />
            <!-- Center Total -->
            <text x="100" y="93" text-anchor="middle" class="donut-val">
              {{ totalUsersCount }}
            </text>
            <text x="100" y="112" text-anchor="middle" class="donut-sub">
              Comptes Répertoriés
            </text>
          </svg>
        </div>

        <div class="donut-legend">
          <div class="legend-row">
            <div class="legend-info">
              <span class="legend-marker vert"></span>
              <span class="legend-label">Patients Adhérents</span>
            </div>
            <div class="legend-values">
              <span class="legend-amount">{{ patientsCount }} patients</span>
              <span class="legend-tag vert">{{ patientPct }}%</span>
            </div>
          </div>

          <div class="legend-row">
            <div class="legend-info">
              <span class="legend-marker noir"></span>
              <span class="legend-label">Médecins Praticiens</span>
            </div>
            <div class="legend-values">
              <span class="legend-amount">{{ medecinsCount }} médecins</span>
              <span class="legend-tag noir">{{ medecinPct }}%</span>
            </div>
          </div>
        </div>

        <div class="rule-box">
          <Users :size="14" class="rule-icon" />
          <span>{{ onmsCount }} médecins enregistrés et certifiés auprès du registre officiel ONMS.</span>
        </div>
      </div>
    </div>

    <!-- Main Grid Panels -->
    <div class="dashboard-panels-grid">
      <!-- Panel 1: Quick Actions & Management -->
      <div class="card-panel">
        <div class="panel-header">
          <h3 class="panel-title">Actions Rapides & Pilotage</h3>
        </div>
        <div class="quick-actions-body">
          <button class="quick-action-btn" @click="router.push('/users')">
            <span class="icon-wrap"><UserCog :size="18" :stroke-width="1.8" /></span>
            <div class="btn-text-content">
              <div class="btn-title">Gestion des Utilisateurs</div>
              <div class="btn-desc">Gérer les comptes, accès et politiques de sécurité</div>
            </div>
            <ChevronRight :size="16" class="arrow-icon" />
          </button>

          <button class="quick-action-btn" @click="router.push('/medecins')">
            <span class="icon-wrap"><Stethoscope :size="18" :stroke-width="1.8" /></span>
            <div class="btn-text-content">
              <div class="btn-title">Registre ONMS & Médecins</div>
              <div class="btn-desc">Contrôler le tableau officiel et valider l'exercice médical</div>
            </div>
            <ChevronRight :size="16" class="arrow-icon" />
          </button>

          <button class="quick-action-btn" @click="router.push('/rendez-vous')">
            <span class="icon-wrap"><Calendar :size="18" :stroke-width="1.8" /></span>
            <div class="btn-text-content">
              <div class="btn-title">Supervision des Consultations</div>
              <div class="btn-desc">Suivre les consultations en cabinet et téléconsultations</div>
            </div>
            <ChevronRight :size="16" class="arrow-icon" />
          </button>

          <button class="quick-action-btn" @click="router.push('/finances')">
            <span class="icon-wrap"><CreditCard :size="18" :stroke-width="1.8" /></span>
            <div class="btn-text-content">
              <div class="btn-title">Régularisation Financière</div>
              <div class="btn-desc">Paiements Wave, Orange Money et soldes portefeuilles</div>
            </div>
            <ChevronRight :size="16" class="arrow-icon" />
          </button>

          <button class="quick-action-btn" @click="router.push('/systeme')">
            <span class="icon-wrap"><ShieldCheck :size="18" :stroke-width="1.8" /></span>
            <div class="btn-text-content">
              <div class="btn-title">Journal d'Activité & Sécurité</div>
              <div class="btn-desc">Historique des accès, connexions et traçabilité</div>
            </div>
            <ChevronRight :size="16" class="arrow-icon" />
          </button>
        </div>
      </div>

      <!-- Panel 2: Distribution des Comptes par Statut -->
      <div class="card-panel">
        <div class="panel-header">
          <h3 class="panel-title">Statut d'Activation des Comptes</h3>
        </div>
        <div class="distribution-body" v-if="userStats">
          <div class="dist-row">
            <span class="dist-label">Comptes Actifs</span>
            <div class="dist-bar-wrapper">
              <div
                class="dist-bar-fill vert"
                :style="{ width: `${(userStats.statusActif / (userStats.totalUsers || 1)) * 100}%` }"
              ></div>
            </div>
            <span class="dist-count">{{ userStats.statusActif }}</span>
          </div>

          <div class="dist-row">
            <span class="dist-label">En Attente d'Activation</span>
            <div class="dist-bar-wrapper">
              <div
                class="dist-bar-fill attente"
                :style="{ width: `${(userStats.statusEnAttente / (userStats.totalUsers || 1)) * 100}%` }"
              ></div>
            </div>
            <span class="dist-count">{{ userStats.statusEnAttente }}</span>
          </div>

          <div class="dist-row">
            <span class="dist-label">Comptes Suspendus / Bloqués</span>
            <div class="dist-bar-wrapper">
              <div
                class="dist-bar-fill noir"
                :style="{ width: `${((userStats.statusSuspendu + userStats.statusBloque) / (userStats.totalUsers || 1)) * 100}%` }"
              ></div>
            </div>
            <span class="dist-count">{{ userStats.statusSuspendu + userStats.statusBloque }}</span>
          </div>

          <div class="dist-row">
            <span class="dist-label">Administrateurs & Staff</span>
            <div class="dist-bar-wrapper">
              <div
                class="dist-bar-fill vert-fonce"
                :style="{ width: `${(userStats.totalAdmins / (userStats.totalUsers || 1)) * 100}%` }"
              ></div>
            </div>
            <span class="dist-count">{{ userStats.totalAdmins }}</span>
          </div>
        </div>
        <div v-else class="loading-state">
          <div class="spinner"></div>
          <span>Chargement des métriques...</span>
        </div>
      </div>
    </div>

    <!-- Recent Complete Traceability Feed (Qui, Quoi, Quand & À quel moment) -->
    <div class="card-panel">
      <div class="panel-header">
        <div>
          <h3 class="panel-title">Journal Récent de Traçabilité & Audit</h3>
          <p class="panel-subtitle">Traçabilité intégrale : Qui a fait quoi, quand et à quel moment sur la plateforme</p>
        </div>
        <button class="btn btn-secondary btn-sm" @click="router.push('/systeme')">
          <span>Consulter Tout l'Historique</span>
          <ChevronRight :size="13" />
        </button>
      </div>

      <div class="table-responsive">
        <div v-if="recentLogs.length === 0 && !loading" class="empty-state">
          <FileText :size="32" class="empty-icon" />
          <p>Aucun événement d'audit récent enregistré</p>
        </div>
        <table v-else class="data-table">
          <thead>
            <tr>
              <th style="min-width: 140px;">Quand & Moment</th>
              <th style="min-width: 200px;">Qui (Auteur)</th>
              <th style="min-width: 160px;">Quoi (Action)</th>
              <th>Détail de l'Opération & Cible</th>
              <th style="min-width: 100px;">Résultat</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="log in recentLogs" :key="log.id">
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
                  {{ log.status === 'ALERTE' ? 'Alerte' : 'Succès' }}
                </span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<style scoped>
.dashboard-header-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  flex-wrap: wrap;
  gap: 14px;
}

.dashboard-title {
  font-size: 1.15rem;
  font-weight: 700;
  color: var(--text-dark);
  margin-bottom: 2px;
}

.dashboard-subtitle {
  font-size: 0.8rem;
  color: var(--text-muted);
}

.dashboard-header-actions {
  display: flex;
  align-items: center;
  gap: 10px;
}

.spin-icon {
  animation: spin 1s linear infinite;
}

/* Charts Section Header */
.charts-section-header {
  margin: 28px 0 16px;
}

.section-title {
  font-size: 1.05rem;
  font-weight: 700;
  color: var(--text-dark);
  margin-bottom: 2px;
}

.section-subtitle {
  font-size: 0.78rem;
  color: var(--text-muted);
}

/* Dashboard Charts Grid */
.dashboard-charts-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
  gap: 18px;
  margin-bottom: 28px;
}

.chart-card {
  background: var(--card-bg);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-lg);
  padding: 22px 24px;
  display: flex;
  flex-direction: column;
  transition: border-color 0.2s ease;
}

.chart-card:hover {
  border-color: #CBD5E1;
}

.chart-card-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 12px;
  gap: 10px;
}

.chart-card-title {
  font-size: 0.94rem;
  font-weight: 700;
  color: var(--text-dark);
  margin-bottom: 2px;
}

.chart-card-subtitle {
  font-size: 0.74rem;
  color: var(--text-muted);
  line-height: 1.35;
}

.chart-badge {
  font-size: 0.68rem;
  font-weight: 700;
  padding: 3px 8px;
  border-radius: var(--radius-sm);
  white-space: nowrap;
}

.chart-badge.vert {
  background: var(--primary-light);
  color: var(--primary);
  border: 1px solid var(--primary-border);
}

.chart-badge.noir {
  background: #090D14;
  color: #FFFFFF;
}

/* Donut SVG */
.donut-container {
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 10px 0 14px;
}

.donut-svg {
  width: 175px;
  height: 175px;
  overflow: visible;
}

.donut-track {
  fill: none;
  stroke: #F1F5F9;
  stroke-width: 17;
}

.donut-segment {
  fill: none;
  stroke-width: 17;
  stroke-linecap: butt;
  transition: stroke-dasharray 0.8s cubic-bezier(0.16, 1, 0.3, 1), stroke-dashoffset 0.8s cubic-bezier(0.16, 1, 0.3, 1);
}

.donut-segment.segment-vert {
  stroke: #0D7C66;
}

.donut-segment.segment-noir {
  stroke: #090D14;
}

.donut-segment.segment-gris {
  stroke: #94A3B8;
}

.donut-val {
  font-size: 13px;
  font-weight: 800;
  fill: #090D14;
  font-family: inherit;
}

.donut-sub {
  font-size: 8.5px;
  font-weight: 600;
  fill: #64748B;
  font-family: inherit;
  letter-spacing: 0.03em;
  text-transform: uppercase;
}

/* Legend */
.donut-legend {
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 14px 0 12px;
  border-top: 1px solid var(--border-color);
}

.legend-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 0.8rem;
}

.legend-info {
  display: flex;
  align-items: center;
  gap: 8px;
}

.legend-marker {
  width: 10px;
  height: 10px;
  border-radius: 3px;
  flex-shrink: 0;
}

.legend-marker.vert { background-color: #0D7C66; }
.legend-marker.noir { background-color: #090D14; }

.legend-label {
  font-weight: 600;
  color: var(--text-dark);
}

.legend-values {
  display: flex;
  align-items: center;
  gap: 8px;
}

.legend-amount {
  font-weight: 700;
  color: var(--text-dark);
  font-size: 0.82rem;
}

.legend-tag {
  font-size: 0.65rem;
  font-weight: 700;
  padding: 2px 6px;
  border-radius: var(--radius-sm);
}

.legend-tag.vert {
  background: var(--primary-light);
  color: var(--primary);
}

.legend-tag.noir {
  background: #090D14;
  color: #FFFFFF;
}

/* Rule Notice */
.rule-box {
  margin-top: auto;
  background: var(--bg-alt);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-sm);
  padding: 8px 12px;
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 0.72rem;
  color: var(--text-muted);
  line-height: 1.4;
}

.rule-icon {
  color: var(--primary);
  flex-shrink: 0;
}

/* Panels */
.dashboard-panels-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
  margin-bottom: 24px;
}

@media (max-width: 900px) {
  .dashboard-panels-grid {
    grid-template-columns: 1fr;
  }
}

.quick-actions-body {
  padding: 14px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.quick-action-btn {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 14px;
  border-radius: var(--radius-md);
  border: 1px solid var(--border-color);
  background: #FFFFFF;
  cursor: pointer;
  text-align: left;
  transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
}

.quick-action-btn:hover {
  background: #F8FAFC;
  border-color: var(--primary);
}

.quick-action-btn:hover .arrow-icon {
  transform: translateX(4px);
  color: var(--primary);
}

.quick-action-btn:hover .icon-wrap {
  background: var(--primary);
  color: #FFFFFF;
}

.icon-wrap {
  width: 36px;
  height: 36px;
  border-radius: var(--radius-sm);
  background: var(--primary-light);
  color: var(--primary);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  transition: all 0.2s ease;
}

.btn-text-content {
  flex: 1;
  min-width: 0;
}

.btn-title {
  font-weight: 600;
  font-size: 0.88rem;
  color: var(--text-dark);
}

.btn-desc {
  font-size: 0.75rem;
  color: var(--text-muted);
}

.arrow-icon {
  color: var(--text-light);
  flex-shrink: 0;
  transition: all 0.2s ease;
}

.distribution-body {
  padding: 22px 20px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.dist-row {
  display: flex;
  align-items: center;
  gap: 12px;
}

.dist-label {
  width: 170px;
  font-size: 0.82rem;
  font-weight: 600;
  color: var(--text-body);
}

.dist-bar-wrapper {
  flex: 1;
  height: 9px;
  background: #F1F5F9;
  border-radius: var(--radius-sm);
  overflow: hidden;
}

.dist-bar-fill {
  height: 100%;
  border-radius: var(--radius-sm);
  transition: width 0.5s cubic-bezier(0.16, 1, 0.3, 1);
}

.dist-bar-fill.vert { background-color: var(--primary); }
.dist-bar-fill.attente { background-color: #94A3B8; }
.dist-bar-fill.noir { background-color: #090D14; }
.dist-bar-fill.vert-fonce { background-color: var(--primary-dark); }

.dist-count {
  width: 32px;
  font-size: 0.84rem;
  font-weight: 700;
  text-align: right;
  color: var(--text-dark);
}

/* ========================================= */
/* TRACEABILITY TABLE STYLES (QUI, QUOI, QUAND) */
/* ========================================= */
.panel-subtitle {
  font-size: 0.76rem;
  color: var(--text-muted);
  margin-top: 2px;
}

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
</style>

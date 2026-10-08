<script setup lang="ts">
/**
 * ============================================================================
 * VUE 3 DASHBOARD CENTRAL D'ADMINISTRATION & SUPERVISION GLOBALE (DIAM-YARAAM)
 * ============================================================================
 * RÔLE ARCHITECTURAL (POINT CLÉ POUR LA SOUTENANCE) :
 * Ce composant constitue la tour de contrôle de la plateforme de e-santé.
 * Il fédère en temps réel les indicateurs clés (KPI) issus des microservices :
 * - auth-service : Utilisateurs, rôles (Admins, Médecins, Patients) et logs d'audit
 * - medecin-service : Registre ordinal national ONMS et praticiens actifs
 * - rdv-service : Volumes de consultations (présentiel vs téléconsultation)
 * - wallet-service : Flux financiers en FCFA (chiffre d'affaires, commissions)
 *
 * BONNES PRATIQUES TECHNIQUES MISES EN ŒUVRE :
 * 1. Vue 3 Composition API & TypeScript pour un typage strict et une réactivité optimale.
 * 2. Résilience réseau avec `Promise.allSettled` : si un microservice est temporairement
 *    indisponible, le dashboard charge néanmoins les autres sans bloquer l'interface.
 * 3. Respect du modèle économique : calculs transparents de la commission de 10%
 *    pour la plateforme et 90% pour les praticiens sénégalais.
 * ============================================================================
 */
// Importation du module ou composant
import { ref, onMounted, computed } from 'vue'
// Importation du module ou composant
import { useRouter } from 'vue-router'
// Importation du module ou composant
import StatCard from '../components/common/StatCard.vue'
// Importation du module ou composant
import { userService, type UserStats } from '../services/user.service'
// Importation du module ou composant
import { rdvService, type RdvStats } from '../services/rdv.service'
// Importation du module ou composant
import { walletService, type WalletStats } from '../services/wallet.service'
// Importation du module ou composant
import { medecinService } from '../services/medecin.service'
// Importation du module ou composant
import { systemService, type AuditLogItem } from '../services/system.service'
// Importation du module ou composant
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

// Déclaration de variable
const router = useRouter()

// --- Variables d'état réactives ---
const loading = ref(true)                         // Indicateur global de chargement des métriques
// Déclaration de variable
const userStats = ref<UserStats | null>(null)       // Statistiques démographiques des comptes
// Déclaration de variable
const rdvStats = ref<RdvStats | null>(null)         // Métriques de consultations médicales
// Déclaration de variable
const walletStats = ref<WalletStats | null>(null)   // Statistiques des transactions financières
// Déclaration de variable
const onmsCount = ref(0)                            // Nombre de médecins inscrits à l'Ordre National
// Déclaration de variable
const recentLogs = ref<AuditLogItem[]>([])          // Dernières traces d'audit de sécurité

/**
 * Récupère en parallèle les métriques de tous les microservices backend.
 * L'utilisation de Promise.allSettled garantit une tolérance aux pannes partielles.
 */
// Déclaration de variable
const fetchDashboardData = async () => {
  loading.value = true
  // Bloc d'essai pour gérer les erreurs
  try {
    // Déclaration de variable
    const [uStats, rStats, wStats, onmsList, logs] = await Promise.allSettled([
      userService.getStats(),
      rdvService.getAdminStats(),
      walletService.getWalletStats(),
      medecinService.getAllOnms(),
      systemService.getRecentAuditLogs()
    ])

    // Condition logique
    if (uStats.status === 'fulfilled') userStats.value = uStats.value
    // Condition logique
    if (rStats.status === 'fulfilled') rdvStats.value = rStats.value
    // Condition logique
    if (wStats.status === 'fulfilled') walletStats.value = wStats.value
    // Condition logique
    if (onmsList.status === 'fulfilled') onmsCount.value = onmsList.value.length
    // Condition logique
    if (logs.status === 'fulfilled') recentLogs.value = logs.value.slice(0, 6)
  } catch (error) {
    // Trace dans la console de debug
    console.error('Erreur chargement dashboard', error)
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  fetchDashboardData()
})

// Déclaration de variable
const formatCurrency = (val?: number) => {
  // Condition logique
  if (val === undefined || val === null) return '0 FCFA'
  // Retourne la valeur
  return new Intl.NumberFormat('fr-FR').format(val) + ' FCFA'
}

// Déclaration de variable
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

// ==========================================
// RÈGLE MÉTIER & CALCULS FINANCIERS :
// Pour chaque consultation payée :
// - 10% pour la plateforme Diam-Yaraam (Commission / Chiffre d'affaires net)
// - 90% pour le médecin praticien (Honoraires)
// ==========================================
const chiffreAffairesTotal = computed(() => {
  // Retourne la valeur
  return walletStats.value?.volumeTotalTransactions || 0
})

// Déclaration de variable
const revenuPlateforme = computed(() => {
  // Retourne la valeur
  return Math.round(chiffreAffairesTotal.value * 0.10)
})

// Déclaration de variable
const partMedecins = computed(() => {
  // Retourne la valeur
  return Math.round(chiffreAffairesTotal.value * 0.90)
})

// ==========================================
// CALCULS GRAPHES CIRCULAIRES (SVG DONUT) :
// Circonférence pour r = 70 : C = 2 * PI * 70 ≈ 439.82
// ==========================================
const C = 439.82

// Graphe 1 : Répartition Financière (10% Plateforme / 90% Médecins)
const finMedecinLen = computed(() => (90 / 100) * C)
// Déclaration de variable
const finPlateformeLen = computed(() => (10 / 100) * C)

// Graphe 2 : Modalités des Consultations
const totalConsultations = computed(() => rdvStats.value?.totalRdv || 0)
// Déclaration de variable
const teleconsultationsCount = computed(() => rdvStats.value?.teleconsultations || 0)
// Déclaration de variable
const presentielCount = computed(() => {
  // Déclaration de variable
  const diff = totalConsultations.value - teleconsultationsCount.value
  // Retourne la valeur
  return diff > 0 ? diff : (rdvStats.value?.presentiel || 0)
})

// Déclaration de variable
const teleconsultationPct = computed(() => {
  // Déclaration de variable
  const tot = totalConsultations.value
  // Condition logique
  if (!tot) return 0
  // Retourne la valeur
  return Math.round((teleconsultationsCount.value / tot) * 100)
})

// Déclaration de variable
const presentielPct = computed(() => {
  // Condition logique
  if (!totalConsultations.value) return 0
  // Retourne la valeur
  return Math.max(0, 100 - teleconsultationPct.value)
})

// Déclaration de variable
const rdvTeleLen = computed(() => (teleconsultationPct.value / 100) * C)
// Déclaration de variable
const rdvPresLen = computed(() => (presentielPct.value / 100) * C)

// Graphe 3 : Répartition de la Communauté
const totalUsersCount = computed(() => userStats.value?.totalUsers || 0)
// Déclaration de variable
const patientsCount = computed(() => userStats.value?.totalPatients || 0)
// Déclaration de variable
const medecinsCount = computed(() => userStats.value?.totalMedecins || 0)
// Déclaration de variable
const adminsCount = computed(() => userStats.value?.totalAdmins || 0)

// Déclaration de variable
const patientPct = computed(() => {
  // Déclaration de variable
  const tot = totalUsersCount.value
  // Condition logique
  if (!tot) return 0
  // Retourne la valeur
  return Math.round((patientsCount.value / tot) * 100)
})

// Déclaration de variable
const medecinPct = computed(() => {
  // Déclaration de variable
  const tot = totalUsersCount.value
  // Condition logique
  if (!tot) return 0
  // Retourne la valeur
  return Math.round((medecinsCount.value / tot) * 100)
})

// Déclaration de variable
const adminPct = computed(() => {
  // Condition logique
  if (!totalUsersCount.value) return 0
  // Retourne la valeur
  return Math.max(0, 100 - patientPct.value - medecinPct.value)
})

// Déclaration de variable
const userPatientLen = computed(() => (patientPct.value / 100) * C)
// Déclaration de variable
const userMedecinLen = computed(() => (medecinPct.value / 100) * C)
// Déclaration de variable
const userAdminLen = computed(() => (adminPct.value / 100) * C)
</script>

<template>
  <!-- Conteneur de bloc (div) -->
  <div class="dashboard-view">
    <!-- Executive Dashboard Header -->
    <div class="dashboard-header-bar">
      <!-- Conteneur de bloc (div) -->
      <div>
        <!-- Titre de section -->
        <h2 class="dashboard-title">Vue d'Ensemble des Indicateurs</h2>
        <!-- Paragraphe de texte -->
        <p class="dashboard-subtitle">Supervision financière, activité médicale et répartition des revenus Diam-Yaraam</p>
      </div>
      <!-- Conteneur de bloc (div) -->
      <div class="dashboard-header-actions">
        <!-- Bouton cliquable -->
        <button class="btn btn-secondary btn-sm" @click="fetchDashboardData" :disabled="loading" title="Actualiser les données">
          <RefreshCw :size="13" :class="{ 'spin-icon': loading }" />
          <!-- Conteneur en ligne (span) -->
          <span>{{ loading ? 'Actualisation...' : 'Actualiser les données' }}</span>
        </button>
        <!-- Bouton cliquable -->
        <button class="btn btn-primary btn-sm" @click="router.push('/medecins')">
          <Stethoscope :size="14" />
          <!-- Conteneur en ligne (span) -->
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
      <!-- Titre de section -->
      <h3 class="section-title">Analyses Circulaires & Modèle Économique</h3>
      <!-- Conteneur en ligne (span) -->
      <span class="section-subtitle">Visualisation en temps réel de la répartition des revenus, soins et utilisateurs</span>
    </div>

    <!-- Conteneur de bloc (div) -->
    <div class="dashboard-charts-grid">
      <!-- Graphe Circulaire 1 : Répartition Financière (10% Plateforme / 90% Médecins) -->
      <div class="chart-card">
        <!-- Conteneur de bloc (div) -->
        <div class="chart-card-header">
          <!-- Conteneur de bloc (div) -->
          <div>
            <h4 class="chart-card-title">Répartition du Chiffre d'Affaires</h4>
            <!-- Paragraphe de texte -->
            <p class="chart-card-subtitle">Modèle 10% Commission / 90% Médecins</p>
          </div>
          <!-- Conteneur en ligne (span) -->
          <span class="chart-badge vert">10% / 90%</span>
        </div>

        <!-- Conteneur de bloc (div) -->
        <div class="donut-container">
          <!-- Icône vectorielle -->
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

        <!-- Conteneur de bloc (div) -->
        <div class="donut-legend">
          <!-- Conteneur de bloc (div) -->
          <div class="legend-row">
            <!-- Conteneur de bloc (div) -->
            <div class="legend-info">
              <!-- Conteneur en ligne (span) -->
              <span class="legend-marker vert"></span>
              <!-- Conteneur en ligne (span) -->
              <span class="legend-label">Revenu Diam-Yaraam (10%)</span>
            </div>
            <!-- Conteneur de bloc (div) -->
            <div class="legend-values">
              <!-- Conteneur en ligne (span) -->
              <span class="legend-amount">{{ formatCurrency(revenuPlateforme) }}</span>
              <!-- Conteneur en ligne (span) -->
              <span class="legend-tag vert">10%</span>
            </div>
          </div>

          <!-- Conteneur de bloc (div) -->
          <div class="legend-row">
            <!-- Conteneur de bloc (div) -->
            <div class="legend-info">
              <!-- Conteneur en ligne (span) -->
              <span class="legend-marker noir"></span>
              <!-- Conteneur en ligne (span) -->
              <span class="legend-label">Honoraires Médecins (90%)</span>
            </div>
            <!-- Conteneur de bloc (div) -->
            <div class="legend-values">
              <!-- Conteneur en ligne (span) -->
              <span class="legend-amount">{{ formatCurrency(partMedecins) }}</span>
              <!-- Conteneur en ligne (span) -->
              <span class="legend-tag noir">90%</span>
            </div>
          </div>
        </div>

        <!-- Conteneur de bloc (div) -->
        <div class="rule-box">
          <Info :size="14" class="rule-icon" />
          <!-- Conteneur en ligne (span) -->
          <span>Sur chaque consultation payée, <strong>10%</strong> sont retenus pour la plateforme et <strong>90%</strong> sont versés au médecin.</span>
        </div>
      </div>

      <!-- Graphe Circulaire 2 : Modalités des Consultations -->
      <div class="chart-card">
        <!-- Conteneur de bloc (div) -->
        <div class="chart-card-header">
          <!-- Conteneur de bloc (div) -->
          <div>
            <h4 class="chart-card-title">Modalités des Consultations</h4>
            <!-- Paragraphe de texte -->
            <p class="chart-card-subtitle">Téléconsultations en ligne vs Présentiel</p>
          </div>
          <!-- Conteneur en ligne (span) -->
          <span class="chart-badge noir">Soins Réalisés</span>
        </div>

        <!-- Conteneur de bloc (div) -->
        <div class="donut-container">
          <!-- Icône vectorielle -->
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

        <!-- Conteneur de bloc (div) -->
        <div class="donut-legend">
          <!-- Conteneur de bloc (div) -->
          <div class="legend-row">
            <!-- Conteneur de bloc (div) -->
            <div class="legend-info">
              <!-- Conteneur en ligne (span) -->
              <span class="legend-marker vert"></span>
              <!-- Conteneur en ligne (span) -->
              <span class="legend-label">Téléconsultations (Visio)</span>
            </div>
            <!-- Conteneur de bloc (div) -->
            <div class="legend-values">
              <!-- Conteneur en ligne (span) -->
              <span class="legend-amount">{{ teleconsultationsCount }} séances</span>
              <!-- Conteneur en ligne (span) -->
              <span class="legend-tag vert">{{ teleconsultationPct }}%</span>
            </div>
          </div>

          <!-- Conteneur de bloc (div) -->
          <div class="legend-row">
            <!-- Conteneur de bloc (div) -->
            <div class="legend-info">
              <!-- Conteneur en ligne (span) -->
              <span class="legend-marker noir"></span>
              <!-- Conteneur en ligne (span) -->
              <span class="legend-label">Consultations en Cabinet</span>
            </div>
            <!-- Conteneur de bloc (div) -->
            <div class="legend-values">
              <!-- Conteneur en ligne (span) -->
              <span class="legend-amount">{{ presentielCount }} séances</span>
              <!-- Conteneur en ligne (span) -->
              <span class="legend-tag noir">{{ presentielPct }}%</span>
            </div>
          </div>
        </div>

        <!-- Conteneur de bloc (div) -->
        <div class="rule-box">
          <CheckCircle2 :size="14" class="rule-icon" />
          <!-- Conteneur en ligne (span) -->
          <span>{{ rdvStats?.confirmes ?? totalConsultations }} consultations confirmées sur le planning des praticiens.</span>
        </div>
      </div>

      <!-- Graphe Circulaire 3 : Écosystème des Utilisateurs -->
      <div class="chart-card">
        <!-- Conteneur de bloc (div) -->
        <div class="chart-card-header">
          <!-- Conteneur de bloc (div) -->
          <div>
            <h4 class="chart-card-title">Répartition des Utilisateurs</h4>
            <!-- Paragraphe de texte -->
            <p class="chart-card-subtitle">Patients adhérents, médecins et gestion</p>
          </div>
          <!-- Conteneur en ligne (span) -->
          <span class="chart-badge noir">Communauté</span>
        </div>

        <!-- Conteneur de bloc (div) -->
        <div class="donut-container">
          <!-- Icône vectorielle -->
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

        <!-- Conteneur de bloc (div) -->
        <div class="donut-legend">
          <!-- Conteneur de bloc (div) -->
          <div class="legend-row">
            <!-- Conteneur de bloc (div) -->
            <div class="legend-info">
              <!-- Conteneur en ligne (span) -->
              <span class="legend-marker vert"></span>
              <!-- Conteneur en ligne (span) -->
              <span class="legend-label">Patients Adhérents</span>
            </div>
            <!-- Conteneur de bloc (div) -->
            <div class="legend-values">
              <!-- Conteneur en ligne (span) -->
              <span class="legend-amount">{{ patientsCount }} patients</span>
              <!-- Conteneur en ligne (span) -->
              <span class="legend-tag vert">{{ patientPct }}%</span>
            </div>
          </div>

          <!-- Conteneur de bloc (div) -->
          <div class="legend-row">
            <!-- Conteneur de bloc (div) -->
            <div class="legend-info">
              <!-- Conteneur en ligne (span) -->
              <span class="legend-marker noir"></span>
              <!-- Conteneur en ligne (span) -->
              <span class="legend-label">Médecins Praticiens</span>
            </div>
            <!-- Conteneur de bloc (div) -->
            <div class="legend-values">
              <!-- Conteneur en ligne (span) -->
              <span class="legend-amount">{{ medecinsCount }} médecins</span>
              <!-- Conteneur en ligne (span) -->
              <span class="legend-tag noir">{{ medecinPct }}%</span>
            </div>
          </div>
        </div>

        <!-- Conteneur de bloc (div) -->
        <div class="rule-box">
          <Users :size="14" class="rule-icon" />
          <!-- Conteneur en ligne (span) -->
          <span>{{ onmsCount }} médecins enregistrés et certifiés auprès du registre officiel ONMS.</span>
        </div>
      </div>
    </div>

    <!-- Main Grid Panels -->
    <div class="dashboard-panels-grid">
      <!-- Panel 1: Quick Actions & Management -->
      <div class="card-panel">
        <!-- Conteneur de bloc (div) -->
        <div class="panel-header">
          <!-- Titre de section -->
          <h3 class="panel-title">Actions Rapides & Pilotage</h3>
        </div>
        <!-- Conteneur de bloc (div) -->
        <div class="quick-actions-body">
          <!-- Bouton cliquable -->
          <button class="quick-action-btn" @click="router.push('/users')">
            <!-- Conteneur en ligne (span) -->
            <span class="icon-wrap"><UserCog :size="18" :stroke-width="1.8" /></span>
            <!-- Conteneur de bloc (div) -->
            <div class="btn-text-content">
              <!-- Conteneur de bloc (div) -->
              <div class="btn-title">Gestion des Utilisateurs</div>
              <!-- Conteneur de bloc (div) -->
              <div class="btn-desc">Gérer les comptes, accès et politiques de sécurité</div>
            </div>
            <ChevronRight :size="16" class="arrow-icon" />
          </button>

          <!-- Bouton cliquable -->
          <button class="quick-action-btn" @click="router.push('/medecins')">
            <!-- Conteneur en ligne (span) -->
            <span class="icon-wrap"><Stethoscope :size="18" :stroke-width="1.8" /></span>
            <!-- Conteneur de bloc (div) -->
            <div class="btn-text-content">
              <!-- Conteneur de bloc (div) -->
              <div class="btn-title">Registre ONMS & Médecins</div>
              <!-- Conteneur de bloc (div) -->
              <div class="btn-desc">Contrôler le tableau officiel et valider l'exercice médical</div>
            </div>
            <ChevronRight :size="16" class="arrow-icon" />
          </button>

          <!-- Bouton cliquable -->
          <button class="quick-action-btn" @click="router.push('/rendez-vous')">
            <!-- Conteneur en ligne (span) -->
            <span class="icon-wrap"><Calendar :size="18" :stroke-width="1.8" /></span>
            <!-- Conteneur de bloc (div) -->
            <div class="btn-text-content">
              <!-- Conteneur de bloc (div) -->
              <div class="btn-title">Supervision des Consultations</div>
              <!-- Conteneur de bloc (div) -->
              <div class="btn-desc">Suivre les consultations en cabinet et téléconsultations</div>
            </div>
            <ChevronRight :size="16" class="arrow-icon" />
          </button>

          <!-- Bouton cliquable -->
          <button class="quick-action-btn" @click="router.push('/finances')">
            <!-- Conteneur en ligne (span) -->
            <span class="icon-wrap"><CreditCard :size="18" :stroke-width="1.8" /></span>
            <!-- Conteneur de bloc (div) -->
            <div class="btn-text-content">
              <!-- Conteneur de bloc (div) -->
              <div class="btn-title">Régularisation Financière</div>
              <!-- Conteneur de bloc (div) -->
              <div class="btn-desc">Paiements Wave, Orange Money et soldes portefeuilles</div>
            </div>
            <ChevronRight :size="16" class="arrow-icon" />
          </button>

          <!-- Bouton cliquable -->
          <button class="quick-action-btn" @click="router.push('/systeme')">
            <!-- Conteneur en ligne (span) -->
            <span class="icon-wrap"><ShieldCheck :size="18" :stroke-width="1.8" /></span>
            <!-- Conteneur de bloc (div) -->
            <div class="btn-text-content">
              <!-- Conteneur de bloc (div) -->
              <div class="btn-title">Journal d'Activité & Sécurité</div>
              <!-- Conteneur de bloc (div) -->
              <div class="btn-desc">Historique des accès, connexions et traçabilité</div>
            </div>
            <ChevronRight :size="16" class="arrow-icon" />
          </button>
        </div>
      </div>

      <!-- Panel 2: Distribution des Comptes par Statut -->
      <div class="card-panel">
        <!-- Conteneur de bloc (div) -->
        <div class="panel-header">
          <!-- Titre de section -->
          <h3 class="panel-title">Statut d'Activation des Comptes</h3>
        </div>
        <!-- Conteneur de bloc (div) -->
        <div class="distribution-body" v-if="userStats">
          <!-- Conteneur de bloc (div) -->
          <div class="dist-row">
            <!-- Conteneur en ligne (span) -->
            <span class="dist-label">Comptes Actifs</span>
            <!-- Conteneur de bloc (div) -->
            <div class="dist-bar-wrapper">
              <!-- Conteneur de bloc (div) -->
              <div
                class="dist-bar-fill vert"
                :style="{ width: `${(userStats.statusActif / (userStats.totalUsers || 1)) * 100}%` }"
              ></div>
            </div>
            <!-- Conteneur en ligne (span) -->
            <span class="dist-count">{{ userStats.statusActif }}</span>
          </div>

          <!-- Conteneur de bloc (div) -->
          <div class="dist-row">
            <!-- Conteneur en ligne (span) -->
            <span class="dist-label">En Attente d'Activation</span>
            <!-- Conteneur de bloc (div) -->
            <div class="dist-bar-wrapper">
              <!-- Conteneur de bloc (div) -->
              <div
                class="dist-bar-fill attente"
                :style="{ width: `${(userStats.statusEnAttente / (userStats.totalUsers || 1)) * 100}%` }"
              ></div>
            </div>
            <!-- Conteneur en ligne (span) -->
            <span class="dist-count">{{ userStats.statusEnAttente }}</span>
          </div>

          <!-- Conteneur de bloc (div) -->
          <div class="dist-row">
            <!-- Conteneur en ligne (span) -->
            <span class="dist-label">Comptes Suspendus / Bloqués</span>
            <!-- Conteneur de bloc (div) -->
            <div class="dist-bar-wrapper">
              <!-- Conteneur de bloc (div) -->
              <div
                class="dist-bar-fill noir"
                :style="{ width: `${((userStats.statusSuspendu + userStats.statusBloque) / (userStats.totalUsers || 1)) * 100}%` }"
              ></div>
            </div>
            <!-- Conteneur en ligne (span) -->
            <span class="dist-count">{{ userStats.statusSuspendu + userStats.statusBloque }}</span>
          </div>

          <!-- Conteneur de bloc (div) -->
          <div class="dist-row">
            <!-- Conteneur en ligne (span) -->
            <span class="dist-label">Administrateurs & Staff</span>
            <!-- Conteneur de bloc (div) -->
            <div class="dist-bar-wrapper">
              <!-- Conteneur de bloc (div) -->
              <div
                class="dist-bar-fill vert-fonce"
                :style="{ width: `${(userStats.totalAdmins / (userStats.totalUsers || 1)) * 100}%` }"
              ></div>
            </div>
            <!-- Conteneur en ligne (span) -->
            <span class="dist-count">{{ userStats.totalAdmins }}</span>
          </div>
        </div>
        <!-- Conteneur de bloc (div) -->
        <div v-else class="loading-state">
          <!-- Conteneur de bloc (div) -->
          <div class="spinner"></div>
          <!-- Conteneur en ligne (span) -->
          <span>Chargement des métriques...</span>
        </div>
      </div>
    </div>

    <!-- Recent Complete Traceability Feed (Qui, Quoi, Quand & À quel moment) -->
    <div class="card-panel">
      <!-- Conteneur de bloc (div) -->
      <div class="panel-header">
        <!-- Conteneur de bloc (div) -->
        <div>
          <!-- Titre de section -->
          <h3 class="panel-title">Journal Récent de Traçabilité & Audit</h3>
          <!-- Paragraphe de texte -->
          <p class="panel-subtitle">Traçabilité intégrale : Qui a fait quoi, quand et à quel moment sur la plateforme</p>
        </div>
        <!-- Bouton cliquable -->
        <button class="btn btn-secondary btn-sm" @click="router.push('/systeme')">
          <!-- Conteneur en ligne (span) -->
          <span>Consulter Tout l'Historique</span>
          <ChevronRight :size="13" />
        </button>
      </div>

      <!-- Conteneur de bloc (div) -->
      <div class="table-responsive">
        <!-- Conteneur de bloc (div) -->
        <div v-if="recentLogs.length === 0 && !loading" class="empty-state">
          <FileText :size="32" class="empty-icon" />
          <!-- Paragraphe de texte -->
          <p>Aucun événement d'audit récent enregistré</p>
        </div>
        <!-- Élément de tableau de données -->
        <table v-else class="data-table">
          <thead>
            <!-- Élément de tableau de données -->
            <tr>
              <th style="min-width: 140px;">Quand & Moment</th>
              <th style="min-width: 200px;">Qui (Auteur)</th>
              <th style="min-width: 160px;">Quoi (Action)</th>
              <th>Détail de l'Opération & Cible</th>
              <th style="min-width: 100px;">Résultat</th>
            </tr>
          </thead>
          <tbody>
            <!-- Élément de tableau de données -->
            <tr v-for="log in recentLogs" :key="log.id">
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
/* Sélecteur de classe CSS */
.dashboard-header-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  flex-wrap: wrap;
  gap: 14px;
}

/* Sélecteur de classe CSS */
.dashboard-title {
  font-size: 1.15rem;
  font-weight: 700;
  color: var(--text-dark);
  margin-bottom: 2px;
}

/* Sélecteur de classe CSS */
.dashboard-subtitle {
  font-size: 0.8rem;
  color: var(--text-muted);
}

/* Sélecteur de classe CSS */
.dashboard-header-actions {
  display: flex;
  align-items: center;
  gap: 10px;
}

/* Sélecteur de classe CSS */
.spin-icon {
  animation: spin 1s linear infinite;
}

/* Charts Section Header */
.charts-section-header {
  margin: 28px 0 16px;
}

/* Sélecteur de classe CSS */
.section-title {
  font-size: 1.05rem;
  font-weight: 700;
  color: var(--text-dark);
  margin-bottom: 2px;
}

/* Sélecteur de classe CSS */
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

/* Sélecteur de classe CSS */
.chart-card {
  background: var(--card-bg);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-lg);
  padding: 22px 24px;
  display: flex;
  flex-direction: column;
  transition: border-color 0.2s ease;
}

/* Sélecteur de classe CSS */
.chart-card:hover {
  border-color: #CBD5E1;
}

/* Sélecteur de classe CSS */
.chart-card-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 12px;
  gap: 10px;
}

/* Sélecteur de classe CSS */
.chart-card-title {
  font-size: 0.94rem;
  font-weight: 700;
  color: var(--text-dark);
  margin-bottom: 2px;
}

/* Sélecteur de classe CSS */
.chart-card-subtitle {
  font-size: 0.74rem;
  color: var(--text-muted);
  line-height: 1.35;
}

/* Sélecteur de classe CSS */
.chart-badge {
  font-size: 0.68rem;
  font-weight: 700;
  padding: 3px 8px;
  border-radius: var(--radius-sm);
  white-space: nowrap;
}

/* Sélecteur de classe CSS */
.chart-badge.vert {
  background: var(--primary-light);
  color: var(--primary);
  border: 1px solid var(--primary-border);
}

/* Sélecteur de classe CSS */
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

/* Sélecteur de classe CSS */
.donut-svg {
  width: 175px;
  height: 175px;
  overflow: visible;
}

/* Sélecteur de classe CSS */
.donut-track {
  fill: none;
  stroke: #F1F5F9;
  stroke-width: 17;
}

/* Sélecteur de classe CSS */
.donut-segment {
  fill: none;
  stroke-width: 17;
  stroke-linecap: butt;
  transition: stroke-dasharray 0.8s cubic-bezier(0.16, 1, 0.3, 1), stroke-dashoffset 0.8s cubic-bezier(0.16, 1, 0.3, 1);
}

/* Sélecteur de classe CSS */
.donut-segment.segment-vert {
  stroke: #0D7C66;
}

/* Sélecteur de classe CSS */
.donut-segment.segment-noir {
  stroke: #090D14;
}

/* Sélecteur de classe CSS */
.donut-segment.segment-gris {
  stroke: #94A3B8;
}

/* Sélecteur de classe CSS */
.donut-val {
  font-size: 13px;
  font-weight: 800;
  fill: #090D14;
  font-family: inherit;
}

/* Sélecteur de classe CSS */
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

/* Sélecteur de classe CSS */
.legend-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 0.8rem;
}

/* Sélecteur de classe CSS */
.legend-info {
  display: flex;
  align-items: center;
  gap: 8px;
}

/* Sélecteur de classe CSS */
.legend-marker {
  width: 10px;
  height: 10px;
  border-radius: 3px;
  flex-shrink: 0;
}

/* Sélecteur de classe CSS */
.legend-marker.vert { background-color: #0D7C66; }
/* Sélecteur de classe CSS */
.legend-marker.noir { background-color: #090D14; }

/* Sélecteur de classe CSS */
.legend-label {
  font-weight: 600;
  color: var(--text-dark);
}

/* Sélecteur de classe CSS */
.legend-values {
  display: flex;
  align-items: center;
  gap: 8px;
}

/* Sélecteur de classe CSS */
.legend-amount {
  font-weight: 700;
  color: var(--text-dark);
  font-size: 0.82rem;
}

/* Sélecteur de classe CSS */
.legend-tag {
  font-size: 0.65rem;
  font-weight: 700;
  padding: 2px 6px;
  border-radius: var(--radius-sm);
}

/* Sélecteur de classe CSS */
.legend-tag.vert {
  background: var(--primary-light);
  color: var(--primary);
}

/* Sélecteur de classe CSS */
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

/* Sélecteur de classe CSS */
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
  /* Sélecteur de classe CSS */
  .dashboard-panels-grid {
    grid-template-columns: 1fr;
  }
}

/* Sélecteur de classe CSS */
.quick-actions-body {
  padding: 14px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

/* Sélecteur de classe CSS */
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

/* Sélecteur de classe CSS */
.quick-action-btn:hover {
  background: #F8FAFC;
  border-color: var(--primary);
}

/* Sélecteur de classe CSS */
.quick-action-btn:hover .arrow-icon {
  transform: translateX(4px);
  color: var(--primary);
}

/* Sélecteur de classe CSS */
.quick-action-btn:hover .icon-wrap {
  background: var(--primary);
  color: #FFFFFF;
}

/* Sélecteur de classe CSS */
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

/* Sélecteur de classe CSS */
.btn-text-content {
  flex: 1;
  min-width: 0;
}

/* Sélecteur de classe CSS */
.btn-title {
  font-weight: 600;
  font-size: 0.88rem;
  color: var(--text-dark);
}

/* Sélecteur de classe CSS */
.btn-desc {
  font-size: 0.75rem;
  color: var(--text-muted);
}

/* Sélecteur de classe CSS */
.arrow-icon {
  color: var(--text-light);
  flex-shrink: 0;
  transition: all 0.2s ease;
}

/* Sélecteur de classe CSS */
.distribution-body {
  padding: 22px 20px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

/* Sélecteur de classe CSS */
.dist-row {
  display: flex;
  align-items: center;
  gap: 12px;
}

/* Sélecteur de classe CSS */
.dist-label {
  width: 170px;
  font-size: 0.82rem;
  font-weight: 600;
  color: var(--text-body);
}

/* Sélecteur de classe CSS */
.dist-bar-wrapper {
  flex: 1;
  height: 9px;
  background: #F1F5F9;
  border-radius: var(--radius-sm);
  overflow: hidden;
}

/* Sélecteur de classe CSS */
.dist-bar-fill {
  height: 100%;
  border-radius: var(--radius-sm);
  transition: width 0.5s cubic-bezier(0.16, 1, 0.3, 1);
}

/* Sélecteur de classe CSS */
.dist-bar-fill.vert { background-color: var(--primary); }
/* Sélecteur de classe CSS */
.dist-bar-fill.attente { background-color: #94A3B8; }
/* Sélecteur de classe CSS */
.dist-bar-fill.noir { background-color: #090D14; }
/* Sélecteur de classe CSS */
.dist-bar-fill.vert-fonce { background-color: var(--primary-dark); }

/* Sélecteur de classe CSS */
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

/* Sélecteur de classe CSS */
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
</style>

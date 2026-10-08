<script setup lang="ts">
// Importation du module ou composant
import { ref, computed, onMounted } from 'vue'
// Importation du module ou composant
import Modal from '../components/common/Modal.vue'
// Importation du module ou composant
import StatCard from '../components/common/StatCard.vue'
// Importation du module ou composant
import Pagination from '../components/common/Pagination.vue'
// Importation du module ou composant
import { rdvService, type RendezVousItem, type RdvStats } from '../services/rdv.service'
// Importation du module ou composant
import { patientService, type PatientProfile } from '../services/patient.service'
// Importation du module ou composant
import { medecinService, type PlatformDoctor } from '../services/medecin.service'
// Importation du module ou composant
import { userService, type UserItem } from '../services/user.service'
// Importation du module ou composant
import { useToast } from '../composables/useToast'
// Importation du module ou composant
import { useConfirm } from '../composables/useConfirm'
// Importation du module ou composant
import {
  Search,
  Calendar,
  Video,
  Building2,
  Home,
  Edit2,
  Trash2,
  CheckCircle2,
  Clock,
  User,
  Stethoscope,
  Eye,
  Phone,
  AlertCircle,
  FileText,
  CreditCard,
  MapPin,
  CalendarCheck
} from 'lucide-vue-next'

// Déclaration de variable
const toast = useToast()
// Déclaration de variable
const { confirm } = useConfirm()

// Déclaration de variable
const rendezVousList = ref<RendezVousItem[]>([])
// Déclaration de variable
const rdvStats = ref<RdvStats | null>(null)
// Déclaration de variable
const loading = ref(true)

// Related entities for real name resolution
const patientsMap = ref<Map<string, PatientProfile>>(new Map())
// Déclaration de variable
const medecinsMap = ref<Map<string, PlatformDoctor>>(new Map())
// Déclaration de variable
const usersMap = ref<Map<string, UserItem>>(new Map())

// Filters
const selectedStatut = ref('TOUS')
// Déclaration de variable
const selectedType = ref('TOUS')
// Déclaration de variable
const searchQuery = ref('')

// Status Change Modal
const isStatusModalOpen = ref(false)
// Déclaration de variable
const selectedRdv = ref<RendezVousItem | null>(null)
// Déclaration de variable
const newStatut = ref('CONFIRME')
// Déclaration de variable
const motifRaison = ref('')

// Details Modal
const isDetailsModalOpen = ref(false)
// Déclaration de variable
const detailsRdv = ref<RendezVousItem | null>(null)

// Déclaration de variable
const fetchRdv = async () => {
  loading.value = true
  // Bloc d'essai pour gérer les erreurs
  try {
    // Déclaration de variable
    const [listRes, statsRes, patientsRes, medecinsRes, usersRes] = await Promise.allSettled([
      rdvService.getAllRendezVous(),
      rdvService.getAdminStats(),
      patientService.getAllPatients(),
      medecinService.getAllPlatformMedecins(),
      userService.getAllUsers()
    ])

    // Condition logique
    if (listRes.status === 'fulfilled') rendezVousList.value = listRes.value
    // Condition logique
    if (statsRes.status === 'fulfilled') rdvStats.value = statsRes.value

    // Condition logique
    if (patientsRes.status === 'fulfilled') {
      // Déclaration de variable
      const pMap = new Map<string, PatientProfile>()
      patientsRes.value.forEach(p => {
        pMap.set(p.id, p)
        // Condition logique
        if (p.userId) pMap.set(p.userId, p)
      })
      patientsMap.value = pMap
    }

    // Condition logique
    if (medecinsRes.status === 'fulfilled') {
      // Déclaration de variable
      const mMap = new Map<string, PlatformDoctor>()
      medecinsRes.value.forEach(m => {
        mMap.set(m.id, m)
        // Condition logique
        if (m.userId) mMap.set(m.userId, m)
      })
      medecinsMap.value = mMap
    }

    // Condition logique
    if (usersRes.status === 'fulfilled') {
      // Déclaration de variable
      const uMap = new Map<string, UserItem>()
      usersRes.value.forEach(u => {
        uMap.set(u.id, u)
      })
      usersMap.value = uMap
    }
  } catch {
    toast.error('Erreur lors du chargement des consultations')
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  fetchRdv()
})

// Real name resolution helpers
const getPatientInfo = (patientId: string) => {
  // Déclaration de variable
  const patient = patientsMap.value.get(patientId)
  // Déclaration de variable
  const userId = patient?.userId || patientId
  // Déclaration de variable
  const user = usersMap.value.get(userId)

  // Condition logique
  if (user && (user.firstName || user.lastName)) {
    // Déclaration de variable
    const fn = `${user.firstName || ''} ${user.lastName || ''}`.trim()
    // Déclaration de variable
    const inits = `${(user.firstName?.[0] || '')}${(user.lastName?.[0] || '')}`.toUpperCase() || 'PT'
    // Retourne la valeur
    return {
      fullName: fn,
      phone: user.telephone || patient?.contactUrgenceTelephone || '',
      initials: inits,
      idSnippet: patientId.substring(0, 6).toUpperCase(),
      email: user.email || '',
      city: patient?.ville || patient?.region || 'Sénégal'
    }
  }

  // Retourne la valeur
  return {
    fullName: `Patient #${patientId.substring(0, 6).toUpperCase()}`,
    phone: patient?.contactUrgenceTelephone || '',
    initials: 'PT',
    idSnippet: patientId.substring(0, 6).toUpperCase(),
    email: '',
    city: 'Sénégal'
  }
}

// Déclaration de variable
const getDoctorInfo = (medecinId: string) => {
  // Déclaration de variable
  const doc = medecinsMap.value.get(medecinId)
  // Déclaration de variable
  const user = usersMap.value.get(doc?.userId || medecinId)

  // Déclaration de variable
  let name = ''
  // Condition logique
  if (doc?.nomComplet) {
    name = doc.nomComplet.startsWith('Dr') ? doc.nomComplet : `Dr. ${doc.nomComplet}`
  } else if (user && (user.firstName || user.lastName)) {
    name = `Dr. ${user.firstName || ''} ${user.lastName || ''}`.trim()
  } else {
    name = `Dr. Praticien #${medecinId.substring(0, 6).toUpperCase()}`
  }

  // Retourne la valeur
  return {
    fullName: name,
    specialite: doc?.specialite || 'Médecin Praticien',
    etablissement: doc?.etablissement || 'Plateforme Diam-Yaraam',
    idSnippet: medecinId.substring(0, 6).toUpperCase()
  }
}

// Déclaration de variable
const formatDate = (dateStr?: string, fallbackStr?: string) => {
  // Déclaration de variable
  const str = dateStr || fallbackStr
  // Condition logique
  if (!str) return 'Date à planifier'
  // Bloc d'essai pour gérer les erreurs
  try {
    // Déclaration de variable
    const d = new Date(str)
    // Condition logique
    if (isNaN(d.getTime())) return str
    // Retourne la valeur
    return d.toLocaleString('fr-FR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  } catch {
    // Retourne la valeur
    return str
  }
}

// Déclaration de variable
const getRdvDate = (rdv: RendezVousItem) => {
  // Retourne la valeur
  return rdv.dateHeureConfirmee || rdv.dateHeureSouhaitee || rdv.dateHeure || rdv.createdAt
}

// Déclaration de variable
const openStatusModal = (rdv: RendezVousItem) => {
  selectedRdv.value = rdv
  newStatut.value = rdv.statut
  motifRaison.value = ''
  isStatusModalOpen.value = true
}

// Déclaration de variable
const openDetailsModal = (rdv: RendezVousItem) => {
  detailsRdv.value = rdv
  isDetailsModalOpen.value = true
}

// Déclaration de variable
const handleUpdateStatus = async () => {
  // Condition logique
  if (!selectedRdv.value) return
  // Bloc d'essai pour gérer les erreurs
  try {
    // Attente de la promesse (asynchrone)
    await rdvService.changerStatut(selectedRdv.value.id, newStatut.value, motifRaison.value)
    toast.success(`Statut du RDV mis à jour : ${newStatut.value}`)
    isStatusModalOpen.value = false
    fetchRdv()
  } catch {
    toast.error('Erreur lors du changement de statut')
  }
}

// Déclaration de variable
const handleDeleteRdv = async (id: string) => {
  // Déclaration de variable
  const ok = await confirm({
    title: 'Supprimer la consultation',
    message: 'Confirmez-vous la suppression de cette consultation du planning médical ? Les créneaux associés seront libérés.',
    confirmText: 'Supprimer du planning',
    cancelText: 'Annuler',
    variant: 'danger'
  })
  // Condition logique
  if (ok) {
    // Bloc d'essai pour gérer les erreurs
    try {
      // Attente de la promesse (asynchrone)
      await rdvService.supprimerRendezVous(id)
      toast.success('Consultation supprimée.')
      fetchRdv()
    } catch {
      toast.error('Erreur lors de la suppression')
    }
  }
}

// Pagination
const currentPage = ref(1)
// Déclaration de variable
const pageSize = ref(8)

// Déclaration de variable
const filteredRdvList = computed(() => {
  // Retourne la valeur
  return rendezVousList.value.filter(r => {
    // Déclaration de variable
    const matchStatus = selectedStatut.value === 'TOUS' || r.statut === selectedStatut.value
    // Déclaration de variable
    const matchType = selectedType.value === 'TOUS' || r.typeConsultation === selectedType.value
    // Condition logique
    if (!searchQuery.value.trim()) return matchStatus && matchType

    // Déclaration de variable
    const q = searchQuery.value.toLowerCase()
    // Déclaration de variable
    const pInfo = getPatientInfo(r.patientId)
    // Déclaration de variable
    const dInfo = getDoctorInfo(r.medecinId)

    // Déclaration de variable
    const matchQuery =
      (r.motif || '').toLowerCase().includes(q) ||
      (r.id || '').toLowerCase().includes(q) ||
      pInfo.fullName.toLowerCase().includes(q) ||
      pInfo.phone.toLowerCase().includes(q) ||
      dInfo.fullName.toLowerCase().includes(q) ||
      dInfo.specialite.toLowerCase().includes(q)

    // Retourne la valeur
    return matchStatus && matchType && matchQuery
  })
})

// Déclaration de variable
const paginatedRdv = computed(() => {
  // Déclaration de variable
  const start = (currentPage.value - 1) * pageSize.value
  // Retourne la valeur
  return filteredRdvList.value.slice(start, start + pageSize.value)
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
  <div class="rdv-view">
    <!-- KPI Metrics Grid -->
    <div class="stats-grid" v-if="rdvStats">
      <StatCard
        title="Total Consultations"
        :value="rdvStats.totalRdv"
        trend="Consultations enregistrées"
        trendType="neutral"
        :icon="Calendar"
      />
      <StatCard
        title="Consultations Confirmées"
        :value="rdvStats.confirmes"
        trend="Validées par les praticiens"
        trendType="positive"
        :icon="CheckCircle2"
      />
      <StatCard
        title="En Attente de Validation"
        :value="rdvStats.demandes"
        trend="Demandes patients à traiter"
        trendType="neutral"
        :icon="Clock"
      />
      <StatCard
        title="Téléconsultations"
        :value="rdvStats.teleconsultations"
        trend="Séances médicales en ligne"
        trendType="positive"
        :icon="Video"
      />
    </div>

    <!-- Conteneur de bloc (div) -->
    <div class="card-panel">
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
              placeholder="Rechercher par patient, médecin, spécialité ou motif..."
            />
          </div>

          <select class="filter-select" v-model="selectedStatut" @change="handleFilterChange">
            <option value="TOUS">Tous les statuts</option>
            <option value="DEMANDE">Demandé</option>
            <option value="EN_ATTENTE">En attente</option>
            <option value="ACCEPTE">Accepté</option>
            <option value="CONFIRME">Confirmé</option>
            <option value="EN_COURS">En cours</option>
            <option value="TERMINE">Terminé</option>
            <option value="ANNULE">Annulé</option>
          </select>

          <select class="filter-select" v-model="selectedType" @change="handleFilterChange">
            <option value="TOUS">Toutes les modalités</option>
            <option value="TELECONSULTATION">Téléconsultation (Visio)</option>
            <option value="PRESENTIEL">Consultation en Cabinet</option>
            <option value="PRESENTIELLE">Consultation Présentielle</option>
            <option value="DOMICILE">Visite à Domicile</option>
          </select>
        </div>
      </div>

      <!-- Conteneur de bloc (div) -->
      <div class="table-responsive">
        <!-- Conteneur de bloc (div) -->
        <div v-if="loading" class="loading-state">
          <!-- Conteneur de bloc (div) -->
          <div class="spinner"></div>
          <!-- Paragraphe de texte -->
          <p>Chargement des consultations et synchronisation des praticiens...</p>
        </div>

        <!-- Conteneur de bloc (div) -->
        <div v-else-if="filteredRdvList.length === 0" class="empty-state">
          <Calendar :size="32" class="empty-icon" />
          <!-- Paragraphe de texte -->
          <p>Aucune consultation trouvée.</p>
        </div>

        <!-- Élément de tableau de données -->
        <table v-else class="data-table">
          <thead>
            <!-- Élément de tableau de données -->
            <tr>
              <th>Date & Heure</th>
              <th>Motif Clinique</th>
              <th>Modalité</th>
              <th>Patient</th>
              <th>Praticien Référent</th>
              <th>Statut</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            <!-- Élément de tableau de données -->
            <tr v-for="rdv in paginatedRdv" :key="rdv.id">
              <!-- DATE & HEURE -->
              <td>
                <!-- Conteneur de bloc (div) -->
                <div class="date-cell">
                  <!-- Conteneur de bloc (div) -->
                  <div class="date-main">
                    <CalendarCheck :size="13" class="text-vert" />
                    <strong>{{ formatDate(getRdvDate(rdv)) }}</strong>
                  </div>
                  <!-- Conteneur de bloc (div) -->
                  <div class="date-meta">
                    <!-- Conteneur en ligne (span) -->
                    <span class="ref-badge">RDV #{{ rdv.id.substring(0, 6).toUpperCase() }}</span>
                    <!-- Conteneur en ligne (span) -->
                    <span v-if="rdv.dateHeureConfirmee" class="date-sub-badge confirmed">Confirmé</span>
                    <!-- Conteneur en ligne (span) -->
                    <span v-else class="date-sub-badge planned">Souhaité</span>
                  </div>
                </div>
              </td>

              <!-- MOTIF CLINIQUE -->
              <td>
                <!-- Conteneur de bloc (div) -->
                <div class="motif-cell">
                  <!-- Conteneur de bloc (div) -->
                  <div class="motif-title">{{ rdv.motif || 'Consultation médicale' }}</div>
                  <!-- Conteneur de bloc (div) -->
                  <div v-if="rdv.referencePaiement || rdv.refPaiement" class="motif-payment-tag">
                    <CreditCard :size="11" />
                    <!-- Conteneur en ligne (span) -->
                    <span>Payé : {{ rdv.referencePaiement || rdv.refPaiement }}</span>
                  </div>
                </div>
              </td>

              <!-- MODALITÉ -->
              <td>
                <!-- Conteneur en ligne (span) -->
                <span
                  class="mode-badge"
                  :class="{
                    'teleconsult': rdv.typeConsultation === 'TELECONSULTATION',
                    'presentiel': rdv.typeConsultation === 'PRESENTIEL' || rdv.typeConsultation === 'PRESENTIELLE',
                    'domicile': rdv.typeConsultation === 'DOMICILE'
                  }"
                >
                  <Video v-if="rdv.typeConsultation === 'TELECONSULTATION'" :size="12" :stroke-width="1.8" />
                  <Building2 v-else-if="rdv.typeConsultation === 'PRESENTIEL' || rdv.typeConsultation === 'PRESENTIELLE'" :size="12" :stroke-width="1.8" />
                  <Home v-else :size="12" :stroke-width="1.8" />
                  <!-- Conteneur en ligne (span) -->
                  <span>
                    {{
                      rdv.typeConsultation === 'TELECONSULTATION'
                        ? 'Téléconsultation'
                        : rdv.typeConsultation === 'DOMICILE'
                          ? 'À Domicile'
                          : 'Cabinet'
                    }}
                  </span>
                </span>
              </td>

              <!-- PATIENT COLUMN -->
              <td>
                <!-- Conteneur de bloc (div) -->
                <div class="person-cell patient-col">
                  <!-- Conteneur de bloc (div) -->
                  <div class="person-avatar patient-avatar">
                    {{ getPatientInfo(rdv.patientId).initials }}
                  </div>
                  <!-- Conteneur de bloc (div) -->
                  <div class="person-info">
                    <!-- Conteneur en ligne (span) -->
                    <span class="person-name">{{ getPatientInfo(rdv.patientId).fullName }}</span>
                    <!-- Conteneur en ligne (span) -->
                    <span v-if="getPatientInfo(rdv.patientId).phone" class="person-sub phone-sub">
                      <Phone :size="10" /> {{ getPatientInfo(rdv.patientId).phone }}
                    </span>
                  </div>
                </div>
              </td>

              <!-- PRATICIEN COLUMN -->
              <td>
                <!-- Conteneur de bloc (div) -->
                <div class="person-cell doctor-col">
                  <!-- Conteneur de bloc (div) -->
                  <div class="person-avatar doctor-avatar">
                    <Stethoscope :size="13" />
                  </div>
                  <!-- Conteneur de bloc (div) -->
                  <div class="person-info">
                    <!-- Conteneur en ligne (span) -->
                    <span class="person-name doctor-name">{{ getDoctorInfo(rdv.medecinId).fullName }}</span>
                    <!-- Conteneur en ligne (span) -->
                    <span class="person-sub specialite-sub">
                      {{ getDoctorInfo(rdv.medecinId).specialite }}
                    </span>
                  </div>
                </div>
              </td>

              <!-- STATUT -->
              <td>
                <!-- Conteneur en ligne (span) -->
                <span :class="['badge', 'badge-' + rdv.statut.toLowerCase()]">
                  <!-- Conteneur en ligne (span) -->
                  <span class="badge-dot"></span>
                  {{ rdv.statut }}
                </span>
              </td>

              <!-- ACTIONS -->
              <td>
                <!-- Conteneur de bloc (div) -->
                <div class="table-actions">
                  <!-- Bouton cliquable -->
                  <button
                    class="action-icon-btn view"
                    @click="openDetailsModal(rdv)"
                    title="Voir les détails complets de la consultation"
                  >
                    <Eye :size="13" :stroke-width="1.8" />
                  </button>
                  <!-- Bouton cliquable -->
                  <button
                    class="action-icon-btn edit"
                    @click="openStatusModal(rdv)"
                    title="Changer le statut"
                  >
                    <Edit2 :size="13" :stroke-width="1.8" />
                  </button>
                  <!-- Bouton cliquable -->
                  <button
                    class="action-icon-btn delete"
                    @click="handleDeleteRdv(rdv.id)"
                    title="Supprimer la consultation"
                  >
                    <Trash2 :size="13" :stroke-width="1.8" />
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Pagination Consultations -->
      <Pagination
        v-if="filteredRdvList.length > 0"
        v-model:currentPage="currentPage"
        :totalItems="filteredRdvList.length"
        v-model:pageSize="pageSize"
      />
    </div>

    <!-- Status Change Modal -->
    <Modal :isOpen="isStatusModalOpen" title="Modifier le Statut de la Consultation" @close="isStatusModalOpen = false">
      <!-- Conteneur de bloc (div) -->
      <div v-if="selectedRdv" class="form-grid">
        <!-- Conteneur de bloc (div) -->
        <div class="form-group full-width">
          <label>Consultation sélectionnée</label>
          <!-- Champ de saisie utilisateur -->
          <input
            type="text"
            :value="`RDV #${selectedRdv.id.substring(0, 6).toUpperCase()} — ${getPatientInfo(selectedRdv.patientId).fullName} avec ${getDoctorInfo(selectedRdv.medecinId).fullName} (${formatDate(getRdvDate(selectedRdv))})`"
            disabled
          />
        </div>

        <!-- Conteneur de bloc (div) -->
        <div class="form-group full-width">
          <label>Nouveau Statut Administrateur</label>
          <select v-model="newStatut">
            <option value="DEMANDE">DEMANDE</option>
            <option value="EN_ATTENTE">EN_ATTENTE</option>
            <option value="ACCEPTE">ACCEPTE</option>
            <option value="CONFIRME">CONFIRME</option>
            <option value="EN_COURS">EN_COURS (Session active)</option>
            <option value="TERMINE">TERMINE</option>
            <option value="ANNULE">ANNULE</option>
          </select>
        </div>

        <!-- Conteneur de bloc (div) -->
        <div class="form-group full-width">
          <label>Motif de la décision administrative</label>
          <!-- Champ de saisie utilisateur -->
          <input type="text" v-model="motifRaison" placeholder="Ex: Report validé conjointement ou réclamation" />
        </div>

        <!-- Conteneur de bloc (div) -->
        <div class="modal-actions full-width">
          <!-- Bouton cliquable -->
          <button type="button" class="btn btn-secondary" @click="isStatusModalOpen = false">Annuler</button>
          <!-- Bouton cliquable -->
          <button type="button" class="btn btn-primary" @click="handleUpdateStatus">Appliquer le Statut</button>
        </div>
      </div>
    </Modal>

    <!-- Consultation Details Modal -->
    <Modal
      :isOpen="isDetailsModalOpen"
      :title="`Fiche de Consultation — Réf. RDV #${detailsRdv ? detailsRdv.id.substring(0, 6).toUpperCase() : ''}`"
      maxWidth="620px"
      @close="isDetailsModalOpen = false"
    >
      <!-- Conteneur de bloc (div) -->
      <div v-if="detailsRdv" class="rdv-details-body">
        <!-- Top Status Banner -->
        <div class="details-top-banner">
          <!-- Conteneur de bloc (div) -->
          <div class="details-badge-group">
            <!-- Conteneur en ligne (span) -->
            <span :class="['badge', 'badge-' + detailsRdv.statut.toLowerCase()]">
              <!-- Conteneur en ligne (span) -->
              <span class="badge-dot"></span>
              {{ detailsRdv.statut }}
            </span>
            <!-- Conteneur en ligne (span) -->
            <span
              class="mode-badge"
              :class="{
                'teleconsult': detailsRdv.typeConsultation === 'TELECONSULTATION',
                'presentiel': detailsRdv.typeConsultation === 'PRESENTIEL' || detailsRdv.typeConsultation === 'PRESENTIELLE',
                'domicile': detailsRdv.typeConsultation === 'DOMICILE'
              }"
            >
              {{ detailsRdv.typeConsultation }}
            </span>
          </div>
          <!-- Conteneur de bloc (div) -->
          <div class="details-date">
            <CalendarCheck :size="14" class="text-vert" />
            <strong>{{ formatDate(getRdvDate(detailsRdv)) }}</strong>
          </div>
        </div>

        <!-- Two Columns: Patient & Doctor -->
        <div class="details-actors-grid">
          <!-- Patient Card -->
          <div class="actor-card">
            <!-- Conteneur de bloc (div) -->
            <div class="actor-header">
              <User :size="15" class="text-vert" />
              <!-- Conteneur en ligne (span) -->
              <span>Patient</span>
            </div>
            <!-- Conteneur de bloc (div) -->
            <div class="actor-body">
              <h5 class="actor-name">{{ getPatientInfo(detailsRdv.patientId).fullName }}</h5>
              <!-- Conteneur de bloc (div) -->
              <div class="actor-detail-item">
                <!-- Conteneur en ligne (span) -->
                <span class="detail-label">Téléphone :</span>
                <!-- Conteneur en ligne (span) -->
                <span class="detail-val">{{ getPatientInfo(detailsRdv.patientId).phone || 'Non renseigné' }}</span>
              </div>
              <!-- Conteneur de bloc (div) -->
              <div class="actor-detail-item" v-if="getPatientInfo(detailsRdv.patientId).email">
                <!-- Conteneur en ligne (span) -->
                <span class="detail-label">Email :</span>
                <!-- Conteneur en ligne (span) -->
                <span class="detail-val">{{ getPatientInfo(detailsRdv.patientId).email }}</span>
              </div>
              <!-- Conteneur de bloc (div) -->
              <div class="actor-detail-item">
                <!-- Conteneur en ligne (span) -->
                <span class="detail-label">Réf. Patient :</span>
                <code class="mini-id">#{{ detailsRdv.patientId.substring(0, 8).toUpperCase() }}</code>
              </div>
            </div>
          </div>

          <!-- Doctor Card -->
          <div class="actor-card">
            <!-- Conteneur de bloc (div) -->
            <div class="actor-header">
              <Stethoscope :size="15" class="text-primary" />
              <!-- Conteneur en ligne (span) -->
              <span>Médecin Traitant</span>
            </div>
            <!-- Conteneur de bloc (div) -->
            <div class="actor-body">
              <h5 class="actor-name">{{ getDoctorInfo(detailsRdv.medecinId).fullName }}</h5>
              <!-- Conteneur de bloc (div) -->
              <div class="actor-detail-item">
                <!-- Conteneur en ligne (span) -->
                <span class="detail-label">Spécialité :</span>
                <!-- Conteneur en ligne (span) -->
                <span class="detail-val text-vert font-bold">{{ getDoctorInfo(detailsRdv.medecinId).specialite }}</span>
              </div>
              <!-- Conteneur de bloc (div) -->
              <div class="actor-detail-item">
                <!-- Conteneur en ligne (span) -->
                <span class="detail-label">Établissement :</span>
                <!-- Conteneur en ligne (span) -->
                <span class="detail-val">{{ getDoctorInfo(detailsRdv.medecinId).etablissement }}</span>
              </div>
              <!-- Conteneur de bloc (div) -->
              <div class="actor-detail-item">
                <!-- Conteneur en ligne (span) -->
                <span class="detail-label">Réf. Praticien :</span>
                <code class="mini-id">#{{ detailsRdv.medecinId.substring(0, 8).toUpperCase() }}</code>
              </div>
            </div>
          </div>
        </div>

        <!-- Clinical Details -->
        <div class="clinical-info-card">
          <!-- Conteneur de bloc (div) -->
          <div class="card-mini-title">
            <FileText :size="14" class="text-vert" />
            <!-- Conteneur en ligne (span) -->
            <span>Motif Clinique Déclaré</span>
          </div>
          <!-- Paragraphe de texte -->
          <p class="motif-text">{{ detailsRdv.motif || 'Aucun motif renseigné' }}</p>
          <!-- Conteneur de bloc (div) -->
          <div v-if="detailsRdv.notesMedecin" class="notes-box">
            <strong>Notes Praticien :</strong> {{ detailsRdv.notesMedecin }}
          </div>
        </div>

        <!-- Financial & Transaction Info -->
        <div class="finance-info-card">
          <!-- Conteneur de bloc (div) -->
          <div class="card-mini-title">
            <CreditCard :size="14" class="text-vert" />
            <!-- Conteneur en ligne (span) -->
            <span>Règlement & Transaction Médicale</span>
          </div>
          <!-- Conteneur de bloc (div) -->
          <div class="finance-grid">
            <!-- Conteneur de bloc (div) -->
            <div class="finance-item">
              <!-- Conteneur en ligne (span) -->
              <span class="detail-label">Honoraires :</span>
              <strong>{{ detailsRdv.tarifApplique ? (detailsRdv.tarifApplique + ' FCFA') : 'Tarif standard' }}</strong>
            </div>
            <!-- Conteneur de bloc (div) -->
            <div class="finance-item">
              <!-- Conteneur en ligne (span) -->
              <span class="detail-label">Statut Paiement :</span>
              <!-- Conteneur en ligne (span) -->
              <span class="badge" :class="detailsRdv.paiementValide ? 'badge-confirme' : 'badge-demande'">
                {{ detailsRdv.paiementValide ? 'Réglé & Validé' : 'En attente' }}
              </span>
            </div>
            <!-- Conteneur de bloc (div) -->
            <div class="finance-item" v-if="detailsRdv.referencePaiement || detailsRdv.refPaiement">
              <!-- Conteneur en ligne (span) -->
              <span class="detail-label">Réf. Transaction :</span>
              <code>{{ detailsRdv.referencePaiement || detailsRdv.refPaiement }}</code>
            </div>
          </div>
        </div>

        <!-- Conteneur de bloc (div) -->
        <div class="modal-actions">
          <!-- Bouton cliquable -->
          <button type="button" class="btn btn-secondary btn-sm" @click="isDetailsModalOpen = false">Fermer</button>
          <!-- Bouton cliquable -->
          <button type="button" class="btn btn-primary btn-sm" @click="isDetailsModalOpen = false; openStatusModal(detailsRdv)">
            <Edit2 :size="13" /> Modifier le Statut
          </button>
        </div>
      </div>
    </Modal>
  </div>
</template>

<style scoped>
/* Date Cell Styling */
.date-cell {
  display: flex;
  flex-direction: column;
  gap: 3px;
}

/* Sélecteur de classe CSS */
.date-main {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 0.84rem;
  color: #090D14;
}

/* Sélecteur de classe CSS */
.date-meta {
  display: flex;
  align-items: center;
  gap: 6px;
}

/* Sélecteur de classe CSS */
.ref-badge {
  font-family: monospace;
  font-size: 0.7rem;
  color: var(--text-muted);
  background: #F1F5F9;
  padding: 1px 5px;
  border-radius: 3px;
  font-weight: 600;
}

/* Sélecteur de classe CSS */
.date-sub-badge {
  font-size: 0.68rem;
  font-weight: 700;
  padding: 1px 5px;
  border-radius: 3px;
}

/* Sélecteur de classe CSS */
.date-sub-badge.confirmed {
  background: rgba(13, 124, 102, 0.12);
  color: #0D7C66;
}

/* Sélecteur de classe CSS */
.date-sub-badge.planned {
  background: #FEF3C7;
  color: #B45309;
}

/* Motif Cell */
.motif-cell {
  display: flex;
  flex-direction: column;
  gap: 4px;
  max-width: 280px;
}

/* Sélecteur de classe CSS */
.motif-title {
  font-size: 0.82rem;
  font-weight: 600;
  color: #1E293B;
  line-height: 1.35;
}

/* Sélecteur de classe CSS */
.motif-payment-tag {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: 0.7rem;
  color: #0D7C66;
  background: #ECFDF5;
  padding: 1px 6px;
  border-radius: 4px;
  width: fit-content;
  font-weight: 600;
}

/* Person Column (Patient & Doctor) */
.person-cell {
  display: flex;
  align-items: center;
  gap: 9px;
}

/* Sélecteur de classe CSS */
.person-avatar {
  width: 32px;
  height: 32px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.72rem;
  font-weight: 800;
  flex-shrink: 0;
}

/* Sélecteur de classe CSS */
.patient-avatar {
  background: rgba(13, 124, 102, 0.12);
  color: #0D7C66;
  border: 1px solid rgba(13, 124, 102, 0.25);
}

/* Sélecteur de classe CSS */
.doctor-avatar {
  background: #EFF6FF;
  color: #2563EB;
  border: 1px solid #BFDBFE;
}

/* Sélecteur de classe CSS */
.person-info {
  display: flex;
  flex-direction: column;
  gap: 1px;
}

/* Sélecteur de classe CSS */
.person-name {
  font-size: 0.82rem;
  font-weight: 700;
  color: #090D14;
}

/* Sélecteur de classe CSS */
.doctor-name {
  color: #0F172A;
}

/* Sélecteur de classe CSS */
.person-sub {
  font-size: 0.7rem;
  color: var(--text-muted);
}

/* Sélecteur de classe CSS */
.phone-sub {
  display: inline-flex;
  align-items: center;
  gap: 3px;
  color: #475569;
}

/* Sélecteur de classe CSS */
.specialite-sub {
  font-weight: 600;
  color: #0D7C66;
}

/* Modality Badges */
.mode-badge {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 3px 8px;
  border-radius: 5px;
  font-size: 0.74rem;
  font-weight: 600;
}

/* Sélecteur de classe CSS */
.mode-badge.teleconsult {
  background: rgba(13, 124, 102, 0.12);
  color: #0D7C66;
  border: 1px solid rgba(13, 124, 102, 0.3);
}

/* Sélecteur de classe CSS */
.mode-badge.presentiel {
  background: #F1F5F9;
  color: #334155;
  border: 1px solid #E2E8F0;
}

/* Sélecteur de classe CSS */
.mode-badge.domicile {
  background: #FEF3C7;
  color: #92400E;
  border: 1px solid #FDE68A;
}

/* Action Buttons */
.action-icon-btn.view {
  color: #0D7C66;
  background: rgba(13, 124, 102, 0.08);
}

/* Sélecteur de classe CSS */
.action-icon-btn.view:hover {
  background: #0D7C66;
  color: #FFFFFF;
}

/* Details Modal Styles */
.rdv-details-body {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

/* Sélecteur de classe CSS */
.details-top-banner {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: #F8FAFC;
  padding: 10px 14px;
  border-radius: var(--radius-sm);
  border: 1px solid #E2E8F0;
}

/* Sélecteur de classe CSS */
.details-badge-group {
  display: flex;
  align-items: center;
  gap: 8px;
}

/* Sélecteur de classe CSS */
.details-date {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 0.82rem;
}

/* Sélecteur de classe CSS */
.details-actors-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}

/* Sélecteur de classe CSS */
.actor-card {
  background: #FFFFFF;
  border: 1px solid var(--border-color);
  border-radius: var(--radius-sm);
  padding: 12px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

/* Sélecteur de classe CSS */
.actor-header {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 0.75rem;
  font-weight: 700;
  color: var(--text-muted);
  text-transform: uppercase;
  letter-spacing: 0.4px;
  border-bottom: 1px solid #F1F5F9;
  padding-bottom: 6px;
}

/* Sélecteur de classe CSS */
.actor-body {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

/* Sélecteur de classe CSS */
.actor-name {
  font-size: 0.92rem;
  font-weight: 800;
  color: #090D14;
  margin: 0 0 4px 0;
}

/* Sélecteur de classe CSS */
.actor-detail-item {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 0.76rem;
}

/* Sélecteur de classe CSS */
.detail-label {
  color: var(--text-muted);
  font-size: 0.72rem;
}

/* Sélecteur de classe CSS */
.detail-val {
  font-weight: 600;
  color: #1E293B;
}

/* Sélecteur de classe CSS */
.mini-id {
  font-family: monospace;
  background: #F1F5F9;
  padding: 1px 4px;
  border-radius: 3px;
  font-size: 0.7rem;
}

/* Sélecteur de classe CSS */
.clinical-info-card,
/* Sélecteur de classe CSS */
.finance-info-card {
  background: #F8FAFC;
  border: 1px solid #E2E8F0;
  border-radius: var(--radius-sm);
  padding: 12px;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

/* Sélecteur de classe CSS */
.card-mini-title {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 0.76rem;
  font-weight: 700;
  color: #090D14;
  text-transform: uppercase;
  letter-spacing: 0.3px;
}

/* Sélecteur de classe CSS */
.motif-text {
  font-size: 0.84rem;
  color: #334155;
  margin: 0;
  line-height: 1.45;
}

/* Sélecteur de classe CSS */
.notes-box {
  background: #FFFFFF;
  border: 1px solid #CBD5E1;
  padding: 8px 10px;
  border-radius: 4px;
  font-size: 0.78rem;
  color: #475569;
}

/* Sélecteur de classe CSS */
.finance-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 8px;
  font-size: 0.78rem;
}

/* Sélecteur de classe CSS */
.finance-item {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

/* Sélecteur de classe CSS */
.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  margin-top: 8px;
}
</style>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import Modal from '../components/common/Modal.vue'
import StatCard from '../components/common/StatCard.vue'
import Pagination from '../components/common/Pagination.vue'
import { rdvService, type RendezVousItem, type RdvStats } from '../services/rdv.service'
import { patientService, type PatientProfile } from '../services/patient.service'
import { medecinService, type PlatformDoctor } from '../services/medecin.service'
import { userService, type UserItem } from '../services/user.service'
import { useToast } from '../composables/useToast'
import { useConfirm } from '../composables/useConfirm'
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

const toast = useToast()
const { confirm } = useConfirm()

const rendezVousList = ref<RendezVousItem[]>([])
const rdvStats = ref<RdvStats | null>(null)
const loading = ref(true)

// Related entities for real name resolution
const patientsMap = ref<Map<string, PatientProfile>>(new Map())
const medecinsMap = ref<Map<string, PlatformDoctor>>(new Map())
const usersMap = ref<Map<string, UserItem>>(new Map())

// Filters
const selectedStatut = ref('TOUS')
const selectedType = ref('TOUS')
const searchQuery = ref('')

// Status Change Modal
const isStatusModalOpen = ref(false)
const selectedRdv = ref<RendezVousItem | null>(null)
const newStatut = ref('CONFIRME')
const motifRaison = ref('')

// Details Modal
const isDetailsModalOpen = ref(false)
const detailsRdv = ref<RendezVousItem | null>(null)

const fetchRdv = async () => {
  loading.value = true
  try {
    const [listRes, statsRes, patientsRes, medecinsRes, usersRes] = await Promise.allSettled([
      rdvService.getAllRendezVous(),
      rdvService.getAdminStats(),
      patientService.getAllPatients(),
      medecinService.getAllPlatformMedecins(),
      userService.getAllUsers()
    ])

    if (listRes.status === 'fulfilled') rendezVousList.value = listRes.value
    if (statsRes.status === 'fulfilled') rdvStats.value = statsRes.value

    if (patientsRes.status === 'fulfilled') {
      const pMap = new Map<string, PatientProfile>()
      patientsRes.value.forEach(p => {
        pMap.set(p.id, p)
        if (p.userId) pMap.set(p.userId, p)
      })
      patientsMap.value = pMap
    }

    if (medecinsRes.status === 'fulfilled') {
      const mMap = new Map<string, PlatformDoctor>()
      medecinsRes.value.forEach(m => {
        mMap.set(m.id, m)
        if (m.userId) mMap.set(m.userId, m)
      })
      medecinsMap.value = mMap
    }

    if (usersRes.status === 'fulfilled') {
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
  const patient = patientsMap.value.get(patientId)
  const userId = patient?.userId || patientId
  const user = usersMap.value.get(userId)

  if (user && (user.firstName || user.lastName)) {
    const fn = `${user.firstName || ''} ${user.lastName || ''}`.trim()
    const inits = `${(user.firstName?.[0] || '')}${(user.lastName?.[0] || '')}`.toUpperCase() || 'PT'
    return {
      fullName: fn,
      phone: user.telephone || patient?.contactUrgenceTelephone || '',
      initials: inits,
      idSnippet: patientId.substring(0, 6).toUpperCase(),
      email: user.email || '',
      city: patient?.ville || patient?.region || 'Sénégal'
    }
  }

  return {
    fullName: `Patient #${patientId.substring(0, 6).toUpperCase()}`,
    phone: patient?.contactUrgenceTelephone || '',
    initials: 'PT',
    idSnippet: patientId.substring(0, 6).toUpperCase(),
    email: '',
    city: 'Sénégal'
  }
}

const getDoctorInfo = (medecinId: string) => {
  const doc = medecinsMap.value.get(medecinId)
  const user = usersMap.value.get(doc?.userId || medecinId)

  let name = ''
  if (doc?.nomComplet) {
    name = doc.nomComplet.startsWith('Dr') ? doc.nomComplet : `Dr. ${doc.nomComplet}`
  } else if (user && (user.firstName || user.lastName)) {
    name = `Dr. ${user.firstName || ''} ${user.lastName || ''}`.trim()
  } else {
    name = `Dr. Praticien #${medecinId.substring(0, 6).toUpperCase()}`
  }

  return {
    fullName: name,
    specialite: doc?.specialite || 'Médecin Praticien',
    etablissement: doc?.etablissement || 'Plateforme Diam-Yaraam',
    idSnippet: medecinId.substring(0, 6).toUpperCase()
  }
}

const formatDate = (dateStr?: string, fallbackStr?: string) => {
  const str = dateStr || fallbackStr
  if (!str) return 'Date à planifier'
  try {
    const d = new Date(str)
    if (isNaN(d.getTime())) return str
    return d.toLocaleString('fr-FR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  } catch {
    return str
  }
}

const getRdvDate = (rdv: RendezVousItem) => {
  return rdv.dateHeureConfirmee || rdv.dateHeureSouhaitee || rdv.dateHeure || rdv.createdAt
}

const openStatusModal = (rdv: RendezVousItem) => {
  selectedRdv.value = rdv
  newStatut.value = rdv.statut
  motifRaison.value = ''
  isStatusModalOpen.value = true
}

const openDetailsModal = (rdv: RendezVousItem) => {
  detailsRdv.value = rdv
  isDetailsModalOpen.value = true
}

const handleUpdateStatus = async () => {
  if (!selectedRdv.value) return
  try {
    await rdvService.changerStatut(selectedRdv.value.id, newStatut.value, motifRaison.value)
    toast.success(`Statut du RDV mis à jour : ${newStatut.value}`)
    isStatusModalOpen.value = false
    fetchRdv()
  } catch {
    toast.error('Erreur lors du changement de statut')
  }
}

const handleDeleteRdv = async (id: string) => {
  const ok = await confirm({
    title: 'Supprimer la consultation',
    message: 'Confirmez-vous la suppression de cette consultation du planning médical ? Les créneaux associés seront libérés.',
    confirmText: 'Supprimer du planning',
    cancelText: 'Annuler',
    variant: 'danger'
  })
  if (ok) {
    try {
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
const pageSize = ref(8)

const filteredRdvList = computed(() => {
  return rendezVousList.value.filter(r => {
    const matchStatus = selectedStatut.value === 'TOUS' || r.statut === selectedStatut.value
    const matchType = selectedType.value === 'TOUS' || r.typeConsultation === selectedType.value
    if (!searchQuery.value.trim()) return matchStatus && matchType

    const q = searchQuery.value.toLowerCase()
    const pInfo = getPatientInfo(r.patientId)
    const dInfo = getDoctorInfo(r.medecinId)

    const matchQuery =
      (r.motif || '').toLowerCase().includes(q) ||
      (r.id || '').toLowerCase().includes(q) ||
      pInfo.fullName.toLowerCase().includes(q) ||
      pInfo.phone.toLowerCase().includes(q) ||
      dInfo.fullName.toLowerCase().includes(q) ||
      dInfo.specialite.toLowerCase().includes(q)

    return matchStatus && matchType && matchQuery
  })
})

const paginatedRdv = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value
  return filteredRdvList.value.slice(start, start + pageSize.value)
})

const handleSearch = () => {
  currentPage.value = 1
}

const handleFilterChange = () => {
  currentPage.value = 1
}
</script>

<template>
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

    <div class="card-panel">
      <div class="panel-header">
        <div class="toolbar">
          <div class="search-input-wrapper">
            <span class="search-icon-inside"><Search :size="15" :stroke-width="1.8" /></span>
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

      <div class="table-responsive">
        <div v-if="loading" class="loading-state">
          <div class="spinner"></div>
          <p>Chargement des consultations et synchronisation des praticiens...</p>
        </div>

        <div v-else-if="filteredRdvList.length === 0" class="empty-state">
          <Calendar :size="32" class="empty-icon" />
          <p>Aucune consultation trouvée.</p>
        </div>

        <table v-else class="data-table">
          <thead>
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
            <tr v-for="rdv in paginatedRdv" :key="rdv.id">
              <!-- DATE & HEURE -->
              <td>
                <div class="date-cell">
                  <div class="date-main">
                    <CalendarCheck :size="13" class="text-vert" />
                    <strong>{{ formatDate(getRdvDate(rdv)) }}</strong>
                  </div>
                  <div class="date-meta">
                    <span class="ref-badge">RDV #{{ rdv.id.substring(0, 6).toUpperCase() }}</span>
                    <span v-if="rdv.dateHeureConfirmee" class="date-sub-badge confirmed">Confirmé</span>
                    <span v-else class="date-sub-badge planned">Souhaité</span>
                  </div>
                </div>
              </td>

              <!-- MOTIF CLINIQUE -->
              <td>
                <div class="motif-cell">
                  <div class="motif-title">{{ rdv.motif || 'Consultation médicale' }}</div>
                  <div v-if="rdv.referencePaiement || rdv.refPaiement" class="motif-payment-tag">
                    <CreditCard :size="11" />
                    <span>Payé : {{ rdv.referencePaiement || rdv.refPaiement }}</span>
                  </div>
                </div>
              </td>

              <!-- MODALITÉ -->
              <td>
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
                <div class="person-cell patient-col">
                  <div class="person-avatar patient-avatar">
                    {{ getPatientInfo(rdv.patientId).initials }}
                  </div>
                  <div class="person-info">
                    <span class="person-name">{{ getPatientInfo(rdv.patientId).fullName }}</span>
                    <span v-if="getPatientInfo(rdv.patientId).phone" class="person-sub phone-sub">
                      <Phone :size="10" /> {{ getPatientInfo(rdv.patientId).phone }}
                    </span>
                  </div>
                </div>
              </td>

              <!-- PRATICIEN COLUMN -->
              <td>
                <div class="person-cell doctor-col">
                  <div class="person-avatar doctor-avatar">
                    <Stethoscope :size="13" />
                  </div>
                  <div class="person-info">
                    <span class="person-name doctor-name">{{ getDoctorInfo(rdv.medecinId).fullName }}</span>
                    <span class="person-sub specialite-sub">
                      {{ getDoctorInfo(rdv.medecinId).specialite }}
                    </span>
                  </div>
                </div>
              </td>

              <!-- STATUT -->
              <td>
                <span :class="['badge', 'badge-' + rdv.statut.toLowerCase()]">
                  <span class="badge-dot"></span>
                  {{ rdv.statut }}
                </span>
              </td>

              <!-- ACTIONS -->
              <td>
                <div class="table-actions">
                  <button
                    class="action-icon-btn view"
                    @click="openDetailsModal(rdv)"
                    title="Voir les détails complets de la consultation"
                  >
                    <Eye :size="13" :stroke-width="1.8" />
                  </button>
                  <button
                    class="action-icon-btn edit"
                    @click="openStatusModal(rdv)"
                    title="Changer le statut"
                  >
                    <Edit2 :size="13" :stroke-width="1.8" />
                  </button>
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
      <div v-if="selectedRdv" class="form-grid">
        <div class="form-group full-width">
          <label>Consultation sélectionnée</label>
          <input
            type="text"
            :value="`RDV #${selectedRdv.id.substring(0, 6).toUpperCase()} — ${getPatientInfo(selectedRdv.patientId).fullName} avec ${getDoctorInfo(selectedRdv.medecinId).fullName} (${formatDate(getRdvDate(selectedRdv))})`"
            disabled
          />
        </div>

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

        <div class="form-group full-width">
          <label>Motif de la décision administrative</label>
          <input type="text" v-model="motifRaison" placeholder="Ex: Report validé conjointement ou réclamation" />
        </div>

        <div class="modal-actions full-width">
          <button type="button" class="btn btn-secondary" @click="isStatusModalOpen = false">Annuler</button>
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
      <div v-if="detailsRdv" class="rdv-details-body">
        <!-- Top Status Banner -->
        <div class="details-top-banner">
          <div class="details-badge-group">
            <span :class="['badge', 'badge-' + detailsRdv.statut.toLowerCase()]">
              <span class="badge-dot"></span>
              {{ detailsRdv.statut }}
            </span>
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
          <div class="details-date">
            <CalendarCheck :size="14" class="text-vert" />
            <strong>{{ formatDate(getRdvDate(detailsRdv)) }}</strong>
          </div>
        </div>

        <!-- Two Columns: Patient & Doctor -->
        <div class="details-actors-grid">
          <!-- Patient Card -->
          <div class="actor-card">
            <div class="actor-header">
              <User :size="15" class="text-vert" />
              <span>Patient</span>
            </div>
            <div class="actor-body">
              <h5 class="actor-name">{{ getPatientInfo(detailsRdv.patientId).fullName }}</h5>
              <div class="actor-detail-item">
                <span class="detail-label">Téléphone :</span>
                <span class="detail-val">{{ getPatientInfo(detailsRdv.patientId).phone || 'Non renseigné' }}</span>
              </div>
              <div class="actor-detail-item" v-if="getPatientInfo(detailsRdv.patientId).email">
                <span class="detail-label">Email :</span>
                <span class="detail-val">{{ getPatientInfo(detailsRdv.patientId).email }}</span>
              </div>
              <div class="actor-detail-item">
                <span class="detail-label">Réf. Patient :</span>
                <code class="mini-id">#{{ detailsRdv.patientId.substring(0, 8).toUpperCase() }}</code>
              </div>
            </div>
          </div>

          <!-- Doctor Card -->
          <div class="actor-card">
            <div class="actor-header">
              <Stethoscope :size="15" class="text-primary" />
              <span>Médecin Traitant</span>
            </div>
            <div class="actor-body">
              <h5 class="actor-name">{{ getDoctorInfo(detailsRdv.medecinId).fullName }}</h5>
              <div class="actor-detail-item">
                <span class="detail-label">Spécialité :</span>
                <span class="detail-val text-vert font-bold">{{ getDoctorInfo(detailsRdv.medecinId).specialite }}</span>
              </div>
              <div class="actor-detail-item">
                <span class="detail-label">Établissement :</span>
                <span class="detail-val">{{ getDoctorInfo(detailsRdv.medecinId).etablissement }}</span>
              </div>
              <div class="actor-detail-item">
                <span class="detail-label">Réf. Praticien :</span>
                <code class="mini-id">#{{ detailsRdv.medecinId.substring(0, 8).toUpperCase() }}</code>
              </div>
            </div>
          </div>
        </div>

        <!-- Clinical Details -->
        <div class="clinical-info-card">
          <div class="card-mini-title">
            <FileText :size="14" class="text-vert" />
            <span>Motif Clinique Déclaré</span>
          </div>
          <p class="motif-text">{{ detailsRdv.motif || 'Aucun motif renseigné' }}</p>
          <div v-if="detailsRdv.notesMedecin" class="notes-box">
            <strong>Notes Praticien :</strong> {{ detailsRdv.notesMedecin }}
          </div>
        </div>

        <!-- Financial & Transaction Info -->
        <div class="finance-info-card">
          <div class="card-mini-title">
            <CreditCard :size="14" class="text-vert" />
            <span>Règlement & Transaction Médicale</span>
          </div>
          <div class="finance-grid">
            <div class="finance-item">
              <span class="detail-label">Honoraires :</span>
              <strong>{{ detailsRdv.tarifApplique ? (detailsRdv.tarifApplique + ' FCFA') : 'Tarif standard' }}</strong>
            </div>
            <div class="finance-item">
              <span class="detail-label">Statut Paiement :</span>
              <span class="badge" :class="detailsRdv.paiementValide ? 'badge-confirme' : 'badge-demande'">
                {{ detailsRdv.paiementValide ? 'Réglé & Validé' : 'En attente' }}
              </span>
            </div>
            <div class="finance-item" v-if="detailsRdv.referencePaiement || detailsRdv.refPaiement">
              <span class="detail-label">Réf. Transaction :</span>
              <code>{{ detailsRdv.referencePaiement || detailsRdv.refPaiement }}</code>
            </div>
          </div>
        </div>

        <div class="modal-actions">
          <button type="button" class="btn btn-secondary btn-sm" @click="isDetailsModalOpen = false">Fermer</button>
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

.date-main {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 0.84rem;
  color: #090D14;
}

.date-meta {
  display: flex;
  align-items: center;
  gap: 6px;
}

.ref-badge {
  font-family: monospace;
  font-size: 0.7rem;
  color: var(--text-muted);
  background: #F1F5F9;
  padding: 1px 5px;
  border-radius: 3px;
  font-weight: 600;
}

.date-sub-badge {
  font-size: 0.68rem;
  font-weight: 700;
  padding: 1px 5px;
  border-radius: 3px;
}

.date-sub-badge.confirmed {
  background: rgba(13, 124, 102, 0.12);
  color: #0D7C66;
}

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

.motif-title {
  font-size: 0.82rem;
  font-weight: 600;
  color: #1E293B;
  line-height: 1.35;
}

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

.patient-avatar {
  background: rgba(13, 124, 102, 0.12);
  color: #0D7C66;
  border: 1px solid rgba(13, 124, 102, 0.25);
}

.doctor-avatar {
  background: #EFF6FF;
  color: #2563EB;
  border: 1px solid #BFDBFE;
}

.person-info {
  display: flex;
  flex-direction: column;
  gap: 1px;
}

.person-name {
  font-size: 0.82rem;
  font-weight: 700;
  color: #090D14;
}

.doctor-name {
  color: #0F172A;
}

.person-sub {
  font-size: 0.7rem;
  color: var(--text-muted);
}

.phone-sub {
  display: inline-flex;
  align-items: center;
  gap: 3px;
  color: #475569;
}

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

.mode-badge.teleconsult {
  background: rgba(13, 124, 102, 0.12);
  color: #0D7C66;
  border: 1px solid rgba(13, 124, 102, 0.3);
}

.mode-badge.presentiel {
  background: #F1F5F9;
  color: #334155;
  border: 1px solid #E2E8F0;
}

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

.details-top-banner {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: #F8FAFC;
  padding: 10px 14px;
  border-radius: var(--radius-sm);
  border: 1px solid #E2E8F0;
}

.details-badge-group {
  display: flex;
  align-items: center;
  gap: 8px;
}

.details-date {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 0.82rem;
}

.details-actors-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}

.actor-card {
  background: #FFFFFF;
  border: 1px solid var(--border-color);
  border-radius: var(--radius-sm);
  padding: 12px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

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

.actor-body {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.actor-name {
  font-size: 0.92rem;
  font-weight: 800;
  color: #090D14;
  margin: 0 0 4px 0;
}

.actor-detail-item {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 0.76rem;
}

.detail-label {
  color: var(--text-muted);
  font-size: 0.72rem;
}

.detail-val {
  font-weight: 600;
  color: #1E293B;
}

.mini-id {
  font-family: monospace;
  background: #F1F5F9;
  padding: 1px 4px;
  border-radius: 3px;
  font-size: 0.7rem;
}

.clinical-info-card,
.finance-info-card {
  background: #F8FAFC;
  border: 1px solid #E2E8F0;
  border-radius: var(--radius-sm);
  padding: 12px;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

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

.motif-text {
  font-size: 0.84rem;
  color: #334155;
  margin: 0;
  line-height: 1.45;
}

.notes-box {
  background: #FFFFFF;
  border: 1px solid #CBD5E1;
  padding: 8px 10px;
  border-radius: 4px;
  font-size: 0.78rem;
  color: #475569;
}

.finance-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 8px;
  font-size: 0.78rem;
}

.finance-item {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  margin-top: 8px;
}
</style>

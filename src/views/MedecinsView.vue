<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import Modal from '../components/common/Modal.vue'
import Pagination from '../components/common/Pagination.vue'
import {
  medecinService,
  type OnmsDoctor,
  type PlatformDoctor
} from '../services/medecin.service'
import { useToast } from '../composables/useToast'
import { useConfirm } from '../composables/useConfirm'
import {
  Search,
  Plus,
  Edit2,
  PauseCircle,
  PlayCircle,
  Trash2,
  FileCheck,
  Stethoscope,
  CheckCircle2,
  AlertCircle,
  Video
} from 'lucide-vue-next'

const toast = useToast()
const { confirm } = useConfirm()

const activeTab = ref<'onms' | 'platform'>('onms')
const loading = ref(true)

// ONMS
const onmsList = ref<OnmsDoctor[]>([])
const searchOnms = ref('')
const isOnmsModalOpen = ref(false)
const onmsModalMode = ref<'add' | 'edit'>('add')
const currentOnms = ref<Partial<OnmsDoctor>>({
  numeroOrdre: '',
  section: 'B',
  nom: '',
  prenom: '',
  specialite: '',
  etablissement: '',
  region: 'Dakar',
  telephone: '',
  statutProfessionnel: 'ACTIF'
})

// ONMS Pagination
const onmsCurrentPage = ref(1)
const onmsPageSize = ref(8)

const filteredOnmsList = computed(() => {
  if (!searchOnms.value.trim()) return onmsList.value
  const q = searchOnms.value.toLowerCase()
  return onmsList.value.filter(d =>
    d.numeroOrdre?.toLowerCase().includes(q) ||
    d.nom?.toLowerCase().includes(q) ||
    d.prenom?.toLowerCase().includes(q) ||
    d.specialite?.toLowerCase().includes(q) ||
    d.etablissement?.toLowerCase().includes(q)
  )
})

const paginatedOnms = computed(() => {
  const start = (onmsCurrentPage.value - 1) * onmsPageSize.value
  return filteredOnmsList.value.slice(start, start + onmsPageSize.value)
})

const handleSearchOnms = () => {
  onmsCurrentPage.value = 1
}

// Platform Doctors
const platformDoctors = ref<PlatformDoctor[]>([])
const searchPlatform = ref('')

// Platform Doctors Pagination
const platformCurrentPage = ref(1)
const platformPageSize = ref(8)

const filteredPlatformList = computed(() => {
  if (!searchPlatform.value.trim()) return platformDoctors.value
  const q = searchPlatform.value.toLowerCase()
  return platformDoctors.value.filter(d =>
    d.nomComplet?.toLowerCase().includes(q) ||
    d.specialite?.toLowerCase().includes(q) ||
    d.etablissement?.toLowerCase().includes(q)
  )
})

const paginatedPlatform = computed(() => {
  const start = (platformCurrentPage.value - 1) * platformPageSize.value
  return filteredPlatformList.value.slice(start, start + platformPageSize.value)
})

const handleSearchPlatform = () => {
  platformCurrentPage.value = 1
}

const fetchData = async () => {
  loading.value = true
  try {
    const [onmsRes, platformRes] = await Promise.allSettled([
      medecinService.getAllOnms(),
      medecinService.getAllPlatformMedecins()
    ])
    if (onmsRes.status === 'fulfilled') onmsList.value = onmsRes.value
    if (platformRes.status === 'fulfilled') platformDoctors.value = platformRes.value
  } catch {
    toast.error('Erreur lors du chargement des praticiens')
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  fetchData()
})

// ONMS Handlers
const openAddOnmsModal = () => {
  onmsModalMode.value = 'add'
  currentOnms.value = {
    numeroOrdre: '',
    section: 'B',
    nom: '',
    prenom: '',
    specialite: '',
    etablissement: '',
    region: 'Dakar',
    telephone: '',
    statutProfessionnel: 'ACTIF'
  }
  isOnmsModalOpen.value = true
}

const openEditOnmsModal = (doc: OnmsDoctor) => {
  onmsModalMode.value = 'edit'
  currentOnms.value = { ...doc }
  isOnmsModalOpen.value = true
}

const saveOnmsDoctor = async () => {
  try {
    if (onmsModalMode.value === 'add') {
      await medecinService.addOnms(currentOnms.value)
      toast.success("Praticien inscrit avec succès au répertoire ONMS.")
    } else {
      await medecinService.updateOnms(currentOnms.value.numeroOrdre!, currentOnms.value)
      toast.success('Dossier ordinal mis à jour.')
    }
    isOnmsModalOpen.value = false
    fetchData()
  } catch (err: any) {
    toast.error(err.response?.data?.message || "Erreur lors de l'enregistrement ONMS")
  }
}

const toggleOnmsStatus = async (doc: OnmsDoctor) => {
  const newStatut = doc.statutProfessionnel === 'ACTIF' ? 'SUSPENDU' : 'ACTIF'
  if (newStatut === 'SUSPENDU') {
    const ok = await confirm({
      title: 'Suspension d\'un Praticien ONMS',
      message: `Souhaitez-vous suspendre temporairement le droit d'exercice de Dr. ${doc.prenom} ${doc.nom} (N° ${doc.numeroOrdre}) ?`,
      confirmText: 'Suspendre le praticien',
      cancelText: 'Annuler',
      variant: 'warning'
    })
    if (!ok) return
  }

  try {
    await medecinService.updateOnms(doc.numeroOrdre, { ...doc, statutProfessionnel: newStatut })
    toast.success(`Statut de Dr. ${doc.nom} passé à ${newStatut}`)
    fetchData()
  } catch {
    toast.error('Erreur lors du changement de statut')
  }
}

const deleteOnmsDoctor = async (numeroOrdre: string) => {
  const ok = await confirm({
    title: 'Radiation de l’Ordre National des Médecins',
    message: `Confirmez-vous la radiation définitive du praticien N° ${numeroOrdre} du tableau officiel de l'ONMS ? Cette action est irréversible.`,
    confirmText: 'Confirmer la radiation',
    cancelText: 'Annuler',
    variant: 'danger'
  })
  if (ok) {
    try {
      await medecinService.deleteOnms(numeroOrdre)
      toast.success('Radiation enregistrée dans le registre.')
      fetchData()
    } catch {
      toast.error('Erreur lors de la radiation')
    }
  }
}

// Platform Doctors Handlers
const toggleVerifyPlatformDoctor = async (doc: PlatformDoctor) => {
  const newVerified = !doc.verified
  const newStatut = newVerified ? 'ACTIF' : 'SUSPENDU'

  if (!newVerified) {
    const ok = await confirm({
      title: 'Suspension du Praticien sur la Plateforme',
      message: `Voulez-vous révoquer l'homologation et suspendre le profil du praticien ${doc.nomComplet} ? Ses téléconsultations seront désactivées.`,
      confirmText: 'Suspendre le profil',
      cancelText: 'Annuler',
      variant: 'warning'
    })
    if (!ok) return
  }

  try {
    await medecinService.updateMedecinStatus(doc.id, newStatut, newVerified)
    toast.success(`Praticien ${doc.nomComplet} ${newVerified ? 'homologué et activé' : 'suspendu'}.`)
    fetchData()
  } catch {
    toast.error('Erreur lors de la mise à jour')
  }
}
</script>

<template>
  <div class="medecins-view">
    <div class="card-panel">
      <!-- Tabs Header -->
      <div class="tabs-nav">
        <button
          class="tab-btn"
          :class="{ active: activeTab === 'onms' }"
          @click="activeTab = 'onms'"
        >
          <FileCheck :size="15" :stroke-width="1.8" />
          <span>Registre Ordinal ONMS ({{ onmsList.length }})</span>
        </button>
        <button
          class="tab-btn"
          :class="{ active: activeTab === 'platform' }"
          @click="activeTab = 'platform'"
        >
          <Stethoscope :size="15" :stroke-width="1.8" />
          <span>Praticiens sur la Plateforme ({{ platformDoctors.length }})</span>
        </button>
      </div>

      <!-- TAB 1 : REGISTRE ONMS -->
      <div v-if="activeTab === 'onms'">
        <div class="panel-header">
          <div class="toolbar">
            <div class="search-input-wrapper">
              <span class="search-icon-inside"><Search :size="15" :stroke-width="1.8" /></span>
              <input
                type="text"
                v-model="searchOnms"
                @input="handleSearchOnms"
                placeholder="Rechercher par N° d'ordre, nom, spécialité..."
              />
            </div>
          </div>
          <button class="btn btn-primary" @click="openAddOnmsModal">
            <Plus :size="15" :stroke-width="1.8" />
            <span>Inscrire un Médecin ONMS</span>
          </button>
        </div>

        <div class="table-responsive">
          <div v-if="loading" class="loading-state">
            <div class="spinner"></div>
            <p>Chargement du registre officiel ONMS...</p>
          </div>

          <div v-else-if="filteredOnmsList.length === 0" class="empty-state">
            <FileCheck :size="32" class="empty-icon" />
            <p>Aucun praticien ne correspond à votre recherche dans le registre ONMS.</p>
          </div>

          <table v-else class="data-table">
            <thead>
              <tr>
                <th>N° Ordinal</th>
                <th>Médecin</th>
                <th>Spécialité</th>
                <th>Établissement & Région</th>
                <th>Statut Ordinal</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="doc in paginatedOnms" :key="doc.numeroOrdre">
                <td><strong class="text-primary">#{{ doc.numeroOrdre }}</strong></td>
                <td>
                  <div class="doc-cell">
                    <div class="doc-name">Dr. {{ doc.prenom }} {{ doc.nom }}</div>
                    <div class="text-muted text-sm">{{ doc.telephone }}</div>
                  </div>
                </td>
                <td><span class="specialite-tag">{{ doc.specialite }}</span></td>
                <td>
                  <div>{{ doc.etablissement }}</div>
                  <div class="text-muted text-sm">{{ doc.region }}</div>
                </td>
                <td>
                  <span :class="['badge', doc.statutProfessionnel === 'ACTIF' ? 'badge-actif' : 'badge-suspendu']">
                    <span class="badge-dot"></span>
                    {{ doc.statutProfessionnel }}
                  </span>
                </td>
                <td>
                  <div class="table-actions">
                    <button class="action-icon-btn edit" @click="openEditOnmsModal(doc)" title="Modifier la fiche">
                      <Edit2 :size="13" :stroke-width="1.8" />
                    </button>
                    <button
                      class="action-icon-btn unlock"
                      @click="toggleOnmsStatus(doc)"
                      :title="doc.statutProfessionnel === 'ACTIF' ? 'Suspendre l\'exercice' : 'Activer l\'exercice'"
                    >
                      <PauseCircle v-if="doc.statutProfessionnel === 'ACTIF'" :size="13" :stroke-width="1.8" />
                      <PlayCircle v-else :size="13" :stroke-width="1.8" />
                    </button>
                    <button
                      class="action-icon-btn delete"
                      @click="deleteOnmsDoctor(doc.numeroOrdre)"
                      title="Radier du tableau de l'Ordre"
                    >
                      <Trash2 :size="13" :stroke-width="1.8" />
                    </button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Pagination ONMS -->
        <Pagination
          v-if="filteredOnmsList.length > 0"
          v-model:currentPage="onmsCurrentPage"
          :totalItems="filteredOnmsList.length"
          v-model:pageSize="onmsPageSize"
        />
      </div>

      <!-- TAB 2 : MÉDECINS DE LA PLATEFORME -->
      <div v-if="activeTab === 'platform'">
        <div class="panel-header">
          <div class="toolbar">
            <div class="search-input-wrapper">
              <span class="search-icon-inside"><Search :size="15" :stroke-width="1.8" /></span>
              <input
                type="text"
                v-model="searchPlatform"
                @input="handleSearchPlatform"
                placeholder="Filtrer les médecins inscrits..."
              />
            </div>
          </div>
        </div>

        <div class="table-responsive">
          <div v-if="loading" class="loading-state">
            <div class="spinner"></div>
            <p>Chargement des praticiens...</p>
          </div>

          <div v-else-if="filteredPlatformList.length === 0" class="empty-state">
            <Stethoscope :size="32" class="empty-icon" />
            <p>Aucun médecin inscrit sur la plateforme ne correspond aux critères.</p>
          </div>

          <table v-else class="data-table">
            <thead>
              <tr>
                <th>Praticien</th>
                <th>Spécialité & Structure</th>
                <th>Honoraires / Téléconsultation</th>
                <th>Statut Homologation</th>
                <th>État du Compte</th>
                <th>Action Ordinale</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="doc in paginatedPlatform" :key="doc.id">
                <td>
                  <div class="doc-cell">
                    <div class="doc-name">{{ doc.nomComplet || 'Médecin Praticien' }}</div>
                    <div class="text-muted text-sm">Compte: {{ doc.userId.substring(0, 8) }}...</div>
                  </div>
                </td>
                <td>
                  <div><strong>{{ doc.specialite || 'Médecine Générale' }}</strong></div>
                  <div class="text-muted text-sm">{{ doc.etablissement || 'Cabinet Médical' }} ({{ doc.region || 'Sénégal' }})</div>
                </td>
                <td>
                  <div>{{ doc.tarifConsultation ? doc.tarifConsultation + ' FCFA' : 'Tarif standard' }}</div>
                  <span class="teleconsult-tag" v-if="doc.teleconsultationActive">
                    <Video :size="11" :stroke-width="1.8" />
                    <span>Téléconsultation active</span>
                  </span>
                  <span class="text-muted text-xs" v-else>Présentiel uniquement</span>
                </td>
                <td>
                  <span v-if="doc.verified" class="badge badge-actif">
                    <CheckCircle2 :size="11" :stroke-width="2" />
                    HOMOLOGUÉ ONMS
                  </span>
                  <span v-else class="badge badge-bloque">
                    <AlertCircle :size="11" :stroke-width="2" />
                    EN ATTENTE ONMS
                  </span>
                </td>
                <td>
                  <span :class="['badge', doc.statutMedecin === 'ACTIF' ? 'badge-actif' : 'badge-suspendu']">
                    <span class="badge-dot"></span>
                    {{ doc.statutMedecin }}
                  </span>
                </td>
                <td>
                  <button
                    :class="['btn', 'btn-sm', doc.verified ? 'btn-secondary' : 'btn-primary']"
                    @click="toggleVerifyPlatformDoctor(doc)"
                  >
                    {{ doc.verified ? 'Suspendre Profil' : 'Homologuer & Activer' }}
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Pagination Platform Doctors -->
        <Pagination
          v-if="filteredPlatformList.length > 0"
          v-model:currentPage="platformCurrentPage"
          :totalItems="filteredPlatformList.length"
          v-model:pageSize="platformPageSize"
        />
      </div>
    </div>

    <!-- ONMS Doctor Modal -->
    <Modal
      :isOpen="isOnmsModalOpen"
      :title="onmsModalMode === 'add' ? 'Inscrire un Praticien au Tableau de l\'ONMS' : 'Modifier la Fiche Ordinale'"
      @close="isOnmsModalOpen = false"
    >
      <form @submit.prevent="saveOnmsDoctor" class="form-grid">
        <div class="form-group" v-if="onmsModalMode === 'add'">
          <label>N° d'Ordre National *</label>
          <input type="text" v-model="currentOnms.numeroOrdre" required placeholder="Ex: 14502" />
        </div>
        <div class="form-group" v-else>
          <label>N° d'Ordre National</label>
          <input type="text" :value="currentOnms.numeroOrdre" disabled />
        </div>

        <div class="form-group">
          <label>Section ONMS</label>
          <select v-model="currentOnms.section">
            <option value="A">Section A (Secteur Public)</option>
            <option value="B">Section B (Secteur Privé)</option>
            <option value="C">Section C (Services de Santé des Armées)</option>
          </select>
        </div>

        <div class="form-group">
          <label>Prénom *</label>
          <input type="text" v-model="currentOnms.prenom" required placeholder="Dr. Prénom" />
        </div>

        <div class="form-group">
          <label>Nom de famille *</label>
          <input type="text" v-model="currentOnms.nom" required placeholder="Nom de famille" />
        </div>

        <div class="form-group">
          <label>Discipline / Spécialité *</label>
          <input type="text" v-model="currentOnms.specialite" required placeholder="Ex: Cardiologie" />
        </div>

        <div class="form-group">
          <label>Établissement d'exercice principal *</label>
          <input type="text" v-model="currentOnms.etablissement" required placeholder="Ex: Hôpital Principal de Dakar" />
        </div>

        <div class="form-group">
          <label>Région administrative *</label>
          <select v-model="currentOnms.region">
            <option value="Dakar">Dakar</option>
            <option value="Thiès">Thiès</option>
            <option value="Saint-Louis">Saint-Louis</option>
            <option value="Diourbel">Diourbel</option>
            <option value="Kaolack">Kaolack</option>
            <option value="Ziguinchor">Ziguinchor</option>
            <option value="Tambacounda">Tambacounda</option>
          </select>
        </div>

        <div class="form-group">
          <label>Ligne téléphonique professionnelle *</label>
          <input type="text" v-model="currentOnms.telephone" required placeholder="+22177XXXXXXX" />
        </div>

        <div class="form-group">
          <label>Statut Ordinal</label>
          <select v-model="currentOnms.statutProfessionnel">
            <option value="ACTIF">ACTIF (Autorisé à exercer)</option>
            <option value="SUSPENDU">SUSPENDU</option>
            <option value="RADIE">RADIE</option>
          </select>
        </div>

        <div class="modal-actions full-width">
          <button type="button" class="btn btn-secondary" @click="isOnmsModalOpen = false">Annuler</button>
          <button type="submit" class="btn btn-primary">Enregistrer la Fiche</button>
        </div>
      </form>
    </Modal>
  </div>
</template>

<style scoped>
.specialite-tag {
  background: #F1F5F9;
  color: #334155;
  padding: 3px 8px;
  border-radius: 4px;
  font-size: 0.78rem;
  font-weight: 600;
  border: 1px solid var(--border-color);
}

.doc-name {
  font-weight: 600;
  color: var(--text-dark);
}

.text-primary {
  color: var(--primary);
}

.text-sm {
  font-size: 0.78rem;
}

.text-xs {
  font-size: 0.72rem;
}

.teleconsult-tag {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: 0.72rem;
  color: var(--primary);
  background: var(--primary-light);
  padding: 2px 6px;
  border-radius: 4px;
  font-weight: 600;
  margin-top: 3px;
  border: 1px solid var(--primary-border);
}

.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  margin-top: 8px;
}
</style>

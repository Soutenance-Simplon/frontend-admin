<script setup lang="ts">
/**
 * ============================================================================
 * GESTION & HOMOLOGATION DES MÉDECINS (CONFORMITÉ ORDRE DES MÉDECINS - ONMS)
 * ============================================================================
 * RÔLE ARCHITECTURAL (POINT CRUCIAL DE DÉONTOLOGIE EN SOUTENANCE) :
 * Ce module gère la conformité légale et le droit d'exercice des médecins sur la
 * plateforme Diam-Yaraam, en stricte conformité avec le Code de Déontologie Médicale
 * et la législation sanitaire de la République du Sénégal.
 *
 * DOUBLE NIVEAU DE CONTRÔLE :
 * 1. Registre Ordinal ONMS (Tableau Officiel) :
 *    - Base de référence officielle des médecins autorisés à exercer au Sénégal
 *      (Section A, B, etc., avec N° d'ordre, spécialité, région et téléphone).
 *    - Permet l'import initial et la gestion administrative des radiations / suspensions.
 * 2. Praticiens sur la Plateforme (Comptes Utilisateurs) :
 *    - Médecins ayant créé un compte applicatif.
 *    - L'homologation (`verified: true`) vérifie la correspondance exacte avec le
 *      numéro d'ordre officiel avant d'autoriser les téléconsultations et ordonnances.
 * ============================================================================
 */
// Importation du module ou composant
import { ref, computed, onMounted } from 'vue'
// Importation du module ou composant
import Modal from '../components/common/Modal.vue'
// Importation du module ou composant
import Pagination from '../components/common/Pagination.vue'
// Importation du module ou composant
import {
  medecinService,
  type OnmsDoctor,
  type PlatformDoctor
} from '../services/medecin.service'
// Importation du module ou composant
import { useToast } from '../composables/useToast'
// Importation du module ou composant
import { useConfirm } from '../composables/useConfirm'
// Importation du module ou composant
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

// Déclaration de variable
const toast = useToast()
// Déclaration de variable
const { confirm } = useConfirm()

// --- Onglet actif : 'onms' (Registre officiel) ou 'platform' (Comptes Diam-Yaraam) ---
const activeTab = ref<'onms' | 'platform'>('onms')
// Déclaration de variable
const loading = ref(true)

// --- État du Registre Ordinal Officiel ONMS ---
const onmsList = ref<OnmsDoctor[]>([])                  // Liste exhaustive des praticiens de l'ordre
// Déclaration de variable
const searchOnms = ref('')                              // Filtre de recherche textuelle
// Déclaration de variable
const isOnmsModalOpen = ref(false)                      // Affichage de la modale d'édition/ajout
// Déclaration de variable
const onmsModalMode = ref<'add' | 'edit'>('add')        // Mode du formulaire modal
// Déclaration de variable
const currentOnms = ref<Partial<OnmsDoctor>>({          // Données du praticien en cours d'édition
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
// Déclaration de variable
const onmsPageSize = ref(8)

// Déclaration de variable
const filteredOnmsList = computed(() => {
  // Condition logique
  if (!searchOnms.value.trim()) return onmsList.value
  // Déclaration de variable
  const q = searchOnms.value.toLowerCase()
  // Retourne la valeur
  return onmsList.value.filter(d =>
    d.numeroOrdre?.toLowerCase().includes(q) ||
    d.nom?.toLowerCase().includes(q) ||
    d.prenom?.toLowerCase().includes(q) ||
    d.specialite?.toLowerCase().includes(q) ||
    d.etablissement?.toLowerCase().includes(q)
  )
})

// Déclaration de variable
const paginatedOnms = computed(() => {
  // Déclaration de variable
  const start = (onmsCurrentPage.value - 1) * onmsPageSize.value
  // Retourne la valeur
  return filteredOnmsList.value.slice(start, start + onmsPageSize.value)
})

// Déclaration de variable
const handleSearchOnms = () => {
  onmsCurrentPage.value = 1
}

// Platform Doctors
const platformDoctors = ref<PlatformDoctor[]>([])
// Déclaration de variable
const searchPlatform = ref('')

// Platform Doctors Pagination
const platformCurrentPage = ref(1)
// Déclaration de variable
const platformPageSize = ref(8)

// Déclaration de variable
const filteredPlatformList = computed(() => {
  // Condition logique
  if (!searchPlatform.value.trim()) return platformDoctors.value
  // Déclaration de variable
  const q = searchPlatform.value.toLowerCase()
  // Retourne la valeur
  return platformDoctors.value.filter(d =>
    d.nomComplet?.toLowerCase().includes(q) ||
    d.specialite?.toLowerCase().includes(q) ||
    d.etablissement?.toLowerCase().includes(q)
  )
})

// Déclaration de variable
const paginatedPlatform = computed(() => {
  // Déclaration de variable
  const start = (platformCurrentPage.value - 1) * platformPageSize.value
  // Retourne la valeur
  return filteredPlatformList.value.slice(start, start + platformPageSize.value)
})

// Déclaration de variable
const handleSearchPlatform = () => {
  platformCurrentPage.value = 1
}

// Déclaration de variable
const fetchData = async () => {
  loading.value = true
  // Bloc d'essai pour gérer les erreurs
  try {
    // Déclaration de variable
    const [onmsRes, platformRes] = await Promise.allSettled([
      medecinService.getAllOnms(),
      medecinService.getAllPlatformMedecins()
    ])
    // Condition logique
    if (onmsRes.status === 'fulfilled') onmsList.value = onmsRes.value
    // Condition logique
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

// Déclaration de variable
const openEditOnmsModal = (doc: OnmsDoctor) => {
  onmsModalMode.value = 'edit'
  currentOnms.value = { ...doc }
  isOnmsModalOpen.value = true
}

// Déclaration de variable
const saveOnmsDoctor = async () => {
  // Bloc d'essai pour gérer les erreurs
  try {
    // Condition logique
    if (onmsModalMode.value === 'add') {
      // Attente de la promesse (asynchrone)
      await medecinService.addOnms(currentOnms.value)
      toast.success("Praticien inscrit avec succès au répertoire ONMS.")
    } else {
      // Attente de la promesse (asynchrone)
      await medecinService.updateOnms(currentOnms.value.numeroOrdre!, currentOnms.value)
      toast.success('Dossier ordinal mis à jour.')
    }
    isOnmsModalOpen.value = false
    fetchData()
  } catch (err: any) {
    toast.error(err.response?.data?.message || "Erreur lors de l'enregistrement ONMS")
  }
}

// Déclaration de variable
const toggleOnmsStatus = async (doc: OnmsDoctor) => {
  // Déclaration de variable
  const newStatut = doc.statutProfessionnel === 'ACTIF' ? 'SUSPENDU' : 'ACTIF'
  // Condition logique
  if (newStatut === 'SUSPENDU') {
    // Déclaration de variable
    const ok = await confirm({
      title: 'Suspension d\'un Praticien ONMS',
      message: `Souhaitez-vous suspendre temporairement le droit d'exercice de Dr. ${doc.prenom} ${doc.nom} (N° ${doc.numeroOrdre}) ?`,
      confirmText: 'Suspendre le praticien',
      cancelText: 'Annuler',
      variant: 'warning'
    })
    // Condition logique
    if (!ok) return
  }

  // Bloc d'essai pour gérer les erreurs
  try {
    // Attente de la promesse (asynchrone)
    await medecinService.updateOnms(doc.numeroOrdre, { ...doc, statutProfessionnel: newStatut })
    toast.success(`Statut de Dr. ${doc.nom} passé à ${newStatut}`)
    fetchData()
  } catch {
    toast.error('Erreur lors du changement de statut')
  }
}

// Déclaration de variable
const deleteOnmsDoctor = async (numeroOrdre: string) => {
  // Déclaration de variable
  const ok = await confirm({
    title: 'Radiation de l’Ordre National des Médecins',
    message: `Confirmez-vous la radiation définitive du praticien N° ${numeroOrdre} du tableau officiel de l'ONMS ? Cette action est irréversible.`,
    confirmText: 'Confirmer la radiation',
    cancelText: 'Annuler',
    variant: 'danger'
  })
  // Condition logique
  if (ok) {
    // Bloc d'essai pour gérer les erreurs
    try {
      // Attente de la promesse (asynchrone)
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
  // Déclaration de variable
  const newVerified = !doc.verified
  // Déclaration de variable
  const newStatut = newVerified ? 'ACTIF' : 'SUSPENDU'

  // Condition logique
  if (!newVerified) {
    // Déclaration de variable
    const ok = await confirm({
      title: 'Suspension du Praticien sur la Plateforme',
      message: `Voulez-vous révoquer l'homologation et suspendre le profil du praticien ${doc.nomComplet} ? Ses téléconsultations seront désactivées.`,
      confirmText: 'Suspendre le profil',
      cancelText: 'Annuler',
      variant: 'warning'
    })
    // Condition logique
    if (!ok) return
  }

  // Bloc d'essai pour gérer les erreurs
  try {
    // Attente de la promesse (asynchrone)
    await medecinService.updateMedecinStatus(doc.id, newStatut, newVerified)
    toast.success(`Praticien ${doc.nomComplet} ${newVerified ? 'homologué et activé' : 'suspendu'}.`)
    fetchData()
  } catch {
    toast.error('Erreur lors de la mise à jour')
  }
}
</script>

<template>
  <!-- Conteneur de bloc (div) -->
  <div class="medecins-view">
    <!-- Conteneur de bloc (div) -->
    <div class="card-panel">
      <!-- Tabs Header -->
      <div class="tabs-nav">
        <!-- Bouton cliquable -->
        <button
          class="tab-btn"
          :class="{ active: activeTab === 'onms' }"
          @click="activeTab = 'onms'"
        >
          <FileCheck :size="15" :stroke-width="1.8" />
          <!-- Conteneur en ligne (span) -->
          <span>Registre Ordinal ONMS ({{ onmsList.length }})</span>
        </button>
        <!-- Bouton cliquable -->
        <button
          class="tab-btn"
          :class="{ active: activeTab === 'platform' }"
          @click="activeTab = 'platform'"
        >
          <Stethoscope :size="15" :stroke-width="1.8" />
          <!-- Conteneur en ligne (span) -->
          <span>Praticiens sur la Plateforme ({{ platformDoctors.length }})</span>
        </button>
      </div>

      <!-- TAB 1 : REGISTRE ONMS -->
      <div v-if="activeTab === 'onms'">
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
                v-model="searchOnms"
                @input="handleSearchOnms"
                placeholder="Rechercher par N° d'ordre, nom, spécialité..."
              />
            </div>
          </div>
          <!-- Bouton cliquable -->
          <button class="btn btn-primary" @click="openAddOnmsModal">
            <Plus :size="15" :stroke-width="1.8" />
            <!-- Conteneur en ligne (span) -->
            <span>Inscrire un Médecin ONMS</span>
          </button>
        </div>

        <!-- Conteneur de bloc (div) -->
        <div class="table-responsive">
          <!-- Conteneur de bloc (div) -->
          <div v-if="loading" class="loading-state">
            <!-- Conteneur de bloc (div) -->
            <div class="spinner"></div>
            <!-- Paragraphe de texte -->
            <p>Chargement du registre officiel ONMS...</p>
          </div>

          <!-- Conteneur de bloc (div) -->
          <div v-else-if="filteredOnmsList.length === 0" class="empty-state">
            <FileCheck :size="32" class="empty-icon" />
            <!-- Paragraphe de texte -->
            <p>Aucun praticien ne correspond à votre recherche dans le registre ONMS.</p>
          </div>

          <!-- Élément de tableau de données -->
          <table v-else class="data-table">
            <thead>
              <!-- Élément de tableau de données -->
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
              <!-- Élément de tableau de données -->
              <tr v-for="doc in paginatedOnms" :key="doc.numeroOrdre">
                <!-- Élément de tableau de données -->
                <td><strong class="text-primary">#{{ doc.numeroOrdre }}</strong></td>
                <!-- Élément de tableau de données -->
                <td>
                  <!-- Conteneur de bloc (div) -->
                  <div class="doc-cell">
                    <!-- Conteneur de bloc (div) -->
                    <div class="doc-name">Dr. {{ doc.prenom }} {{ doc.nom }}</div>
                    <!-- Conteneur de bloc (div) -->
                    <div class="text-muted text-sm">{{ doc.telephone }}</div>
                  </div>
                </td>
                <!-- Élément de tableau de données -->
                <td><span class="specialite-tag">{{ doc.specialite }}</span></td>
                <!-- Élément de tableau de données -->
                <td>
                  <!-- Conteneur de bloc (div) -->
                  <div>{{ doc.etablissement }}</div>
                  <!-- Conteneur de bloc (div) -->
                  <div class="text-muted text-sm">{{ doc.region }}</div>
                </td>
                <!-- Élément de tableau de données -->
                <td>
                  <!-- Conteneur en ligne (span) -->
                  <span :class="['badge', doc.statutProfessionnel === 'ACTIF' ? 'badge-actif' : 'badge-suspendu']">
                    <!-- Conteneur en ligne (span) -->
                    <span class="badge-dot"></span>
                    {{ doc.statutProfessionnel }}
                  </span>
                </td>
                <!-- Élément de tableau de données -->
                <td>
                  <!-- Conteneur de bloc (div) -->
                  <div class="table-actions">
                    <!-- Bouton cliquable -->
                    <button class="action-icon-btn edit" @click="openEditOnmsModal(doc)" title="Modifier la fiche">
                      <Edit2 :size="13" :stroke-width="1.8" />
                    </button>
                    <!-- Bouton cliquable -->
                    <button
                      class="action-icon-btn unlock"
                      @click="toggleOnmsStatus(doc)"
                      :title="doc.statutProfessionnel === 'ACTIF' ? 'Suspendre l\'exercice' : 'Activer l\'exercice'"
                    >
                      <PauseCircle v-if="doc.statutProfessionnel === 'ACTIF'" :size="13" :stroke-width="1.8" />
                      <PlayCircle v-else :size="13" :stroke-width="1.8" />
                    </button>
                    <!-- Bouton cliquable -->
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
                v-model="searchPlatform"
                @input="handleSearchPlatform"
                placeholder="Filtrer les médecins inscrits..."
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
            <p>Chargement des praticiens...</p>
          </div>

          <!-- Conteneur de bloc (div) -->
          <div v-else-if="filteredPlatformList.length === 0" class="empty-state">
            <Stethoscope :size="32" class="empty-icon" />
            <!-- Paragraphe de texte -->
            <p>Aucun médecin inscrit sur la plateforme ne correspond aux critères.</p>
          </div>

          <!-- Élément de tableau de données -->
          <table v-else class="data-table">
            <thead>
              <!-- Élément de tableau de données -->
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
              <!-- Élément de tableau de données -->
              <tr v-for="doc in paginatedPlatform" :key="doc.id">
                <!-- Élément de tableau de données -->
                <td>
                  <!-- Conteneur de bloc (div) -->
                  <div class="doc-cell">
                    <!-- Conteneur de bloc (div) -->
                    <div class="doc-name">{{ doc.nomComplet || 'Médecin Praticien' }}</div>
                    <!-- Conteneur de bloc (div) -->
                    <div class="text-muted text-sm">Compte: {{ doc.userId.substring(0, 8) }}...</div>
                  </div>
                </td>
                <!-- Élément de tableau de données -->
                <td>
                  <!-- Conteneur de bloc (div) -->
                  <div><strong>{{ doc.specialite || 'Médecine Générale' }}</strong></div>
                  <!-- Conteneur de bloc (div) -->
                  <div class="text-muted text-sm">{{ doc.etablissement || 'Cabinet Médical' }} ({{ doc.region || 'Sénégal' }})</div>
                </td>
                <!-- Élément de tableau de données -->
                <td>
                  <!-- Conteneur de bloc (div) -->
                  <div>{{ doc.tarifConsultation ? doc.tarifConsultation + ' FCFA' : 'Tarif standard' }}</div>
                  <!-- Conteneur en ligne (span) -->
                  <span class="teleconsult-tag" v-if="doc.teleconsultationActive">
                    <Video :size="11" :stroke-width="1.8" />
                    <!-- Conteneur en ligne (span) -->
                    <span>Téléconsultation active</span>
                  </span>
                  <!-- Conteneur en ligne (span) -->
                  <span class="text-muted text-xs" v-else>Présentiel uniquement</span>
                </td>
                <!-- Élément de tableau de données -->
                <td>
                  <!-- Conteneur en ligne (span) -->
                  <span v-if="doc.verified" class="badge badge-actif">
                    <CheckCircle2 :size="11" :stroke-width="2" />
                    HOMOLOGUÉ ONMS
                  </span>
                  <!-- Conteneur en ligne (span) -->
                  <span v-else class="badge badge-bloque">
                    <AlertCircle :size="11" :stroke-width="2" />
                    EN ATTENTE ONMS
                  </span>
                </td>
                <!-- Élément de tableau de données -->
                <td>
                  <!-- Conteneur en ligne (span) -->
                  <span :class="['badge', doc.statutMedecin === 'ACTIF' ? 'badge-actif' : 'badge-suspendu']">
                    <!-- Conteneur en ligne (span) -->
                    <span class="badge-dot"></span>
                    {{ doc.statutMedecin }}
                  </span>
                </td>
                <!-- Élément de tableau de données -->
                <td>
                  <!-- Bouton cliquable -->
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
      <!-- Formulaire de saisie -->
      <form @submit.prevent="saveOnmsDoctor" class="form-grid">
        <!-- Conteneur de bloc (div) -->
        <div class="form-group" v-if="onmsModalMode === 'add'">
          <label>N° d'Ordre National *</label>
          <!-- Champ de saisie utilisateur -->
          <input type="text" v-model="currentOnms.numeroOrdre" required placeholder="Ex: 14502" />
        </div>
        <!-- Conteneur de bloc (div) -->
        <div class="form-group" v-else>
          <label>N° d'Ordre National</label>
          <!-- Champ de saisie utilisateur -->
          <input type="text" :value="currentOnms.numeroOrdre" disabled />
        </div>

        <!-- Conteneur de bloc (div) -->
        <div class="form-group">
          <label>Section ONMS</label>
          <select v-model="currentOnms.section">
            <option value="A">Section A (Secteur Public)</option>
            <option value="B">Section B (Secteur Privé)</option>
            <option value="C">Section C (Services de Santé des Armées)</option>
          </select>
        </div>

        <!-- Conteneur de bloc (div) -->
        <div class="form-group">
          <label>Prénom *</label>
          <!-- Champ de saisie utilisateur -->
          <input type="text" v-model="currentOnms.prenom" required placeholder="Dr. Prénom" />
        </div>

        <!-- Conteneur de bloc (div) -->
        <div class="form-group">
          <label>Nom de famille *</label>
          <!-- Champ de saisie utilisateur -->
          <input type="text" v-model="currentOnms.nom" required placeholder="Nom de famille" />
        </div>

        <!-- Conteneur de bloc (div) -->
        <div class="form-group">
          <label>Discipline / Spécialité *</label>
          <!-- Champ de saisie utilisateur -->
          <input type="text" v-model="currentOnms.specialite" required placeholder="Ex: Cardiologie" />
        </div>

        <!-- Conteneur de bloc (div) -->
        <div class="form-group">
          <label>Établissement d'exercice principal *</label>
          <!-- Champ de saisie utilisateur -->
          <input type="text" v-model="currentOnms.etablissement" required placeholder="Ex: Hôpital Principal de Dakar" />
        </div>

        <!-- Conteneur de bloc (div) -->
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

        <!-- Conteneur de bloc (div) -->
        <div class="form-group">
          <label>Ligne téléphonique professionnelle *</label>
          <!-- Champ de saisie utilisateur -->
          <input type="text" v-model="currentOnms.telephone" required placeholder="+22177XXXXXXX" />
        </div>

        <!-- Conteneur de bloc (div) -->
        <div class="form-group">
          <label>Statut Ordinal</label>
          <select v-model="currentOnms.statutProfessionnel">
            <option value="ACTIF">ACTIF (Autorisé à exercer)</option>
            <option value="SUSPENDU">SUSPENDU</option>
            <option value="RADIE">RADIE</option>
          </select>
        </div>

        <!-- Conteneur de bloc (div) -->
        <div class="modal-actions full-width">
          <!-- Bouton cliquable -->
          <button type="button" class="btn btn-secondary" @click="isOnmsModalOpen = false">Annuler</button>
          <!-- Bouton cliquable -->
          <button type="submit" class="btn btn-primary">Enregistrer la Fiche</button>
        </div>
      </form>
    </Modal>
  </div>
</template>

<style scoped>
/* Sélecteur de classe CSS */
.specialite-tag {
  background: #F1F5F9;
  color: #334155;
  padding: 3px 8px;
  border-radius: 4px;
  font-size: 0.78rem;
  font-weight: 600;
  border: 1px solid var(--border-color);
}

/* Sélecteur de classe CSS */
.doc-name {
  font-weight: 600;
  color: var(--text-dark);
}

/* Sélecteur de classe CSS */
.text-primary {
  color: var(--primary);
}

/* Sélecteur de classe CSS */
.text-sm {
  font-size: 0.78rem;
}

/* Sélecteur de classe CSS */
.text-xs {
  font-size: 0.72rem;
}

/* Sélecteur de classe CSS */
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

/* Sélecteur de classe CSS */
.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  margin-top: 8px;
}
</style>

<script setup lang="ts">
// Importation du module ou composant
import { ref, computed, onMounted } from 'vue'
// Importation du module ou composant
import Modal from '../components/common/Modal.vue'
// Importation du module ou composant
import Pagination from '../components/common/Pagination.vue'
// Importation du module ou composant
import { userService, type UserItem } from '../services/user.service'
// Importation du module ou composant
import { useToast } from '../composables/useToast'
// Importation du module ou composant
import {
  Search,
  UserPlus,
  Edit2,
  Unlock,
  Trash2,
  Users,
  Lock
} from 'lucide-vue-next'

// Importation du module ou composant
import { useConfirm } from '../composables/useConfirm'

// Déclaration de variable
const toast = useToast()
// Déclaration de variable
const { confirm } = useConfirm()

// Déclaration de variable
const users = ref<UserItem[]>([])
// Déclaration de variable
const loading = ref(true)

// Filters
const searchQuery = ref('')
// Déclaration de variable
const selectedRole = ref('TOUS')
// Déclaration de variable
const selectedStatus = ref('TOUS')

// Pagination
const currentPage = ref(1)
// Déclaration de variable
const pageSize = ref(8)

// Déclaration de variable
const paginatedUsers = computed(() => {
  // Déclaration de variable
  const start = (currentPage.value - 1) * pageSize.value
  // Retourne la valeur
  return users.value.slice(start, start + pageSize.value)
})

// Modals
const isCreateModalOpen = ref(false)
// Déclaration de variable
const isEditModalOpen = ref(false)

// Déclaration de variable
const newUser = ref({
  firstName: '',
  lastName: '',
  telephone: '',
  email: '',
  password: '',
  role: 'PATIENT'
})

// Déclaration de variable
const editingUser = ref<UserItem | null>(null)
// Déclaration de variable
const editForm = ref({
  status: 'ACTIF',
  role: 'PATIENT'
})

// Déclaration de variable
const fetchUsers = async () => {
  loading.value = true
  // Bloc d'essai pour gérer les erreurs
  try {
    users.value = await userService.getAllUsers({
      search: searchQuery.value,
      role: selectedRole.value,
      status: selectedStatus.value
    })
    // Reset page if out of bounds
    const maxPage = Math.max(1, Math.ceil(users.value.length / pageSize.value))
    // Condition logique
    if (currentPage.value > maxPage) {
      currentPage.value = 1
    }
  } catch (err: any) {
    toast.error('Erreur lors du chargement des utilisateurs')
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  fetchUsers()
})

// Déclaration de variable
const handleSearch = () => {
  currentPage.value = 1
  fetchUsers()
}

// Déclaration de variable
const handleFilterChange = () => {
  currentPage.value = 1
  fetchUsers()
}

// Actions
const openCreateModal = () => {
  newUser.value = {
    firstName: '',
    lastName: '',
    telephone: '',
    email: '',
    password: '',
    role: 'PATIENT'
  }
  isCreateModalOpen.value = true
}

// Déclaration de variable
const handleCreateUser = async () => {
  // Bloc d'essai pour gérer les erreurs
  try {
    // Attente de la promesse (asynchrone)
    await userService.createUser(newUser.value)
    toast.success('Compte utilisateur créé avec succès.')
    isCreateModalOpen.value = false
    fetchUsers()
  } catch (err: any) {
    toast.error(err.response?.data?.message || 'Erreur lors de la création')
  }
}

// Déclaration de variable
const openEditModal = (u: UserItem) => {
  editingUser.value = u
  editForm.value = {
    status: u.accountStatus,
    role: u.role
  }
  isEditModalOpen.value = true
}

// Déclaration de variable
const handleUpdateUser = async () => {
  // Condition logique
  if (!editingUser.value) return
  // Bloc d'essai pour gérer les erreurs
  try {
    // Attente de la promesse (asynchrone)
    await userService.updateStatus(editingUser.value.id, editForm.value.status)
    // Condition logique
    if (editForm.value.role !== editingUser.value.role) {
      // Attente de la promesse (asynchrone)
      await userService.updateRole(editingUser.value.id, editForm.value.role)
    }
    toast.success('Compte utilisateur mis à jour.')
    isEditModalOpen.value = false
    fetchUsers()
  } catch (err: any) {
    toast.error('Erreur lors de la mise à jour')
  }
}

// Déclaration de variable
const handleUnlockUser = async (u: UserItem) => {
  // Bloc d'essai pour gérer les erreurs
  try {
    // Attente de la promesse (asynchrone)
    await userService.unlockUser(u.id)
    toast.success(`Compte de ${u.firstName} ${u.lastName} réactivé.`)
    fetchUsers()
  } catch {
    toast.error('Erreur lors du déblocage')
  }
}

// Déclaration de variable
const handleDeleteUser = async (u: UserItem) => {
  // Déclaration de variable
  const confirmed = await confirm({
    title: 'Supprimer le compte utilisateur',
    message: `Confirmez-vous la suppression définitive du compte de ${u.firstName} ${u.lastName} (${u.telephone}) ? Cette action est irréversible et révoquera tous ses accès.`,
    confirmText: 'Supprimer définitivement',
    cancelText: 'Annuler',
    variant: 'danger'
  })
  // Condition logique
  if (confirmed) {
    // Bloc d'essai pour gérer les erreurs
    try {
      // Attente de la promesse (asynchrone)
      await userService.deleteUser(u.id)
      toast.success('Compte utilisateur supprimé.')
      fetchUsers()
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Erreur lors de la suppression')
    }
  }
}

// Déclaration de variable
const getRoleBadgeClass = (role: string) => {
  switch (role?.toUpperCase()) {
    case 'ADMIN': return 'badge-role-admin'
    case 'MEDECIN': return 'badge-role-medecin'
    default: return 'badge-role-patient'
  }
}

// Déclaration de variable
const getStatusBadgeClass = (status: string) => {
  switch (status?.toUpperCase()) {
    case 'ACTIF': return 'badge-actif'
    case 'EN_ATTENTE': return 'badge-en_attente'
    case 'SUSPENDU': return 'badge-suspendu'
    case 'BLOQUE': return 'badge-bloque'
    default: return ''
  }
}
</script>

<template>
  <!-- Conteneur de bloc (div) -->
  <div class="users-view">
    <!-- Conteneur de bloc (div) -->
    <div class="card-panel">
      <!-- Panel Header with Search & Filter -->
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
              placeholder="Filtrer par nom, téléphone, email..."
            />
          </div>

          <select class="filter-select" v-model="selectedRole" @change="handleFilterChange">
            <option value="TOUS">Tous les rôles</option>
            <option value="PATIENT">Patients</option>
            <option value="MEDECIN">Médecins</option>
            <option value="ADMIN">Administrateurs</option>
          </select>

          <select class="filter-select" v-model="selectedStatus" @change="handleFilterChange">
            <option value="TOUS">Tous les statuts</option>
            <option value="ACTIF">Actif</option>
            <option value="EN_ATTENTE">En attente</option>
            <option value="SUSPENDU">Suspendu</option>
            <option value="BLOQUE">Bloqué</option>
          </select>
        </div>

        <!-- Bouton cliquable -->
        <button class="btn btn-primary" @click="openCreateModal">
          <UserPlus :size="15" :stroke-width="1.8" />
          <!-- Conteneur en ligne (span) -->
          <span>Nouvel Utilisateur</span>
        </button>
      </div>

      <!-- Users Table -->
      <div class="table-responsive">
        <!-- Conteneur de bloc (div) -->
        <div v-if="loading" class="loading-state">
          <!-- Conteneur de bloc (div) -->
          <div class="spinner"></div>
          <!-- Paragraphe de texte -->
          <p>Chargement des comptes...</p>
        </div>

        <!-- Conteneur de bloc (div) -->
        <div v-else-if="users.length === 0" class="empty-state">
          <Users :size="32" class="empty-icon" />
          <!-- Paragraphe de texte -->
          <p>Aucun utilisateur ne correspond aux critères de sélection.</p>
        </div>

        <!-- Élément de tableau de données -->
        <table v-else class="data-table">
          <thead>
            <!-- Élément de tableau de données -->
            <tr>
              <th>Identité</th>
              <th>Coordonnées</th>
              <th>Rôle</th>
              <th>Statut</th>
              <th>Sécurité Connexion</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            <!-- Élément de tableau de données -->
            <tr v-for="u in paginatedUsers" :key="u.id">
              <!-- Élément de tableau de données -->
              <td>
                <!-- Conteneur de bloc (div) -->
                <div class="user-cell">
                  <!-- Conteneur de bloc (div) -->
                  <div class="user-avatar-mini">
                    {{ u.firstName?.[0] || 'U' }}{{ u.lastName?.[0] || '' }}
                  </div>
                  <!-- Conteneur de bloc (div) -->
                  <div>
                    <!-- Conteneur de bloc (div) -->
                    <div class="user-cell-name">{{ u.firstName }} {{ u.lastName }}</div>
                    <!-- Conteneur de bloc (div) -->
                    <div class="user-cell-sub">{{ u.role === 'ADMIN' ? 'Administrateur' : u.role === 'MEDECIN' ? 'Médecin Praticien' : 'Patient Adhérent' }}</div>
                  </div>
                </div>
              </td>
              <!-- Élément de tableau de données -->
              <td>
                <!-- Conteneur de bloc (div) -->
                <div><strong>{{ u.telephone }}</strong></div>
                <!-- Conteneur de bloc (div) -->
                <div class="text-muted text-sm">{{ u.email || 'Aucun e-mail' }}</div>
              </td>
              <!-- Élément de tableau de données -->
              <td>
                <!-- Conteneur en ligne (span) -->
                <span :class="['badge', getRoleBadgeClass(u.role)]">
                  {{ u.role }}
                </span>
              </td>
              <!-- Élément de tableau de données -->
              <td>
                <!-- Conteneur en ligne (span) -->
                <span :class="['badge', getStatusBadgeClass(u.accountStatus)]">
                  <!-- Conteneur en ligne (span) -->
                  <span class="badge-dot"></span>
                  {{ u.accountStatus }}
                </span>
              </td>
              <!-- Élément de tableau de données -->
              <td>
                <!-- Conteneur en ligne (span) -->
                <span :class="{ 'text-danger fw-bold': u.failedLoginAttempts > 0 }">
                  {{ u.failedLoginAttempts }} échec(s)
                </span>
                <!-- Conteneur en ligne (span) -->
                <span v-if="u.lockedUntil" class="locked-badge">
                  <Lock :size="12" :stroke-width="2" />
                  <!-- Conteneur en ligne (span) -->
                  <span>Verrouillé</span>
                </span>
              </td>
              <!-- Élément de tableau de données -->
              <td>
                <!-- Conteneur de bloc (div) -->
                <div class="table-actions">
                  <!-- Bouton cliquable -->
                  <button class="action-icon-btn edit" @click="openEditModal(u)" title="Modifier statut et rôle">
                    <Edit2 :size="14" :stroke-width="1.8" />
                  </button>
                  <!-- Bouton cliquable -->
                  <button
                    v-if="u.accountStatus === 'BLOQUE' || u.failedLoginAttempts > 0"
                    class="action-icon-btn unlock"
                    @click="handleUnlockUser(u)"
                    title="Débloquer le compte"
                  >
                    <Unlock :size="14" :stroke-width="1.8" />
                  </button>
                  <!-- Bouton cliquable -->
                  <button class="action-icon-btn delete" @click="handleDeleteUser(u)" title="Supprimer le compte">
                    <Trash2 :size="14" :stroke-width="1.8" />
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Pagination -->
      <Pagination
        v-if="users.length > 0"
        v-model:currentPage="currentPage"
        :totalItems="users.length"
        v-model:pageSize="pageSize"
      />
    </div>

    <!-- Create User Modal -->
    <Modal :isOpen="isCreateModalOpen" title="Créer un Compte Utilisateur" @close="isCreateModalOpen = false">
      <!-- Formulaire de saisie -->
      <form @submit.prevent="handleCreateUser" class="form-grid">
        <!-- Conteneur de bloc (div) -->
        <div class="form-group">
          <label>Prénom *</label>
          <!-- Champ de saisie utilisateur -->
          <input type="text" v-model="newUser.firstName" required placeholder="Ex: Moussa" />
        </div>

        <!-- Conteneur de bloc (div) -->
        <div class="form-group">
          <label>Nom *</label>
          <!-- Champ de saisie utilisateur -->
          <input type="text" v-model="newUser.lastName" required placeholder="Ex: Diop" />
        </div>

        <!-- Conteneur de bloc (div) -->
        <div class="form-group">
          <label>Numéro de téléphone (+221...) *</label>
          <!-- Champ de saisie utilisateur -->
          <input type="text" v-model="newUser.telephone" required placeholder="+22177XXXXXXX" />
        </div>

        <!-- Conteneur de bloc (div) -->
        <div class="form-group">
          <label>Adresse e-mail</label>
          <!-- Champ de saisie utilisateur -->
          <input type="email" v-model="newUser.email" placeholder="nom@domaine.sn" />
        </div>

        <!-- Conteneur de bloc (div) -->
        <div class="form-group">
          <label>Mot de passe initial *</label>
          <!-- Champ de saisie utilisateur -->
          <input type="password" v-model="newUser.password" required placeholder="8 caractères minimum" />
        </div>

        <!-- Conteneur de bloc (div) -->
        <div class="form-group">
          <label>Rôle attribué *</label>
          <select v-model="newUser.role" required>
            <option value="PATIENT">PATIENT</option>
            <option value="MEDECIN">MEDECIN</option>
            <option value="ADMIN">ADMIN</option>
          </select>
        </div>

        <!-- Conteneur de bloc (div) -->
        <div class="modal-actions full-width">
          <!-- Bouton cliquable -->
          <button type="button" class="btn btn-secondary" @click="isCreateModalOpen = false">Annuler</button>
          <!-- Bouton cliquable -->
          <button type="submit" class="btn btn-primary">Enregistrer le Compte</button>
        </div>
      </form>
    </Modal>

    <!-- Edit User Modal -->
    <Modal :isOpen="isEditModalOpen" title="Modifier le Statut et les Droits" @close="isEditModalOpen = false">
      <!-- Conteneur de bloc (div) -->
      <div v-if="editingUser" class="form-grid">
        <!-- Conteneur de bloc (div) -->
        <div class="form-group full-width">
          <label>Utilisateur sélectionné</label>
          <!-- Champ de saisie utilisateur -->
          <input type="text" :value="`${editingUser.firstName} ${editingUser.lastName} (${editingUser.telephone})`" disabled />
        </div>

        <!-- Conteneur de bloc (div) -->
        <div class="form-group">
          <label>Statut du compte</label>
          <select v-model="editForm.status">
            <option value="ACTIF">ACTIF</option>
            <option value="SUSPENDU">SUSPENDU</option>
            <option value="BLOQUE">BLOQUE</option>
            <option value="EN_ATTENTE">EN_ATTENTE</option>
          </select>
        </div>

        <!-- Conteneur de bloc (div) -->
        <div class="form-group">
          <label>Rôle fonctionnel</label>
          <select v-model="editForm.role">
            <option value="PATIENT">PATIENT</option>
            <option value="MEDECIN">MEDECIN</option>
            <option value="ADMIN">ADMIN</option>
          </select>
        </div>

        <!-- Conteneur de bloc (div) -->
        <div class="modal-actions full-width">
          <!-- Bouton cliquable -->
          <button type="button" class="btn btn-secondary" @click="isEditModalOpen = false">Annuler</button>
          <!-- Bouton cliquable -->
          <button type="button" class="btn btn-primary" @click="handleUpdateUser">Valider les Modifications</button>
        </div>
      </div>
    </Modal>
  </div>
</template>

<style scoped>
/* Sélecteur de classe CSS */
.user-cell {
  display: flex;
  align-items: center;
  gap: 10px;
}

/* Sélecteur de classe CSS */
.user-avatar-mini {
  width: 32px;
  height: 32px;
  border-radius: var(--radius-sm);
  background: #F1F5F9;
  border: 1px solid var(--border-color);
  color: #334155;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  font-size: 0.75rem;
  flex-shrink: 0;
}

/* Sélecteur de classe CSS */
.user-cell-name {
  font-weight: 600;
  color: var(--text-dark);
}

/* Sélecteur de classe CSS */
.user-cell-sub {
  font-size: 0.72rem;
  color: var(--text-muted);
}

/* Sélecteur de classe CSS */
.text-sm {
  font-size: 0.78rem;
}

/* Sélecteur de classe CSS */
.text-danger {
  color: var(--danger);
}

/* Sélecteur de classe CSS */
.fw-bold {
  font-weight: 700;
}

/* Sélecteur de classe CSS */
.locked-badge {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  margin-left: 6px;
  font-size: 0.7rem;
  color: var(--danger);
  font-weight: 600;
  background: var(--danger-light);
  padding: 2px 6px;
  border-radius: 4px;
  border: 1px solid var(--danger-border);
}

/* Sélecteur de classe CSS */
.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  margin-top: 8px;
}
</style>

<script setup lang="ts">
// Importation du module ou composant
import { ref, computed, onMounted } from 'vue'
// Importation du module ou composant
import { authService, type AdminUser } from '../services/auth.service'
// Importation du module ou composant
import { useToast } from '../composables/useToast'
// Importation du module ou composant
import { useConfirm } from '../composables/useConfirm'
// Importation du module ou composant
import {
  User,
  ShieldCheck,
  Lock,
  KeyRound,
  Eye,
  EyeOff,
  Save,
  CheckCircle2,
  AlertTriangle,
  Smartphone,
  Mail,
  RefreshCw,
  LogOut,
  Check
} from 'lucide-vue-next'
// Importation du module ou composant
import { useRouter } from 'vue-router'

// Déclaration de variable
const toast = useToast()
// Déclaration de variable
const { confirm } = useConfirm()
// Déclaration de variable
const router = useRouter()

// Déclaration de variable
const currentUser = ref<AdminUser | null>(null)
// Déclaration de variable
const userDetails = ref<any>(null)
// Déclaration de variable
const loading = ref(true)

// Profile Form
const profileForm = ref({
  firstName: '',
  lastName: '',
  telephone: '',
  email: ''
})
// Déclaration de variable
const isSavingProfile = ref(false)

// Password Form
const passwordForm = ref({
  ancienMotDePasse: '',
  nouveauMotDePasse: '',
  confirmationMotDePasse: ''
})
// Déclaration de variable
const showOldPassword = ref(false)
// Déclaration de variable
const showNewPassword = ref(false)
// Déclaration de variable
const showConfirmPassword = ref(false)
// Déclaration de variable
const isChangingPassword = ref(false)

// Password Strength
const passwordCriteria = computed(() => {
  // Déclaration de variable
  const p = passwordForm.value.nouveauMotDePasse
  // Retourne la valeur
  return {
    length: p.length >= 8,
    hasUpper: /[A-Z]/.test(p),
    hasNumber: /[0-9]/.test(p),
    hasSpecial: /[^A-Za-z0-9]/.test(p)
  }
})

// Déclaration de variable
const passwordStrengthScore = computed(() => {
  // Déclaration de variable
  const c = passwordCriteria.value
  // Déclaration de variable
  let score = 0
  // Condition logique
  if (c.length) score += 1
  // Condition logique
  if (c.hasUpper) score += 1
  // Condition logique
  if (c.hasNumber) score += 1
  // Condition logique
  if (c.hasSpecial) score += 1
  // Retourne la valeur
  return score
})

// Déclaration de variable
const passwordStrengthLabel = computed(() => {
  // Déclaration de variable
  const s = passwordStrengthScore.value
  // Condition logique
  if (!passwordForm.value.nouveauMotDePasse) return ''
  // Condition logique
  if (s <= 1) return 'Faible'
  // Condition logique
  if (s === 2) return 'Moyen'
  // Condition logique
  if (s === 3) return 'Fort'
  // Retourne la valeur
  return 'Conforme'
})

// Déclaration de variable
const passwordStrengthColor = computed(() => {
  // Déclaration de variable
  const s = passwordStrengthScore.value
  // Condition logique
  if (s <= 1) return '#DC2626'
  // Condition logique
  if (s === 2) return '#D97706'
  // Condition logique
  if (s === 3) return '#0D7C66'
  // Retourne la valeur
  return '#0D7C66'
})

// Déclaration de variable
const passwordsMatch = computed(() => {
  // Condition logique
  if (!passwordForm.value.confirmationMotDePasse) return null
  // Retourne la valeur
  return passwordForm.value.nouveauMotDePasse === passwordForm.value.confirmationMotDePasse
})

// Déclaration de variable
const adminInitials = computed(() => {
  // Condition logique
  if (!currentUser.value) return 'AD'
  // Déclaration de variable
  const f = currentUser.value.firstName?.[0] || ''
  // Déclaration de variable
  const l = currentUser.value.lastName?.[0] || ''
  // Retourne la valeur
  return (f + l).toUpperCase() || 'AD'
})

// Déclaration de variable
const fetchProfileData = async () => {
  loading.value = true
  // Bloc d'essai pour gérer les erreurs
  try {
    // Déclaration de variable
    const user = authService.getCurrentUser()
    currentUser.value = user

    // Condition logique
    if (user?.userId) {
      // Déclaration de variable
      const details = await authService.getUserDetails(user.userId)
      // Condition logique
      if (details) {
        userDetails.value = details
        profileForm.value = {
          firstName: details.firstName || user.firstName || '',
          lastName: details.lastName || user.lastName || '',
          telephone: details.telephone || user.telephone || '',
          email: details.email || ''
        }
      } else {
        profileForm.value = {
          firstName: user.firstName || '',
          lastName: user.lastName || '',
          telephone: user.telephone || '',
          email: ''
        }
      }
    }
  } catch {
    toast.error('Erreur lors du chargement du profil')
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  fetchProfileData()
})

// Déclaration de variable
const handleSaveProfile = async () => {
  // Condition logique
  if (!currentUser.value?.userId) return
  // Condition logique
  if (!profileForm.value.firstName.trim() || !profileForm.value.lastName.trim() || !profileForm.value.telephone.trim()) {
    toast.warning('Prénom, nom et téléphone requis.')
    return
  }

  isSavingProfile.value = true
  // Bloc d'essai pour gérer les erreurs
  try {
    // Déclaration de variable
    const updated = await authService.updateProfile(currentUser.value.userId, {
      firstName: profileForm.value.firstName.trim(),
      lastName: profileForm.value.lastName.trim(),
      telephone: profileForm.value.telephone.trim(),
      email: profileForm.value.email.trim() || undefined
    })

    currentUser.value = updated
    toast.success('Profil mis à jour avec succès.')
  } catch (err: any) {
    toast.error(err.response?.data?.message || 'Erreur lors de la mise à jour')
  } finally {
    isSavingProfile.value = false
  }
}

// Déclaration de variable
const handleChangePassword = async () => {
  // Condition logique
  if (!currentUser.value?.userId) return
  // Déclaration de variable
  const { ancienMotDePasse, nouveauMotDePasse, confirmationMotDePasse } = passwordForm.value

  // Condition logique
  if (!nouveauMotDePasse) {
    toast.warning('Veuillez saisir votre nouveau mot de passe.')
    return
  }

  // Condition logique
  if (nouveauMotDePasse.length < 8) {
    toast.warning('Minimum 8 caractères requis.')
    return
  }

  // Condition logique
  if (nouveauMotDePasse !== confirmationMotDePasse) {
    toast.error('Les mots de passe ne correspondent pas.')
    return
  }

  isChangingPassword.value = true
  // Bloc d'essai pour gérer les erreurs
  try {
    // Attente de la promesse (asynchrone)
    await authService.changePassword(currentUser.value.userId, {
      ancienMotDePasse: ancienMotDePasse || undefined,
      nouveauMotDePasse,
      confirmationMotDePasse
    })

    toast.success('Mot de passe mis à jour avec succès.')
    passwordForm.value = {
      ancienMotDePasse: '',
      nouveauMotDePasse: '',
      confirmationMotDePasse: ''
    }
  } catch (err: any) {
    toast.error(err.response?.data?.message || 'Erreur lors du changement de mot de passe')
  } finally {
    isChangingPassword.value = false
  }
}

// Déclaration de variable
const handleLogout = async () => {
  // Déclaration de variable
  const confirmed = await confirm({
    title: 'Déconnexion',
    message: 'Fermer votre session administrateur ?',
    confirmText: 'Se déconnecter',
    cancelText: 'Annuler',
    variant: 'warning'
  })
  // Condition logique
  if (confirmed) {
    authService.logout()
    router.push('/login')
  }
}
</script>

<template>
  <!-- Conteneur de bloc (div) -->
  <div class="profile-page">
    <!-- Clean, Flat Admin Header Card -->
    <div class="admin-header-card">
      <!-- Conteneur de bloc (div) -->
      <div class="header-main">
        <!-- Conteneur de bloc (div) -->
        <div class="avatar-box">
          {{ adminInitials }}
        </div>

        <!-- Conteneur de bloc (div) -->
        <div class="admin-info">
          <!-- Conteneur de bloc (div) -->
          <div class="name-row">
            <!-- Titre de section -->
            <h2 class="admin-title">{{ currentUser?.firstName }} {{ currentUser?.lastName }}</h2>
            <!-- Conteneur en ligne (span) -->
            <span class="role-tag">
              <ShieldCheck :size="13" />
              <!-- Conteneur en ligne (span) -->
              <span>{{ currentUser?.role || 'ADMIN' }}</span>
            </span>
          </div>

          <!-- Conteneur de bloc (div) -->
          <div class="info-chips">
            <!-- Conteneur en ligne (span) -->
            <span class="info-chip">
              <Smartphone :size="12" class="text-vert" />
              <!-- Conteneur en ligne (span) -->
              <span>{{ currentUser?.telephone }}</span>
            </span>
            <!-- Conteneur en ligne (span) -->
            <span v-if="userDetails?.email" class="info-chip">
              <Mail :size="12" class="text-vert" />
              <!-- Conteneur en ligne (span) -->
              <span>{{ userDetails.email }}</span>
            </span>
          </div>
        </div>
      </div>
    </div>

    <!-- 2 Column Clean Cards -->
    <div class="profile-columns">
      <!-- CARD 1: Mot de Passe -->
      <div class="flat-card">
        <!-- Conteneur de bloc (div) -->
        <div class="card-title-row">
          <!-- Conteneur de bloc (div) -->
          <div class="icon-indicator icon-vert">
            <KeyRound :size="16" />
          </div>
          <!-- Conteneur de bloc (div) -->
          <div>
            <!-- Titre de section -->
            <h3 class="card-heading">Modifier le mot de passe</h3>
            <!-- Conteneur en ligne (span) -->
            <span class="card-subheading">Sécurité et authentification du compte</span>
          </div>
        </div>

        <!-- Formulaire de saisie -->
        <form @submit.prevent="handleChangePassword" class="form-body">
          <!-- Conteneur de bloc (div) -->
          <div class="field-item">
            <label class="field-title">Mot de passe actuel</label>
            <!-- Conteneur de bloc (div) -->
            <div class="input-wrap">
              <Lock :size="14" class="input-icon" />
              <!-- Champ de saisie utilisateur -->
              <input
                :type="showOldPassword ? 'text' : 'password'"
                v-model="passwordForm.ancienMotDePasse"
                placeholder="Votre mot de passe actuel..."
                class="form-control"
              />
              <!-- Bouton cliquable -->
              <button type="button" class="eye-btn" @click="showOldPassword = !showOldPassword">
                <EyeOff v-if="showOldPassword" :size="14" />
                <Eye v-else :size="14" />
              </button>
            </div>
          </div>

          <!-- Conteneur de bloc (div) -->
          <div class="field-item">
            <label class="field-title">Nouveau mot de passe</label>
            <!-- Conteneur de bloc (div) -->
            <div class="input-wrap">
              <KeyRound :size="14" class="input-icon" />
              <!-- Champ de saisie utilisateur -->
              <input
                :type="showNewPassword ? 'text' : 'password'"
                v-model="passwordForm.nouveauMotDePasse"
                placeholder="Minimum 8 caractères..."
                class="form-control"
                required
              />
              <!-- Bouton cliquable -->
              <button type="button" class="eye-btn" @click="showNewPassword = !showNewPassword">
                <EyeOff v-if="showNewPassword" :size="14" />
                <Eye v-else :size="14" />
              </button>
            </div>

            <!-- Clean Flat Progress Bar -->
            <div v-if="passwordForm.nouveauMotDePasse" class="progress-wrap">
              <!-- Conteneur de bloc (div) -->
              <div class="progress-track">
                <!-- Conteneur de bloc (div) -->
                <div
                  class="progress-fill"
                  :style="{
                    width: (passwordStrengthScore * 25) + '%',
                    backgroundColor: passwordStrengthColor
                  }"
                ></div>
              </div>
              <!-- Conteneur en ligne (span) -->
              <span class="progress-text" :style="{ color: passwordStrengthColor }">
                {{ passwordStrengthLabel }}
              </span>
            </div>
          </div>

          <!-- Conteneur de bloc (div) -->
          <div class="field-item">
            <label class="field-title">Confirmation du mot de passe</label>
            <!-- Conteneur de bloc (div) -->
            <div class="input-wrap">
              <Check :size="14" class="input-icon" />
              <!-- Champ de saisie utilisateur -->
              <input
                :type="showConfirmPassword ? 'text' : 'password'"
                v-model="passwordForm.confirmationMotDePasse"
                placeholder="Confirmez le nouveau mot de passe..."
                class="form-control"
                required
              />
              <!-- Bouton cliquable -->
              <button type="button" class="eye-btn" @click="showConfirmPassword = !showConfirmPassword">
                <EyeOff v-if="showConfirmPassword" :size="14" />
                <Eye v-else :size="14" />
              </button>
            </div>

            <!-- Conteneur de bloc (div) -->
            <div v-if="passwordsMatch !== null" class="match-box">
              <!-- Conteneur en ligne (span) -->
              <span v-if="passwordsMatch" class="text-vert text-xs font-bold">
                <CheckCircle2 :size="12" /> Les mots de passe correspondent
              </span>
              <!-- Conteneur en ligne (span) -->
              <span v-else class="text-danger text-xs font-bold">
                <AlertTriangle :size="12" /> Les mots de passe ne correspondent pas
              </span>
            </div>
          </div>

          <!-- Bouton cliquable -->
          <button
            type="submit"
            class="submit-btn btn-vert"
            :disabled="isChangingPassword || passwordForm.nouveauMotDePasse.length < 8 || passwordsMatch === false"
          >
            <KeyRound :size="14" />
            <!-- Conteneur en ligne (span) -->
            <span>{{ isChangingPassword ? 'Enregistrement...' : 'Mettre à jour le mot de passe' }}</span>
          </button>
        </form>
      </div>

      <!-- CARD 2: Coordonnées -->
      <div class="flat-card">
        <!-- Conteneur de bloc (div) -->
        <div class="card-title-row">
          <!-- Conteneur de bloc (div) -->
          <div class="icon-indicator icon-blue">
            <User :size="16" />
          </div>
          <!-- Conteneur de bloc (div) -->
          <div>
            <!-- Titre de section -->
            <h3 class="card-heading">Coordonnées du compte</h3>
            <!-- Conteneur en ligne (span) -->
            <span class="card-subheading">Informations administratives</span>
          </div>
        </div>

        <!-- Formulaire de saisie -->
        <form @submit.prevent="handleSaveProfile" class="form-body">
          <!-- Conteneur de bloc (div) -->
          <div class="row-2">
            <!-- Conteneur de bloc (div) -->
            <div class="field-item">
              <label class="field-title">Prénom</label>
              <!-- Conteneur de bloc (div) -->
              <div class="input-wrap">
                <User :size="14" class="input-icon" />
                <!-- Champ de saisie utilisateur -->
                <input
                  type="text"
                  v-model="profileForm.firstName"
                  placeholder="Prénom"
                  class="form-control"
                  required
                />
              </div>
            </div>

            <!-- Conteneur de bloc (div) -->
            <div class="field-item">
              <label class="field-title">Nom</label>
              <!-- Conteneur de bloc (div) -->
              <div class="input-wrap">
                <User :size="14" class="input-icon" />
                <!-- Champ de saisie utilisateur -->
                <input
                  type="text"
                  v-model="profileForm.lastName"
                  placeholder="Nom"
                  class="form-control"
                  required
                />
              </div>
            </div>
          </div>

          <!-- Conteneur de bloc (div) -->
          <div class="field-item">
            <label class="field-title">Téléphone (+221)</label>
            <!-- Conteneur de bloc (div) -->
            <div class="input-wrap">
              <Smartphone :size="14" class="input-icon" />
              <!-- Champ de saisie utilisateur -->
              <input
                type="tel"
                v-model="profileForm.telephone"
                placeholder="+221..."
                class="form-control"
                required
              />
            </div>
          </div>

          <!-- Conteneur de bloc (div) -->
          <div class="field-item">
            <label class="field-title">Email professionnel</label>
            <!-- Conteneur de bloc (div) -->
            <div class="input-wrap">
              <Mail :size="14" class="input-icon" />
              <!-- Champ de saisie utilisateur -->
              <input
                type="email"
                v-model="profileForm.email"
                placeholder="admin@diamyaraam.sn"
                class="form-control"
              />
            </div>
          </div>

          <!-- Bouton cliquable -->
          <button
            type="submit"
            class="submit-btn btn-dark"
            :disabled="isSavingProfile"
          >
            <Save :size="14" />
            <!-- Conteneur en ligne (span) -->
            <span>{{ isSavingProfile ? 'Enregistrement...' : 'Enregistrer les coordonnées' }}</span>
          </button>
        </form>
      </div>
    </div>

    <!-- Clean Bottom Bar -->
    <div class="footer-bar">
      <!-- Conteneur en ligne (span) -->
      <span class="footer-info">
        Session administrative active • Diam-Yaraam
      </span>

      <!-- Conteneur de bloc (div) -->
      <div class="footer-buttons">
        <!-- Bouton cliquable -->
        <button class="footer-btn" @click="fetchProfileData">
          <RefreshCw :size="13" />
          <!-- Conteneur en ligne (span) -->
          <span>Synchroniser</span>
        </button>
        <!-- Bouton cliquable -->
        <button class="footer-btn btn-danger-flat" @click="handleLogout">
          <LogOut :size="13" />
          <!-- Conteneur en ligne (span) -->
          <span>Se déconnecter</span>
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* Sélecteur de classe CSS */
.profile-page {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

/* Header Card */
.admin-header-card {
  background: #FFFFFF;
  border: 1px solid var(--border-color);
  border-radius: var(--radius-md);
  padding: 18px 22px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

/* Sélecteur de classe CSS */
.header-main {
  display: flex;
  align-items: center;
  gap: 16px;
}

/* Sélecteur de classe CSS */
.avatar-box {
  width: 52px;
  height: 52px;
  border-radius: 50%;
  background: #0D7C66;
  border: 2px solid #0D7C66;
  color: #FFFFFF;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.25rem;
  font-weight: 800;
}

/* Sélecteur de classe CSS */
.admin-info {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

/* Sélecteur de classe CSS */
.name-row {
  display: flex;
  align-items: center;
  gap: 10px;
}

/* Sélecteur de classe CSS */
.admin-title {
  font-size: 1.15rem;
  font-weight: 700;
  color: #090D14;
  margin: 0;
}

/* Sélecteur de classe CSS */
.role-tag {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  background: #0D7C66;
  color: #FFFFFF;
  border: 1px solid #0D7C66;
  font-size: 0.72rem;
  font-weight: 700;
  padding: 2px 8px;
  border-radius: 4px;
}

/* Sélecteur de classe CSS */
.info-chips {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

/* Sélecteur de classe CSS */
.info-chip {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  background: #F8FAFC;
  border: 1px solid #E2E8F0;
  padding: 3px 8px;
  border-radius: 4px;
  font-size: 0.75rem;
  color: #475569;
}

/* 2-Columns */
.profile-columns {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
}

/* Sélecteur de classe CSS */
.flat-card {
  background: #FFFFFF;
  border: 1px solid var(--border-color);
  border-radius: var(--radius-md);
  padding: 20px 22px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

/* Sélecteur de classe CSS */
.card-title-row {
  display: flex;
  align-items: center;
  gap: 10px;
  padding-bottom: 12px;
  border-bottom: 1px solid #F1F5F9;
}

/* Sélecteur de classe CSS */
.icon-indicator {
  width: 32px;
  height: 32px;
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
}

/* Sélecteur de classe CSS */
.icon-vert {
  background: rgba(13, 124, 102, 0.1);
  color: #0D7C66;
  border: 1px solid rgba(13, 124, 102, 0.2);
}

/* Sélecteur de classe CSS */
.icon-blue {
  background: #EFF6FF;
  color: #2563EB;
  border: 1px solid #DBEAFE;
}

/* Sélecteur de classe CSS */
.card-heading {
  font-size: 0.92rem;
  font-weight: 700;
  color: #090D14;
  margin: 0;
}

/* Sélecteur de classe CSS */
.card-subheading {
  font-size: 0.72rem;
  color: var(--text-muted);
}

/* Form */
.form-body {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

/* Sélecteur de classe CSS */
.row-2 {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}

/* Sélecteur de classe CSS */
.field-item {
  display: flex;
  flex-direction: column;
  gap: 5px;
}

/* Sélecteur de classe CSS */
.field-title {
  font-size: 0.75rem;
  font-weight: 600;
  color: #334155;
}

/* Sélecteur de classe CSS */
.input-wrap {
  position: relative;
  display: flex;
  align-items: center;
}

/* Sélecteur de classe CSS */
.input-icon {
  position: absolute;
  left: 10px;
  color: #94A3B8;
}

/* Sélecteur de classe CSS */
.form-control {
  width: 100%;
  padding: 8px 34px 8px 32px;
  border: 1px solid #CBD5E1;
  border-radius: var(--radius-sm);
  font-size: 0.82rem;
  background: #FFFFFF;
  color: #090D14;
  transition: border-color 0.15s ease;
}

/* Sélecteur de classe CSS */
.form-control:focus {
  outline: none;
  border-color: #0D7C66;
}

/* Sélecteur de classe CSS */
.eye-btn {
  position: absolute;
  right: 8px;
  background: transparent;
  border: none;
  color: #94A3B8;
  cursor: pointer;
  padding: 4px;
  display: flex;
  align-items: center;
}

/* Sélecteur de classe CSS */
.eye-btn:hover {
  color: #090D14;
}

/* Progress */
.progress-wrap {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 4px;
}

/* Sélecteur de classe CSS */
.progress-track {
  flex: 1;
  height: 4px;
  background: #E2E8F0;
  border-radius: 2px;
  overflow: hidden;
}

/* Sélecteur de classe CSS */
.progress-fill {
  height: 100%;
  transition: width 0.2s ease, background-color 0.2s ease;
}

/* Sélecteur de classe CSS */
.progress-text {
  font-size: 0.7rem;
  font-weight: 700;
  min-width: 50px;
  text-align: right;
}

/* Sélecteur de classe CSS */
.match-box {
  margin-top: 2px;
}

/* Submit Buttons */
.submit-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 9px 14px;
  border-radius: var(--radius-sm);
  font-size: 0.82rem;
  font-weight: 600;
  border: none;
  cursor: pointer;
  margin-top: 4px;
  transition: background 0.15s ease;
}

/* Sélecteur de classe CSS */
.btn-vert {
  background: #0D7C66;
  color: #FFFFFF;
}

/* Sélecteur de classe CSS */
.btn-vert:hover:not(:disabled) {
  background: #096352;
}

/* Sélecteur de classe CSS */
.btn-dark {
  background: #0F172A;
  color: #FFFFFF;
}

/* Sélecteur de classe CSS */
.btn-dark:hover:not(:disabled) {
  background: #1E293B;
}

/* Sélecteur de classe CSS */
.submit-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* Footer Bar */
.footer-bar {
  background: #FFFFFF;
  border: 1px solid var(--border-color);
  border-radius: var(--radius-sm);
  padding: 10px 16px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

/* Sélecteur de classe CSS */
.footer-info {
  font-size: 0.76rem;
  color: #64748B;
}

/* Sélecteur de classe CSS */
.footer-buttons {
  display: flex;
  align-items: center;
  gap: 8px;
}

/* Sélecteur de classe CSS */
.footer-btn {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  background: #F8FAFC;
  border: 1px solid #CBD5E1;
  color: #334155;
  padding: 5px 10px;
  border-radius: 4px;
  font-size: 0.74rem;
  font-weight: 600;
  cursor: pointer;
}

/* Sélecteur de classe CSS */
.footer-btn:hover {
  background: #E2E8F0;
  color: #090D14;
}

/* Sélecteur de classe CSS */
.btn-danger-flat {
  color: #DC2626;
  border-color: #FECACA;
  background: #FEF2F2;
}

/* Sélecteur de classe CSS */
.btn-danger-flat:hover {
  background: #DC2626;
  color: #FFFFFF;
  border-color: #DC2626;
}

@media (max-width: 900px) {
  /* Sélecteur de classe CSS */
  .admin-header-card {
    flex-direction: column;
    align-items: flex-start;
    gap: 14px;
  }
  /* Sélecteur de classe CSS */
  .profile-columns {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 600px) {
  /* Sélecteur de classe CSS */
  .header-main {
    flex-direction: column;
    align-items: center;
    text-align: center;
  }
  /* Sélecteur de classe CSS */
  .name-row {
    flex-direction: column;
    align-items: center;
    gap: 8px;
  }
  /* Sélecteur de classe CSS */
  .info-chips {
    justify-content: center;
  }
  /* Sélecteur de classe CSS */
  .flat-card {
    padding: 16px;
  }
}
</style>

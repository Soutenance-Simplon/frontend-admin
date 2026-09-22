<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { authService, type AdminUser } from '../services/auth.service'
import { useToast } from '../composables/useToast'
import { useConfirm } from '../composables/useConfirm'
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
import { useRouter } from 'vue-router'

const toast = useToast()
const { confirm } = useConfirm()
const router = useRouter()

const currentUser = ref<AdminUser | null>(null)
const userDetails = ref<any>(null)
const loading = ref(true)

// Profile Form
const profileForm = ref({
  firstName: '',
  lastName: '',
  telephone: '',
  email: ''
})
const isSavingProfile = ref(false)

// Password Form
const passwordForm = ref({
  ancienMotDePasse: '',
  nouveauMotDePasse: '',
  confirmationMotDePasse: ''
})
const showOldPassword = ref(false)
const showNewPassword = ref(false)
const showConfirmPassword = ref(false)
const isChangingPassword = ref(false)

// Password Strength
const passwordCriteria = computed(() => {
  const p = passwordForm.value.nouveauMotDePasse
  return {
    length: p.length >= 8,
    hasUpper: /[A-Z]/.test(p),
    hasNumber: /[0-9]/.test(p),
    hasSpecial: /[^A-Za-z0-9]/.test(p)
  }
})

const passwordStrengthScore = computed(() => {
  const c = passwordCriteria.value
  let score = 0
  if (c.length) score += 1
  if (c.hasUpper) score += 1
  if (c.hasNumber) score += 1
  if (c.hasSpecial) score += 1
  return score
})

const passwordStrengthLabel = computed(() => {
  const s = passwordStrengthScore.value
  if (!passwordForm.value.nouveauMotDePasse) return ''
  if (s <= 1) return 'Faible'
  if (s === 2) return 'Moyen'
  if (s === 3) return 'Fort'
  return 'Conforme'
})

const passwordStrengthColor = computed(() => {
  const s = passwordStrengthScore.value
  if (s <= 1) return '#DC2626'
  if (s === 2) return '#D97706'
  if (s === 3) return '#0D7C66'
  return '#0D7C66'
})

const passwordsMatch = computed(() => {
  if (!passwordForm.value.confirmationMotDePasse) return null
  return passwordForm.value.nouveauMotDePasse === passwordForm.value.confirmationMotDePasse
})

const adminInitials = computed(() => {
  if (!currentUser.value) return 'AD'
  const f = currentUser.value.firstName?.[0] || ''
  const l = currentUser.value.lastName?.[0] || ''
  return (f + l).toUpperCase() || 'AD'
})

const fetchProfileData = async () => {
  loading.value = true
  try {
    const user = authService.getCurrentUser()
    currentUser.value = user

    if (user?.userId) {
      const details = await authService.getUserDetails(user.userId)
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

const handleSaveProfile = async () => {
  if (!currentUser.value?.userId) return
  if (!profileForm.value.firstName.trim() || !profileForm.value.lastName.trim() || !profileForm.value.telephone.trim()) {
    toast.warning('Prénom, nom et téléphone requis.')
    return
  }

  isSavingProfile.value = true
  try {
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

const handleChangePassword = async () => {
  if (!currentUser.value?.userId) return
  const { ancienMotDePasse, nouveauMotDePasse, confirmationMotDePasse } = passwordForm.value

  if (!nouveauMotDePasse) {
    toast.warning('Veuillez saisir votre nouveau mot de passe.')
    return
  }

  if (nouveauMotDePasse.length < 8) {
    toast.warning('Minimum 8 caractères requis.')
    return
  }

  if (nouveauMotDePasse !== confirmationMotDePasse) {
    toast.error('Les mots de passe ne correspondent pas.')
    return
  }

  isChangingPassword.value = true
  try {
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

const handleLogout = async () => {
  const confirmed = await confirm({
    title: 'Déconnexion',
    message: 'Fermer votre session administrateur ?',
    confirmText: 'Se déconnecter',
    cancelText: 'Annuler',
    variant: 'warning'
  })
  if (confirmed) {
    authService.logout()
    router.push('/login')
  }
}
</script>

<template>
  <div class="profile-page">
    <!-- Clean, Flat Admin Header Card -->
    <div class="admin-header-card">
      <div class="header-main">
        <div class="avatar-box">
          {{ adminInitials }}
        </div>

        <div class="admin-info">
          <div class="name-row">
            <h2 class="admin-title">{{ currentUser?.firstName }} {{ currentUser?.lastName }}</h2>
            <span class="role-tag">
              <ShieldCheck :size="13" />
              <span>{{ currentUser?.role || 'ADMIN' }}</span>
            </span>
          </div>

          <div class="info-chips">
            <span class="info-chip">
              <Smartphone :size="12" class="text-vert" />
              <span>{{ currentUser?.telephone }}</span>
            </span>
            <span v-if="userDetails?.email" class="info-chip">
              <Mail :size="12" class="text-vert" />
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
        <div class="card-title-row">
          <div class="icon-indicator icon-vert">
            <KeyRound :size="16" />
          </div>
          <div>
            <h3 class="card-heading">Modifier le mot de passe</h3>
            <span class="card-subheading">Sécurité et authentification du compte</span>
          </div>
        </div>

        <form @submit.prevent="handleChangePassword" class="form-body">
          <div class="field-item">
            <label class="field-title">Mot de passe actuel</label>
            <div class="input-wrap">
              <Lock :size="14" class="input-icon" />
              <input
                :type="showOldPassword ? 'text' : 'password'"
                v-model="passwordForm.ancienMotDePasse"
                placeholder="Votre mot de passe actuel..."
                class="form-control"
              />
              <button type="button" class="eye-btn" @click="showOldPassword = !showOldPassword">
                <EyeOff v-if="showOldPassword" :size="14" />
                <Eye v-else :size="14" />
              </button>
            </div>
          </div>

          <div class="field-item">
            <label class="field-title">Nouveau mot de passe</label>
            <div class="input-wrap">
              <KeyRound :size="14" class="input-icon" />
              <input
                :type="showNewPassword ? 'text' : 'password'"
                v-model="passwordForm.nouveauMotDePasse"
                placeholder="Minimum 8 caractères..."
                class="form-control"
                required
              />
              <button type="button" class="eye-btn" @click="showNewPassword = !showNewPassword">
                <EyeOff v-if="showNewPassword" :size="14" />
                <Eye v-else :size="14" />
              </button>
            </div>

            <!-- Clean Flat Progress Bar -->
            <div v-if="passwordForm.nouveauMotDePasse" class="progress-wrap">
              <div class="progress-track">
                <div
                  class="progress-fill"
                  :style="{
                    width: (passwordStrengthScore * 25) + '%',
                    backgroundColor: passwordStrengthColor
                  }"
                ></div>
              </div>
              <span class="progress-text" :style="{ color: passwordStrengthColor }">
                {{ passwordStrengthLabel }}
              </span>
            </div>
          </div>

          <div class="field-item">
            <label class="field-title">Confirmation du mot de passe</label>
            <div class="input-wrap">
              <Check :size="14" class="input-icon" />
              <input
                :type="showConfirmPassword ? 'text' : 'password'"
                v-model="passwordForm.confirmationMotDePasse"
                placeholder="Confirmez le nouveau mot de passe..."
                class="form-control"
                required
              />
              <button type="button" class="eye-btn" @click="showConfirmPassword = !showConfirmPassword">
                <EyeOff v-if="showConfirmPassword" :size="14" />
                <Eye v-else :size="14" />
              </button>
            </div>

            <div v-if="passwordsMatch !== null" class="match-box">
              <span v-if="passwordsMatch" class="text-vert text-xs font-bold">
                <CheckCircle2 :size="12" /> Les mots de passe correspondent
              </span>
              <span v-else class="text-danger text-xs font-bold">
                <AlertTriangle :size="12" /> Les mots de passe ne correspondent pas
              </span>
            </div>
          </div>

          <button
            type="submit"
            class="submit-btn btn-vert"
            :disabled="isChangingPassword || passwordForm.nouveauMotDePasse.length < 8 || passwordsMatch === false"
          >
            <KeyRound :size="14" />
            <span>{{ isChangingPassword ? 'Enregistrement...' : 'Mettre à jour le mot de passe' }}</span>
          </button>
        </form>
      </div>

      <!-- CARD 2: Coordonnées -->
      <div class="flat-card">
        <div class="card-title-row">
          <div class="icon-indicator icon-blue">
            <User :size="16" />
          </div>
          <div>
            <h3 class="card-heading">Coordonnées du compte</h3>
            <span class="card-subheading">Informations administratives</span>
          </div>
        </div>

        <form @submit.prevent="handleSaveProfile" class="form-body">
          <div class="row-2">
            <div class="field-item">
              <label class="field-title">Prénom</label>
              <div class="input-wrap">
                <User :size="14" class="input-icon" />
                <input
                  type="text"
                  v-model="profileForm.firstName"
                  placeholder="Prénom"
                  class="form-control"
                  required
                />
              </div>
            </div>

            <div class="field-item">
              <label class="field-title">Nom</label>
              <div class="input-wrap">
                <User :size="14" class="input-icon" />
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

          <div class="field-item">
            <label class="field-title">Téléphone (+221)</label>
            <div class="input-wrap">
              <Smartphone :size="14" class="input-icon" />
              <input
                type="tel"
                v-model="profileForm.telephone"
                placeholder="+221..."
                class="form-control"
                required
              />
            </div>
          </div>

          <div class="field-item">
            <label class="field-title">Email professionnel</label>
            <div class="input-wrap">
              <Mail :size="14" class="input-icon" />
              <input
                type="email"
                v-model="profileForm.email"
                placeholder="admin@diamyaraam.sn"
                class="form-control"
              />
            </div>
          </div>

          <button
            type="submit"
            class="submit-btn btn-dark"
            :disabled="isSavingProfile"
          >
            <Save :size="14" />
            <span>{{ isSavingProfile ? 'Enregistrement...' : 'Enregistrer les coordonnées' }}</span>
          </button>
        </form>
      </div>
    </div>

    <!-- Clean Bottom Bar -->
    <div class="footer-bar">
      <span class="footer-info">
        Session administrative active • Diam-Yaraam
      </span>

      <div class="footer-buttons">
        <button class="footer-btn" @click="fetchProfileData">
          <RefreshCw :size="13" />
          <span>Synchroniser</span>
        </button>
        <button class="footer-btn btn-danger-flat" @click="handleLogout">
          <LogOut :size="13" />
          <span>Se déconnecter</span>
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
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

.header-main {
  display: flex;
  align-items: center;
  gap: 16px;
}

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

.admin-info {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.name-row {
  display: flex;
  align-items: center;
  gap: 10px;
}

.admin-title {
  font-size: 1.15rem;
  font-weight: 700;
  color: #090D14;
  margin: 0;
}

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

.info-chips {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

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

.flat-card {
  background: #FFFFFF;
  border: 1px solid var(--border-color);
  border-radius: var(--radius-md);
  padding: 20px 22px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.card-title-row {
  display: flex;
  align-items: center;
  gap: 10px;
  padding-bottom: 12px;
  border-bottom: 1px solid #F1F5F9;
}

.icon-indicator {
  width: 32px;
  height: 32px;
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.icon-vert {
  background: rgba(13, 124, 102, 0.1);
  color: #0D7C66;
  border: 1px solid rgba(13, 124, 102, 0.2);
}

.icon-blue {
  background: #EFF6FF;
  color: #2563EB;
  border: 1px solid #DBEAFE;
}

.card-heading {
  font-size: 0.92rem;
  font-weight: 700;
  color: #090D14;
  margin: 0;
}

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

.row-2 {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}

.field-item {
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.field-title {
  font-size: 0.75rem;
  font-weight: 600;
  color: #334155;
}

.input-wrap {
  position: relative;
  display: flex;
  align-items: center;
}

.input-icon {
  position: absolute;
  left: 10px;
  color: #94A3B8;
}

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

.form-control:focus {
  outline: none;
  border-color: #0D7C66;
}

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

.progress-track {
  flex: 1;
  height: 4px;
  background: #E2E8F0;
  border-radius: 2px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  transition: width 0.2s ease, background-color 0.2s ease;
}

.progress-text {
  font-size: 0.7rem;
  font-weight: 700;
  min-width: 50px;
  text-align: right;
}

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

.btn-vert {
  background: #0D7C66;
  color: #FFFFFF;
}

.btn-vert:hover:not(:disabled) {
  background: #096352;
}

.btn-dark {
  background: #0F172A;
  color: #FFFFFF;
}

.btn-dark:hover:not(:disabled) {
  background: #1E293B;
}

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

.footer-info {
  font-size: 0.76rem;
  color: #64748B;
}

.footer-buttons {
  display: flex;
  align-items: center;
  gap: 8px;
}

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

.footer-btn:hover {
  background: #E2E8F0;
  color: #090D14;
}

.btn-danger-flat {
  color: #DC2626;
  border-color: #FECACA;
  background: #FEF2F2;
}

.btn-danger-flat:hover {
  background: #DC2626;
  color: #FFFFFF;
  border-color: #DC2626;
}

@media (max-width: 900px) {
  .admin-header-card {
    flex-direction: column;
    align-items: flex-start;
    gap: 14px;
  }
  .profile-columns {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 600px) {
  .header-main {
    flex-direction: column;
    align-items: center;
    text-align: center;
  }
  .name-row {
    flex-direction: column;
    align-items: center;
    gap: 8px;
  }
  .info-chips {
    justify-content: center;
  }
  .flat-card {
    padding: 16px;
  }
}
</style>

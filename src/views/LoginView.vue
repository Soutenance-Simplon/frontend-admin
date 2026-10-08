<script setup lang="ts">
// Importation du module ou composant
import { ref } from 'vue'
// Importation du module ou composant
import { useRouter } from 'vue-router'
// Importation du module ou composant
import { authService } from '../services/auth.service'
// Importation du module ou composant
import { useToast } from '../composables/useToast'
// Importation du module ou composant
import { Mail, Lock, Eye, EyeOff } from 'lucide-vue-next'

// Déclaration de variable
const router = useRouter()
// Déclaration de variable
const toast = useToast()

// Déclaration de variable
const telephone = ref('770000000')
// Déclaration de variable
const password = ref('monpasse')
// Déclaration de variable
const showPassword = ref(false)
// Déclaration de variable
const loading = ref(false)
// Déclaration de variable
const errorMessage = ref('')
// Déclaration de variable
const isShaking = ref(false)

// Déclaration de variable
const handleLogin = async () => {
  errorMessage.value = ''
  loading.value = true
  isShaking.value = false

  // Bloc d'essai pour gérer les erreurs
  try {
    // Déclaration de variable
    const user = await authService.login(telephone.value, password.value)
    toast.success(`Authentification réussie. Bienvenue, ${user.firstName} ${user.lastName}.`)
    router.push('/')
  } catch (err: any) {
    errorMessage.value = err.message || 'Email ou mot de passe incorrect'
    isShaking.value = true
    setTimeout(() => {
      isShaking.value = false
    }, 500)
  } finally {
    loading.value = false
  }
}

// Déclaration de variable
const fillAdminDemo = () => {
  telephone.value = '770000000'
  password.value = 'monpasse'
}
</script>

<template>
  <!-- Conteneur de bloc (div) -->
  <div class="scaffold">
    <!-- Conteneur de bloc (div) -->
    <div class="login-container">
      <!-- Conteneur de bloc (div) -->
      <div class="login-card" :class="{ 'shake-anim': isShaking }">
        <!-- LOGO -->
        <div class="logo-wrapper">
          <!-- Image -->
          <img
            src="@/assets/diamyaraam.png"
            alt="Diam-Yaraam"
            class="logo"
          />
        </div>

        <!-- MOTTO -->
        <p class="brand-subtitle">
          Fàggaru mo gën fadiou,aar sa yàram, aar sa dund
        </p>

        <!-- FORM -->
        <form @submit.prevent="handleLogin" class="form">
          <!-- EMAIL / TELEPHONE -->
          <div class="input-group-tel">
            <vue-tel-input
              v-model="telephone"
              mode="international"
              defaultCountry="SN"
              :dropdownOptions="{ showFlags: true, showDialCodeInSelection: true, showSearchBox: true }"
              :inputOptions="{ placeholder: 'Numéro de téléphone ou Email', autocomplete: 'username' }"
            ></vue-tel-input>
          </div>

          <!-- MOT DE PASSE -->
          <div class="input-group">
            <!-- Conteneur en ligne (span) -->
            <span class="prefix">
              <Lock :size="18" class="icon-lock" />
            </span>
            <!-- Champ de saisie utilisateur -->
            <input
              :type="showPassword ? 'text' : 'password'"
              v-model="password"
              placeholder="Mot de passe"
              required
              autocomplete="current-password"
              class="input-field"
            />
            <!-- Bouton cliquable -->
            <button
              type="button"
              class="suffix-btn"
              @click="showPassword = !showPassword"
              tabindex="-1"
            >
              <EyeOff v-if="showPassword" :size="18" />
              <Eye v-else :size="18" />
            </button>
          </div>

          <!-- BUTTON -->
          <button type="submit" class="btn-submit" :disabled="loading">
            <!-- Conteneur en ligne (span) -->
            <span v-if="loading" class="spinner"></span>
            <!-- Conteneur en ligne (span) -->
            <span v-else>Connexion</span>
          </button>

        

          <!-- ERROR -->
          <div v-if="errorMessage" class="error-msg">
            {{ errorMessage }}
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* Sélecteur de classe CSS */
.scaffold {
  min-height: 100vh;
  width: 100%;
  background-color: #0D7C66;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
}

/* Sélecteur de classe CSS */
.login-container {
  width: 100%;
  max-width: 900px;
  display: flex;
  justify-content: center;
}

/* Sélecteur de classe CSS */
.login-card {
  background: #F4F2F7;
  border-radius: 16px;
  padding: 40px 60px;
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
}

/* Sélecteur de classe CSS */
.shake-anim {
  animation: shake 0.5s ease-in-out;
}

@keyframes shake {
  0%, 100% { transform: translateX(0); }
  20% { transform: translateX(-10px); }
  40% { transform: translateX(10px); }
  60% { transform: translateX(-10px); }
  80% { transform: translateX(10px); }
}

/* Sélecteur de classe CSS */
.logo-wrapper {
  display: flex;
  justify-content: center;
  align-items: center;
}

/* Sélecteur de classe CSS */
.logo {
  width: 220px;
  height: auto;
  object-fit: contain;
}

/* Sélecteur de classe CSS */
.brand-subtitle {
  color: #0D7C66;
  font-size: 15px;
  font-weight: 500;
  text-align: center;
  margin: 10px 0 32px 0;
}

/* Sélecteur de classe CSS */
.form {
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

/* Sélecteur de classe CSS */
.input-group {
  position: relative;
  display: flex;
  align-items: center;
  background: #FFFFFF;
  border-radius: 12px;
  height: 52px;
}

/* Sélecteur de classe CSS */
.input-group-tel {
  width: 100%;
  height: 52px;
  background: #FFFFFF;
  border-radius: 12px;
}

:deep(.vue-tel-input) {
  border: none !important;
  border-radius: 12px !important;
  height: 100%;
  box-shadow: none !important;
  background: transparent;
}

:deep(.vue-tel-input:focus-within) {
  box-shadow: none !important;
  border: none !important;
}

:deep(.vti__input) {
  color: #0D7C66;
  font-size: 14px;
  background: transparent;
  padding-left: 8px;
}

:deep(.vti__input::placeholder) {
  color: #0D7C66;
  opacity: 0.8;
}

:deep(.vti__dropdown) {
  padding: 0 12px 0 16px;
  border-radius: 12px 0 0 12px;
}

:deep(.vti__dropdown:hover) {
  background: transparent;
}

:deep(.vti__selection) {
  font-size: 14px;
  color: #0D7C66;
}

/* Sélecteur de classe CSS */
.icon-lock {
  color: #0D7C66;
}

/* Sélecteur de classe CSS */
.input-field {
  flex: 1;
  border: none;
  background: transparent;
  padding: 0 16px;
  font-size: 14px;
  color: #0D7C66;
  outline: none;
}

/* Sélecteur de classe CSS */
.input-field::placeholder {
  color: #0D7C66;
  opacity: 0.8;
}

/* Sélecteur de classe CSS */
.suffix-btn {
  background: transparent;
  border: none;
  color: #0D7C66;
  padding-right: 16px;
  cursor: pointer;
  display: flex;
  align-items: center;
  transition: color 0.2s;
}

/* Sélecteur de classe CSS */
.suffix-btn:hover {
  color: #096352;
}

/* Sélecteur de classe CSS */
.btn-submit {
  background: #FFFFFF;
  border: none;
  border-radius: 12px;
  height: 52px;
  color: #0D7C66;
  font-weight: 700;
  font-size: 15px;
  cursor: pointer;
  transition: background-color 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-top: 8px;
}

/* Sélecteur de classe CSS */
.btn-submit:hover:not(:disabled) {
  background-color: #F8F9FA;
}

/* Sélecteur de classe CSS */
.btn-submit:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

/* Sélecteur de classe CSS */
.btn-link {
  background: transparent;
  border: none;
  color: #0D7C66;
  font-weight: 600;
  font-size: 14px;
  cursor: pointer;
  text-align: center;
}

/* Sélecteur de classe CSS */
.btn-link:hover {
  text-decoration: underline;
}

/* Sélecteur de classe CSS */
.error-msg {
  color: #DC2626;
  font-weight: 600;
  font-size: 14px;
  text-align: center;
  margin-top: 8px;
}

/* Sélecteur de classe CSS */
.spinner {
  width: 22px;
  height: 22px;
  border: 2.5px solid rgba(13, 124, 102, 0.2);
  border-top-color: #0D7C66;
  border-radius: 50%;
  animation: spin 0.7s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}
</style>

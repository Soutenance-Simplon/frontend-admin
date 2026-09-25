<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { authService } from '../services/auth.service'
import { useToast } from '../composables/useToast'
import { Mail, Lock, Eye, EyeOff } from 'lucide-vue-next'

const router = useRouter()
const toast = useToast()

const telephone = ref('+221770000000')
const password = ref('Fatou3112')
const showPassword = ref(false)
const loading = ref(false)
const errorMessage = ref('')
const isShaking = ref(false)

const handleLogin = async () => {
  errorMessage.value = ''
  loading.value = true
  isShaking.value = false

  try {
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

const fillAdminDemo = () => {
  telephone.value = '+221770000000'
  password.value = 'Fatou3112'
}
</script>

<template>
  <div class="scaffold">
    <div class="login-container">
      <div class="login-card" :class="{ 'shake-anim': isShaking }">
        <!-- LOGO -->
        <div class="logo-wrapper">
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
            <span class="prefix">
              <Lock :size="18" class="icon-lock" />
            </span>
            <input
              :type="showPassword ? 'text' : 'password'"
              v-model="password"
              placeholder="Mot de passe"
              required
              autocomplete="current-password"
              class="input-field"
            />
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
            <span v-if="loading" class="spinner"></span>
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
.scaffold {
  min-height: 100vh;
  width: 100%;
  background-color: #0D7C66;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
}

.login-container {
  width: 100%;
  max-width: 900px;
  display: flex;
  justify-content: center;
}

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

.logo-wrapper {
  display: flex;
  justify-content: center;
  align-items: center;
}

.logo {
  width: 220px;
  height: auto;
  object-fit: contain;
}

.brand-subtitle {
  color: #0D7C66;
  font-size: 15px;
  font-weight: 500;
  text-align: center;
  margin: 10px 0 32px 0;
}

.form {
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.input-group {
  position: relative;
  display: flex;
  align-items: center;
  background: #FFFFFF;
  border-radius: 12px;
  height: 52px;
}

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

.icon-lock {
  color: #0D7C66;
}

.input-field {
  flex: 1;
  border: none;
  background: transparent;
  padding: 0 16px;
  font-size: 14px;
  color: #0D7C66;
  outline: none;
}

.input-field::placeholder {
  color: #0D7C66;
  opacity: 0.8;
}

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

.suffix-btn:hover {
  color: #096352;
}

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

.btn-submit:hover:not(:disabled) {
  background-color: #F8F9FA;
}

.btn-submit:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

.btn-link {
  background: transparent;
  border: none;
  color: #0D7C66;
  font-weight: 600;
  font-size: 14px;
  cursor: pointer;
  text-align: center;
}

.btn-link:hover {
  text-decoration: underline;
}

.error-msg {
  color: #DC2626;
  font-weight: 600;
  font-size: 14px;
  text-align: center;
  margin-top: 8px;
}

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

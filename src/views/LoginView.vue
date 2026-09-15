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
  <div class="flutter-scaffold">
    <div class="login-container">
      <div class="flutter-card" :class="{ 'shake-anim': isShaking }">
        <!-- LOGO FLUTTER (diamyaraam.png) -->
        <div class="logo-wrapper">
          <img
            src="@/assets/diamyaraam.png"
            alt="Diam-Yaraam"
            class="flutter-logo"
          />
        </div>

        <!-- WOLOF SUBTITLE / MOTTO -->
        <p class="flutter-subtitle">
          Fàggaru mo gën fadiou,aar sa yàram, aar sa dund
        </p>

        <!-- FORM -->
        <form @submit.prevent="handleLogin" class="flutter-form">
          <!-- EMAIL / TELEPHONE -->
          <div class="flutter-field">
            <label class="field-label">Email ou Téléphone</label>
            <div class="input-container">
              <span class="prefix-icon">
                <Mail :size="18" :stroke-width="1.8" />
              </span>
              <input
                type="text"
                v-model="telephone"
                placeholder="+221..."
                required
                autocomplete="username"
                class="flutter-input"
              />
            </div>
          </div>

          <!-- MOT DE PASSE -->
          <div class="flutter-field">
            <label class="field-label">Mot de passe</label>
            <div class="input-container">
              <span class="prefix-icon">
                <Lock :size="18" :stroke-width="1.8" />
              </span>
              <input
                :type="showPassword ? 'text' : 'password'"
                v-model="password"
                placeholder="Mot de passe"
                required
                autocomplete="current-password"
                class="flutter-input with-suffix"
              />
              <button
                type="button"
                class="suffix-eye-btn"
                @click="showPassword = !showPassword"
                tabindex="-1"
              >
                <EyeOff v-if="showPassword" :size="18" :stroke-width="1.8" />
                <Eye v-else :size="18" :stroke-width="1.8" />
              </button>
            </div>
          </div>

          <!-- BUTTON ELEVATED BUTTON -->
          <button
            type="submit"
            class="flutter-elevated-button"
            :disabled="loading"
          >
            <span v-if="loading" class="spinner-small"></span>
            <span v-else class="button-text">Connexion</span>
          </button>

          <!-- REGISTER / DEMO TEXT BUTTON -->
          <button
            type="button"
            class="flutter-text-button"
            @click="fillAdminDemo"
          >
          </button>

          <!-- ERROR MESSAGE -->
          <div v-if="errorMessage" class="flutter-error">
            {{ errorMessage }}
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* Page background matches Flutter Scaffold backgroundColor: AppColors.primary (#0D7C66) */
.flutter-scaffold {
  min-height: 100vh;
  width: 100vw;
  background-color: #0D7C66;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
}

.login-container {
  width: 100%;
  max-width: 440px;
  display: flex;
  justify-content: center;
}

/* Flutter Card with borderRadius: BorderRadius.circular(22), flat design (no shadow) */
.flutter-card {
  background: #FFFFFF;
  border-radius: 22px;
  padding: 28px;
  width: 100%;
  border: 1px solid rgba(255, 255, 255, 0.2);
  display: flex;
  flex-direction: column;
  align-items: center;
}

/* Shake animation on error matching Flutter ShakeController */
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

/* Logo diamyaraam.png */
.logo-wrapper {
  display: flex;
  justify-content: center;
  align-items: center;
  margin-bottom: 8px;
}

.flutter-logo {
  width: 250px;
  height: 155px;
  object-fit: contain;
}

/* Wolof subtitle style matching Flutter AppTextStyles.subtitle in brand green */
.flutter-subtitle {
  color: #0D7C66;
  font-size: 15px;
  font-weight: 600;
  text-align: center;
  margin: 0 0 28px 0;
  line-height: 1.4;
}

/* Form */
.flutter-form {
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.flutter-field {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.field-label {
  font-size: 13px;
  font-weight: 600;
  color: #0D7C66;
  margin-left: 4px;
}

.input-container {
  position: relative;
  display: flex;
  align-items: center;
}

.prefix-icon {
  position: absolute;
  left: 14px;
  color: #0D7C66;
  display: flex;
  align-items: center;
  justify-content: center;
  pointer-events: none;
}

.flutter-input {
  width: 100%;
  height: 48px;
  background-color: #FFFFFF;
  border: 1.5px solid #CBD5E1;
  border-radius: 12px;
  padding: 0 16px 0 44px;
  font-size: 15px;
  color: #0F172A;
  transition: border-color 0.2s ease;
}

.flutter-input.with-suffix {
  padding-right: 44px;
}

.flutter-input:focus {
  outline: none;
  border-color: #0D7C66;
}

.suffix-eye-btn {
  position: absolute;
  right: 12px;
  background: transparent;
  border: none;
  color: #94A3B8;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 4px;
  transition: color 0.15s;
}

.suffix-eye-btn:hover {
  color: #0D7C66;
}

/* Flutter ElevatedButton style */
.flutter-elevated-button {
  width: 100%;
  height: 50px;
  background-color: #0D7C66;
  color: #FFFFFF;
  border: none;
  border-radius: 14px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-top: 8px;
  transition: background-color 0.15s ease;
}

.flutter-elevated-button:hover:not(:disabled) {
  background-color: #096352;
}

.flutter-elevated-button:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

.button-text {
  font-size: 16px;
  font-weight: 700;
  letter-spacing: 0.2px;
}

/* Flutter TextButton style for link */
.flutter-text-button {
  background: transparent;
  border: none;
  color: #0D7C66;
  font-size: 14px;
  font-weight: 700;
  cursor: pointer;
  padding: 8px;
  margin-top: 4px;
  text-align: center;
  transition: opacity 0.15s;
}

.flutter-text-button:hover {
  text-decoration: underline;
  opacity: 0.85;
}

/* Error message matching Flutter */
.flutter-error {
  color: #DC2626;
  font-weight: 600;
  font-size: 14px;
  text-align: center;
  margin-top: 6px;
}

/* Spinner */
.spinner-small {
  width: 22px;
  height: 22px;
  border: 2.5px solid rgba(255, 255, 255, 0.4);
  border-top-color: #FFFFFF;
  border-radius: 50%;
  animation: spin 0.7s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}
</style>

<script setup lang="ts">
// Importation du module ou composant
import { computed, watch } from 'vue'
// Importation du module ou composant
import { useRoute, useRouter } from 'vue-router'
// Importation du module ou composant
import { authService } from '../../services/auth.service'
// Importation du module ou composant
import { useToast } from '../../composables/useToast'
// Importation du module ou composant
import { useConfirm } from '../../composables/useConfirm'
// Importation du module ou composant
import { useSidebar } from '../../composables/useSidebar'
// Importation du module ou composant
import {
  Activity,
  LayoutDashboard,
  Users,
  Stethoscope,
  HeartPulse,
  Calendar,
  ShieldCheck,
  LogOut,
  KeyRound,
  X
} from 'lucide-vue-next'

// Déclaration de variable
const route = useRoute()
// Déclaration de variable
const router = useRouter()
// Déclaration de variable
const toast = useToast()
// Déclaration de variable
const { confirm } = useConfirm()
// Déclaration de variable
const { isSidebarOpen, close } = useSidebar()

// Close sidebar automatically on navigation on mobile
watch(() => route.path, () => {
  close()
})

// Déclaration de variable
const currentUser = computed(() => authService.getCurrentUser())

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
const adminFullName = computed(() => {
  // Condition logique
  if (!currentUser.value) return 'Administrateur Système'
  // Retourne la valeur
  return `${currentUser.value.firstName} ${currentUser.value.lastName}`
})

// Déclaration de variable
const handleLogout = async () => {
  // Déclaration de variable
  const confirmed = await confirm({
    title: 'Déconnexion du Portail',
    message: 'Êtes-vous sûr de vouloir mettre fin à votre session d’administration sécurisée ?',
    confirmText: 'Se déconnecter',
    cancelText: 'Rester connecté',
    variant: 'warning'
  })
  // Condition logique
  if (confirmed) {
    authService.logout()
    toast.info('Session terminée avec succès.')
    router.push('/login')
  }
}
</script>

<template>
  <!-- Mobile drawer backdrop -->
  <div
    v-if="isSidebarOpen"
    class="sidebar-backdrop"
    @click="close"
    aria-hidden="true"
  ></div>

  <aside class="sidebar" :class="{ 'sidebar-open': isSidebarOpen }">
    <!-- Conteneur de bloc (div) -->
    <div class="brand-container">
      <!-- Lien de navigation Vue Router -->
      <router-link to="/" class="brand" @click="close">
        <!-- Image -->
        <img src="@/assets/diam-yaraam-emblem.png" alt="Logo Diam Yaraam" class="brand-emblem-img" />
        <!-- Conteneur de bloc (div) -->
        <div class="brand-text">
          <!-- Conteneur de bloc (div) -->
          <div class="brand-title">Diam Yaraam</div>
        </div>
      </router-link>
      <!-- Bouton cliquable -->
      <button class="sidebar-close-btn" @click="close" aria-label="Fermer le menu de navigation">
        <X :size="18" :stroke-width="2" />
      </button>
    </div>

    <nav class="sidebar-nav">
      <!-- Conteneur de bloc (div) -->
      <div class="nav-section-label">PILOTAGE</div>
      <!-- Lien de navigation Vue Router -->
      <router-link to="/" class="nav-item" :class="{ active: route.path === '/' }">
        <!-- Conteneur en ligne (span) -->
        <span class="icon"><LayoutDashboard :size="17" :stroke-width="1.8" /></span>
        <!-- Conteneur en ligne (span) -->
        <span>Vue d'ensemble</span>
      </router-link>

      <!-- Conteneur de bloc (div) -->
      <div class="nav-section-label">ACTIVITÉ MÉDICALE</div>
      <!-- Lien de navigation Vue Router -->
      <router-link to="/users" class="nav-item" :class="{ active: route.path === '/users' }">
        <!-- Conteneur en ligne (span) -->
        <span class="icon"><Users :size="17" :stroke-width="1.8" /></span>
        <!-- Conteneur en ligne (span) -->
        <span>Comptes & Accès</span>
      </router-link>

      <!-- Lien de navigation Vue Router -->
      <router-link to="/medecins" class="nav-item" :class="{ active: route.path === '/medecins' }">
        <!-- Conteneur en ligne (span) -->
        <span class="icon"><Stethoscope :size="17" :stroke-width="1.8" /></span>
        <!-- Conteneur en ligne (span) -->
        <span>Registre ONMS & Médecins</span>
      </router-link>

      <!-- Lien de navigation Vue Router -->
      <router-link to="/patients" class="nav-item" :class="{ active: route.path === '/patients' }">
        <!-- Conteneur en ligne (span) -->
        <span class="icon"><HeartPulse :size="17" :stroke-width="1.8" /></span>
        <!-- Conteneur en ligne (span) -->
        <span>Dossiers Patients</span>
      </router-link>

      <!-- Lien de navigation Vue Router -->
      <router-link to="/rendez-vous" class="nav-item" :class="{ active: route.path === '/rendez-vous' }">
        <!-- Conteneur en ligne (span) -->
        <span class="icon"><Calendar :size="17" :stroke-width="1.8" /></span>
        <!-- Conteneur en ligne (span) -->
        <span>Planning Consultations</span>
      </router-link>

      <!-- Conteneur de bloc (div) -->
      <div class="nav-section-label">SÉCURITÉ & AUDIT</div>
      <!-- Lien de navigation Vue Router -->
      <router-link to="/systeme" class="nav-item" :class="{ active: route.path === '/systeme' }">
        <!-- Conteneur en ligne (span) -->
        <span class="icon"><ShieldCheck :size="17" :stroke-width="1.8" /></span>
        <!-- Conteneur en ligne (span) -->
        <span>Journal d'Activité & Sécurité</span>
      </router-link>

      <!-- Conteneur de bloc (div) -->
      <div class="nav-section-label">MON COMPTE</div>
      <!-- Lien de navigation Vue Router -->
      <router-link to="/profil" class="nav-item" :class="{ active: route.path === '/profil' }">
        <!-- Conteneur en ligne (span) -->
        <span class="icon"><KeyRound :size="17" :stroke-width="1.8" /></span>
        <!-- Conteneur en ligne (span) -->
        <span>Profil & Mot de Passe</span>
      </router-link>
    </nav>

    <!-- Conteneur de bloc (div) -->
    <div class="sidebar-footer">
      <!-- Lien de navigation Vue Router -->
      <router-link to="/profil" class="admin-badge-card" title="Gérer mon profil et changer mon mot de passe">
        <!-- Conteneur de bloc (div) -->
        <div class="admin-avatar">
          {{ adminInitials }}
        </div>
        <!-- Conteneur de bloc (div) -->
        <div class="admin-meta">
          <!-- Conteneur de bloc (div) -->
          <div class="admin-name">{{ adminFullName }}</div>
          <!-- Conteneur de bloc (div) -->
          <div class="admin-role">{{ currentUser?.role || 'SUPER_ADMIN' }}</div>
        </div>
        <!-- Bouton cliquable -->
        <button class="btn-logout" @click.prevent="handleLogout" title="Déconnexion de la session">
          <LogOut :size="16" :stroke-width="1.8" />
        </button>
      </router-link>
    </div>
  </aside>
</template>

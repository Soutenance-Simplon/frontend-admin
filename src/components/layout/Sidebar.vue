<script setup lang="ts">
import { computed, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { authService } from '../../services/auth.service'
import { useToast } from '../../composables/useToast'
import { useConfirm } from '../../composables/useConfirm'
import { useSidebar } from '../../composables/useSidebar'
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

const route = useRoute()
const router = useRouter()
const toast = useToast()
const { confirm } = useConfirm()
const { isSidebarOpen, close } = useSidebar()

// Close sidebar automatically on navigation on mobile
watch(() => route.path, () => {
  close()
})

const currentUser = computed(() => authService.getCurrentUser())

const adminInitials = computed(() => {
  if (!currentUser.value) return 'AD'
  const f = currentUser.value.firstName?.[0] || ''
  const l = currentUser.value.lastName?.[0] || ''
  return (f + l).toUpperCase() || 'AD'
})

const adminFullName = computed(() => {
  if (!currentUser.value) return 'Administrateur Système'
  return `${currentUser.value.firstName} ${currentUser.value.lastName}`
})

const handleLogout = async () => {
  const confirmed = await confirm({
    title: 'Déconnexion du Portail',
    message: 'Êtes-vous sûr de vouloir mettre fin à votre session d’administration sécurisée ?',
    confirmText: 'Se déconnecter',
    cancelText: 'Rester connecté',
    variant: 'warning'
  })
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
    <div class="brand-container">
      <router-link to="/" class="brand" @click="close">
        <img src="@/assets/diam-yaraam-emblem.png" alt="Logo Diam Yaraam" class="brand-emblem-img" />
        <div class="brand-text">
          <div class="brand-title">Diam Yaraam</div>
        </div>
      </router-link>
      <button class="sidebar-close-btn" @click="close" aria-label="Fermer le menu de navigation">
        <X :size="18" :stroke-width="2" />
      </button>
    </div>

    <nav class="sidebar-nav">
      <div class="nav-section-label">PILOTAGE</div>
      <router-link to="/" class="nav-item" :class="{ active: route.path === '/' }">
        <span class="icon"><LayoutDashboard :size="17" :stroke-width="1.8" /></span>
        <span>Vue d'ensemble</span>
      </router-link>

      <div class="nav-section-label">ACTIVITÉ MÉDICALE</div>
      <router-link to="/users" class="nav-item" :class="{ active: route.path === '/users' }">
        <span class="icon"><Users :size="17" :stroke-width="1.8" /></span>
        <span>Comptes & Accès</span>
      </router-link>

      <router-link to="/medecins" class="nav-item" :class="{ active: route.path === '/medecins' }">
        <span class="icon"><Stethoscope :size="17" :stroke-width="1.8" /></span>
        <span>Registre ONMS & Médecins</span>
      </router-link>

      <router-link to="/patients" class="nav-item" :class="{ active: route.path === '/patients' }">
        <span class="icon"><HeartPulse :size="17" :stroke-width="1.8" /></span>
        <span>Dossiers Patients</span>
      </router-link>

      <router-link to="/rendez-vous" class="nav-item" :class="{ active: route.path === '/rendez-vous' }">
        <span class="icon"><Calendar :size="17" :stroke-width="1.8" /></span>
        <span>Planning Consultations</span>
      </router-link>

      <div class="nav-section-label">SÉCURITÉ & AUDIT</div>
      <router-link to="/systeme" class="nav-item" :class="{ active: route.path === '/systeme' }">
        <span class="icon"><ShieldCheck :size="17" :stroke-width="1.8" /></span>
        <span>Journal d'Activité & Sécurité</span>
      </router-link>

      <div class="nav-section-label">MON COMPTE</div>
      <router-link to="/profil" class="nav-item" :class="{ active: route.path === '/profil' }">
        <span class="icon"><KeyRound :size="17" :stroke-width="1.8" /></span>
        <span>Profil & Mot de Passe</span>
      </router-link>
    </nav>

    <div class="sidebar-footer">
      <router-link to="/profil" class="admin-badge-card" title="Gérer mon profil et changer mon mot de passe">
        <div class="admin-avatar">
          {{ adminInitials }}
        </div>
        <div class="admin-meta">
          <div class="admin-name">{{ adminFullName }}</div>
          <div class="admin-role">{{ currentUser?.role || 'SUPER_ADMIN' }}</div>
        </div>
        <button class="btn-logout" @click.prevent="handleLogout" title="Déconnexion de la session">
          <LogOut :size="16" :stroke-width="1.8" />
        </button>
      </router-link>
    </div>
  </aside>
</template>

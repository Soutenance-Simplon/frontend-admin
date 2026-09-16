<script setup lang="ts">
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { Calendar, Menu, LogOut } from 'lucide-vue-next'
import { useSidebar } from '../../composables/useSidebar'
import { authService } from '../../services/auth.service'
import { useToast } from '../../composables/useToast'
import { useConfirm } from '../../composables/useConfirm'

const route = useRoute()
const router = useRouter()
const toast = useToast()
const { confirm } = useConfirm()
const { toggle } = useSidebar()

const todayFormatted = computed(() => {
  const d = new Date()
  const dateStr = d.toLocaleDateString('fr-FR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  })
  return dateStr.charAt(0).toUpperCase() + dateStr.slice(1)
})

const handleLogout = async () => {
  const confirmed = await confirm({
    title: 'Déconnexion du Portail',
    message: 'Êtes-vous sûr de vouloir vous déconnecter de votre session administrateur ?',
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

const pageMetadata = computed(() => {
  switch (route.path) {
    case '/':
      return {
        title: "Tableau de Bord Exécutif",
        subtitle: 'Indicateurs d’activité globale et métriques de santé publique'
      }
    case '/users':
      return {
        title: 'Gestion des Utilisateurs & Droits',
        subtitle: 'Répertoire des comptes, politiques d’accès et contrôle de sécurité'
      }
    case '/medecins':
      return {
        title: 'Ordre National des Médecins (ONMS)',
        subtitle: 'Vérification ordinale et conformité d’exercice des praticiens'
      }
    case '/patients':
      return {
        title: 'Dossiers Médicaux & Patients',
        subtitle: 'Données cliniques, antécédents, contacts d’urgence et consentements'
      }
    case '/rendez-vous':
      return {
        title: 'Supervision des Consultations',
        subtitle: 'Gestion des consultations en cabinet et sessions de télémédecine'
      }
    case '/finances':
      return {
        title: 'Gestion Financière & Flux Monétaires',
        subtitle: 'Portefeuilles santé Diam-Yaraam et réconciliation des transactions'
      }
    case '/systeme':
      return {
        title: 'Journal d’Activité & Sécurité',
        subtitle: 'Traçabilité des accès, connexions et historique des opérations'
      }
    case '/profil':
      return {
        title: 'Profil Administrateur & Sécurité',
        subtitle: 'Gestion du compte, modification du mot de passe et politique de sécurité'
      }
    default:
      return {
        title: 'Administration Centrale',
        subtitle: 'Plateforme Médicale Intégrée Diam-Yaraam'
      }
  }
})
</script>

<template>
  <header class="topbar">
    <div class="topbar-left">
      <!-- Hamburger toggle button on mobile -->
      <button
        class="mobile-menu-btn"
        @click="toggle"
        aria-label="Ouvrir le menu de navigation"
        title="Menu de navigation"
      >
        <Menu :size="20" :stroke-width="2" />
      </button>

      <div class="page-header-info">
        <h1>{{ pageMetadata.title }}</h1>
        <p class="page-header-subtitle">{{ pageMetadata.subtitle }}</p>
      </div>
    </div>

    <div class="topbar-actions">
      <div class="topbar-date">
        <Calendar :size="14" :stroke-width="1.8" />
        <span class="date-text">{{ todayFormatted }}</span>
      </div>

      <!-- Bouton Déconnexion dans la Navbar -->
      <button
        class="topbar-logout-btn"
        @click="handleLogout"
        title="Déconnexion de la session administrateur"
      >
        <LogOut :size="14" :stroke-width="2" />
        <span class="logout-btn-text">Déconnexion</span>
      </button>
    </div>
  </header>
</template>

<style scoped>
.topbar-left {
  display: flex;
  align-items: center;
  gap: 14px;
  min-width: 0;
}

.mobile-menu-btn {
  display: none;
  background: transparent;
  border: 1px solid var(--border-color);
  color: var(--text-dark);
  padding: 6px;
  border-radius: var(--radius-sm);
  cursor: pointer;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  transition: all 0.15s ease;
}

.mobile-menu-btn:hover {
  background-color: var(--bg-alt);
  color: var(--primary);
  border-color: var(--primary);
}

.page-header-info {
  min-width: 0;
}

.page-header-info h1 {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.topbar-logout-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  background: #0D7C66;
  color: #FFFFFF;
  border: 1px solid #0D7C66;
  padding: 6px 14px;
  border-radius: var(--radius-sm);
  font-size: 0.78rem;
  font-weight: 700;
  cursor: pointer;
  white-space: nowrap;
  flex-shrink: 0;
  transition: all 0.2s ease;
}

.topbar-logout-btn:hover {
  background: #096352;
  border-color: #096352;
  color: #FFFFFF;
}

@media (max-width: 1024px) {
  .mobile-menu-btn {
    display: inline-flex;
  }
}

@media (max-width: 640px) {
  .page-header-subtitle {
    display: none;
  }
  .topbar-date {
    display: none;
  }
}

@media (max-width: 480px) {
  .topbar-logout-btn .logout-btn-text {
    display: none;
  }
  .topbar-logout-btn {
    padding: 6px 8px;
  }
}
</style>

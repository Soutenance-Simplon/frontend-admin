<script setup lang="ts">
// Importation du module ou composant
import { computed } from 'vue'
// Importation du module ou composant
import { useRoute, useRouter } from 'vue-router'
// Importation du module ou composant
import { Calendar, Menu, LogOut } from 'lucide-vue-next'
// Importation du module ou composant
import { useSidebar } from '../../composables/useSidebar'
// Importation du module ou composant
import { authService } from '../../services/auth.service'
// Importation du module ou composant
import { useToast } from '../../composables/useToast'
// Importation du module ou composant
import { useConfirm } from '../../composables/useConfirm'

// Déclaration de variable
const route = useRoute()
// Déclaration de variable
const router = useRouter()
// Déclaration de variable
const toast = useToast()
// Déclaration de variable
const { confirm } = useConfirm()
// Déclaration de variable
const { toggle } = useSidebar()

// Déclaration de variable
const todayFormatted = computed(() => {
  // Déclaration de variable
  const d = new Date()
  // Déclaration de variable
  const dateStr = d.toLocaleDateString('fr-FR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  })
  // Retourne la valeur
  return dateStr.charAt(0).toUpperCase() + dateStr.slice(1)
})

// Déclaration de variable
const handleLogout = async () => {
  // Déclaration de variable
  const confirmed = await confirm({
    title: 'Déconnexion du Portail',
    message: 'Êtes-vous sûr de vouloir vous déconnecter de votre session administrateur ?',
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

// Déclaration de variable
const pageMetadata = computed(() => {
  switch (route.path) {
    case '/':
      // Retourne la valeur
      return {
        title: "Tableau de Bord Exécutif",
        subtitle: 'Indicateurs d’activité globale et métriques de santé publique'
      }
    case '/users':
      // Retourne la valeur
      return {
        title: 'Gestion des Utilisateurs & Droits',
        subtitle: 'Répertoire des comptes, politiques d’accès et contrôle de sécurité'
      }
    case '/medecins':
      // Retourne la valeur
      return {
        title: 'Ordre National des Médecins (ONMS)',
        subtitle: 'Vérification ordinale et conformité d’exercice des praticiens'
      }
    case '/patients':
      // Retourne la valeur
      return {
        title: 'Dossiers Médicaux & Patients',
        subtitle: 'Données cliniques, antécédents, contacts d’urgence et consentements'
      }
    case '/rendez-vous':
      // Retourne la valeur
      return {
        title: 'Supervision des Consultations',
        subtitle: 'Gestion des consultations en cabinet et sessions de télémédecine'
      }
    case '/finances':
      // Retourne la valeur
      return {
        title: 'Gestion Financière & Flux Monétaires',
        subtitle: 'Portefeuilles santé Diam-Yaraam et réconciliation des transactions'
      }
    case '/systeme':
      // Retourne la valeur
      return {
        title: 'Journal d’Activité & Sécurité',
        subtitle: 'Traçabilité des accès, connexions et historique des opérations'
      }
    case '/profil':
      // Retourne la valeur
      return {
        title: 'Profil Administrateur & Sécurité',
        subtitle: 'Gestion du compte, modification du mot de passe et politique de sécurité'
      }
    default:
      // Retourne la valeur
      return {
        title: 'Administration Centrale',
        subtitle: 'Plateforme Médicale Intégrée Diam-Yaraam'
      }
  }
})
</script>

<template>
  <header class="topbar">
    <!-- Conteneur de bloc (div) -->
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

      <!-- Conteneur de bloc (div) -->
      <div class="page-header-info">
        <!-- Titre de section -->
        <h1>{{ pageMetadata.title }}</h1>
        <!-- Paragraphe de texte -->
        <p class="page-header-subtitle">{{ pageMetadata.subtitle }}</p>
      </div>
    </div>

    <!-- Conteneur de bloc (div) -->
    <div class="topbar-actions">
      <!-- Conteneur de bloc (div) -->
      <div class="topbar-date">
        <Calendar :size="14" :stroke-width="1.8" />
        <!-- Conteneur en ligne (span) -->
        <span class="date-text">{{ todayFormatted }}</span>
      </div>

      <!-- Bouton Déconnexion dans la Navbar -->
      <button
        class="topbar-logout-btn"
        @click="handleLogout"
        title="Déconnexion de la session administrateur"
      >
        <LogOut :size="14" :stroke-width="2" />
        <!-- Conteneur en ligne (span) -->
        <span class="logout-btn-text">Déconnexion</span>
      </button>
    </div>
  </header>
</template>

<style scoped>
/* Sélecteur de classe CSS */
.topbar-left {
  display: flex;
  align-items: center;
  gap: 14px;
  min-width: 0;
}

/* Sélecteur de classe CSS */
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

/* Sélecteur de classe CSS */
.mobile-menu-btn:hover {
  background-color: var(--bg-alt);
  color: var(--primary);
  border-color: var(--primary);
}

/* Sélecteur de classe CSS */
.page-header-info {
  min-width: 0;
}

/* Sélecteur de classe CSS */
.page-header-info h1 {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* Sélecteur de classe CSS */
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

/* Sélecteur de classe CSS */
.topbar-logout-btn:hover {
  background: #096352;
  border-color: #096352;
  color: #FFFFFF;
}

@media (max-width: 1024px) {
  /* Sélecteur de classe CSS */
  .mobile-menu-btn {
    display: inline-flex;
  }
}

@media (max-width: 640px) {
  /* Sélecteur de classe CSS */
  .page-header-subtitle {
    display: none;
  }
  /* Sélecteur de classe CSS */
  .topbar-date {
    display: none;
  }
}

@media (max-width: 480px) {
  /* Sélecteur de classe CSS */
  .topbar-logout-btn .logout-btn-text {
    display: none;
  }
  /* Sélecteur de classe CSS */
  .topbar-logout-btn {
    padding: 6px 8px;
  }
}
</style>

// Importation du module ou composant
import { createRouter, createWebHistory } from 'vue-router'
// Importation du module ou composant
import { authService } from '../services/auth.service'

// Importation du module ou composant
import LoginView from '../views/LoginView.vue'
// Importation du module ou composant
import DashboardView from '../views/DashboardView.vue'
// Importation du module ou composant
import UsersView from '../views/UsersView.vue'
// Importation du module ou composant
import MedecinsView from '../views/MedecinsView.vue'
// Importation du module ou composant
import PatientsView from '../views/PatientsView.vue'
// Importation du module ou composant
import RendezVousView from '../views/RendezVousView.vue'
// Importation du module ou composant
import FinancesView from '../views/FinancesView.vue'
// Importation du module ou composant
import SystemView from '../views/SystemView.vue'
// Importation du module ou composant
import ProfileView from '../views/ProfileView.vue'

// Déclaration de variable
const routes = [
  {
    path: '/login',
    name: 'login',
    component: LoginView,
    meta: { public: true }
  },
  {
    path: '/',
    name: 'dashboard',
    component: DashboardView,
    meta: { requiresAuth: true }
  },
  {
    path: '/users',
    name: 'users',
    component: UsersView,
    meta: { requiresAuth: true }
  },
  {
    path: '/medecins',
    name: 'medecins',
    component: MedecinsView,
    meta: { requiresAuth: true }
  },
  {
    path: '/patients',
    name: 'patients',
    component: PatientsView,
    meta: { requiresAuth: true }
  },
  {
    path: '/rendez-vous',
    name: 'rendez-vous',
    component: RendezVousView,
    meta: { requiresAuth: true }
  },
  {
    path: '/finances',
    name: 'finances',
    component: FinancesView,
    meta: { requiresAuth: true }
  },
  {
    path: '/systeme',
    name: 'systeme',
    component: SystemView,
    meta: { requiresAuth: true }
  },
  {
    path: '/profil',
    name: 'profil',
    component: ProfileView,
    meta: { requiresAuth: true }
  },
  {
    path: '/:pathMatch(.*)*',
    redirect: '/'
  }
]

// Déclaration de variable
const router = createRouter({
  history: createWebHistory(),
  routes
})

router.beforeEach((to, _from, next) => {
  // Déclaration de variable
  const isAuth = authService.isAuthenticated()

  // Condition logique
  if (to.meta.requiresAuth && !isAuth) {
    next('/login')
  } else if (to.path === '/login' && isAuth) {
    next('/')
  } else {
    next()
  }
})

// Exportation
export default router

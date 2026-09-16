import { createRouter, createWebHistory } from 'vue-router'
import { authService } from '../services/auth.service'

import LoginView from '../views/LoginView.vue'
import DashboardView from '../views/DashboardView.vue'
import UsersView from '../views/UsersView.vue'
import MedecinsView from '../views/MedecinsView.vue'
import PatientsView from '../views/PatientsView.vue'
import RendezVousView from '../views/RendezVousView.vue'
import FinancesView from '../views/FinancesView.vue'
import SystemView from '../views/SystemView.vue'
import ProfileView from '../views/ProfileView.vue'

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

const router = createRouter({
  history: createWebHistory(),
  routes
})

router.beforeEach((to, _from, next) => {
  const isAuth = authService.isAuthenticated()

  if (to.meta.requiresAuth && !isAuth) {
    next('/login')
  } else if (to.path === '/login' && isAuth) {
    next('/')
  } else {
    next()
  }
})

export default router

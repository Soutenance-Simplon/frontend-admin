<script setup lang="ts">
// Importation du module ou composant
import { computed } from 'vue'
// Importation du module ou composant
import { useRoute } from 'vue-router'
// Importation du module ou composant
import Sidebar from './components/layout/Sidebar.vue'
// Importation du module ou composant
import Navbar from './components/layout/Navbar.vue'
// Importation du module ou composant
import Toast from './components/common/Toast.vue'
// Importation du module ou composant
import ConfirmModal from './components/common/ConfirmModal.vue'

// Déclaration de variable
const route = useRoute()
// Déclaration de variable
const isLoginPage = computed(() => route.path === '/login')
</script>

<template>
  <!-- Conteneur de bloc (div) -->
  <div v-if="isLoginPage">
    <router-view />
  </div>

  <!-- Conteneur de bloc (div) -->
  <div v-else class="dashboard-layout">
    <Sidebar />
    <!-- Conteneur de bloc (div) -->
    <div class="main-wrapper">
      <Navbar />
      <main class="content-scroll">
        <router-view />
      </main>
    </div>
  </div>

  <Toast />
  <ConfirmModal />
</template>

<style>
@import './assets/main.css';
</style>

<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import Sidebar from './components/layout/Sidebar.vue'
import Navbar from './components/layout/Navbar.vue'
import Toast from './components/common/Toast.vue'
import ConfirmModal from './components/common/ConfirmModal.vue'

const route = useRoute()
const isLoginPage = computed(() => route.path === '/login')
</script>

<template>
  <div v-if="isLoginPage">
    <router-view />
  </div>

  <div v-else class="dashboard-layout">
    <Sidebar />
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

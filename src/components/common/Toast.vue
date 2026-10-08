<script setup lang="ts">
// Importation du module ou composant
import { useToast } from '../../composables/useToast'
// Importation du module ou composant
import { CheckCircle2, AlertCircle, AlertTriangle, Info } from 'lucide-vue-next'

// Déclaration de variable
const { toasts, remove } = useToast()

// Déclaration de variable
const getIconComponent = (type: string) => {
  switch (type) {
    case 'success': return CheckCircle2
    case 'error': return AlertCircle
    case 'warning': return AlertTriangle
    default: return Info
  }
}
</script>

<template>
  <!-- Conteneur de bloc (div) -->
  <div class="toast-container" v-if="toasts.length > 0">
    <!-- Conteneur de bloc (div) -->
    <div
      v-for="t in toasts"
      :key="t.id"
      :class="['toast', t.type]"
      @click="remove(t.id)"
      role="status"
    >
      <component :is="getIconComponent(t.type)" :size="18" :stroke-width="2" class="toast-icon-svg" />
      <!-- Conteneur en ligne (span) -->
      <span class="toast-text">{{ t.text }}</span>
    </div>
  </div>
</template>

<style scoped>
/* Sélecteur de classe CSS */
.toast-icon-svg {
  flex-shrink: 0;
}
/* Sélecteur de classe CSS */
.toast.success .toast-icon-svg {
  color: var(--success);
}
/* Sélecteur de classe CSS */
.toast.error .toast-icon-svg {
  color: var(--danger);
}
/* Sélecteur de classe CSS */
.toast.warning .toast-icon-svg {
  color: var(--warning);
}
/* Sélecteur de classe CSS */
.toast.info .toast-icon-svg {
  color: var(--info);
}
/* Sélecteur de classe CSS */
.toast-text {
  flex: 1;
}
</style>

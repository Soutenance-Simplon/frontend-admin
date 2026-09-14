<script setup lang="ts">
import { useToast } from '../../composables/useToast'
import { CheckCircle2, AlertCircle, AlertTriangle, Info } from 'lucide-vue-next'

const { toasts, remove } = useToast()

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
  <div class="toast-container" v-if="toasts.length > 0">
    <div
      v-for="t in toasts"
      :key="t.id"
      :class="['toast', t.type]"
      @click="remove(t.id)"
      role="status"
    >
      <component :is="getIconComponent(t.type)" :size="18" :stroke-width="2" class="toast-icon-svg" />
      <span class="toast-text">{{ t.text }}</span>
    </div>
  </div>
</template>

<style scoped>
.toast-icon-svg {
  flex-shrink: 0;
}
.toast.success .toast-icon-svg {
  color: var(--success);
}
.toast.error .toast-icon-svg {
  color: var(--danger);
}
.toast.warning .toast-icon-svg {
  color: var(--warning);
}
.toast.info .toast-icon-svg {
  color: var(--info);
}
.toast-text {
  flex: 1;
}
</style>

<script setup lang="ts">
import { X } from 'lucide-vue-next'

defineProps<{
  isOpen: boolean
  title: string
  maxWidth?: string
}>()

const emit = defineEmits<{
  (e: 'close'): void
}>()
</script>

<template>
  <Teleport to="body">
    <div v-if="isOpen" class="modal-overlay" @click.self="emit('close')">
      <div class="modal-content" :style="{ maxWidth: maxWidth || '600px' }">
        <div class="modal-header">
          <h2>{{ title }}</h2>
          <button class="btn-close-modal" @click="emit('close')" aria-label="Fermer la boîte de dialogue">
            <X :size="18" :stroke-width="2" />
          </button>
        </div>
        <div class="modal-body">
          <slot></slot>
        </div>
        <div v-if="$slots.footer" class="modal-footer">
          <slot name="footer"></slot>
        </div>
      </div>
    </div>
  </Teleport>
</template>

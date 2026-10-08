<script setup lang="ts">
// Importation du module ou composant
import { X } from 'lucide-vue-next'

defineProps<{
  isOpen: boolean
  title: string
  maxWidth?: string
}>()

// Déclaration de variable
const emit = defineEmits<{
  (e: 'close'): void
}>()
</script>

<template>
  <Teleport to="body">
    <!-- Conteneur de bloc (div) -->
    <div v-if="isOpen" class="modal-overlay" @click.self="emit('close')">
      <!-- Conteneur de bloc (div) -->
      <div class="modal-content" :style="{ maxWidth: maxWidth || '600px' }">
        <!-- Conteneur de bloc (div) -->
        <div class="modal-header">
          <!-- Titre de section -->
          <h2>{{ title }}</h2>
          <!-- Bouton cliquable -->
          <button class="btn-close-modal" @click="emit('close')" aria-label="Fermer la boîte de dialogue">
            <X :size="18" :stroke-width="2" />
          </button>
        </div>
        <!-- Conteneur de bloc (div) -->
        <div class="modal-body">
          <slot></slot>
        </div>
        <!-- Conteneur de bloc (div) -->
        <div v-if="$slots.footer" class="modal-footer">
          <slot name="footer"></slot>
        </div>
      </div>
    </div>
  </Teleport>
</template>

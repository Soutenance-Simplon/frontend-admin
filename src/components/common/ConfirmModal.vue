<script setup lang="ts">
// Importation du module ou composant
import { useConfirm } from '../../composables/useConfirm'
// Importation du module ou composant
import { AlertTriangle, AlertCircle, HelpCircle, X } from 'lucide-vue-next'

// Déclaration de variable
const { state, handleConfirm, handleCancel } = useConfirm()

// Déclaration de variable
const getIcon = (variant?: string) => {
  switch (variant) {
    case 'warning': return AlertTriangle
    case 'primary': return HelpCircle
    default: return AlertCircle
  }
}
</script>

<template>
  <Teleport to="body">
    <!-- Conteneur de bloc (div) -->
    <div v-if="state.isOpen" class="modal-overlay" @click.self="handleCancel">
      <!-- Conteneur de bloc (div) -->
      <div class="confirm-modal-content">
        <!-- Bouton cliquable -->
        <button class="confirm-close-btn" @click="handleCancel" aria-label="Fermer la boîte de dialogue">
          <X :size="16" :stroke-width="2" />
        </button>

        <!-- Conteneur de bloc (div) -->
        <div class="confirm-body">
          <!-- Conteneur de bloc (div) -->
          <div :class="['confirm-icon-badge', state.variant || 'danger']">
            <component :is="getIcon(state.variant)" :size="22" :stroke-width="2" />
          </div>

          <!-- Conteneur de bloc (div) -->
          <div class="confirm-text">
            <!-- Titre de section -->
            <h3 class="confirm-title">{{ state.title }}</h3>
            <!-- Paragraphe de texte -->
            <p class="confirm-message">{{ state.message }}</p>
          </div>
        </div>

        <!-- Conteneur de bloc (div) -->
        <div class="confirm-actions">
          <!-- Bouton cliquable -->
          <button type="button" class="btn btn-secondary" @click="handleCancel">
            {{ state.cancelText }}
          </button>
          <!-- Bouton cliquable -->
          <button
            type="button"
            :class="[
              'btn',
              state.variant === 'danger'
                ? 'btn-danger'
                : state.variant === 'warning'
                  ? 'btn-warning'
                  : 'btn-primary'
            ]"
            @click="handleConfirm"
          >
            {{ state.confirmText }}
          </button>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<style scoped>
/* Sélecteur de classe CSS */
.confirm-modal-content {
  position: relative;
  background: #FFFFFF;
  border-radius: var(--radius-md);
  max-width: 440px;
  width: 100%;
  padding: 22px;
  border: 1px solid var(--border-color);
  animation: modalPop 0.2s cubic-bezier(0.16, 1, 0.3, 1);
}

/* Sélecteur de classe CSS */
.confirm-close-btn {
  position: absolute;
  top: 14px;
  right: 14px;
  background: transparent;
  border: none;
  color: var(--text-light);
  cursor: pointer;
  padding: 4px;
  border-radius: var(--radius-sm);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  transition: all 0.15s;
}

/* Sélecteur de classe CSS */
.confirm-close-btn:hover {
  color: var(--text-dark);
  background: #F1F5F9;
}

/* Sélecteur de classe CSS */
.confirm-body {
  display: flex;
  gap: 16px;
  align-items: flex-start;
  margin-bottom: 20px;
}

/* Sélecteur de classe CSS */
.confirm-icon-badge {
  width: 44px;
  height: 44px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

/* Sélecteur de classe CSS */
.confirm-icon-badge.danger {
  background: var(--danger-light);
  color: var(--danger);
  border: 1px solid var(--danger-border);
}

/* Sélecteur de classe CSS */
.confirm-icon-badge.warning {
  background: var(--warning-light);
  color: var(--warning);
  border: 1px solid var(--warning-border);
}

/* Sélecteur de classe CSS */
.confirm-icon-badge.primary {
  background: var(--primary-light);
  color: var(--primary);
  border: 1px solid var(--primary-border);
}

/* Sélecteur de classe CSS */
.confirm-text {
  flex: 1;
  padding-top: 2px;
}

/* Sélecteur de classe CSS */
.confirm-title {
  font-size: 1rem;
  font-weight: 700;
  color: var(--text-dark);
  margin-bottom: 6px;
  letter-spacing: -0.01em;
}

/* Sélecteur de classe CSS */
.confirm-message {
  font-size: 0.85rem;
  color: var(--text-muted);
  line-height: 1.45;
}

/* Sélecteur de classe CSS */
.confirm-actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}
</style>

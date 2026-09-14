<script setup lang="ts">
import { useConfirm } from '../../composables/useConfirm'
import { AlertTriangle, AlertCircle, HelpCircle, X } from 'lucide-vue-next'

const { state, handleConfirm, handleCancel } = useConfirm()

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
    <div v-if="state.isOpen" class="modal-overlay" @click.self="handleCancel">
      <div class="confirm-modal-content">
        <button class="confirm-close-btn" @click="handleCancel" aria-label="Fermer la boîte de dialogue">
          <X :size="16" :stroke-width="2" />
        </button>

        <div class="confirm-body">
          <div :class="['confirm-icon-badge', state.variant || 'danger']">
            <component :is="getIcon(state.variant)" :size="22" :stroke-width="2" />
          </div>

          <div class="confirm-text">
            <h3 class="confirm-title">{{ state.title }}</h3>
            <p class="confirm-message">{{ state.message }}</p>
          </div>
        </div>

        <div class="confirm-actions">
          <button type="button" class="btn btn-secondary" @click="handleCancel">
            {{ state.cancelText }}
          </button>
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

.confirm-close-btn:hover {
  color: var(--text-dark);
  background: #F1F5F9;
}

.confirm-body {
  display: flex;
  gap: 16px;
  align-items: flex-start;
  margin-bottom: 20px;
}

.confirm-icon-badge {
  width: 44px;
  height: 44px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.confirm-icon-badge.danger {
  background: var(--danger-light);
  color: var(--danger);
  border: 1px solid var(--danger-border);
}

.confirm-icon-badge.warning {
  background: var(--warning-light);
  color: var(--warning);
  border: 1px solid var(--warning-border);
}

.confirm-icon-badge.primary {
  background: var(--primary-light);
  color: var(--primary);
  border: 1px solid var(--primary-border);
}

.confirm-text {
  flex: 1;
  padding-top: 2px;
}

.confirm-title {
  font-size: 1rem;
  font-weight: 700;
  color: var(--text-dark);
  margin-bottom: 6px;
  letter-spacing: -0.01em;
}

.confirm-message {
  font-size: 0.85rem;
  color: var(--text-muted);
  line-height: 1.45;
}

.confirm-actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}
</style>

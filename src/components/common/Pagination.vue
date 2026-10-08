<script setup lang="ts">
// Importation du module ou composant
import { computed } from 'vue'
// Importation du module ou composant
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-vue-next'

// Déclaration de variable
const props = withDefaults(
  defineProps<{
    currentPage: number
    totalItems: number
    pageSize?: number
    pageSizeOptions?: number[]
    showPageSize?: boolean
  }>(),
  {
    pageSize: 8,
    pageSizeOptions: () => [5, 8, 10, 20, 50],
    showPageSize: true
  }
)

// Déclaration de variable
const emit = defineEmits<{
  (e: 'update:currentPage', page: number): void
  (e: 'update:pageSize', size: number): void
}>()

// Déclaration de variable
const totalPages = computed(() => {
  // Retourne la valeur
  return Math.max(1, Math.ceil(props.totalItems / props.pageSize))
})

// Déclaration de variable
const startItem = computed(() => {
  // Condition logique
  if (props.totalItems === 0) return 0
  // Retourne la valeur
  return (props.currentPage - 1) * props.pageSize + 1
})

// Déclaration de variable
const endItem = computed(() => {
  // Retourne la valeur
  return Math.min(props.totalItems, props.currentPage * props.pageSize)
})

// Déclaration de variable
const setPage = (page: number) => {
  // Condition logique
  if (page < 1 || page > totalPages.value || page === props.currentPage) return
  emit('update:currentPage', page)
}

// Déclaration de variable
const handlePageSizeChange = (event: Event) => {
  // Déclaration de variable
  const target = event.target as HTMLSelectElement
  // Déclaration de variable
  const newSize = Number(target.value)
  emit('update:pageSize', newSize)
  emit('update:currentPage', 1)
}

// Compute visible page numbers with ellipsis
const pages = computed(() => {
  // Déclaration de variable
  const total = totalPages.value
  // Déclaration de variable
  const current = props.currentPage
  // Déclaration de variable
  const delta = 1 // how many pages around current

  // Condition logique
  if (total <= 7) {
    // Retourne la valeur
    return Array.from({ length: total }, (_, i) => i + 1)
  }

  // Déclaration de variable
  const range: (number | string)[] = []
  // Déclaration de variable
  const left = Math.max(2, current - delta)
  // Déclaration de variable
  const right = Math.min(total - 1, current + delta)

  range.push(1)

  // Condition logique
  if (left > 2) {
    range.push('...')
  }

  for (let i = left; i <= right; i++) {
    range.push(i)
  }

  // Condition logique
  if (right < total - 1) {
    range.push('...')
  }

  range.push(total)
  // Retourne la valeur
  return range
})
</script>

<template>
  <!-- Conteneur de bloc (div) -->
  <div class="pagination-container" v-if="totalItems > 0">
    <!-- Conteneur de bloc (div) -->
    <div class="pagination-info">
      <!-- Conteneur en ligne (span) -->
      <span class="info-text">
        Affichage de <strong>{{ startItem }}</strong> à <strong>{{ endItem }}</strong> sur <strong>{{ totalItems }}</strong> entrées
      </span>

      <!-- Conteneur de bloc (div) -->
      <div class="page-size-selector" v-if="showPageSize && totalItems > 5">
        <label for="page-size-select" class="size-label">Par page :</label>
        <select
          id="page-size-select"
          class="size-select"
          :value="pageSize"
          @change="handlePageSizeChange"
        >
          <option v-for="opt in pageSizeOptions" :key="opt" :value="opt">
            {{ opt }}
          </option>
        </select>
      </div>
    </div>

    <!-- Conteneur de bloc (div) -->
    <div class="pagination-controls" v-if="totalPages > 1">
      <!-- First page -->
      <button
        class="page-btn nav-btn"
        :disabled="currentPage === 1"
        @click="setPage(1)"
        title="Première page"
        aria-label="Première page"
      >
        <ChevronsLeft :size="15" :stroke-width="1.8" />
      </button>

      <!-- Previous page -->
      <button
        class="page-btn nav-btn"
        :disabled="currentPage === 1"
        @click="setPage(currentPage - 1)"
        title="Page précédente"
        aria-label="Page précédente"
      >
        <ChevronLeft :size="15" :stroke-width="1.8" />
      </button>

      <!-- Page Numbers -->
      <template v-for="(p, idx) in pages" :key="idx">
        <!-- Conteneur en ligne (span) -->
        <span v-if="p === '...'" class="page-ellipsis">…</span>
        <!-- Bouton cliquable -->
        <button
          v-else
          class="page-btn num-btn"
          :class="{ active: p === currentPage }"
          @click="setPage(Number(p))"
          :aria-current="p === currentPage ? 'page' : undefined"
        >
          {{ p }}
        </button>
      </template>

      <!-- Next page -->
      <button
        class="page-btn nav-btn"
        :disabled="currentPage === totalPages"
        @click="setPage(currentPage + 1)"
        title="Page suivante"
        aria-label="Page suivante"
      >
        <ChevronRight :size="15" :stroke-width="1.8" />
      </button>

      <!-- Last page -->
      <button
        class="page-btn nav-btn"
        :disabled="currentPage === totalPages"
        @click="setPage(totalPages)"
        title="Dernière page"
        aria-label="Dernière page"
      >
        <ChevronsRight :size="15" :stroke-width="1.8" />
      </button>
    </div>
  </div>
</template>

<style scoped>
/* Sélecteur de classe CSS */
.pagination-container {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 12px;
  padding: 12px 18px;
  background: #ffffff;
  border-top: 1px solid var(--border-color, #e2e8f0);
  border-bottom-left-radius: var(--radius-lg, 12px);
  border-bottom-right-radius: var(--radius-lg, 12px);
}

/* Sélecteur de classe CSS */
.pagination-info {
  display: flex;
  align-items: center;
  gap: 16px;
  flex-wrap: wrap;
}

/* Sélecteur de classe CSS */
.info-text {
  font-size: 12.5px;
  color: var(--text-muted, #64748b);
  letter-spacing: -0.01em;
}

/* Sélecteur de classe CSS */
.info-text strong {
  font-weight: 600;
  color: var(--text-dark, #090d14);
}

/* Sélecteur de classe CSS */
.page-size-selector {
  display: flex;
  align-items: center;
  gap: 6px;
}

/* Sélecteur de classe CSS */
.size-label {
  font-size: 12px;
  color: var(--text-muted, #64748b);
}

/* Sélecteur de classe CSS */
.size-select {
  height: 28px;
  padding: 0 8px;
  font-size: 12px;
  font-weight: 600;
  color: var(--text-body, #1e293b);
  background: #ffffff;
  border: 1px solid var(--border-color, #e2e8f0);
  border-radius: var(--radius-sm, 6px);
  outline: none;
  cursor: pointer;
  transition: all 0.15s ease;
}

/* Sélecteur de classe CSS */
.size-select:focus {
  border-color: var(--primary, #0D7C66);
}

/* Sélecteur de classe CSS */
.pagination-controls {
  display: flex;
  align-items: center;
  gap: 4px;
}

/* Sélecteur de classe CSS */
.page-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  height: 30px;
  min-width: 30px;
  padding: 0 8px;
  font-size: 12.5px;
  font-weight: 500;
  color: var(--text-body, #1e293b);
  background: #ffffff;
  border: 1px solid var(--border-color, #e2e8f0);
  border-radius: var(--radius-sm, 6px);
  cursor: pointer;
  transition: all 0.15s ease;
  user-select: none;
}

/* Sélecteur de classe CSS */
.page-btn:hover:not(:disabled):not(.active) {
  background: #f8fafc;
  border-color: #cbd5e1;
  color: var(--text-dark, #090d14);
}

/* Sélecteur de classe CSS */
.page-btn.active {
  background: var(--primary, #0D7C66);
  border-color: var(--primary, #0D7C66);
  color: #ffffff;
  font-weight: 600;
}

/* Sélecteur de classe CSS */
.page-btn:disabled {
  opacity: 0.35;
  cursor: not-allowed;
  background: #f8fafc;
  border-color: var(--border-color, #e2e8f0);
}

/* Sélecteur de classe CSS */
.page-ellipsis {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  height: 30px;
  width: 22px;
  font-size: 12px;
  color: var(--text-muted, #94a3b8);
  user-select: none;
}

@media (max-width: 640px) {
  /* Sélecteur de classe CSS */
  .pagination-container {
    flex-direction: column;
    align-items: center;
    text-align: center;
    gap: 10px;
  }
}
</style>

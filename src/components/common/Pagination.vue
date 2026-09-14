<script setup lang="ts">
import { computed } from 'vue'
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-vue-next'

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

const emit = defineEmits<{
  (e: 'update:currentPage', page: number): void
  (e: 'update:pageSize', size: number): void
}>()

const totalPages = computed(() => {
  return Math.max(1, Math.ceil(props.totalItems / props.pageSize))
})

const startItem = computed(() => {
  if (props.totalItems === 0) return 0
  return (props.currentPage - 1) * props.pageSize + 1
})

const endItem = computed(() => {
  return Math.min(props.totalItems, props.currentPage * props.pageSize)
})

const setPage = (page: number) => {
  if (page < 1 || page > totalPages.value || page === props.currentPage) return
  emit('update:currentPage', page)
}

const handlePageSizeChange = (event: Event) => {
  const target = event.target as HTMLSelectElement
  const newSize = Number(target.value)
  emit('update:pageSize', newSize)
  emit('update:currentPage', 1)
}

// Compute visible page numbers with ellipsis
const pages = computed(() => {
  const total = totalPages.value
  const current = props.currentPage
  const delta = 1 // how many pages around current

  if (total <= 7) {
    return Array.from({ length: total }, (_, i) => i + 1)
  }

  const range: (number | string)[] = []
  const left = Math.max(2, current - delta)
  const right = Math.min(total - 1, current + delta)

  range.push(1)

  if (left > 2) {
    range.push('...')
  }

  for (let i = left; i <= right; i++) {
    range.push(i)
  }

  if (right < total - 1) {
    range.push('...')
  }

  range.push(total)
  return range
})
</script>

<template>
  <div class="pagination-container" v-if="totalItems > 0">
    <div class="pagination-info">
      <span class="info-text">
        Affichage de <strong>{{ startItem }}</strong> à <strong>{{ endItem }}</strong> sur <strong>{{ totalItems }}</strong> entrées
      </span>

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
        <span v-if="p === '...'" class="page-ellipsis">…</span>
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

.pagination-info {
  display: flex;
  align-items: center;
  gap: 16px;
  flex-wrap: wrap;
}

.info-text {
  font-size: 12.5px;
  color: var(--text-muted, #64748b);
  letter-spacing: -0.01em;
}

.info-text strong {
  font-weight: 600;
  color: var(--text-dark, #090d14);
}

.page-size-selector {
  display: flex;
  align-items: center;
  gap: 6px;
}

.size-label {
  font-size: 12px;
  color: var(--text-muted, #64748b);
}

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

.size-select:focus {
  border-color: var(--primary, #0D7C66);
}

.pagination-controls {
  display: flex;
  align-items: center;
  gap: 4px;
}

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

.page-btn:hover:not(:disabled):not(.active) {
  background: #f8fafc;
  border-color: #cbd5e1;
  color: var(--text-dark, #090d14);
}

.page-btn.active {
  background: var(--primary, #0D7C66);
  border-color: var(--primary, #0D7C66);
  color: #ffffff;
  font-weight: 600;
}

.page-btn:disabled {
  opacity: 0.35;
  cursor: not-allowed;
  background: #f8fafc;
  border-color: var(--border-color, #e2e8f0);
}

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
  .pagination-container {
    flex-direction: column;
    align-items: center;
    text-align: center;
    gap: 10px;
  }
}
</style>

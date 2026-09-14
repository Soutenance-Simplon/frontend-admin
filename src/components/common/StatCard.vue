<script setup lang="ts">
import type { Component } from 'vue'

defineProps<{
  title: string
  value: string | number
  subText?: string
  icon?: string | Component
  themeColor?: 'vert' | 'noir' | 'blanc' | 'teal' | 'blue' | 'amber' | 'emerald' | 'green' | 'purple' | 'orange' | 'red'
  tag?: string
  tagType?: 'vert' | 'noir' | 'neutral'
}>()

const getThemeClass = (color?: string) => {
  switch (color) {
    case 'noir':
    case 'blue':
    case 'purple':
      return 'noir'
    case 'blanc':
    case 'amber':
    case 'orange':
      return 'blanc'
    case 'vert':
    case 'emerald':
    case 'green':
    case 'teal':
    default:
      return 'vert'
  }
}
</script>

<template>
  <div class="stat-card">
    <div class="stat-info">
      <div class="stat-header-row">
        <span class="stat-label">{{ title }}</span>
        <span v-if="tag" :class="['stat-tag', tagType || 'vert']">{{ tag }}</span>
      </div>
      <div class="stat-value">{{ value }}</div>
      <div v-if="subText" class="stat-sub">{{ subText }}</div>
    </div>
    <div :class="['stat-icon-wrapper', getThemeClass(themeColor)]">
      <component v-if="typeof icon !== 'string' && icon" :is="icon" :size="20" :stroke-width="1.8" />
      <span v-else-if="icon">{{ icon }}</span>
      <slot name="icon"></slot>
    </div>
  </div>
</template>

<style scoped>
.stat-header-row {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 6px;
  flex-wrap: wrap;
}

.stat-tag {
  display: inline-flex;
  align-items: center;
  font-size: 0.65rem;
  font-weight: 700;
  padding: 2px 7px;
  border-radius: var(--radius-sm, 4px);
  letter-spacing: 0.02em;
  text-transform: uppercase;
}

.stat-tag.vert {
  background: var(--primary-light);
  color: var(--primary);
  border: 1px solid var(--primary-border);
}

.stat-tag.noir {
  background: #090D14;
  color: #FFFFFF;
}

.stat-tag.neutral {
  background: #F1F5F9;
  color: #475569;
  border: 1px solid #CBD5E1;
}
</style>

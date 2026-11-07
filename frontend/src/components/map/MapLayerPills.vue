<script setup lang="ts">
import { Layers } from 'lucide-vue-next';

defineProps<{
  layerFilter: 'all' | 'vencidos' | 'abiertos';
  totalCount: number;
  openCount: number;
  overdueCount: number;
}>();

defineEmits<{
  (e: 'update:layerFilter', val: 'all' | 'vencidos' | 'abiertos'): void;
}>();
</script>

<template>
  <div class="layer-pills">
    <Layers :size="14" class="layer-icon" />
    <button
      class="layer-btn"
      :class="{ active: layerFilter === 'all' }"
      @click="$emit('update:layerFilter', 'all')"
    >
      Todos ({{ totalCount.toLocaleString() }})
    </button>
    <button
      class="layer-btn info"
      :class="{ active: layerFilter === 'abiertos' }"
      @click="$emit('update:layerFilter', 'abiertos')"
    >
      Solo Abiertos ({{ openCount.toLocaleString() }})
    </button>
    <button
      class="layer-btn danger"
      :class="{ active: layerFilter === 'vencidos' }"
      @click="$emit('update:layerFilter', 'vencidos')"
    >
      ⚠ Abiertos Vencidos ({{ overdueCount.toLocaleString() }})
    </button>
  </div>
</template>

<style scoped>
.layer-pills {
  display: flex;
  align-items: center;
  gap: 6px;
  flex-wrap: wrap;
}

.layer-icon {
  color: var(--text-muted);
  margin-right: 2px;
}

.layer-btn {
  background: var(--bg-subtle);
  border: 1px solid var(--border-subtle);
  color: var(--text-secondary);
  font-size: 0.76rem;
  font-weight: 600;
  padding: 5px 11px;
  border-radius: var(--radius-full);
  cursor: pointer;
  transition: all var(--transition-fast);
}

.layer-btn:hover {
  border-color: var(--color-accent, #1D4ED8);
  color: var(--text-primary);
}

.layer-btn.active {
  background: var(--color-accent-soft, #EFF6FF);
  border-color: var(--color-accent, #1D4ED8);
  color: var(--color-accent, #1D4ED8);
  font-weight: 700;
}

[data-theme="dark"] .layer-btn.active {
  background: rgba(30, 58, 138, 0.35);
  border-color: #38BDF8;
  color: #38BDF8;
}

.layer-btn.info.active {
  background: var(--sla-info-bg);
  border-color: var(--sla-info);
  color: var(--sla-info);
}

.layer-btn.danger.active {
  background: var(--sla-danger-bg);
  border-color: var(--sla-danger);
  color: var(--sla-danger);
}
</style>


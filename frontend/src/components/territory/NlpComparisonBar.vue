<script setup lang="ts">
import type { NlpClusterComparison } from '../../types/nlpGraph';

defineProps<{
  comparisons: NlpClusterComparison[];
  selectedId: string | null;
}>();

const emit = defineEmits<{
  (e: 'select', cluster: NlpClusterComparison): void;
}>();
</script>

<template>
  <div class="vs-comparison-bar">
    <div
      v-for="c in comparisons"
      :key="c.id"
      class="vs-card"
      :class="{ active: selectedId === c.id }"
      @click="emit('select', c)"
    >
      <div class="vs-card-header">
        <span class="cluster-dot" :style="{ backgroundColor: c.color }"></span>
        <b class="cluster-title">{{ c.name }}</b>
        <span class="vs-rate-badge">{{ c.tasa_cierre }}% resuelto</span>
      </div>

      <div class="vs-split-values">
        <div class="vs-val-side red-side">
          <span class="vs-lbl">🔴 Abiertos</span>
          <span class="vs-num">{{ c.abiertos_count }}</span>
          <span class="vs-mora">~{{ c.abiertos_mora }} d</span>
        </div>
        <div class="vs-divider">VS</div>
        <div class="vs-val-side green-side">
          <span class="vs-lbl">🟢 Cerrados</span>
          <span class="vs-num">{{ c.cerrados_count }}</span>
          <span class="vs-mora">~{{ c.cerrados_atencion }} d</span>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.vs-comparison-bar {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 8px;
  width: 100%;
}
.vs-card {
  background: var(--bg-card);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-sm);
  padding: 6px 10px;
  cursor: pointer;
  display: flex;
  flex-direction: column;
  gap: 4px;
  transition: all var(--transition-fast);
}
.vs-card:hover {
  border-color: var(--color-brand);
  background: var(--bg-hover);
}
.vs-card.active {
  border-color: var(--color-brand);
  box-shadow: 0 0 0 1px var(--color-brand);
  background: var(--bg-subtle);
}
.vs-card-header {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 0.74rem;
}
.cluster-dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  flex-shrink: 0;
}
.cluster-title {
  color: var(--text-primary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  flex: 1;
}
.vs-rate-badge {
  font-size: 0.68rem;
  font-weight: 700;
  color: var(--text-secondary);
}
.vs-split-values {
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: var(--bg-subtle);
  border-radius: 4px;
  padding: 3px 6px;
}
.vs-val-side {
  display: flex;
  flex-direction: column;
  align-items: center;
}
.vs-lbl {
  font-size: 0.64rem;
  color: var(--text-secondary);
}
.vs-num {
  font-size: 0.82rem;
  font-weight: 800;
  color: var(--text-primary);
  line-height: 1.1;
}
.vs-mora {
  font-size: 0.62rem;
  color: var(--text-secondary);
}
.red-side .vs-num {
  color: var(--color-danger, #BE123C);
}
.green-side .vs-num {
  color: var(--color-brand, #0F766E);
}
.vs-divider {
  font-size: 0.64rem;
  font-weight: 800;
  color: var(--text-secondary);
  opacity: 0.5;
}
@media (max-width: 1024px) {
  .vs-comparison-bar {
    grid-template-columns: repeat(2, 1fr);
  }
}
</style>

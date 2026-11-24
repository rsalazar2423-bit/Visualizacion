<script setup lang="ts">
export interface InlineKpiItem {
  label: string;
  value: string | number;
  tone?: 'brand' | 'danger' | 'neutral';
  tooltip?: string;
}

defineProps<{
  items: InlineKpiItem[];
}>();
</script>

<template>
  <div v-if="items.length > 0" class="inline-kpi-strip" role="status" aria-label="Indicadores del filtro actual">
    <div
      v-for="(item, idx) in items"
      :key="idx"
      class="kpi-pill"
      :class="`tone-${item.tone ?? 'neutral'}`"
      :title="item.tooltip || `${item.label}: ${item.value}`"
    >
      <span class="pill-lbl">{{ item.label }}</span>
      <strong class="pill-val">{{ typeof item.value === 'number' ? item.value.toLocaleString() : item.value }}</strong>
    </div>
  </div>
</template>

<style scoped>
.inline-kpi-strip {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  flex-wrap: wrap;
}

.kpi-pill {
  display: inline-flex;
  align-items: baseline;
  gap: 5px;
  height: 28px;
  padding: 0 9px;
  border-radius: var(--radius-full);
  background: var(--bg-subtle);
  border: 1px solid var(--border-subtle);
  line-height: 26px;
  white-space: nowrap;
}

.pill-lbl {
  font-size: 0.68rem;
  font-weight: 600;
  color: var(--text-secondary);
}

.pill-val {
  font-size: 0.78rem;
  font-weight: 800;
  color: var(--text-primary);
  font-variant-numeric: tabular-nums;
}

.tone-brand .pill-val {
  color: var(--sla-success);
}

.tone-danger {
  background: var(--sla-danger-bg);
  border-color: var(--sla-danger-border);
}

.tone-danger .pill-val {
  color: var(--sla-danger);
}

@media (max-width: 1180px) {
  .inline-kpi-strip {
    display: none;
  }
}
</style>

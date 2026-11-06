<script setup lang="ts">
defineProps<{
  title: string;
  value: string | number;
  subtitle?: string;
  badge?: string;
  color?: 'brand' | 'success' | 'info' | 'warning' | 'danger' | 'emerald' | 'mint' | 'amber' | 'terracotta' | 'cyan';
}>();
</script>

<template>
  <div :class="['kpi-card', color || 'brand']">
    <div class="kpi-header">
      <span class="kpi-title">{{ title }}</span>
      <span v-if="badge" class="kpi-mini-badge">{{ badge }}</span>
      <span v-else class="kpi-dot"></span>
    </div>
    <div class="kpi-value">{{ value }}</div>
    <div v-if="subtitle" class="kpi-subtitle">{{ subtitle }}</div>
  </div>
</template>

<style scoped>
.kpi-card {
  background: var(--bg-card);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-lg);
  padding: 18px 20px;
  box-shadow: var(--shadow-sm);
  display: flex;
  flex-direction: column;
  position: relative;
  overflow: hidden;
  transition: transform var(--transition-fast), box-shadow var(--transition-fast), border-color var(--transition-fast);
}

.kpi-card:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-md);
}

.kpi-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  margin-bottom: 8px;
}

.kpi-title {
  font-size: 0.78rem;
  font-weight: 700;
  color: var(--text-secondary);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.kpi-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  flex-shrink: 0;
}

.kpi-mini-badge {
  font-size: 0.68rem;
  font-weight: 700;
  padding: 2px 7px;
  border-radius: var(--radius-full);
  background: var(--bg-subtle);
  color: var(--text-secondary);
  white-space: nowrap;
}

.kpi-value {
  font-size: 1.8rem;
  font-weight: 800;
  color: var(--text-primary);
  line-height: 1.15;
  font-variant-numeric: tabular-nums;
  letter-spacing: -0.5px;
}

.kpi-subtitle {
  font-size: 0.78rem;
  color: var(--text-muted);
  margin-top: 6px;
  line-height: 1.35;
}

/* Semantic & Brand Color Accents (Sin colores huérfanos) */
.kpi-card.brand,
.kpi-card.emerald {
  border-left: 4px solid var(--color-brand);
}
.kpi-card.brand .kpi-dot,
.kpi-card.emerald .kpi-dot {
  background: var(--color-brand);
}

.kpi-card.success,
.kpi-card.mint {
  border-left: 4px solid var(--sla-success);
}
.kpi-card.success .kpi-dot,
.kpi-card.mint .kpi-dot {
  background: var(--sla-success);
}

.kpi-card.info,
.kpi-card.cyan {
  border-left: 4px solid var(--sla-info);
}
.kpi-card.info .kpi-dot,
.kpi-card.cyan .kpi-dot {
  background: var(--sla-info);
}

.kpi-card.warning,
.kpi-card.amber {
  border-left: 4px solid var(--sla-warning);
}
.kpi-card.warning .kpi-dot,
.kpi-card.amber .kpi-dot {
  background: var(--sla-warning);
}

.kpi-card.danger,
.kpi-card.terracotta {
  border-left: 4px solid var(--sla-danger);
}
.kpi-card.danger .kpi-dot,
.kpi-card.terracotta .kpi-dot {
  background: var(--sla-danger);
}
</style>

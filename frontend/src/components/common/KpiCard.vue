<script setup lang="ts">
defineProps<{
  title: string;
  value: string | number;
  subtitle?: string;
  color?: 'emerald' | 'mint' | 'amber' | 'terracotta' | 'cyan';
}>();
</script>

<template>
  <div :class="['kpi-card', color || 'emerald']">
    <div class="kpi-header">
      <span class="kpi-title">{{ title }}</span>
      <span class="kpi-dot"></span>
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
  transition: transform var(--transition-fast), box-shadow var(--transition-fast);
}

.kpi-card:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-md);
}

.kpi-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 8px;
}

.kpi-title {
  font-size: 0.82rem;
  font-weight: 600;
  color: var(--text-secondary);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.kpi-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
}

.kpi-value {
  font-size: 1.75rem;
  font-weight: 800;
  color: var(--text-primary);
  line-height: 1.2;
}

.kpi-subtitle {
  font-size: 0.78rem;
  color: var(--text-muted);
  margin-top: 6px;
}

/* Color Accents */
.kpi-card.emerald .kpi-dot { background: var(--color-emerald); }
.kpi-card.emerald { border-left: 4px solid var(--color-emerald); }

.kpi-card.mint .kpi-dot { background: var(--color-mint); }
.kpi-card.mint { border-left: 4px solid var(--color-mint); }

.kpi-card.amber .kpi-dot { background: var(--color-amber-light); }
.kpi-card.amber { border-left: 4px solid var(--color-amber-light); }

.kpi-card.terracotta .kpi-dot { background: var(--color-terracotta); }
.kpi-card.terracotta { border-left: 4px solid var(--color-terracotta); }

.kpi-card.cyan .kpi-dot { background: var(--color-cyan); }
.kpi-card.cyan { border-left: 4px solid var(--color-cyan); }
</style>

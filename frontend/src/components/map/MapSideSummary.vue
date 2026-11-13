<script setup lang="ts">
import type { MapLayerFilter } from './MapLayerPills.vue';

const props = defineProps<{
  timeMode: 'all' | 'cumulative' | 'single';
  selectedYear: number;
  layerFilter: MapLayerFilter;
  showLines: boolean;
  stats: {
    total: number;
    cumple: number;
    excedeCerrado: number;
    abiertoVencido: number;
    abiertoEnPlazo: number;
  };
  transmissionLinesCount: number;
}>();

const emit = defineEmits<{
  (e: 'update:layerFilter', val: MapLayerFilter): void;
  (e: 'toggle-lines'): void;
}>();

function toggleFilter(target: MapLayerFilter) {
  emit('update:layerFilter', props.layerFilter === target ? 'all' : target);
}
</script>

<template>
  <aside class="map-side-summary">
    <div class="period-indicator-box">
      <span class="period-caption">Corte Temporal Activo</span>
      <div class="period-big-year">
        {{ timeMode === 'all' ? '2008 – 2023' : (timeMode === 'cumulative' ? `Hasta ${selectedYear}` : `Año ${selectedYear}`) }}
      </div>
      <span class="period-sub">
        {{ timeMode === 'cumulative' ? 'Vista acumulada histórica' : (timeMode === 'single' ? 'Incidentes reportados en el año' : 'Total histórico consolidado') }}
      </span>
    </div>

    <div class="map-legend-metrics">
      <button
        type="button"
        class="map-metric-row clickable"
        :class="{ active: layerFilter === 'vencidos' }"
        title="Clic para filtrar solo Abiertos Vencidos"
        @click="toggleFilter('vencidos')"
      >
        <span class="dot-indicator danger-pulse"></span>
        <div class="metric-info">
          <span class="metric-label">Abiertos Vencidos</span>
          <span class="metric-sub">Prioridad superada (Alerta)</span>
        </div>
        <b class="metric-val danger-text">{{ stats.abiertoVencido.toLocaleString() }}</b>
      </button>

      <button
        type="button"
        class="map-metric-row clickable"
        :class="{ active: layerFilter === 'abiertos_plazo' }"
        title="Clic para filtrar solo Abiertos En Plazo (no vencidos)"
        @click="toggleFilter('abiertos_plazo')"
      >
        <span class="dot-indicator info-open"></span>
        <div class="metric-info">
          <span class="metric-label">Abiertos En Plazo</span>
          <span class="metric-sub">Activos dentro del SLA</span>
        </div>
        <b class="metric-val info-text">{{ stats.abiertoEnPlazo.toLocaleString() }}</b>
      </button>

      <button
        type="button"
        class="map-metric-row clickable"
        :class="{ active: layerFilter === 'cerrados' }"
        title="Clic para filtrar todos los avisos Cerrados"
        @click="toggleFilter('cerrados')"
      >
        <span class="dot-indicator success"></span>
        <div class="metric-info">
          <span class="metric-label">Cerrados (A Tiempo / Retraso)</span>
          <span class="metric-sub">{{ stats.cumple.toLocaleString() }} en plazo · {{ stats.excedeCerrado.toLocaleString() }} fuera SLA</span>
        </div>
        <b class="metric-val success-text">{{ (stats.cumple + stats.excedeCerrado).toLocaleString() }}</b>
      </button>

      <button
        type="button"
        class="map-metric-row line-row clickable"
        :class="{ active: showLines, dimmed: !showLines }"
        title="Clic para mostrar u ocultar las líneas de transmisión"
        @click="emit('toggle-lines')"
      >
        <span class="line-indicator"></span>
        <div class="metric-info">
          <span class="metric-label">Corredores Eléctricos</span>
          <span class="metric-sub">{{ showLines ? 'Visibles (clic para ocultar)' : 'Ocultos (clic para mostrar)' }}</span>
        </div>
        <b class="metric-val">{{ transmissionLinesCount }}</b>
      </button>
    </div>

    <div class="map-interaction-tip">
      💡 <b>Interacción:</b> Haz clic en una categoría para aislarla, usa la rueda para zoom o pulsa un nodo para filtrar territorio.
    </div>
  </aside>
</template>

<style scoped>
.map-side-summary {
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  gap: 12px;
  background: var(--bg-subtle);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-md);
  padding: 16px;
}

.period-indicator-box {
  display: flex;
  flex-direction: column;
  padding-bottom: 12px;
  border-bottom: 1px solid var(--border-subtle);
}

.period-caption {
  font-size: 0.7rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.6px;
  color: var(--text-muted);
}

.period-big-year {
  font-size: 1.65rem;
  font-weight: 800;
  color: var(--text-primary);
  line-height: 1.2;
  margin: 2px 0;
  font-variant-numeric: tabular-nums;
}

.period-sub {
  font-size: 0.76rem;
  color: var(--text-secondary);
}

.map-legend-metrics {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.map-metric-row {
  display: flex;
  align-items: center;
  gap: 10px;
  width: 100%;
  text-align: left;
  background: var(--bg-card);
  padding: 9px 12px;
  border-radius: var(--radius-sm);
  border: 1px solid var(--border-subtle);
  transition: all var(--transition-fast);
}

.map-metric-row.clickable {
  cursor: pointer;
}

.map-metric-row.clickable:hover {
  border-color: var(--color-brand);
  transform: translateY(-1px);
}

.map-metric-row.active {
  border-color: var(--color-brand);
  background: var(--color-brand-soft);
}

.map-metric-row.dimmed {
  opacity: 0.55;
}

.dot-indicator {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  flex-shrink: 0;
}

.dot-indicator.danger-pulse {
  background: var(--sla-danger);
  box-shadow: 0 0 0 4px var(--sla-danger-bg);
}

.dot-indicator.warning {
  background: var(--sla-warning);
  box-shadow: 0 0 0 1px rgba(255, 255, 255, 0.4);
}

.dot-indicator.info-open {
  background: var(--sla-info, #38BDF8);
  box-shadow: 0 0 0 1px rgba(255, 255, 255, 0.4);
}

.info-text {
  color: var(--sla-info, #38BDF8);
}

.dot-indicator.success {
  background: var(--sla-success, #059669);
  box-shadow: 0 0 0 1px rgba(255, 255, 255, 0.4);
}

.success-text {
  color: var(--sla-success, #059669);
}

.line-indicator {
  width: 14px;
  height: 3px;
  background: #475569;
  border-radius: 2px;
  flex-shrink: 0;
}

[data-theme="dark"] .line-indicator {
  background: #60A5FA;
}

.metric-info {
  display: flex;
  flex-direction: column;
  flex: 1;
}

.metric-label {
  font-size: 0.78rem;
  font-weight: 700;
  color: var(--text-primary);
}

.metric-sub {
  font-size: 0.68rem;
  color: var(--text-muted);
}

.metric-val {
  font-size: 0.95rem;
  font-weight: 800;
  font-variant-numeric: tabular-nums;
  color: var(--text-primary);
}

.danger-text { color: var(--sla-danger); }
.warning-text { color: var(--sla-warning); }
.neutral-text { color: var(--text-secondary); }

.map-interaction-tip {
  font-size: 0.74rem;
  line-height: 1.45;
  color: var(--text-secondary);
  background: var(--bg-card);
  padding: 10px 12px;
  border-radius: var(--radius-sm);
  border: 1px solid var(--border-subtle);
}
</style>


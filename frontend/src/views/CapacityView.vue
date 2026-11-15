<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { Sliders, ClipboardList, RefreshCw, RadioTower, AlertCircle, Gauge, CheckCircle2 } from 'lucide-vue-next';
import { useCapacityStore } from '../stores/capacityStore';
import CapacitySimulatorPanel from '../components/capacity/CapacitySimulatorPanel.vue';
import CoordinatorWorkspacePanel from '../components/capacity/CoordinatorWorkspacePanel.vue';

const store = useCapacityStore();
const activeSubView = ref<'simulator' | 'coordinator'>('simulator');

onMounted(() => {
  store.loadAll();
});
</script>

<template>
  <div class="viewport-clean-view">
    <!-- BARRA SUPERIOR COMPACTA: Título, Filtros Mínimos y Selector de Hoja (1 solo renglón) -->
    <header class="compact-control-bar card">
      <div class="brand-zone">
        <span class="badge badge-tag">03 · Capacidad</span>
      </div>

      <!-- Filtros mínimos: Zonas y Estado -->
      <div class="minimal-filters">
        <select
          :value="store.selectedCte"
          class="form-select-sm"
          @change="store.setCte(($event.target as HTMLSelectElement).value)"
        >
          <option value="Todos">Todas las CTEs (Nacional)</option>
          <option v-for="c in store.filterOptions.ctes" :key="c" :value="c">
            CTE {{ c }}
          </option>
        </select>

        <button
          v-if="store.selectedCte !== 'Todos'"
          class="btn-reset-icon"
          title="Restablecer filtros"
          @click="store.resetFilters"
        >
          <RefreshCw :size="13" />
        </button>
      </div>

      <!-- Pestañas de Hojas (2 sub-vistas accionables) -->
      <nav class="subview-toggle">
        <button
          class="toggle-btn"
          :class="{ active: activeSubView === 'simulator' }"
          @click="activeSubView = 'simulator'"
        >
          <Sliders :size="14" />
          <span>1. Simulador de Cuadrillas</span>
        </button>

        <button
          class="toggle-btn"
          :class="{ active: activeSubView === 'coordinator' }"
          @click="activeSubView = 'coordinator'"
        >
          <ClipboardList :size="14" />
          <span>2. Centro del Coordinador</span>
        </button>
      </nav>
    </header>

    <!-- KPIS EJECUTIVOS EN LÍNEA -->
    <div v-if="store.capacityData?.kpis" class="kpi-micro-row">
      <div class="kpi-micro-chip">
        <div class="kpi-main">
          <span class="chip-label">Torres Totales</span>
          <b class="chip-val">{{ store.capacityData.kpis.total_torres.toLocaleString() }}</b>
          <span class="chip-sub">Infraestructura monitoreada</span>
        </div>
        <div class="kpi-icon-box">
          <RadioTower :size="18" />
        </div>
      </div>
      <div class="kpi-micro-chip danger-chip">
        <div class="kpi-main">
          <span class="chip-label">Avisos Abiertos</span>
          <b class="chip-val danger-text">{{ store.capacityData.kpis.avisos_abiertos.toLocaleString() }}</b>
          <span class="chip-sub">{{ store.capacityData.kpis.abiertos_vencidos.toLocaleString() }} ya vencidos en mora</span>
        </div>
        <div class="kpi-icon-box danger-icon">
          <AlertCircle :size="18" />
        </div>
      </div>
      <div class="kpi-micro-chip">
        <div class="kpi-main">
          <span class="chip-label">Carga × 100 Torres</span>
          <b class="chip-val">{{ store.capacityData.kpis.carga_por_100_torres }}</b>
          <span class="chip-sub">Densidad operativa relativa</span>
        </div>
        <div class="kpi-icon-box">
          <Gauge :size="18" />
        </div>
      </div>
      <div class="kpi-micro-chip">
        <div class="kpi-main">
          <span class="chip-label">Cumplimiento SLA</span>
          <b class="chip-val success-text">{{ store.capacityData.kpis.cumplimiento_oportuno_pct }}%</b>
          <span class="chip-sub">Atención dentro del plazo</span>
        </div>
        <div class="kpi-icon-box">
          <CheckCircle2 :size="18" />
        </div>
      </div>
    </div>

    <!-- ÁREA DE CONTENIDO (VIEWPORT-FIT / CERO SCROLL) -->
    <main class="chart-viewport-stage">
      <!-- HOJA 1: Simulador Táctico de Cuadrillas (Hoja Dedicada) -->
      <section v-show="activeSubView === 'simulator'" class="stage-pane simulator-pane">
        <CapacitySimulatorPanel />
      </section>

      <!-- HOJA 2: Centro del Coordinador (Operación Diaria) -->
      <section v-show="activeSubView === 'coordinator'" class="stage-pane simulator-pane">
        <CoordinatorWorkspacePanel
          :cte="store.selectedCte"
          :depto="store.selectedDepto"
        />
      </section>
    </main>
  </div>
</template>

<style scoped>
.viewport-clean-view {
  display: flex;
  flex-direction: column;
  gap: 10px;
  flex: 1;
  min-height: 0;
}

/* Barra Superior de Control */
.compact-control-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 14px;
  padding: 8px 16px;
  background: var(--bg-card);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-md);
  flex-shrink: 0;
}

.brand-zone {
  display: flex;
  align-items: center;
}

.minimal-filters {
  display: flex;
  align-items: center;
  gap: 8px;
  flex: 1;
  max-width: 650px;
}

.form-select-sm {
  height: 32px;
  padding: 0 10px;
  font-size: 0.82rem;
  background: var(--bg-subtle);
  color: var(--text-primary);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-sm);
  outline: none;
  cursor: pointer;
}

.btn-reset-icon {
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--bg-subtle);
  color: var(--text-secondary);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-sm);
  cursor: pointer;
  transition: all 0.15s ease;
}

.btn-reset-icon:hover {
  color: var(--color-brand);
  border-color: var(--color-brand);
}

.subview-toggle {
  display: flex;
  align-items: center;
  gap: 4px;
  background: var(--bg-subtle);
  padding: 3px;
  border-radius: var(--radius-sm);
  border: 1px solid var(--border-subtle);
}

.toggle-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 5px 12px;
  border: none;
  background: transparent;
  color: var(--text-secondary);
  font-size: 0.82rem;
  font-weight: 600;
  border-radius: var(--radius-sm);
  cursor: pointer;
  transition: all 0.15s ease;
  white-space: nowrap;
}

.toggle-btn.active {
  background: var(--bg-card);
  color: var(--color-brand);
  font-weight: 700;
  box-shadow: var(--shadow-sm);
}

/* Micro KPIs */
.kpi-micro-row {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 10px;
  flex-shrink: 0;
}

.kpi-micro-chip {
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  padding: 10px 16px;
  background: var(--bg-card);
  border: 1px solid var(--border-subtle);
  border-left: 4px solid var(--color-brand, #0f766e);
  border-radius: var(--radius-md, 8px);
  box-shadow: var(--shadow-sm);
}

.kpi-main {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
}

.chip-label {
  color: var(--text-secondary);
  font-size: 0.7rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.chip-val {
  font-size: 1.65rem;
  line-height: 1.1;
  color: var(--text-primary);
  font-weight: 800;
  font-variant-numeric: tabular-nums;
}

.chip-sub {
  font-size: 0.72rem;
  color: var(--text-secondary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.kpi-icon-box {
  width: 38px;
  height: 38px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--color-brand-soft, rgba(15, 118, 110, 0.12));
  color: var(--color-brand, #0f766e);
  flex-shrink: 0;
}

.danger-chip {
  border-color: var(--sla-danger-border);
  border-left-color: var(--sla-danger, #be123c);
  background: var(--sla-danger-bg);
}

.kpi-icon-box.danger-icon {
  background: rgba(190, 18, 60, 0.14);
  color: var(--sla-danger, #be123c);
}

/* Escenario de Gráficas */
.chart-viewport-stage {
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
}

.stage-pane {
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
}

.stage-pane.dual-charts {
  display: grid;
  grid-template-columns: 1fr 1fr;
  grid-template-rows: 1fr;
  gap: 12px;
  min-height: 0;
  height: 100%;
}

.simulator-pane {
  overflow-y: auto;
}
</style>

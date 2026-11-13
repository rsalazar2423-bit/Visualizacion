<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { BarChart3, Sliders, RefreshCw } from 'lucide-vue-next';
import { useCapacityStore } from '../stores/capacityStore';
import RegionalLoadChart from '../components/charts/RegionalLoadChart.vue';
import ComplianceScatterChart from '../components/charts/ComplianceScatterChart.vue';
import CapacitySimulatorPanel from '../components/capacity/CapacitySimulatorPanel.vue';
import ExpandableChartCard from '../components/common/ExpandableChartCard.vue';

const store = useCapacityStore();
const activeSubView = ref<'diagnosis' | 'simulator'>('diagnosis');

function onSelectRegion(region: string) {
  if (store.filterOptions.ctes.includes(region)) {
    store.setCte(region);
  }
}

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

      <!-- Pestañas de Hojas (Máximo 2 gráficas por hoja) -->
      <nav class="subview-toggle">
        <button
          class="toggle-btn"
          :class="{ active: activeSubView === 'diagnosis' }"
          @click="activeSubView = 'diagnosis'"
        >
          <BarChart3 :size="14" />
          <span>1. Diagnóstico Regional & Dispersión (2 Gráficas)</span>
        </button>

        <button
          class="toggle-btn"
          :class="{ active: activeSubView === 'simulator' }"
          @click="activeSubView = 'simulator'"
        >
          <Sliders :size="14" />
          <span>2. Simulador de Cuadrillas (Hoja Táctica)</span>
        </button>
      </nav>
    </header>

    <!-- KPIS COMPACTOS EN LÍNEA (1 sola fila) -->
    <div v-if="store.capacityData?.kpis" class="kpi-micro-row">
      <div class="kpi-micro-chip">
        <span class="chip-label">Torres Totales:</span>
        <b class="chip-val">{{ store.capacityData.kpis.total_torres.toLocaleString() }}</b>
      </div>
      <div class="kpi-micro-chip danger-chip">
        <span class="chip-label">Avisos Abiertos:</span>
        <b class="chip-val danger-text">{{ store.capacityData.kpis.avisos_abiertos.toLocaleString() }}</b>
      </div>
      <div class="kpi-micro-chip">
        <span class="chip-label">Carga x 100 Torres:</span>
        <b class="chip-val">{{ store.capacityData.kpis.carga_por_100_torres }}</b>
      </div>
      <div class="kpi-micro-chip">
        <span class="chip-label">Cumplimiento:</span>
        <b class="chip-val success-text">{{ store.capacityData.kpis.cumplimiento_oportuno_pct }}%</b>
      </div>
    </div>

    <!-- ÁREA DE CONTENIDO (VIEWPORT-FIT / CERO SCROLL) -->
    <main class="chart-viewport-stage">
      <!-- HOJA 1: Exactamente 2 Gráficas en Paralelo (Ambas con botón para Ampliar) -->
      <section v-show="activeSubView === 'diagnosis'" class="stage-pane dual-charts">
        <ExpandableChartCard
          title="Carga Regional: Backlog Activo y Densidad de Torres"
          subtitle="Volumen de avisos pendientes (vencidos vs. en plazo) y presión operativa relativa por 100 torres"
        >
          <RegionalLoadChart
            :regions="store.capacityData?.regions || []"
            @select-region="onSelectRegion"
          />
        </ExpandableChartCard>

        <ExpandableChartCard
          title="Matriz de Dispersión: Carga de Trabajo vs. % Cumplimiento"
          subtitle="Correlación municipal entre volumen atendido y efectividad SLA. El tamaño indica mora acumulada."
        >
          <ComplianceScatterChart :items="store.capacityData?.municipios_scatter || []" />
        </ExpandableChartCard>
      </section>

      <!-- HOJA 2: Simulador Táctico de Cuadrillas (Hoja Dedicada) -->
      <section v-show="activeSubView === 'simulator'" class="stage-pane simulator-pane">
        <CapacitySimulatorPanel />
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
  align-items: center;
  justify-content: space-between;
  padding: 6px 14px;
  background: var(--bg-card);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-sm);
  font-size: 0.82rem;
}

.chip-label {
  color: var(--text-secondary);
  font-weight: 500;
}

.chip-val {
  font-size: 0.95rem;
  color: var(--text-primary);
  font-weight: 800;
}

.danger-chip {
  border-color: var(--sla-danger-border);
  background: var(--sla-danger-bg);
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
  gap: 12px;
}

.simulator-pane {
  overflow-y: auto;
}
</style>

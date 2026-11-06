<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { TrendingUp, Target, RefreshCw } from 'lucide-vue-next';
import { useOperationsStore } from '../stores/operationsStore';
import TimeEvolutionChart from '../components/charts/TimeEvolutionChart.vue';
import StackedBarChart from '../components/charts/StackedBarChart.vue';
import DonutChart from '../components/charts/DonutChart.vue';
import ExpandableChartCard from '../components/common/ExpandableChartCard.vue';

const opsStore = useOperationsStore();
const activeSubView = ref<'evolution' | 'sla'>('evolution');

onMounted(async () => {
  await opsStore.loadFilterOptions();
  await opsStore.fetchData();
});
</script>

<template>
  <div class="viewport-clean-view">
    <!-- BARRA SUPERIOR COMPACTA: Título, Filtros Mínimos y Selector de Hoja (1 solo renglón) -->
    <header class="compact-control-bar card">
      <div class="brand-zone">
        <span class="badge badge-tag">01 · Operaciones</span>
      </div>

      <!-- Filtros mínimos esenciales -->
      <div class="minimal-filters">
        <select
          :value="opsStore.selectedCte"
          class="form-select-sm"
          @change="opsStore.setCte(($event.target as HTMLSelectElement).value)"
        >
          <option v-for="c in opsStore.filterOptions.ctes" :key="c" :value="c">
            {{ c === 'Todos' ? 'Todas las CTEs' : `CTE ${c}` }}
          </option>
        </select>

        <select
          :value="opsStore.selectedDepto"
          class="form-select-sm"
          @change="opsStore.setDepto(($event.target as HTMLSelectElement).value)"
        >
          <option v-for="d in opsStore.filterOptions.departamentos" :key="d" :value="d">
            {{ d === 'Todos' ? 'Todos Deptos' : d }}
          </option>
        </select>

        <select
          :value="opsStore.selectedTipo"
          class="form-select-sm"
          @change="opsStore.setSingleTipo(($event.target as HTMLSelectElement).value)"
        >
          <option v-for="t in opsStore.filterOptions.tipos" :key="t" :value="t">
            {{ t === 'Todos' ? 'Todos los Tipos' : t }}
          </option>
        </select>

        <button
          v-if="opsStore.selectedCte !== 'Todos' || opsStore.selectedDepto !== 'Todos' || opsStore.selectedTipo !== 'Todos'"
          class="btn-reset-icon"
          title="Restablecer filtros"
          @click="opsStore.resetFilters"
        >
          <RefreshCw :size="13" />
        </button>
      </div>

      <!-- Pestañas de Hoja (Máximo 2 gráficas por hoja) -->
      <nav class="subview-toggle">
        <button
          class="toggle-btn"
          :class="{ active: activeSubView === 'evolution' }"
          title="Evolución Histórica (2008-2023)"
          @click="activeSubView = 'evolution'"
        >
          <TrendingUp :size="13" />
          <span>1. Evolución</span>
        </button>
        <button
          class="toggle-btn"
          :class="{ active: activeSubView === 'sla' }"
          title="Cumplimiento SLA por Prioridad y Tipología"
          @click="activeSubView = 'sla'"
        >
          <Target :size="13" />
          <span>2. SLA y Tipología</span>
        </button>
      </nav>
    </header>

    <!-- KPIS COMPACTOS EN LÍNEA (4 indicadores en 1 sola fila delgada) -->
    <div v-if="opsStore.data?.kpis" class="kpi-micro-row">
      <div class="kpi-micro-chip">
        <span class="chip-label">Cumplimiento:</span>
        <b class="chip-val success-text">{{ opsStore.data.kpis.cumple_pct }}%</b>
      </div>
      <div class="kpi-micro-chip">
        <span class="chip-label">Tiempo Típico:</span>
        <b class="chip-val">{{ opsStore.data.kpis.tiempo_tipico_mediana ?? opsStore.data.kpis.dias_prom ?? 0 }} días</b>
      </div>
      <div class="kpi-micro-chip">
        <span class="chip-label">Total Avisos:</span>
        <b class="chip-val">{{ opsStore.data.kpis.total.toLocaleString() }}</b>
      </div>
      <div class="kpi-micro-chip danger-chip">
        <span class="chip-label">Abiertos Vencidos:</span>
        <b class="chip-val danger-text">{{ (opsStore.data.kpis.abiertos_vencidos ?? 0).toLocaleString() }}</b>
      </div>
    </div>

    <!-- ÁREA DE GRÁFICAS: AJUSTADA EXACTAMENTE AL VIEWPORT (0 SCROLL) -->
    <main class="chart-viewport-stage">
      <!-- HOJA 1: 1 Sola Gráfica Grande con botón para Ampliar -->
      <section v-show="activeSubView === 'evolution'" class="stage-pane single-chart">
        <ExpandableChartCard
          title="Evolución de Avisos Ingresados vs. Cerrados y Tasa de Cumplimiento (2008 – 2023)"
          subtitle="Análisis histórico de la demanda de incidentes frente a la capacidad de cierre anual"
        >
          <TimeEvolutionChart />
        </ExpandableChartCard>
      </section>

      <!-- HOJA 2: Exactamente 2 Gráficas en Paralelo (Ambas con botón para Ampliar) -->
      <section v-show="activeSubView === 'sla'" class="stage-pane dual-charts">
        <ExpandableChartCard
          title="Cumplimiento de Plazo por Prioridad SLA (100%)"
          subtitle="Relación porcentual de atención oportuna frente a vencimiento"
        >
          <StackedBarChart />
        </ExpandableChartCard>

        <ExpandableChartCard
          title="Composición por Tipología Técnica"
          subtitle="Distribución proporcional de causas de mantenimiento sobre la red"
        >
          <DonutChart />
        </ExpandableChartCard>
      </section>
    </main>
  </div>
</template>

<style scoped>
.viewport-clean-view {
  display: flex;
  flex-direction: column;
  gap: 8px;
  height: 100%;
  max-height: 100%;
  overflow: hidden; /* CERO SCROLL */
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
</style>

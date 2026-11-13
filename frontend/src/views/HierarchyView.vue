<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { Compass, BarChart3, Layers, FileText, RefreshCw } from 'lucide-vue-next';
import { useTerritoryStore } from '../stores/territoryStore';
import HistoricalMapChart from '../components/charts/HistoricalMapChart.vue';
import TerritoryDiagnosticsRow from '../components/territory/TerritoryDiagnosticsRow.vue';
import TreemapPanel from '../components/territory/TreemapPanel.vue';
import SunburstPanel from '../components/territory/SunburstPanel.vue';
import TicketsTable from '../components/common/TicketsTable.vue';

const territoryStore = useTerritoryStore();
const activeSubView = ref<'map' | 'bottlenecks' | 'hierarchy' | 'audit'>('map');

onMounted(async () => {
  // Carga paralela de filtros y dataset para eliminar cuellos de botella en la inicialización
  await Promise.all([
    territoryStore.loadFilterOptions(),
    territoryStore.fetchData(),
  ]);
});
</script>

<template>
  <div class="viewport-clean-view">
    <!-- BARRA SUPERIOR COMPACTA: Título, Filtros Mínimos y Selector de Hoja (1 solo renglón) -->
    <header class="compact-control-bar card">
      <div class="brand-zone">
        <span class="badge badge-tag">02 · Territorio</span>
      </div>

      <!-- Controles mínimos: 3 Selectores -->
      <div class="minimal-filters">
        <select
          :value="territoryStore.selectedCte"
          class="form-select-sm"
          @change="territoryStore.setCte(($event.target as HTMLSelectElement).value)"
        >
          <option v-for="c in territoryStore.filterOptions.ctes" :key="c" :value="c">
            {{ c === 'Todos' ? 'Todas las CTEs' : `CTE ${c}` }}
          </option>
        </select>

        <select
          :value="territoryStore.selectedDepto || 'Todos'"
          class="form-select-sm"
          @change="territoryStore.setDepto(($event.target as HTMLSelectElement).value)"
        >
          <option v-for="d in territoryStore.filterOptions.departamentos" :key="d" :value="d">
            {{ d === 'Todos' ? 'Todos Deptos' : d }}
          </option>
        </select>

        <select
          :value="territoryStore.selectedMunicipio || 'Todos'"
          class="form-select-sm"
          @change="territoryStore.setCityDropdown(($event.target as HTMLSelectElement).value)"
        >
          <option value="Todos">Todos Municipios</option>
          <option
            v-for="m in territoryStore.filterOptions.municipios"
            :key="m.value"
            :value="m.value"
          >
            {{ m.label }}
          </option>
        </select>

        <button
          v-if="territoryStore.selectedCte !== 'Todos' || territoryStore.selectedDepto || territoryStore.selectedMunicipio"
          class="btn-reset-icon"
          title="Restablecer filtros"
          @click="territoryStore.resetAllFilters"
        >
          <RefreshCw :size="13" />
        </button>
      </div>

      <!-- Pestañas de Hojas (Máximo 2 gráficas por hoja) - Nombres ultracompactos -->
      <nav class="subview-toggle">
        <button
          class="toggle-btn"
          :class="{ active: activeSubView === 'map' }"
          title="Mapa de Red Georreferenciada"
          @click="activeSubView = 'map'"
        >
          <Compass :size="13" />
          <span>1. Mapa</span>
        </button>

        <button
          class="toggle-btn"
          :class="{ active: activeSubView === 'bottlenecks' }"
          title="Ranking y Cuellos de Botella"
          @click="activeSubView = 'bottlenecks'"
        >
          <BarChart3 :size="13" />
          <span>2. Diagnóstico</span>
        </button>

        <button
          class="toggle-btn"
          :class="{ active: activeSubView === 'hierarchy' }"
          title="Composición y Jerarquía Técnica"
          @click="activeSubView = 'hierarchy'"
        >
          <Layers :size="13" />
          <span>3. Jerarquía</span>
        </button>

        <button
          class="toggle-btn"
          :class="{ active: activeSubView === 'audit' }"
          title="Tabla de Detalle y Auditoría"
          @click="activeSubView = 'audit'"
        >
          <FileText :size="13" />
          <span>4. Auditoría</span>
        </button>
      </nav>
    </header>

    <!-- KPIS COMPACTOS EN LÍNEA (1 sola fila) -->
    <div v-if="territoryStore.data?.kpis" class="kpi-micro-row">
      <div class="kpi-micro-chip">
        <span class="chip-label">Torres Activas:</span>
        <b class="chip-val">{{ territoryStore.data.kpis.equipos.toLocaleString() }}</b>
      </div>
      <div class="kpi-micro-chip">
        <span class="chip-label">Municipios:</span>
        <b class="chip-val">{{ territoryStore.data.kpis.mpios.toLocaleString() }}</b>
      </div>
      <div class="kpi-micro-chip">
        <span class="chip-label">Cumplimiento:</span>
        <b class="chip-val success-text">{{ territoryStore.data.kpis.cumple_pct }}%</b>
      </div>
      <div class="kpi-micro-chip danger-chip">
        <span class="chip-label">Abiertos Vencidos:</span>
        <b class="chip-val danger-text">{{ (territoryStore.data.kpis.abiertos_vencidos ?? 0).toLocaleString() }}</b>
      </div>
    </div>

    <!-- ÁREA DE GRÁFICAS (VIEWPORT-FIT / CERO SCROLL) -->
    <main class="chart-viewport-stage">
      <!-- HOJA 1: Mapa Geográfico de Torres y Red (1 Sola Gran Vista) -->
      <section v-show="activeSubView === 'map'" class="stage-pane single-pane">
        <HistoricalMapChart />
      </section>

      <!-- HOJA 2: Exactamente 2 Gráficas (Ranking de Sectores + Boxplot de Tiempos) -->
      <section v-show="activeSubView === 'bottlenecks'" class="stage-pane">
        <TerritoryDiagnosticsRow />
      </section>

      <!-- HOJA 3: Exactamente 2 Gráficas Jerárquicas (Treemap + Sunburst) -->
      <section v-show="activeSubView === 'hierarchy'" class="stage-pane dual-charts">
        <TreemapPanel />
        <SunburstPanel />
      </section>

      <!-- HOJA 4: Tabla de Auditoría (Dedicada y con scroll propio interno) -->
      <section v-show="activeSubView === 'audit'" class="stage-pane audit-pane card">
        <TicketsTable
          v-if="territoryStore.data"
          :tickets="territoryStore.data.tickets"
          :total-matches="territoryStore.data.total_tickets_matching"
        />
      </section>
    </main>
  </div>
</template>

<style scoped>
.viewport-clean-view {
  display: flex;
  flex-direction: column;
  gap: 8px;
  flex: 1;
  min-height: 100%;
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
  gap: 14px;
  align-items: start;
}

@media (max-width: 1100px) {
  .stage-pane.dual-charts {
    grid-template-columns: 1fr;
  }
}

.audit-pane {
  padding: 12px;
  overflow-y: auto;
}
</style>

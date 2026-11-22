<script setup lang="ts">
import { ref, watch, onMounted } from 'vue';
import { useRoute } from 'vue-router';
import { Compass, FileText, Network, RefreshCw, RadioTower, MapPin, CheckCircle2, AlertCircle } from 'lucide-vue-next';
import { useTerritoryStore } from '../stores/territoryStore';
import HistoricalMapChart from '../components/charts/HistoricalMapChart.vue';
import TicketsTable from '../components/common/TicketsTable.vue';
import SemanticNetworkGraph from '../components/charts/SemanticNetworkGraph.vue';

const route = useRoute();
const territoryStore = useTerritoryStore();
const validTabs = ['map', 'audit', 'nlp'] as const;
type SubTab = (typeof validTabs)[number];
const rawTab = route.query.tab as string | undefined;
const initialTab: SubTab = validTabs.includes(rawTab as SubTab) ? (rawTab as SubTab) : 'map';
const activeSubView = ref<SubTab>(initialTab);

watch(
  () => route.query.tab,
  (tab) => {
    if (validTabs.includes(tab as SubTab)) {
      activeSubView.value = tab as SubTab;
    }
  }
);

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

      <!-- Pestañas de Hojas (2 sub-vistas esenciales: Mapa + Auditoría) -->
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
          :class="{ active: activeSubView === 'audit' }"
          title="Tabla de Detalle y Auditoría"
          @click="activeSubView = 'audit'"
        >
          <FileText :size="13" />
          <span>2. Auditoría</span>
        </button>

        <button
          class="toggle-btn"
          :class="{ active: activeSubView === 'nlp' }"
          title="Red Semántica de Causas Operativas (NLP)"
          @click="activeSubView = 'nlp'"
        >
          <Network :size="13" />
          <span>3. Semántica NLP</span>
        </button>
      </nav>
    </header>

    <!-- KPIS EJECUTIVOS EN LÍNEA -->
    <div v-if="territoryStore.data?.kpis" class="kpi-micro-row">
      <div class="kpi-micro-chip">
        <div class="kpi-main">
          <span class="chip-label">Torres Activas</span>
          <b class="chip-val">{{ territoryStore.data.kpis.equipos.toLocaleString() }}</b>
          <span class="chip-sub">Activos en red eléctrica</span>
        </div>
        <div class="kpi-icon-box">
          <RadioTower :size="18" />
        </div>
      </div>
      <div class="kpi-micro-chip">
        <div class="kpi-main">
          <span class="chip-label">Municipios</span>
          <b class="chip-val">{{ territoryStore.data.kpis.mpios.toLocaleString() }}</b>
          <span class="chip-sub">Cobertura territorial</span>
        </div>
        <div class="kpi-icon-box">
          <MapPin :size="18" />
        </div>
      </div>
      <div class="kpi-micro-chip">
        <div class="kpi-main">
          <span class="chip-label">Cumplimiento SLA</span>
          <b class="chip-val success-text">{{ territoryStore.data.kpis.cumple_pct }}%</b>
          <span class="chip-sub">Atención dentro del plazo</span>
        </div>
        <div class="kpi-icon-box">
          <CheckCircle2 :size="18" />
        </div>
      </div>
      <div class="kpi-micro-chip danger-chip">
        <div class="kpi-main">
          <span class="chip-label">Abiertos Vencidos</span>
          <b class="chip-val danger-text">{{ (territoryStore.data.kpis.abiertos_vencidos ?? 0).toLocaleString() }}</b>
          <span class="chip-sub">Requieren intervención priorizada</span>
        </div>
        <div class="kpi-icon-box danger-icon">
          <AlertCircle :size="18" />
        </div>
      </div>
    </div>

    <!-- ÁREA DE GRÁFICAS (VIEWPORT-FIT / CERO SCROLL) -->
    <main class="chart-viewport-stage">
      <!-- HOJA 1: Mapa Geográfico de Torres y Red (1 Sola Gran Vista) -->
      <section v-show="activeSubView === 'map'" class="stage-pane single-pane">
        <HistoricalMapChart />
      </section>

      <!-- HOJA 2: Tabla de Auditoría (Dedicada y con scroll propio interno) -->
      <section v-show="activeSubView === 'audit'" class="stage-pane audit-pane card">
        <TicketsTable
          v-if="territoryStore.data"
          :tickets="territoryStore.data.tickets"
          :total-matches="territoryStore.data.total_tickets_matching"
        />
      </section>

      <!-- HOJA 3: Red Semántica NLP (Causas Raíz y Fricción Operativa) -->
      <section v-show="activeSubView === 'nlp'" class="stage-pane single-pane">
        <SemanticNetworkGraph />
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

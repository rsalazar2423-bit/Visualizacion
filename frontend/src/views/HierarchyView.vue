<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { Compass, BarChart3, Layers, FileText } from 'lucide-vue-next';
import { useTerritoryStore } from '../stores/territoryStore';
import TerritoryFilters from '../components/territory/TerritoryFilters.vue';
import TerritoryKpiGrid from '../components/territory/TerritoryKpiGrid.vue';
import HistoricalMapChart from '../components/charts/HistoricalMapChart.vue';
import TerritoryDiagnosticsRow from '../components/territory/TerritoryDiagnosticsRow.vue';
import TreemapPanel from '../components/territory/TreemapPanel.vue';
import SunburstPanel from '../components/territory/SunburstPanel.vue';
import TicketsTable from '../components/common/TicketsTable.vue';

const territoryStore = useTerritoryStore();
const activeTab = ref<'map' | 'diagnostics' | 'hierarchy' | 'audit'>('map');

onMounted(async () => {
  await territoryStore.loadFilterOptions();
  await territoryStore.fetchData();
});
</script>

<template>
  <div class="hierarchy-view">
    <!-- Header ultracompacto -->
    <header class="view-header">
      <div class="header-inline">
        <span class="badge badge-tag">Vista 02 · EcoGrid DEC</span>
        <h1 class="view-title">Diagnóstico Territorial, Mapa Histórico y Desempeño Técnico</h1>
      </div>
      <p class="view-subtitle">
        Georreferenciación histórica de avisos y líneas (2008–2023), identificación de sectores con mayores retrasos, tiempos de atención por tipo de incidente y auditoría de avisos.
      </p>
    </header>

    <!-- Controles Mínimos: Filtros Territoriales en 1 sola fila compacta -->
    <TerritoryFilters />

    <!-- Resumen de Cobertura -->
    <TerritoryKpiGrid />

    <!-- Navegación por Pestañas Tácticas (Elimina el scroll vertical excesivo) -->
    <div class="tactical-tabs-nav" role="tablist">
      <button
        class="tab-btn"
        :class="{ active: activeTab === 'map' }"
        role="tab"
        :aria-selected="activeTab === 'map'"
        @click="activeTab = 'map'"
      >
        <Compass :size="15" />
        <span>1. Mapa de Red y Corredores</span>
      </button>

      <button
        class="tab-btn"
        :class="{ active: activeTab === 'diagnostics' }"
        role="tab"
        :aria-selected="activeTab === 'diagnostics'"
        @click="activeTab = 'diagnostics'"
      >
        <BarChart3 :size="15" />
        <span>2. Sectores Críticos & Tiempos</span>
      </button>

      <button
        class="tab-btn"
        :class="{ active: activeTab === 'hierarchy' }"
        role="tab"
        :aria-selected="activeTab === 'hierarchy'"
        @click="activeTab = 'hierarchy'"
      >
        <Layers :size="15" />
        <span>3. Estructura Jerárquica</span>
      </button>

      <button
        class="tab-btn"
        :class="{ active: activeTab === 'audit' }"
        role="tab"
        :aria-selected="activeTab === 'audit'"
        @click="activeTab = 'audit'"
      >
        <FileText :size="15" />
        <span>4. Auditoría de Avisos</span>
      </button>
    </div>

    <!-- Contenedor de la Pestaña Activa (Viewport-Fit) -->
    <div class="tab-content-container">
      <div v-show="activeTab === 'map'" class="tab-pane">
        <HistoricalMapChart />
      </div>

      <div v-show="activeTab === 'diagnostics'" class="tab-pane">
        <TerritoryDiagnosticsRow />
      </div>

      <div v-show="activeTab === 'hierarchy'" class="tab-pane grid-2">
        <TreemapPanel />
        <SunburstPanel />
      </div>

      <div v-show="activeTab === 'audit'" class="tab-pane">
        <section class="step-section">
          <div class="step-title-bar">
            <span class="badge badge-step">AUDITORÍA</span>
            <b>Detalle de Avisos por Municipio, Sector y Línea</b>
          </div>
          <TicketsTable
            v-if="territoryStore.data"
            :tickets="territoryStore.data.tickets"
            :total-matches="territoryStore.data.total_tickets_matching"
          />
        </section>
      </div>
    </div>
  </div>
</template>

<style scoped>
.hierarchy-view {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.view-header {
  margin-bottom: 0px;
}

.header-inline {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}

.view-title {
  font-size: 1.45rem;
  font-weight: 800;
  color: var(--text-primary);
  margin: 0;
  letter-spacing: -0.3px;
}

.view-subtitle {
  font-size: 0.88rem;
  color: var(--text-secondary);
  margin-top: 4px;
}

/* Barra de Pestañas Tácticas */
.tactical-tabs-nav {
  display: flex;
  align-items: center;
  gap: 8px;
  background: var(--bg-subtle);
  padding: 6px;
  border-radius: var(--radius-md);
  border: 1px solid var(--border-subtle);
  overflow-x: auto;
}

.tab-btn {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  background: transparent;
  color: var(--text-secondary);
  border: none;
  border-radius: var(--radius-sm);
  font-size: 0.86rem;
  font-weight: 600;
  cursor: pointer;
  transition: all var(--transition-fast);
  white-space: nowrap;
}

.tab-btn:hover {
  color: var(--text-primary);
  background: var(--bg-card-hover);
}

.tab-btn.active {
  background: var(--bg-card);
  color: var(--color-brand);
  box-shadow: var(--shadow-sm);
  border: 1px solid var(--border-subtle);
  font-weight: 700;
}

.tab-content-container {
  min-height: 480px;
}

.tab-pane {
  animation: fadeIn 0.18s ease-in-out;
}

@keyframes fadeIn {
  from {
    opacity: 0.8;
    transform: translateY(2px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>

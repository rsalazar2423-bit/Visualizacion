<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { BarChart3, Sliders } from 'lucide-vue-next';
import { useCapacityStore } from '../stores/capacityStore';
import CapacityFilterBar from '../components/capacity/CapacityFilterBar.vue';
import CapacityKpiGrid from '../components/capacity/CapacityKpiGrid.vue';
import RegionalLoadChart from '../components/charts/RegionalLoadChart.vue';
import ComplianceScatterChart from '../components/charts/ComplianceScatterChart.vue';
import CapacitySimulatorPanel from '../components/capacity/CapacitySimulatorPanel.vue';

const store = useCapacityStore();
const activeTab = ref<'diagnosis' | 'simulator'>('diagnosis');

onMounted(() => {
  store.loadAll();
});
</script>

<template>
  <div class="capacity-view">
    <header class="view-header">
      <div class="header-inline">
        <span class="badge badge-tag">Vista 03 · EcoGrid DEC</span>
        <h1 class="view-title">Capacidad Operativa y Escenarios de Asignación de Recursos</h1>
      </div>
      <p class="view-subtitle">
        Relación entre carga territorial de avisos, infraestructura instalada y simulación táctica de cuadrillas para evacuar el atraso operativo.
      </p>
    </header>

    <!-- Controles Mínimos: Filtros de Zona -->
    <CapacityFilterBar />

    <!-- KPIs de Capacidad -->
    <CapacityKpiGrid />

    <!-- Pestañas Tácticas (Eliminación de Scroll) -->
    <div class="tactical-tabs-nav" role="tablist">
      <button
        class="tab-btn"
        :class="{ active: activeTab === 'diagnosis' }"
        role="tab"
        :aria-selected="activeTab === 'diagnosis'"
        @click="activeTab = 'diagnosis'"
      >
        <BarChart3 :size="15" />
        <span>1. Diagnóstico de Carga Regional & Dispersión</span>
      </button>

      <button
        class="tab-btn"
        :class="{ active: activeTab === 'simulator' }"
        role="tab"
        :aria-selected="activeTab === 'simulator'"
        @click="activeTab = 'simulator'"
      >
        <Sliders :size="15" />
        <span>2. Simulador Táctico de Cuadrillas</span>
      </button>
    </div>

    <!-- Contenedor de la Pestaña Activa (Viewport-Fit) -->
    <div class="tab-content-container">
      <div v-show="activeTab === 'diagnosis'" class="tab-pane">
        <section class="step-section">
          <div class="step-title-bar">
            <span class="badge badge-step">DIAGNÓSTICO</span>
            <b>Carga Regional y Relación de Avisos frente a Cumplimiento de Plazo</b>
          </div>

          <div class="grid-2">
            <RegionalLoadChart :regions="store.capacityData?.regions || []" />
            <ComplianceScatterChart :items="store.capacityData?.municipios_scatter || []" />
          </div>
        </section>
      </div>

      <div v-show="activeTab === 'simulator'" class="tab-pane">
        <CapacitySimulatorPanel />
      </div>
    </div>
  </div>
</template>

<style scoped>
.capacity-view {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.view-header {
  margin-bottom: 0;
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

<script setup lang="ts">
import { onMounted } from 'vue';
import { useCapacityStore } from '../stores/capacityStore';
import CapacityFilterBar from '../components/capacity/CapacityFilterBar.vue';
import CapacityKpiGrid from '../components/capacity/CapacityKpiGrid.vue';
import RegionalLoadChart from '../components/charts/RegionalLoadChart.vue';
import ComplianceScatterChart from '../components/charts/ComplianceScatterChart.vue';
import CapacitySimulatorPanel from '../components/capacity/CapacitySimulatorPanel.vue';

const store = useCapacityStore();

onMounted(() => {
  store.loadAll();
});
</script>

<template>
  <div class="capacity-view">
    <header class="view-header">
      <div class="badge badge-tag">Vista 03 · EcoGrid DEC</div>
      <h1 class="view-title">Capacidad Operativa y Escenarios de Asignación de Recursos</h1>
      <p class="view-subtitle">
        Relación entre carga territorial de avisos, infraestructura instalada y simulación táctica de cuadrillas para evacuar el atraso operativo.
      </p>
    </header>

    <!-- Paso 1: Filtros de Zona -->
    <CapacityFilterBar />

    <!-- Paso 2: KPIs de Capacidad -->
    <CapacityKpiGrid />

    <!-- Paso 3: Gráficos de Carga vs. Cumplimiento -->
    <section class="step-section">
      <div class="step-title-bar">
        <span class="badge badge-step">PASO 3</span>
        <b>Diagnóstico de Carga Regional y Dispersión frente a Cumplimiento</b>
      </div>

      <div class="grid-2">
        <RegionalLoadChart :regions="store.capacityData?.regions || []" />
        <ComplianceScatterChart :items="store.capacityData?.municipios_scatter || []" />
      </div>
    </section>

    <!-- Paso 4: Simulador de Escenarios de Asignación de Personal -->
    <CapacitySimulatorPanel />
  </div>
</template>

<style scoped>
.capacity-view {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.view-header {
  margin-bottom: 4px;
}

.view-title {
  font-size: 1.8rem;
  font-weight: 800;
  color: var(--text-primary);
  margin: 8px 0 6px;
  letter-spacing: -0.3px;
}

.view-subtitle {
  font-size: 0.95rem;
  color: var(--text-secondary);
}
</style>

<script setup lang="ts">
import { onMounted } from 'vue';
import { useOperationsStore } from '../stores/operationsStore';
import OperationsFilterBar from '../components/operations/OperationsFilterBar.vue';
import TypologyFilterPills from '../components/operations/TypologyFilterPills.vue';
import OperationsKpiGrid from '../components/operations/OperationsKpiGrid.vue';
import OperationsChartsGrid from '../components/operations/OperationsChartsGrid.vue';

const opsStore = useOperationsStore();

onMounted(async () => {
  await opsStore.loadFilterOptions();
  await opsStore.fetchData();
});
</script>

<template>
  <div class="operations-view">
    <!-- Header -->
    <header class="view-header">
      <div class="badge badge-tag">Módulo Operativo · EcoGrid DEC</div>
      <h1 class="view-title">Tablero 1: Eficiencia Operativa y Tiempos de Resolución</h1>
      <p class="view-subtitle">
        Supervisión de cumplimiento de SLA, tiempos promedio de apertura y desglose por tipología de aviso.
      </p>
    </header>

    <!-- Paso 1: Filtros de Control Operativo -->
    <OperationsFilterBar />

    <!-- Selección Rápida por Tipología (Multi-Selección Interactiva) -->
    <TypologyFilterPills />

    <!-- Paso 2: Indicadores de Gestión y Cumplimiento de SLA -->
    <OperationsKpiGrid />

    <!-- Paso 3: Gráficos Analíticos -->
    <OperationsChartsGrid />
  </div>
</template>

<style scoped>
.operations-view {
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

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
      <div class="badge badge-tag">Vista 01 · EcoGrid DEC</div>
      <h1 class="view-title">Seguimiento de la Gestión Operativa y Cumplimiento de SLA</h1>
      <p class="view-subtitle">
        Estado general de la operación (abiertos vs. cerrados, a tiempo vs. vencidos), evolución temporal de ingresos frente a cierres y cumplimiento por prioridad.
      </p>
    </header>

    <!-- Paso 1: Filtros de Control Operativo -->
    <OperationsFilterBar />

    <!-- Selección Rápida por Tipología (Multi-Selección Interactiva) -->
    <TypologyFilterPills />

    <!-- Paso 2: 4 Indicadores Principales (KPIs del Documento Rector) -->
    <OperationsKpiGrid />

    <!-- Paso 3: Gráficos Analíticos (Evolución Temporal + 100% Stacked SLA + Donut) -->
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

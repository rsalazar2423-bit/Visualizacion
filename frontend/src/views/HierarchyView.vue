<script setup lang="ts">
import { onMounted } from 'vue';
import { useTerritoryStore } from '../stores/territoryStore';
import TerritoryFilters from '../components/territory/TerritoryFilters.vue';
import TerritoryKpiGrid from '../components/territory/TerritoryKpiGrid.vue';
import TerritoryChartsGrid from '../components/territory/TerritoryChartsGrid.vue';
import TicketsTable from '../components/common/TicketsTable.vue';

const territoryStore = useTerritoryStore();

onMounted(async () => {
  await territoryStore.loadFilterOptions();
  await territoryStore.fetchData();
});
</script>

<template>
  <div class="hierarchy-view">
    <!-- Header -->
    <header class="view-header">
      <div class="badge badge-tag">Módulo Territorial · EcoGrid DEC</div>
      <h1 class="view-title">Tablero 2: Estructura Jerárquica y Cobertura Territorial</h1>
      <p class="view-subtitle">
        Exploración multinivel (País ➔ Departamento ➔ Municipio), anatomía concéntrica de avisos y auditoría operativa de tickets.
      </p>
    </header>

    <!-- Paso 1: Filtros Territoriales -->
    <TerritoryFilters />

    <!-- Paso 2: Resumen de Cobertura -->
    <TerritoryKpiGrid />

    <!-- Paso 3: Exploración Jerárquica Multinivel & Anatomía del Aviso -->
    <TerritoryChartsGrid />

    <!-- Paso 4: Auditoría y Detalle de Tickets -->
    <section class="step-section">
      <div class="step-title-bar">
        <span class="badge badge-step">PASO 4</span>
        <b>Auditoría y Detalle de Tickets por Ciudad</b>
      </div>

      <TicketsTable
        v-if="territoryStore.data"
        :tickets="territoryStore.data.tickets"
        :total-matches="territoryStore.data.total_tickets_matching"
      />
    </section>
  </div>
</template>

<style scoped>
.hierarchy-view {
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

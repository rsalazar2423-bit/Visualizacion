<script setup lang="ts">
import { computed } from 'vue';
import { useOperationsStore } from '../../stores/operationsStore';
import KpiCard from '../common/KpiCard.vue';

const opsStore = useOperationsStore();

const hasActiveFilters = computed(() => {
  return (
    opsStore.selectedCte !== 'Todos' ||
    opsStore.selectedDepto !== 'Todos' ||
    opsStore.selectedTipo !== 'Todos' ||
    opsStore.selectedMunicipio !== 'Todos' ||
    Boolean(opsStore.selectedPrioridad)
  );
});
</script>

<template>
  <section class="step-section">
    <div class="step-header-flex">
      <div class="step-title-bar">
        <span class="badge badge-step">PASO 2</span>
        <b>Indicadores de Gestión y Cumplimiento de SLA</b>
      </div>
      <div v-if="hasActiveFilters" class="active-filter-badge-bar">
        <span class="filter-badge-text">Filtros activos en indicadores:</span>
        <span v-if="opsStore.selectedTipo !== 'Todos'" class="filter-pill">Tipo: <b>{{ opsStore.selectedTipo }}</b></span>
        <span v-if="opsStore.selectedPrioridad" class="filter-pill">Plazo SLA: <b>{{ opsStore.selectedPrioridad }}</b></span>
        <span v-if="opsStore.selectedCte !== 'Todos'" class="filter-pill">CTE: <b>{{ opsStore.selectedCte }}</b></span>
        <span v-if="opsStore.selectedDepto !== 'Todos'" class="filter-pill">Depto: <b>{{ opsStore.selectedDepto }}</b></span>
        <button class="btn-clear-inline" @click="opsStore.resetFilters">✕ Limpiar Todos</button>
      </div>
    </div>

    <div v-if="opsStore.loading && !opsStore.data" class="spinner-container">
      <div class="spinner"></div>
    </div>

    <div v-else-if="opsStore.data" class="grid-4">
      <KpiCard
        title="Total Avisos"
        :value="opsStore.data.kpis.total.toLocaleString()"
        :subtitle="opsStore.selectedTipo !== 'Todos' ? `Avisos de ${opsStore.selectedTipo}` : (opsStore.selectedPrioridad ? `Avisos con plazo ${opsStore.selectedPrioridad}` : 'En la selección actual')"
        color="cyan"
      />
      <KpiCard
        title="% Cumplimiento SLA"
        :value="`${opsStore.data.kpis.cumple_pct}%`"
        :subtitle="opsStore.selectedPrioridad ? `Tasa para plazo ${opsStore.selectedPrioridad}` : 'Dentro del plazo establecido'"
        color="mint"
      />
      <KpiCard
        title="Avisos Fuera de Plazo"
        :value="opsStore.data.kpis.excede.toLocaleString()"
        :subtitle="opsStore.selectedPrioridad ? `Excedidos en plazo ${opsStore.selectedPrioridad}` : 'Exceden prioridad días'"
        color="terracotta"
      />
      <KpiCard
        title="Tiempo Promedio Abierto"
        :value="opsStore.data.kpis.dias_prom != null ? `${Math.round(opsStore.data.kpis.dias_prom)} días` : 'N/D'"
        subtitle="Días desde reporte hasta cierre"
        color="amber"
      />
    </div>
  </section>
</template>


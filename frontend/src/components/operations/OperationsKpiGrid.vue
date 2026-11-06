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

const kpis = computed(() => opsStore.data?.kpis);
</script>

<template>
  <section class="step-section">
    <div class="step-header-flex">
      <div class="step-title-bar">
        <span class="badge badge-step">PASO 2</span>
        <b>Indicadores Principales de Operación y Cumplimiento (KPIs)</b>
      </div>
      <div v-if="hasActiveFilters" class="active-filter-badge-bar">
        <span class="filter-badge-text">Filtros activos:</span>
        <span v-if="opsStore.selectedTipo !== 'Todos'" class="filter-pill">Tipo: <b>{{ opsStore.selectedTipo }}</b></span>
        <span v-if="opsStore.selectedPrioridad" class="filter-pill">Plazo SLA: <b>{{ opsStore.selectedPrioridad }}</b></span>
        <span v-if="opsStore.selectedCte !== 'Todos'" class="filter-pill">Zona: <b>{{ opsStore.selectedCte }}</b></span>
        <span v-if="opsStore.selectedDepto !== 'Todos'" class="filter-pill">Depto: <b>{{ opsStore.selectedDepto }}</b></span>
        <button class="btn-clear-inline" @click="opsStore.resetFilters">✕ Limpiar Todos</button>
      </div>
    </div>

    <div v-if="opsStore.loading && !opsStore.data" class="spinner-container">
      <div class="spinner"></div>
    </div>

    <div v-else-if="kpis" class="grid-4">
      <KpiCard
        title="Cumplimiento Oportuno"
        :value="`${kpis.cumplimiento_oportuno_pct ?? kpis.cumple_pct}%`"
        :badge="`Global: ${kpis.cumple_pct}%`"
        :subtitle="`Avisos cerrados dentro de su plazo (${(kpis.avisos_cerrados ?? kpis.total).toLocaleString()} cerrados)`"
        color="success"
      />
      <KpiCard
        title="Avisos Abiertos"
        :value="(kpis.avisos_abiertos ?? 0).toLocaleString()"
        :badge="`Total: ${kpis.total.toLocaleString()}`"
        subtitle="Volumen de trabajo pendiente de cierre a la fecha de corte"
        color="info"
      />
      <KpiCard
        title="Abiertos Vencidos"
        :value="(kpis.abiertos_vencidos ?? kpis.excede).toLocaleString()"
        :badge="kpis.avisos_abiertos ? `${Math.round(((kpis.abiertos_vencidos ?? 0) / kpis.avisos_abiertos) * 100)}% de abiertos` : 'Crítico'"
        subtitle="Pendientes cuyo plazo ya se superó · Requieren revisión inmediata"
        color="danger"
      />
      <KpiCard
        title="Tiempo Típico de Atención"
        :value="kpis.tiempo_tipico_mediana != null ? `${Math.round(kpis.tiempo_tipico_mediana)} días` : (kpis.dias_prom != null ? `${Math.round(kpis.dias_prom)} días` : 'N/D')"
        :badge="kpis.dias_prom != null ? `Prom: ${Math.round(kpis.dias_prom)} d` : undefined"
        subtitle="Mediana de duración de avisos cerrados (robusta ante extremos)"
        color="warning"
      />
    </div>
  </section>
</template>

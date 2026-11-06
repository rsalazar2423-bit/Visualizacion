<script setup lang="ts">
import KpiCard from '../common/KpiCard.vue';
import { useCapacityStore } from '../../stores/capacityStore';

const store = useCapacityStore();
</script>

<template>
  <section v-if="store.capacityData" class="step-section">
    <div class="step-title-bar">
      <span class="badge badge-step">PASO 2</span>
      <b>Balance de Infraestructura y Presión Operativa</b>
    </div>

    <div class="grid-4">
      <KpiCard
        title="Torres Bajo Supervisión"
        :value="store.capacityData.kpis.total_torres.toLocaleString()"
        subtitle="Equipos georreferenciados en la zona"
        color="brand"
      />
      <KpiCard
        title="Densidad de Carga"
        :value="`${store.capacityData.kpis.carga_por_100_torres}`"
        badge="Avisos / 100 torres"
        subtitle="Tasa histórica de incidentes por cada 100 activos"
        color="info"
      />
      <KpiCard
        title="Backlog Crítico (Vencidos)"
        :value="store.capacityData.kpis.abiertos_vencidos.toLocaleString()"
        :badge="`${store.capacityData.kpis.avisos_abiertos} abiertos totales`"
        subtitle="Avisos pendientes con plazo superado"
        color="danger"
      />
      <KpiCard
        title="Tiempo Típico Actual"
        :value="`${Math.round(store.capacityData.kpis.mediana_dias_cerrados)} días`"
        :badge="`Cumplimiento: ${store.capacityData.kpis.cumplimiento_oportuno_pct}%`"
        subtitle="Mediana de resolución en avisos cerrados"
        color="warning"
      />
    </div>
  </section>
</template>


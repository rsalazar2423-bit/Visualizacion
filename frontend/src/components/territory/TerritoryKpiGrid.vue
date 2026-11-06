<script setup lang="ts">
import { computed } from 'vue';
import { useTerritoryStore } from '../../stores/territoryStore';
import KpiCard from '../common/KpiCard.vue';

const territoryStore = useTerritoryStore();

const isCitySelected = computed(() => Boolean(territoryStore.selectedMunicipio));
</script>

<template>
  <section class="step-section">
    <div class="step-title-bar">
      <span class="badge badge-step">PASO 2</span>
      <b>Resumen de Cobertura Territorial y Avisos en la Zona</b>
    </div>

    <div v-if="territoryStore.loading && !territoryStore.data" class="spinner-container">
      <div class="spinner"></div>
    </div>

    <div v-else-if="territoryStore.data" class="grid-4">
      <KpiCard
        title="Torres Georreferenciadas"
        :value="`${territoryStore.data.kpis.equipos.toLocaleString()} Torres`"
        :badge="typeof territoryStore.data.kpis.ctes === 'number' ? `${territoryStore.data.kpis.ctes} Zonas CTE` : (territoryStore.data.kpis.ctes ? `CTE ${territoryStore.data.kpis.ctes}` : undefined)"
        :subtitle="isCitySelected ? 'Equipos ubicados en este municipio' : 'Activos de transmisión monitoreados'"
        color="brand"
      />
      <KpiCard
        :title="isCitySelected ? 'Avisos en Municipio' : 'Municipios Cubiertos'"
        :value="isCitySelected ? `${territoryStore.data.kpis.mpios.toLocaleString()} Avisos` : `${territoryStore.data.kpis.mpios.toLocaleString()} Municipios`"
        :badge="typeof territoryStore.data.kpis.deptos === 'number' ? `${territoryStore.data.kpis.deptos} Deptos` : String(territoryStore.data.kpis.deptos || '')"
        :subtitle="isCitySelected ? 'Total histórico en esta jurisdicción' : 'Cobertura municipal activa'"
        color="info"
      />
      <KpiCard
        title="Cumplimiento Territorial"
        :value="`${territoryStore.data.kpis.cumple_pct ?? 0}%`"
        subtitle="Proporción de avisos atendidos dentro del plazo"
        color="success"
      />
      <KpiCard
        title="Abiertos Vencidos en Zona"
        :value="(territoryStore.data.kpis.abiertos_vencidos ?? 0).toLocaleString()"
        badge="Prioritario"
        subtitle="Avisos pendientes con plazo superado en la región"
        color="danger"
      />
    </div>
  </section>
</template>

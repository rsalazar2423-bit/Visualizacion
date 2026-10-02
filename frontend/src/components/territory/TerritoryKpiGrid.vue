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
      <b>Resumen de Cobertura y Tickets en la Zona</b>
    </div>

    <div v-if="territoryStore.loading && !territoryStore.data" class="spinner-container">
      <div class="spinner"></div>
    </div>

    <div v-else-if="territoryStore.data" class="grid-4">
      <KpiCard
        title="Macro-Región CTE"
        :value="typeof territoryStore.data.kpis.ctes === 'number' ? `${territoryStore.data.kpis.ctes} CTEs` : (territoryStore.data.kpis.ctes ? `CTE ${territoryStore.data.kpis.ctes}` : 'N/D')"
        :subtitle="isCitySelected ? 'Región administrativa' : 'Zonas de operación'"
        color="emerald"
      />
      <KpiCard
        title="Departamento"
        :value="typeof territoryStore.data.kpis.deptos === 'number' ? `${territoryStore.data.kpis.deptos} Deptos` : (territoryStore.data.kpis.deptos ?? 'N/D')"
        :subtitle="isCitySelected ? 'Departamento sede' : 'Presencia territorial'"
        color="mint"
      />
      <KpiCard
        :title="isCitySelected ? 'Tickets en Municipio' : 'Municipios Cubiertos'"
        :value="isCitySelected ? `${territoryStore.data.kpis.mpios.toLocaleString()} Tickets` : `${territoryStore.data.kpis.mpios.toLocaleString()} Municipios`"
        :subtitle="isCitySelected ? 'Avisos en esta ciudad' : 'Ciudades georreferenciadas'"
        color="amber"
      />
      <KpiCard
        title="Torres Monitoreadas"
        :value="`${territoryStore.data.kpis.equipos.toLocaleString()} Torres`"
        :subtitle="isCitySelected ? 'Equipos en esta ciudad' : 'Equipos georreferenciados'"
        color="terracotta"
      />
    </div>
  </section>
</template>

<script setup lang="ts">
import { Sun } from 'lucide-vue-next';
import SunburstChart from '../charts/SunburstChart.vue';
</script>

<template>
  <div class="card sunburst-panel">
    <!-- Header Analítico Unificado -->
    <div class="chart-header-block">
      <div class="header-main-row">
        <div class="title-with-badge">
          <span class="badge badge-tag">
            <Sun :size="13" /> Anatomía del Aviso
          </span>
          <h3 class="card-title">Estructura Concéntrica de Tipología y Resolución</h3>
        </div>
      </div>

      <p class="chart-reseña">
        Desglose concéntrico multinivel: el núcleo interior clasifica los avisos por causa técnica o ambiental, mientras que los anillos exteriores exponen la tasa de atención oportuna respecto a los plazos contractuales.
      </p>
    </div>

    <SunburstChart />
  </div>
</template>

<style scoped>
.sunburst-panel {
  display: flex;
  flex-direction: column;
}
</style>

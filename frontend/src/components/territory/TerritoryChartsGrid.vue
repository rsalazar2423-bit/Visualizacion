<script setup lang="ts">
import HistoricalMapChart from '../charts/HistoricalMapChart.vue';
import TerritoryDiagnosticsRow from './TerritoryDiagnosticsRow.vue';
import TreemapPanel from './TreemapPanel.vue';
import SunburstPanel from './SunburstPanel.vue';
</script>

<template>
  <section class="step-section">
    <div class="step-title-bar">
      <span class="badge badge-step">PASO 3</span>
      <b>Mapa Geográfico Histórico, Diagnóstico de Cuellos de Botella y Jerarquía</b>
    </div>

    <!-- 1. Mapa Geográfico Interactivo a lo largo de la Historia (2008 - 2023) -->
    <HistoricalMapChart />

    <!-- 2. Ranking de Sectores Críticos & Comparación de Tiempos por Tipología -->
    <TerritoryDiagnosticsRow />

    <!-- 3. Desglose Jerárquico (Treemap Secuencial + Sunburst de Anatomía) -->
    <div class="grid-2">
      <TreemapPanel />
      <SunburstPanel />
    </div>
  </section>
</template>

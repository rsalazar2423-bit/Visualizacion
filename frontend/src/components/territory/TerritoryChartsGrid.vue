<script setup lang="ts">
import TreemapPanel from './TreemapPanel.vue';
import SunburstPanel from './SunburstPanel.vue';
</script>

<template>
  <section class="step-section">
    <div class="step-title-bar">
      <span class="badge badge-step">PASO 3</span>
      <b>Exploración Jerárquica Multinivel & Anatomía del Aviso</b>
    </div>

    <div class="grid-2">
      <TreemapPanel />
      <SunburstPanel />
    </div>
  </section>
</template>


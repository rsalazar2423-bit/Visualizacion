<script setup lang="ts">
import { Map, ArrowLeft, RotateCcw, ChevronRight } from 'lucide-vue-next';
import { useTerritoryStore } from '../../stores/territoryStore';
import TreemapChart from '../charts/TreemapChart.vue';

const territoryStore = useTerritoryStore();

function handleBreadcrumbClick(crumb: any) {
  if (crumb.level === 'root') {
    territoryStore.resetToNational();
  } else if (crumb.level === 'depto' && crumb.depto) {
    territoryStore.drillIntoDepto(crumb.depto);
  }
}
</script>

<template>
  <div class="card treemap-panel">
    <!-- Header Analítico Unificado -->
    <div class="chart-header-block">
      <div class="header-main-row">
        <div class="title-with-badge">
          <span class="badge badge-tag">
            <Map :size="13" /> Cobertura Territorial DEC
          </span>
          <h3 class="card-title">Desglose Jerárquico de la Red Eléctrica</h3>
        </div>

        <div class="treemap-nav-actions">
          <button
            v-if="territoryStore.selectedDepto || territoryStore.selectedMunicipio"
            class="btn btn-sm btn-back"
            @click="territoryStore.ascendLevel"
          >
            <ArrowLeft :size="13" /> Volver a {{ territoryStore.selectedMunicipio ? territoryStore.selectedDepto : 'Toda Colombia' }}
          </button>

          <button class="btn btn-secondary btn-sm" @click="territoryStore.resetToNational">
            <RotateCcw :size="13" /> Ver Toda Colombia
          </button>
        </div>
      </div>

      <p class="chart-reseña">
        Distribución de avisos de mantenimiento por división territorial (País ➔ Departamento ➔ Municipio). La superficie de cada cuadrante refleja proporcionalmente la concentración histórica de intervenciones sobre la infraestructura eléctrica.
      </p>
    </div>

    <!-- Barra Dinámica de Migas de Pan (Breadcrumbs) -->
    <div v-if="territoryStore.selectedDepto" class="breadcrumbs-bar">
      <span
        v-for="(crumb, idx) in territoryStore.breadcrumbs"
        :key="idx"
        class="breadcrumb-chip"
        :class="{ clickable: idx < territoryStore.breadcrumbs.length - 1 }"
        @click="handleBreadcrumbClick(crumb)"
      >
        {{ crumb.label }}
        <ChevronRight v-if="idx < territoryStore.breadcrumbs.length - 1" :size="12" class="crumb-arrow" />
      </span>
    </div>

    <TreemapChart />
  </div>
</template>

<style scoped>
.treemap-panel {
  display: flex;
  flex-direction: column;
}

.treemap-nav-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

.btn-back {
  background: rgba(16, 185, 129, 0.15);
  border: 1px solid var(--color-emerald);
  color: var(--color-emerald);
  font-weight: 700;
  cursor: pointer;
  transition: all var(--transition-fast);
}

.btn-back:hover {
  background: var(--color-emerald);
  color: #ffffff;
}

.breadcrumbs-bar {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 12px;
  margin-bottom: 12px;
  background: var(--bg-hover);
  border-radius: 6px;
  flex-wrap: wrap;
}

.breadcrumb-chip {
  font-size: 0.8rem;
  font-weight: 600;
  color: var(--text-secondary);
  display: inline-flex;
  align-items: center;
  gap: 6px;
}

.breadcrumb-chip.clickable {
  color: #38BDF8;
  cursor: pointer;
}

.breadcrumb-chip.clickable:hover {
  text-decoration: underline;
}

.crumb-arrow {
  color: var(--text-muted);
  font-size: 0.7rem;
}
</style>

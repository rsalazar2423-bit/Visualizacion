<script setup lang="ts">
import { ref, computed } from 'vue';
import { Map, ArrowLeft, RotateCcw, ChevronRight, LayoutGrid, ListOrdered, Search } from 'lucide-vue-next';
import { useTerritoryStore } from '../../stores/territoryStore';
import { useThemeStore } from '../../stores/themeStore';
import { getSequentialTerritoryPalette } from '../../constants/themeTokens';
import TreemapChart from '../charts/TreemapChart.vue';

const territoryStore = useTerritoryStore();
const themeStore = useThemeStore();
const viewMode = ref<'treemap' | 'table'>('treemap');
const searchFilter = ref('');

function handleBreadcrumbClick(crumb: any) {
  if (crumb.level === 'root') {
    territoryStore.resetToNational();
  } else if (crumb.level === 'depto' && crumb.depto) {
    territoryStore.drillIntoDepto(crumb.depto);
  }
}

const detailedItems = computed(() => {
  if (!territoryStore.data?.treemap) return [];
  const rawTreemap = territoryStore.data.treemap;
  const nodes = (rawTreemap.children && rawTreemap.children.length > 0) ? rawTreemap.children : [rawTreemap];
  const total = rawTreemap.value || nodes.reduce((acc, curr) => acc + (curr.value || 0), 0);
  const palette = getSequentialTerritoryPalette(themeStore.isDark);

  let items = nodes.map((n: any, idx) => {
    const val = n.value || 0;
    const pct = total > 0 ? Number(((val / total) * 100).toFixed(1)) : 0;
    return {
      rank: idx + 1,
      name: n.name,
      value: val,
      pct,
      cumple_pct: n.cumple_pct ?? null,
      vencidos: n.vencidos || 0,
      color: palette[idx % palette.length],
    };
  });

  if (searchFilter.value.trim()) {
    const q = searchFilter.value.toLowerCase();
    items = items.filter((i) => i.name.toLowerCase().includes(q));
  }

  return items;
});

function handleZoneClick(name: string) {
  if (!territoryStore.selectedDepto) {
    territoryStore.drillIntoDepto(name);
  } else if (!territoryStore.selectedMunicipio) {
    territoryStore.drillIntoMunicipio(territoryStore.selectedDepto, name);
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
          <!-- Conmutador de Vista: Mosaico vs Tabla Exhaustiva -->
          <div class="view-toggle-group">
            <button
              class="btn-toggle"
              :class="{ active: viewMode === 'treemap' }"
              title="Ver mosaico proporcional"
              @click="viewMode = 'treemap'"
            >
              <LayoutGrid :size="13" /> Cuadrantes
            </button>
            <button
              class="btn-toggle"
              :class="{ active: viewMode === 'table' }"
              title="Ver tabla exhaustiva con todas las zonas y métricas completas"
              @click="viewMode = 'table'"
            >
              <ListOrdered :size="13" /> Ranking Exhaustivo ({{ detailedItems.length }})
            </button>
          </div>

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

    <!-- Vista 1: Cuadrantes Proporcionales (Treemap ECharts) -->
    <TreemapChart v-if="viewMode === 'treemap'" />

    <!-- Vista 2: Tabla y Ranking Exhaustivo (Sin pérdida de información para la cola larga) -->
    <div v-else class="exhaustive-table-container">
      <div class="table-toolbar">
        <div class="search-box">
          <Search :size="13" class="search-icon" />
          <input
            v-model="searchFilter"
            type="text"
            placeholder="Buscar municipio o departamento..."
            class="table-search-input"
          />
        </div>
        <span class="zones-counter-text">
          Mostrando <b>{{ detailedItems.length }}</b> zonas en <b>{{ territoryStore.selectedDepto || 'Colombia' }}</b>
        </span>
      </div>

      <div class="table-scroll-wrapper">
        <table class="zones-ranking-table">
          <thead>
            <tr>
              <th style="width: 48px;">#</th>
              <th>{{ territoryStore.selectedDepto ? 'Municipio' : 'Departamento' }}</th>
              <th class="text-right">Avisos</th>
              <th style="width: 170px;">% Participación</th>
              <th class="text-right">Abiertos Vencidos</th>
              <th class="text-right">% Cumplimiento SLA</th>
              <th class="text-center" style="width: 130px;">Acción</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="item in detailedItems" :key="item.name">
              <td class="rank-col">{{ item.rank }}</td>
              <td>
                <div class="zone-name-box">
                  <span class="zone-dot" :style="{ backgroundColor: item.color }"></span>
                  <span class="zone-title">{{ item.name }}</span>
                </div>
              </td>
              <td class="text-right font-mono font-bold">{{ item.value.toLocaleString() }}</td>
              <td>
                <div class="pct-bar-wrapper">
                  <div class="pct-bar-track">
                    <div class="pct-bar-fill" :style="{ width: item.pct + '%', backgroundColor: item.color }"></div>
                  </div>
                  <span class="pct-text font-mono">{{ item.pct }}%</span>
                </div>
              </td>
              <td class="text-right">
                <span v-if="item.vencidos > 0" class="badge-vencidos">
                  ⚠ {{ item.vencidos }} en mora
                </span>
                <span v-else class="text-muted font-mono">0</span>
              </td>
              <td class="text-right">
                <span
                  v-if="item.cumple_pct !== null"
                  class="badge-sla"
                  :class="item.cumple_pct >= 50 ? 'cumple' : 'alerta'"
                >
                  {{ item.cumple_pct }}%
                </span>
                <span v-else class="text-muted">N/D</span>
              </td>
              <td class="text-center">
                <button
                  class="btn-zone-action"
                  :title="`Auditar incidentes de ${item.name}`"
                  @click="handleZoneClick(item.name)"
                >
                  {{ territoryStore.selectedDepto ? 'Profundizar' : 'Ver Municipios' }}
                </button>
              </td>
            </tr>
            <tr v-if="detailedItems.length === 0">
              <td colspan="7" class="empty-table-state">
                No se encontraron zonas que coincidan con la búsqueda.
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
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

.view-toggle-group {
  display: flex;
  background: var(--bg-subtle);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-sm);
  padding: 2px;
  gap: 2px;
}

.btn-toggle {
  background: transparent;
  border: none;
  font-size: 0.74rem;
  font-weight: 700;
  color: var(--text-secondary);
  padding: 4px 9px;
  border-radius: 4px;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 5px;
  transition: all var(--transition-fast);
}

.btn-toggle:hover {
  color: var(--text-primary);
}

.btn-toggle.active {
  background: var(--bg-card);
  color: var(--color-brand);
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.06);
}

.btn-back {
  background: var(--color-brand-soft);
  border: 1px solid var(--color-brand);
  color: var(--color-brand);
  font-weight: 700;
  cursor: pointer;
  transition: all var(--transition-fast);
}

.btn-back:hover {
  background: var(--color-brand);
  color: #ffffff;
}

.breadcrumbs-bar {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 12px;
  margin-bottom: 12px;
  background: var(--bg-subtle);
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
  color: var(--color-accent);
  cursor: pointer;
}

.breadcrumb-chip.clickable:hover {
  text-decoration: underline;
}

.crumb-arrow {
  color: var(--text-muted);
  font-size: 0.7rem;
}

/* ---- Exhaustive Table Styles ---- */
.exhaustive-table-container {
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin-top: 4px;
}

.table-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  flex-wrap: wrap;
}

.search-box {
  display: flex;
  align-items: center;
  gap: 6px;
  background: var(--bg-subtle);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-sm);
  padding: 5px 10px;
  width: 280px;
}

.search-icon {
  color: var(--text-muted);
}

.table-search-input {
  border: none;
  background: transparent;
  outline: none;
  font-size: 0.8rem;
  color: var(--text-primary);
  width: 100%;
}

.zones-counter-text {
  font-size: 0.78rem;
  color: var(--text-secondary);
}

.table-scroll-wrapper {
  overflow-x: auto;
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-sm);
  max-height: 480px;
}

.zones-ranking-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.8rem;
}

.zones-ranking-table th {
  background: var(--bg-subtle);
  padding: 10px 14px;
  text-align: left;
  font-weight: 700;
  color: var(--text-secondary);
  border-bottom: 1px solid var(--border-subtle);
  position: sticky;
  top: 0;
  z-index: 2;
}

.zones-ranking-table td {
  padding: 9px 14px;
  border-bottom: 1px solid var(--border-subtle);
  color: var(--text-primary);
}

.zones-ranking-table tbody tr:hover {
  background: var(--bg-subtle);
}

.rank-col {
  font-weight: 800;
  color: var(--text-muted);
}

.zone-name-box {
  display: flex;
  align-items: center;
  gap: 8px;
}

.zone-dot {
  width: 9px;
  height: 9px;
  border-radius: 50%;
  flex-shrink: 0;
}

.zone-title {
  font-weight: 700;
}

.pct-bar-wrapper {
  display: flex;
  align-items: center;
  gap: 8px;
}

.pct-bar-track {
  flex: 1;
  height: 6px;
  background: var(--border-subtle);
  border-radius: 3px;
  overflow: hidden;
}

.pct-bar-fill {
  height: 100%;
  border-radius: 3px;
}

.pct-text {
  font-size: 0.74rem;
  color: var(--text-secondary);
  min-width: 42px;
  text-align: right;
}

.badge-vencidos {
  background: var(--sla-danger-bg, rgba(190, 18, 60, 0.12));
  color: var(--sla-danger, #BE123C);
  padding: 2px 7px;
  border-radius: 4px;
  font-size: 0.72rem;
  font-weight: 700;
  display: inline-block;
}

.badge-sla {
  padding: 2px 7px;
  border-radius: 4px;
  font-size: 0.74rem;
  font-weight: 700;
  display: inline-block;
}

.badge-sla.cumple {
  background: var(--sla-success-bg, rgba(5, 150, 105, 0.12));
  color: var(--sla-success, #059669);
}

.badge-sla.alerta {
  background: var(--sla-danger-bg, rgba(190, 18, 60, 0.12));
  color: var(--sla-danger, #BE123C);
}

.btn-zone-action {
  background: var(--color-brand-soft);
  border: 1px solid var(--color-brand);
  color: var(--color-brand);
  padding: 3px 8px;
  border-radius: 4px;
  font-size: 0.72rem;
  font-weight: 700;
  cursor: pointer;
  transition: all var(--transition-fast);
}

.btn-zone-action:hover {
  background: var(--color-brand);
  color: #ffffff;
}

.empty-table-state {
  text-align: center;
  padding: 24px;
  color: var(--text-muted);
}
</style>

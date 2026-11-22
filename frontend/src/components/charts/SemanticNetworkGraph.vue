<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch } from 'vue';
import * as echarts from 'echarts';
import { useThemeStore } from '../../stores/themeStore';
import { useTerritoryStore } from '../../stores/territoryStore';
import { fetchNlpGraphData } from '../../services/analytics/nlpGraphService';
import { buildNlpTreemapOption } from '../../services/analytics/nlpTreemapBuilder';
import type { NlpGraphPayload, NlpClusterComparison, NlpGroupMode, NlpSlaFilter, NlpScopeData } from '../../types/nlpGraph';
import NlpComparisonBar from '../territory/NlpComparisonBar.vue';
import NlpDetailPanel from '../territory/NlpDetailPanel.vue';

const themeStore = useThemeStore();
const territoryStore = useTerritoryStore();
const nlpData = ref<NlpGraphPayload | null>(null);
const groupMode = ref<NlpGroupMode>('cluster');
const slaFilter = ref<NlpSlaFilter>('todos');
const selectedClusterId = ref<string | null>(null);

const leftRef = ref<HTMLDivElement | null>(null);
const rightRef = ref<HTMLDivElement | null>(null);
let leftChart: echarts.ECharts | null = null;
let rightChart: echarts.ECharts | null = null;
let ro: ResizeObserver | null = null;

const activeDepto = computed(() => {
  const dep = territoryStore.selectedDepto;
  if (dep && dep !== 'Todos' && nlpData.value?.by_depto?.[dep]) return dep;
  return null;
});

const activeScope = computed<NlpScopeData | null>(() => {
  if (!nlpData.value) return null;
  const slaScopes = activeDepto.value ? nlpData.value.by_depto[activeDepto.value] : nlpData.value.nacional;
  return slaScopes?.[slaFilter.value] ?? null;
});

const geoLabel = computed(() => (activeDepto.value ? 'Municipio' : 'Departamento'));

const slaLabel = computed(() =>
  slaFilter.value === 'vencidos' ? ' · Vencidos' : slaFilter.value === 'a_tiempo' ? ' · A Tiempo' : '',
);

const selectedComparison = computed<NlpClusterComparison | null>(() => {
  const list = activeScope.value?.comparativa_vs ?? [];
  if (!list.length) return null;
  return list.find((c) => c.id === selectedClusterId.value) ?? list[0];
});

function renderCharts() {
  const scope = activeScope.value;
  if (!scope) return;
  const isDark = themeStore.isDark;
  const scopeTag = `${activeDepto.value ? ` · ${activeDepto.value}` : ''}${slaLabel.value}`;
  const abTot = scope.abiertos.total_avisos.toLocaleString();
  const ceTot = scope.cerrados.total_avisos.toLocaleString();

  if (leftRef.value) {
    if (!leftChart) {
      leftChart = echarts.init(leftRef.value);
      leftChart.on('click', handleNodeClick);
    }
    leftChart.setOption(
      buildNlpTreemapOption(scope.abiertos, `Abiertos${scopeTag} (${abTot})`, groupMode.value, geoLabel.value, isDark),
      true,
    );
  }
  if (rightRef.value) {
    if (!rightChart) {
      rightChart = echarts.init(rightRef.value);
      rightChart.on('click', handleNodeClick);
    }
    rightChart.setOption(
      buildNlpTreemapOption(scope.cerrados, `Cerrados${scopeTag} (${ceTot})`, groupMode.value, geoLabel.value, isDark),
      true,
    );
  }
}

function handleNodeClick(p: any) {
  const scope = activeScope.value;
  if (!scope) return;
  const targetName = p.data?.clusterName || p.name;
  const comp = scope.comparativa_vs.find((c) => c.name === targetName);
  if (comp) selectedClusterId.value = comp.id;
}

onMounted(async () => {
  try {
    nlpData.value = await fetchNlpGraphData();
    const first = nlpData.value.nacional.todos.comparativa_vs[0];
    if (first) selectedClusterId.value = first.id;
    renderCharts();
    ro = new ResizeObserver(() => {
      leftChart?.resize();
      rightChart?.resize();
    });
    if (leftRef.value) ro.observe(leftRef.value);
    if (rightRef.value) ro.observe(rightRef.value);
  } catch (err) {
    console.error('Error al inicializar treemaps comparativos NLP:', err);
  }
});

onUnmounted(() => {
  ro?.disconnect();
  leftChart?.dispose();
  rightChart?.dispose();
});

watch([() => themeStore.isDark, activeDepto, groupMode, slaFilter], () => renderCharts());
</script>

<template>
  <div class="semantic-vs-card">
    <div class="vs-header-cluster">
      <div class="header-titles">
        <div class="title-left">
          <span class="main-title">Análisis Semántico VS (NLP)</span>
          <span class="scope-pill">{{ activeDepto ? `Depto: ${activeDepto}` : 'Nacional' }}</span>
        </div>

        <div class="controls-right">
          <div class="group-toggle" role="group" aria-label="Filtro de plazo SLA">
            <button class="toggle-chip" :class="{ active: slaFilter === 'todos' }" @click="slaFilter = 'todos'">
              Todos
            </button>
            <button class="toggle-chip danger-chip" :class="{ active: slaFilter === 'vencidos' }" @click="slaFilter = 'vencidos'">
              Solo Vencidos
            </button>
            <button class="toggle-chip" :class="{ active: slaFilter === 'a_tiempo' }" @click="slaFilter = 'a_tiempo'">
              A Tiempo
            </button>
          </div>

          <div class="group-toggle" role="group" aria-label="Agrupación jerárquica">
            <button class="toggle-chip" :class="{ active: groupMode === 'cluster' }" @click="groupMode = 'cluster'">
              Clúster → {{ geoLabel }}
            </button>
            <button class="toggle-chip" :class="{ active: groupMode === 'depto' }" @click="groupMode = 'depto'">
              {{ geoLabel }} → Clúster
            </button>
          </div>
        </div>
      </div>

      <NlpComparisonBar
        v-if="activeScope"
        :comparisons="activeScope.comparativa_vs"
        :selected-id="selectedComparison?.id || null"
        @select="(c) => (selectedClusterId = c.id)"
      />
    </div>

    <div class="vs-dual-canvases">
      <div class="canvas-card left-border"><div ref="leftRef" class="graph-canvas"></div></div>
      <div class="canvas-card right-border"><div ref="rightRef" class="graph-canvas"></div></div>
    </div>

    <NlpDetailPanel :comparison="selectedComparison" />
  </div>
</template>

<style scoped>
.semantic-vs-card { width: 100%; height: 100%; min-height: 0; display: flex; flex-direction: column; gap: 6px; }
.vs-header-cluster { display: flex; flex-direction: column; gap: 6px; flex-shrink: 0; }
.header-titles { display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 6px; }
.title-left, .controls-right { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
.main-title { font-size: 0.85rem; font-weight: 700; color: var(--text-primary); }
.scope-pill {
  font-size: 0.68rem; font-weight: 700; padding: 2px 8px; border-radius: 999px;
  background: var(--bg-subtle); border: 1px solid var(--border-subtle); color: var(--color-brand, #0F766E);
}
.group-toggle {
  display: inline-flex; gap: 3px; padding: 2px;
  background: var(--bg-subtle); border: 1px solid var(--border-subtle); border-radius: var(--radius-sm);
}
.toggle-chip {
  border: none; background: transparent; color: var(--text-secondary);
  font-size: 0.71rem; font-weight: 600; padding: 3px 8px; border-radius: 4px; cursor: pointer;
}
.toggle-chip.active {
  background: var(--bg-card); color: var(--color-brand, #0F766E); font-weight: 700; box-shadow: var(--shadow-sm);
}
.toggle-chip.danger-chip.active { color: var(--color-danger, #BE123C); }
.vs-dual-canvases { flex: 1; min-height: 0; display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
.canvas-card { background: var(--bg-card); border: 1px solid var(--border-subtle); border-radius: var(--radius-sm); position: relative; overflow: hidden; }
.left-border { border-top: 3px solid var(--color-danger, #BE123C); }
.right-border { border-top: 3px solid var(--color-brand, #0F766E); }
.graph-canvas { width: 100%; height: 100%; min-height: 240px; }
@media (max-width: 900px) { .vs-dual-canvases { grid-template-columns: 1fr; } }
</style>

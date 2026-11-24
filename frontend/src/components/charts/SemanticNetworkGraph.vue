<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch } from 'vue';
import * as echarts from 'echarts';
import { useThemeStore } from '../../stores/themeStore';
import { useTerritoryStore } from '../../stores/territoryStore';
import { fetchNlpGraphData } from '../../services/analytics/nlpGraphService';
import {
  computeTriageSummaries,
  buildTriageBarOption,
  getChartOrderedRoutes,
  ESTADO_OPTS,
  URGENCY_OPTS,
  HORIZON_OPTS,
} from '../../services/analytics/nlpTriageEngine';
import { computeTopRepeatTowers, computeTopLines, buildTowerBarOption } from '../../services/analytics/nlpTowerEngine';
import type { NlpEstadoFilter, NlpGraphPayload, NlpHorizonFilter, NlpRouteId, NlpUrgencyFilter } from '../../types/nlpGraph';
import NlpActionTray from '../territory/NlpActionTray.vue';

const themeStore = useThemeStore();
const territoryStore = useTerritoryStore();

const payload = ref<NlpGraphPayload | null>(null);
const chartMode = ref<'causal' | 'linea' | 'torre'>('causal');
const estadoFilter = ref<NlpEstadoFilter>('ambos');
const tipoFilter = ref<string>('Todos');
const urgenciaFilter = ref<NlpUrgencyFilter>('todos');
const horizonteFilter = ref<NlpHorizonFilter>('todas');
const selectedRouteId = ref<NlpRouteId>('r_servidumbre');
const selectedTowerKey = ref<string | null>(null);
const selectedTag = ref<string | null>(null);

const chartRef = ref<HTMLDivElement | null>(null);
let chart: echarts.ECharts | null = null;
let ro: ResizeObserver | null = null;

const tipoOptions = computed(() => {
  if (!payload.value) return ['Todos'];
  const set = new Set(payload.value.tickets.map((t) => t.tipo));
  return ['Todos', ...Array.from(set).sort()];
});

const summaries = computed(() => {
  if (!payload.value) return [];
  return computeTriageSummaries(payload.value, {
    estado: estadoFilter.value,
    tipo: tipoFilter.value,
    cte: territoryStore.selectedCte,
    depto: territoryStore.selectedDepto,
    municipio: territoryStore.selectedMunicipio,
    urgencia: urgenciaFilter.value,
    horizonte: horizonteFilter.value,
  });
});

const totalVisible = computed(() => summaries.value.reduce((acc, r) => acc + r.total, 0));
const entityItems = computed(() => {
  const all = summaries.value.flatMap((r) => r.tickets);
  return chartMode.value === 'linea' ? computeTopLines(all, 10) : computeTopRepeatTowers(all, 10);
});
const selectedRoute = computed(
  () => summaries.value.find((r) => r.id === selectedRouteId.value) ?? summaries.value[0] ?? null,
);
const selectedEntity = computed(
  () => entityItems.value.find((t) => t.key === selectedTowerKey.value) ?? entityItems.value[0] ?? null,
);
const panelMeta = computed(() => {
  if (chartMode.value === 'linea') {
    return { title: 'Top 10 Líneas Críticas (Concentración Pareto)', sub: 'Corredores eléctricos que concentran la mayor mora' };
  }
  if (chartMode.value === 'torre') {
    return { title: 'Top 10 Torres Reincidentes (Historial de Retrasos)', sub: 'Torres que repiten avisos y vencimientos en el tiempo' };
  }
  return { title: 'Distribución por Causal y Cumplimiento de Plazo', sub: 'Haz clic en cualquier barra para inspeccionar sus avisos' };
});

function selectRoute(id: NlpRouteId) {
  selectedRouteId.value = id;
  selectedTag.value = null;
}

function toggleTag(tag: string) {
  selectedTag.value = selectedTag.value === tag ? null : tag;
}

function renderChart() {
  if (!chartRef.value || !summaries.value.length) return;
  if (!chart) {
    chart = echarts.init(chartRef.value);
    chart.on('click', (p: any) => {
      if (chartMode.value === 'causal') {
        const clicked = getChartOrderedRoutes(summaries.value)[p.dataIndex];
        if (clicked) selectRoute(clicked.id);
      } else {
        const clicked = [...entityItems.value].reverse()[p.dataIndex];
        if (clicked) selectedTowerKey.value = clicked.key;
      }
    });
  }
  const opt =
    chartMode.value === 'causal'
      ? buildTriageBarOption(summaries.value, estadoFilter.value, selectedRouteId.value, themeStore.isDark)
      : buildTowerBarOption(entityItems.value, estadoFilter.value, selectedEntity.value?.key ?? null, themeStore.isDark);
  chart.setOption(opt, true);
}

onMounted(async () => {
  try {
    payload.value = await fetchNlpGraphData();
    const firstUrgent = [...summaries.value].sort((a, b) => b.vencidos_total - a.vencidos_total)[0];
    if (firstUrgent) selectedRouteId.value = firstUrgent.id;
    renderChart();
    ro = new ResizeObserver(() => chart?.resize());
    if (chartRef.value) ro.observe(chartRef.value);
  } catch (err) {
    console.error('Error cargando Triaje Operativo NLP:', err);
  }
});

onUnmounted(() => { ro?.disconnect(); chart?.dispose(); });
watch([summaries, selectedRouteId, selectedTowerKey, chartMode, () => themeStore.isDark], () => renderChart());
</script>

<template>
  <div class="triage-layout">
    <!-- Barra única y limpia en 1 sola línea: Toggle de Bolsa + 3 Selectores discretos -->
    <div class="triage-toolbar card">
      <div class="toolbar-title">
        <span class="title-main">Causales Operativas (NLP)</span>
        <span class="count-pill">{{ totalVisible.toLocaleString() }} avisos</span>
      </div>

      <div class="toolbar-filters">
        <div class="seg-group" role="group" aria-label="Bolsa de avisos">
          <button v-for="opt in ESTADO_OPTS" :key="opt.id" class="seg-btn" :class="{ active: estadoFilter === opt.id }" @click="estadoFilter = opt.id">
            {{ opt.label }}
          </button>
        </div>

        <select v-model="tipoFilter" class="filter-select" aria-label="Tipo de aviso">
          <option v-for="tp in tipoOptions" :key="tp" :value="tp">
            {{ tp === 'Todos' ? 'Todos los Tipos' : tp }}
          </option>
        </select>

        <select v-model="urgenciaFilter" class="filter-select" aria-label="Estado de plazo">
          <option v-for="u in URGENCY_OPTS" :key="u.id" :value="u.id">{{ u.label }}</option>
        </select>

        <select v-model="horizonteFilter" class="filter-select" aria-label="Prioridad">
          <option v-for="h in HORIZON_OPTS" :key="h.id" :value="h.id">{{ h.label }}</option>
        </select>
      </div>
    </div>

    <!-- Vista 50/50 espaciosa -->
    <div class="triage-split">
      <section class="chart-panel card">
        <header class="panel-head-row">
          <div>
            <h3 class="panel-title">{{ panelMeta.title }}</h3>
            <p class="panel-sub">{{ panelMeta.sub }}</p>
          </div>
          <div class="seg-group" role="group" aria-label="Modo de gráfico">
            <button class="seg-btn" :class="{ active: chartMode === 'causal' }" @click="chartMode = 'causal'">Por Causal</button>
            <button class="seg-btn" :class="{ active: chartMode === 'linea' }" @click="chartMode = 'linea'">Por Línea</button>
            <button class="seg-btn" :class="{ active: chartMode === 'torre' }" @click="chartMode = 'torre'">Por Torre</button>
          </div>
        </header>
        <div ref="chartRef" class="bars-canvas"></div>
      </section>

      <NlpActionTray
        :route="selectedRoute"
        :tower="chartMode !== 'causal' ? selectedEntity : null"
        :selected-tag="selectedTag"
        @toggle-tag="toggleTag"
      />
    </div>
  </div>
</template>

<style scoped>
.triage-layout { width: 100%; height: 100%; min-height: 0; display: flex; flex-direction: column; gap: 8px; }
.triage-toolbar {
  display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 10px;
  padding: 7px 14px; background: var(--bg-card); border: 1px solid var(--border-subtle); border-radius: var(--radius-md); flex-shrink: 0;
}
.toolbar-title, .toolbar-filters { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
.title-main { font-size: 0.86rem; font-weight: 700; color: var(--text-primary); }
.count-pill {
  font-size: 0.72rem; font-weight: 600; padding: 2px 9px; border-radius: var(--radius-full);
  background: var(--bg-subtle); border: 1px solid var(--border-subtle); color: var(--text-secondary);
}
.seg-group { display: inline-flex; gap: 2px; padding: 2px; background: var(--bg-subtle); border: 1px solid var(--border-subtle); border-radius: var(--radius-sm); }
.seg-btn { border: none; background: transparent; color: var(--text-secondary); font-size: 0.74rem; font-weight: 600; padding: 4px 10px; border-radius: 4px; cursor: pointer; }
.seg-btn.active { background: var(--bg-card); color: var(--color-brand); font-weight: 700; box-shadow: var(--shadow-sm); }
.filter-select {
  height: 30px; padding: 0 10px; font-size: 0.74rem; font-weight: 600;
  background: var(--bg-subtle); color: var(--text-primary); border: 1px solid var(--border-subtle); border-radius: var(--radius-sm); cursor: pointer; outline: none;
}
.filter-select:focus { border-color: var(--border-focus); }
.triage-split { flex: 1; min-height: 0; display: grid; grid-template-columns: 0.95fr 1.05fr; gap: 10px; }
.chart-panel { display: flex; flex-direction: column; gap: 8px; padding: 14px 16px; min-height: 0; background: var(--bg-card); border: 1px solid var(--border-subtle); border-radius: var(--radius-md); }
.panel-head-row { display: flex; justify-content: space-between; align-items: flex-start; gap: 8px; flex-wrap: wrap; }
.panel-title { margin: 0; font-size: 0.92rem; font-weight: 800; color: var(--text-primary); }
.panel-sub { margin: 2px 0 0; font-size: 0.74rem; color: var(--text-secondary); }
.bars-canvas { flex: 1; width: 100%; min-height: 240px; cursor: pointer; }
@media (max-width: 1024px) { .triage-split { grid-template-columns: 1fr; } }
</style>

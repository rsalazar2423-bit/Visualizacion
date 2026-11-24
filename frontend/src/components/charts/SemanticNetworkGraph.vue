<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch } from 'vue';
import * as echarts from 'echarts';
import { useThemeStore } from '../../stores/themeStore';
import { useTerritoryStore } from '../../stores/territoryStore';
import { fetchNlpGraphData } from '../../services/analytics/nlpGraphService';
import {
  computeTriageSummaries,
  buildTriageBarOption,
  ESTADO_OPTS,
  URGENCY_OPTS,
  HORIZON_OPTS,
} from '../../services/analytics/nlpTriageEngine';
import type { NlpEstadoFilter, NlpGraphPayload, NlpHorizonFilter, NlpRouteId, NlpUrgencyFilter } from '../../types/nlpGraph';
import NlpActionTray from '../territory/NlpActionTray.vue';

const themeStore = useThemeStore();
const territoryStore = useTerritoryStore();

const payload = ref<NlpGraphPayload | null>(null);
const estadoFilter = ref<NlpEstadoFilter>('ambos');
const tipoFilter = ref<string>('Todos');
const urgenciaFilter = ref<NlpUrgencyFilter>('todos');
const horizonteFilter = ref<NlpHorizonFilter>('todas');
const selectedRouteId = ref<NlpRouteId>('r_servidumbre');
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
const totalOverdue = computed(() => summaries.value.reduce((acc, r) => acc + r.vencidos_total, 0));
const selectedRoute = computed(
  () => summaries.value.find((r) => r.id === selectedRouteId.value) ?? summaries.value[0] ?? null,
);
const geoLevelLabel = computed(() => (territoryStore.selectedDepto ? 'Municipio' : 'Departamento'));

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
      const clicked = [...summaries.value].reverse()[p.dataIndex];
      if (clicked) selectRoute(clicked.id);
    });
  }
  chart.setOption(buildTriageBarOption(summaries.value, estadoFilter.value, selectedRouteId.value, themeStore.isDark), true);
}

function handleDrillGeo(name: string) {
  if (!territoryStore.selectedDepto) territoryStore.setDepto(name);
  else territoryStore.setCityDropdown(name);
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
watch([summaries, selectedRouteId, () => themeStore.isDark], () => renderChart());
</script>

<template>
  <div class="triage-layout">
    <div class="triage-toolbar card">
      <div class="toolbar-title">
        <span class="title-main">Causales de Vencimiento y Tratamiento (NLP)</span>
        <span class="count-pill">{{ totalVisible.toLocaleString() }} avisos · {{ totalOverdue.toLocaleString() }} vencidos</span>
      </div>

      <div class="toolbar-filters">
        <select v-model="tipoFilter" class="tipo-select" aria-label="Filtrar por Tipo de aviso">
          <option v-for="tp in tipoOptions" :key="tp" :value="tp">
            {{ tp === 'Todos' ? 'Todos los Tipos' : `Tipo: ${tp}` }}
          </option>
        </select>
        <div class="seg-group" role="group" aria-label="Estado de aviso">
          <button v-for="opt in ESTADO_OPTS" :key="opt.id" class="seg-btn" :class="{ active: estadoFilter === opt.id }" @click="estadoFilter = opt.id">{{ opt.label }}</button>
        </div>
        <div class="seg-group" role="group" aria-label="Urgencia de plazo">
          <button v-for="opt in URGENCY_OPTS" :key="opt.id" class="seg-btn" :class="[opt.cls, { active: urgenciaFilter === opt.id }]" @click="urgenciaFilter = opt.id">{{ opt.label }}</button>
        </div>
        <div class="seg-group" role="group" aria-label="Horizonte de prioridad">
          <button v-for="opt in HORIZON_OPTS" :key="opt.id" class="seg-btn" :class="{ active: horizonteFilter === opt.id }" @click="horizonteFilter = opt.id">{{ opt.label }}</button>
        </div>
      </div>
    </div>

    <div class="triage-split">
      <section class="chart-panel card">
        <header class="panel-head">
          <h3 class="panel-title">Causales con Mayor Vencimiento (Abiertos vs. Cerrados Fuera de Plazo)</h3>
          <p class="panel-sub">Cruza el Tipo de aviso formal contra la causal real detectada en la descripción ({{ payload?.metadata.lexical_coverage_pct ?? 91 }}% cobertura)</p>
        </header>
        <div ref="chartRef" class="bars-canvas"></div>
        <div class="route-cards-grid">
          <button v-for="r in summaries" :key="r.id" class="route-mini-card" :class="{ selected: selectedRoute?.id === r.id }" @click="selectRoute(r.id)">
            <div class="rmc-top">
              <span class="rmc-name">{{ r.short_name }}</span>
              <strong class="rmc-total">{{ r.total.toLocaleString() }}</strong>
            </div>
            <div class="rmc-sub">
              <span class="txt-danger">{{ r.vencimiento_pct }}% venc. ({{ r.vencidos_total.toLocaleString() }})</span>
              <span>· ~{{ r.mediana_dias }}d</span>
            </div>
          </button>
        </div>
      </section>

      <NlpActionTray :route="selectedRoute" :geo-level-label="geoLevelLabel" :selected-tag="selectedTag" @drill-geo="handleDrillGeo" @toggle-tag="toggleTag" />
    </div>
  </div>
</template>

<style scoped>
.triage-layout { width: 100%; height: 100%; min-height: 0; display: flex; flex-direction: column; gap: 8px; }
.triage-toolbar {
  display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 8px;
  padding: 8px 14px; background: var(--bg-card); border: 1px solid var(--border-subtle); border-radius: var(--radius-md); flex-shrink: 0;
}
.toolbar-title, .toolbar-filters { display: flex; align-items: center; gap: 6px; flex-wrap: wrap; }
.title-main { font-size: 0.85rem; font-weight: 800; color: var(--text-primary); }
.count-pill { font-size: 0.71rem; font-weight: 700; padding: 2px 9px; border-radius: 999px; background: var(--bg-subtle); border: 1px solid var(--border-subtle); color: var(--color-brand, #0f766e); }
.tipo-select {
  height: 28px; padding: 0 8px; font-size: 0.72rem; font-weight: 600;
  background: var(--bg-subtle); color: var(--text-primary); border: 1px solid var(--border-subtle); border-radius: var(--radius-sm); cursor: pointer;
}
.seg-group { display: inline-flex; gap: 2px; padding: 2px; background: var(--bg-subtle); border: 1px solid var(--border-subtle); border-radius: var(--radius-sm); }
.seg-btn { border: none; background: transparent; color: var(--text-secondary); font-size: 0.7rem; font-weight: 600; padding: 4px 8px; border-radius: 4px; cursor: pointer; }
.seg-btn.active { background: var(--bg-card); color: var(--color-brand, #0f766e); font-weight: 700; box-shadow: var(--shadow-sm); }
.seg-btn.danger.active { color: #be123c; }
.seg-btn.warn.active { color: #b45309; }
.seg-btn.ok.active { color: #0f766e; }
.triage-split { flex: 1; min-height: 0; display: grid; grid-template-columns: 1fr 1.05fr; gap: 10px; }
.chart-panel { display: flex; flex-direction: column; gap: 8px; padding: 12px 14px; min-height: 0; background: var(--bg-card); border: 1px solid var(--border-subtle); border-radius: var(--radius-md); }
.panel-title { margin: 0; font-size: 0.88rem; font-weight: 800; color: var(--text-primary); }
.panel-sub { margin: 2px 0 0; font-size: 0.71rem; color: var(--text-secondary); }
.bars-canvas { flex: 1; width: 100%; min-height: 210px; }
.route-cards-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(135px, 1fr)); gap: 5px; flex-shrink: 0; }
.route-mini-card { text-align: left; padding: 6px 9px; border-radius: var(--radius-sm); cursor: pointer; background: var(--bg-subtle); border: 1px solid var(--border-subtle); }
.route-mini-card.selected { border-color: var(--color-brand, #0f766e); background: var(--bg-card); box-shadow: 0 0 0 1px var(--color-brand, #0f766e); }
.rmc-top { display: flex; justify-content: space-between; align-items: center; font-size: 0.73rem; color: var(--text-primary); }
.rmc-name { font-weight: 700; }
.rmc-total { font-size: 0.86rem; font-weight: 800; }
.rmc-sub { display: flex; gap: 4px; font-size: 0.65rem; color: var(--text-secondary); margin-top: 2px; }
.txt-danger { color: #be123c; font-weight: 700; }
@media (max-width: 1024px) { .triage-split { grid-template-columns: 1fr; } }
</style>

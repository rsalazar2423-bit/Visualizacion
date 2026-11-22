<script setup lang="ts">
import { ref, onMounted, watch } from 'vue';
import * as echarts from 'echarts';
import { useChart } from '../../composables/useChart';
import { getEChartsThemeTokens } from '../../constants/themeTokens';
import { fetchNlpGraphData } from '../../services/analytics/nlpGraphService';
import type { NlpGraphPayload, NlpClusterSummary } from '../../types/nlpGraph';
import NlpDetailPanel from '../territory/NlpDetailPanel.vue';

const nlpData = ref<NlpGraphPayload | null>(null);
const activeMode = ref<'abiertos' | 'cerrados'>('abiertos');
const selectedCluster = ref<NlpClusterSummary | null>(null);
const chartContainer = ref<HTMLDivElement | null>(null);

function handleChartClick(params: any) {
  if (!nlpData.value || params.dataType !== 'node') return;
  const currentModeData = nlpData.value[activeMode.value];
  const node = currentModeData.nodes.find((n) => n.id === params.data?.id);
  if (!node) return;
  const cluster = currentModeData.clusters.find((c) => c.name === (node.cluster_name || node.name));
  selectedCluster.value = cluster || null;
}

function renderGraph(inst: echarts.ECharts, isDark: boolean) {
  if (!nlpData.value) { inst.clear(); return; }
  const modeData = nlpData.value[activeMode.value];
  const tokens = getEChartsThemeTokens(isDark);

  const option: echarts.EChartsOption = {
    backgroundColor: 'transparent',
    tooltip: {
      trigger: 'item',
      backgroundColor: tokens.tooltipBg,
      borderColor: tokens.tooltipBorder,
      textStyle: { color: tokens.textColor, fontFamily: tokens.fontFamily, fontSize: 11 },
      formatter: (p: any) => {
        if (p.dataType === 'node') {
          const d = p.data;
          const label = d.is_hub ? 'Clúster Causa Raíz' : `Término de ${d.cluster_name}`;
          const mora = d.mediana_dias ? `<div>Mediana mora: <b>${d.mediana_dias} días</b></div>` : '';
          return `<div style="font-weight:700;">${d.name}</div><div style="font-size:10px;color:${tokens.textSecondary};">${label}</div><div>Avisos: <b>${Number(d.value).toLocaleString()}</b></div>${mora}`;
        }
        return `Co-ocurrencia: <b>${p.data.value} avisos</b>`;
      },
    },
    legend: { top: 4, left: 10, textStyle: { color: tokens.textColor, fontSize: 10.5 }, data: modeData.categories.map((c) => c.name) },
    series: [
      {
        type: 'graph',
        layout: 'force',
        data: modeData.nodes as any,
        links: modeData.links as any,
        categories: modeData.categories,
        roam: true,
        draggable: true,
        emphasis: { focus: 'adjacency', lineStyle: { width: 3 } },
        force: { repulsion: 190, edgeLength: [40, 110], gravity: 0.12, friction: 0.85 },
      },
    ],
  };
  inst.setOption(option, true);
}

const { render } = useChart(chartContainer, renderGraph, handleChartClick);

onMounted(async () => {
  try {
    nlpData.value = await fetchNlpGraphData();
    if (nlpData.value.abiertos.clusters.length > 0) {
      selectedCluster.value = nlpData.value.abiertos.clusters[0];
    }
    render();
  } catch (err) {
    console.error('Error al inicializar red semántica NLP:', err);
  }
});

watch([activeMode, nlpData], () => {
  if (nlpData.value) {
    selectedCluster.value = nlpData.value[activeMode.value].clusters[0] || null;
  }
  render();
});
</script>

<template>
  <div class="semantic-network-card">
    <div class="network-toolbar">
      <div class="toolbar-left">
        <span class="toolbar-title">Red Semántica de Causas Operativas (NLP)</span>
        <span class="toolbar-subtitle">Minería de 3.118 descripciones · Co-ocurrencia y mora</span>
      </div>
      <div class="mode-toggles">
        <button class="btn-mode danger-mode" :class="{ active: activeMode === 'abiertos' }" @click="activeMode = 'abiertos'">
          🔴 Fricción & Mora (743 Abiertos)
        </button>
        <button class="btn-mode success-mode" :class="{ active: activeMode === 'cerrados' }" @click="activeMode = 'cerrados'">
          🟢 Capacidad & Éxito (2.375 Cerrados)
        </button>
      </div>
    </div>
    <div class="network-body">
      <div ref="chartContainer" class="graph-canvas-container"></div>
      <NlpDetailPanel :cluster="selectedCluster" :active-mode="activeMode" />
    </div>
  </div>
</template>

<style scoped>
.semantic-network-card {
  width: 100%; height: 100%; min-height: 0; display: flex; flex-direction: column; gap: 8px;
  background: var(--bg-card); border: 1px solid var(--border-subtle); border-radius: var(--radius-md); padding: 10px;
}
.network-toolbar {
  display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 8px;
  border-bottom: 1px solid var(--border-subtle); padding-bottom: 6px; flex-shrink: 0;
}
.toolbar-left { display: flex; flex-direction: column; gap: 1px; }
.toolbar-title { font-size: 0.85rem; font-weight: 700; color: var(--text-primary); }
.toolbar-subtitle { font-size: 0.72rem; color: var(--text-secondary); }
.mode-toggles { display: flex; gap: 6px; }
.btn-mode {
  background: var(--bg-subtle); border: 1px solid var(--border-subtle); font-size: 0.73rem;
  font-weight: 600; padding: 4px 10px; border-radius: var(--radius-sm); cursor: pointer; color: var(--text-secondary);
}
.btn-mode.active.danger-mode {
  background: var(--color-danger-soft, rgba(190, 18, 60, 0.12)); border-color: var(--color-danger, #BE123C);
  color: var(--color-danger, #BE123C); font-weight: 700;
}
.btn-mode.active.success-mode {
  background: var(--color-brand-soft, rgba(15, 118, 110, 0.12)); border-color: var(--color-brand, #0F766E);
  color: var(--color-brand, #0F766E); font-weight: 700;
}
.network-body { flex: 1; min-height: 0; display: flex; gap: 10px; }
.graph-canvas-container { flex: 1; min-height: 0; height: 100%; }
</style>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch } from 'vue';
import * as echarts from 'echarts';
import { useThemeStore } from '../../stores/themeStore';
import { getEChartsThemeTokens } from '../../constants/themeTokens';
import { fetchNlpGraphData } from '../../services/analytics/nlpGraphService';
import type { NlpGraphPayload, NlpClusterComparison, NlpModeData } from '../../types/nlpGraph';
import NlpComparisonBar from '../territory/NlpComparisonBar.vue';
import NlpDetailPanel from '../territory/NlpDetailPanel.vue';

const themeStore = useThemeStore();
const nlpData = ref<NlpGraphPayload | null>(null);
const selectedComparison = ref<NlpClusterComparison | null>(null);

const leftRef = ref<HTMLDivElement | null>(null);
const rightRef = ref<HTMLDivElement | null>(null);
let leftChart: echarts.ECharts | null = null;
let rightChart: echarts.ECharts | null = null;
let ro: ResizeObserver | null = null;

function buildTreemapOption(modeData: NlpModeData, title: string, isDark: boolean): echarts.EChartsOption {
  const tokens = getEChartsThemeTokens(isDark);
  const borderBg = isDark ? '#0f172a' : '#f8fafc';
  const data = modeData.treemap.children
    .filter((c) => c.value > 0)
    .map((c) => ({
      name: c.name,
      value: c.value,
      mora: c.mora,
      clusterName: c.name,
      itemStyle: { color: c.color },
      children: c.children.map((ch) => ({
        name: ch.name,
        value: ch.value,
        mora: ch.mora,
        clusterName: c.name,
      })),
    }));

  return {
    backgroundColor: 'transparent',
    title: {
      text: title,
      left: 8,
      top: 6,
      textStyle: { fontSize: 11.5, fontWeight: 700, color: tokens.textColor },
    },
    tooltip: {
      backgroundColor: tokens.tooltipBg,
      borderColor: tokens.tooltipBorder,
      textStyle: { color: tokens.textColor, fontSize: 11 },
      formatter: (p: any) => {
        const d = p.data || {};
        if (!d.value) return '';
        const pct = modeData.total_avisos > 0 ? ((d.value / modeData.total_avisos) * 100).toFixed(1) : '0';
        const sub = d.clusterName && d.clusterName !== d.name
          ? `<div style="font-size:10px;color:${tokens.textSecondary};">Clúster: ${d.clusterName}</div>`
          : `<div style="font-size:10px;color:${tokens.textSecondary};">Clúster NLP (Clic para detalle)</div>`;
        return `<div style="font-weight:700;">${d.name}</div>${sub}<div>Avisos: <b>${Number(d.value).toLocaleString()}</b> (${pct}%)</div><div>Mediana: <b>${d.mora} días</b></div>`;
      },
    },
    series: [
      {
        type: 'treemap',
        top: 30,
        left: 6,
        right: 6,
        bottom: 6,
        roam: false,
        nodeClick: false,
        breadcrumb: { show: false },
        data: data as any,
        levels: [
          { itemStyle: { borderColor: borderBg, borderWidth: 2, gapWidth: 2 } },
          {
            itemStyle: { borderColor: borderBg, borderWidth: 2, gapWidth: 2 },
            upperLabel: {
              show: true,
              height: 20,
              color: '#ffffff',
              fontSize: 10,
              fontWeight: 700,
              padding: [1, 5],
              formatter: (p: any) => `${p.name} · ${p.value} (${p.data?.mora ?? 0}d)`,
            },
          },
          {
            colorSaturation: [0.42, 0.78],
            itemStyle: { borderColor: 'rgba(255,255,255,0.28)', borderWidth: 1, gapWidth: 1 },
            label: {
              show: true,
              fontSize: 9.5,
              fontWeight: 600,
              color: '#ffffff',
              overflow: 'truncate',
              formatter: (p: any) => `${p.name}\n${p.value}`,
            },
          },
        ],
      },
    ],
  };
}

function renderCharts() {
  if (!nlpData.value) return;
  const isDark = themeStore.isDark;
  const abTot = nlpData.value.abiertos.total_avisos.toLocaleString();
  const ceTot = nlpData.value.cerrados.total_avisos.toLocaleString();
  if (leftRef.value) {
    if (!leftChart) {
      leftChart = echarts.init(leftRef.value);
      leftChart.on('click', handleNodeClick);
    }
    leftChart.setOption(buildTreemapOption(nlpData.value.abiertos, `Abiertos · Fricción (${abTot} avisos)`, isDark), true);
  }
  if (rightRef.value) {
    if (!rightChart) {
      rightChart = echarts.init(rightRef.value);
      rightChart.on('click', handleNodeClick);
    }
    rightChart.setOption(buildTreemapOption(nlpData.value.cerrados, `Cerrados · Resueltos (${ceTot} avisos)`, isDark), true);
  }
}

function handleNodeClick(p: any) {
  if (!nlpData.value) return;
  const targetName = p.data?.clusterName || p.name;
  const comp = nlpData.value.comparativa_vs.find((c) => c.name === targetName);
  if (comp) selectedComparison.value = comp;
}

onMounted(async () => {
  try {
    nlpData.value = await fetchNlpGraphData();
    if (nlpData.value.comparativa_vs.length > 0) {
      selectedComparison.value = nlpData.value.comparativa_vs[0];
    }
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

watch(() => themeStore.isDark, () => renderCharts());
</script>

<template>
  <div class="semantic-vs-card">
    <div class="vs-header-cluster">
      <div class="header-titles">
        <span class="main-title">Análisis Comparativo Semántico VS (NLP · Clúster → Departamento)</span>
        <span class="sub-title">Área proporcional al volumen de avisos · Haz clic en un clúster o departamento para contrastar evidencia</span>
      </div>
      <NlpComparisonBar
        v-if="nlpData"
        :comparisons="nlpData.comparativa_vs"
        :selected-id="selectedComparison?.id || null"
        @select="(c) => (selectedComparison = c)"
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
.header-titles { display: flex; justify-content: space-between; align-items: baseline; flex-wrap: wrap; gap: 4px; }
.main-title { font-size: 0.85rem; font-weight: 700; color: var(--text-primary); }
.sub-title { font-size: 0.71rem; color: var(--text-secondary); }
.vs-dual-canvases { flex: 1; min-height: 0; display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
.canvas-card { background: var(--bg-card); border: 1px solid var(--border-subtle); border-radius: var(--radius-sm); position: relative; overflow: hidden; }
.left-border { border-top: 3px solid var(--color-danger, #BE123C); }
.right-border { border-top: 3px solid var(--color-brand, #0F766E); }
.graph-canvas { width: 100%; height: 100%; min-height: 240px; }
@media (max-width: 900px) { .vs-dual-canvases { grid-template-columns: 1fr; } }
</style>

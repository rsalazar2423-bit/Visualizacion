<script setup lang="ts">
import { ref, watch, inject, onMounted } from 'vue';
import * as echarts from 'echarts';
import { useOperationsStore } from '../../stores/operationsStore';
import { getEChartsThemeTokens, getTipoColor, PRIO_COLORS } from '../../constants/themeTokens';
import { useChart } from '../../composables/useChart';
import { fetchNlpGraphData } from '../../services/analytics/nlpGraphService';
import { buildNlpSankeyData, buildPriorityNlpSankeyData } from '../../services/analytics/nlpSankeyBuilder';
import type { NlpGraphPayload } from '../../types/nlpGraph';

type SankeyMode = 'abiertos_nlp' | 'cerrados_nlp' | 'prioridad';

const opsStore = useOperationsStore();
const isFullscreen = inject('isChartFullscreen', ref(false));
const chartContainer = ref<HTMLDivElement | null>(null);
const sankeyMode = ref<SankeyMode>('abiertos_nlp');
const nlpPayload = ref<NlpGraphPayload | null>(null);

function renderSankey(chartInstance: echarts.ECharts, isDark: boolean) {
  const tokens = getEChartsThemeTokens(isDark);
  let nodes: any[] = [];
  let links: any[] = [];

  if (sankeyMode.value === 'prioridad') {
    if (isFullscreen.value && nlpPayload.value) {
      const built = buildPriorityNlpSankeyData(
        nlpPayload.value,
        { cte: opsStore.selectedCte, depto: opsStore.selectedDepto, tipo: opsStore.selectedTipo },
        isDark,
      );
      nodes = built.nodes;
      links = built.links;
    } else {
      const flow = opsStore.data?.sankey_flow;
      if (!flow?.nodes.length || !flow?.links.length) {
        chartInstance.clear();
        return;
      }
      nodes = flow.nodes.map((n) => {
        let color = tokens.textSecondary;
        if (n.category === 'tipo') color = getTipoColor(n.name, isDark);
        else if (n.category === 'prio') color = PRIO_COLORS[n.name] || '#64748B';
        else if (n.category === 'estado') color = n.name === 'Cumple Plazo' ? tokens.sla.cumple : tokens.sla.excede;
        return { name: n.name, itemStyle: { color, borderColor: 'transparent' } };
      });
      links = flow.links;
    }
  } else {
    if (!nlpPayload.value) return;
    const built = buildNlpSankeyData(
      nlpPayload.value,
      {
        estado: sankeyMode.value === 'abiertos_nlp' ? 'abiertos' : 'cerrados',
        cte: opsStore.selectedCte,
        depto: opsStore.selectedDepto,
        tipo: opsStore.selectedTipo,
        includeEtapa: isFullscreen.value,
      },
      isDark,
    );
    if (!built.nodes.length || !built.links.length) {
      chartInstance.clear();
      return;
    }
    nodes = built.nodes;
    links = built.links;
  }

  chartInstance.setOption(
    {
      backgroundColor: 'transparent',
      tooltip: {
        trigger: 'item',
        triggerOn: 'mousemove',
        backgroundColor: tokens.tooltipBg,
        borderColor: tokens.borderColor,
        textStyle: { color: tokens.textColor, fontFamily: tokens.fontFamily, fontSize: 12 },
        formatter: (p: any) =>
          p.dataType === 'edge'
            ? `<div style="font-weight:800;margin-bottom:3px">${p.data.source} → ${p.data.target}</div><div>Volumen: <b>${Number(p.data.value).toLocaleString('es-CO')} avisos</b></div>`
            : `<div style="font-weight:800;margin-bottom:3px">${p.name}</div><div>Total en nodo: <b>${Number(p.value || 0).toLocaleString('es-CO')} avisos</b></div>`,
      },
      series: [
        {
          type: 'sankey',
          left: 6,
          right: 126,
          top: 8,
          bottom: 10,
          nodeWidth: 14,
          nodeGap: 10,
          draggable: true,
          emphasis: { focus: 'adjacency' },
          data: nodes,
          links,
          lineStyle: { color: 'gradient', curveness: 0.48, opacity: isDark ? 0.35 : 0.28 },
          label: { color: tokens.textColor, fontFamily: tokens.fontFamily, fontSize: 11, fontWeight: 700 },
        },
      ],
    },
    true,
  );
}

function handleNodeClick(params: any) {
  if (params?.dataType !== 'node' || !params?.name) return;
  const raw = String(params.name);
  if (raw.startsWith('Tipo: ')) {
    const tipo = raw.replace('Tipo: ', '').trim();
    opsStore.setSingleTipo(opsStore.selectedTipo === tipo ? 'Todos' : tipo);
  }
}

const { render } = useChart(chartContainer, renderSankey, handleNodeClick);

onMounted(async () => {
  try {
    nlpPayload.value = await fetchNlpGraphData();
    render();
  } catch (err) {
    console.error('Error cargando datos NLP para Sankey:', err);
  }
});

watch(
  () => [opsStore.data?.sankey_flow, opsStore.selectedCte, opsStore.selectedDepto, opsStore.selectedTipo, sankeyMode.value, isFullscreen.value],
  () => render(),
  { deep: true },
);
</script>

<template>
  <div class="sankey-wrapper">
    <div class="sankey-mode-bar">
      <div class="seg-group" role="group" aria-label="Flujo Sankey">
        <button class="seg-btn" :class="{ active: sankeyMode === 'abiertos_nlp' }" @click="sankeyMode = 'abiertos_nlp'">
          Abiertos (NLP)
        </button>
        <button class="seg-btn" :class="{ active: sankeyMode === 'cerrados_nlp' }" @click="sankeyMode = 'cerrados_nlp'">
          Cerrados (NLP)
        </button>
        <button class="seg-btn" :class="{ active: sankeyMode === 'prioridad' }" @click="sankeyMode = 'prioridad'">
          Por Prioridad (Global)
        </button>
      </div>
    </div>

    <div ref="chartContainer" class="sankey-canvas"></div>

    <div class="sankey-legend">
      <span class="leg-item"><i class="dot" style="background: var(--color-brand)"></i> Tipo de Aviso</span>
      <span class="leg-arrow">→</span>
      <span class="leg-item"><i class="dot" style="background: var(--color-accent)"></i> {{ sankeyMode === 'prioridad' ? 'Prioridad SLA' : 'Causal Real (NLP)' }}</span>
      <span class="leg-arrow">→</span>
      <span class="leg-item"><i class="dot" style="background: var(--sla-success)"></i> En Plazo / A Tiempo</span>
      <span class="leg-item"><i class="dot" style="background: var(--sla-danger)"></i> Vencidos</span>
    </div>
  </div>
</template>

<style scoped>
.sankey-wrapper { display: flex; flex-direction: column; width: 100%; height: 100%; min-height: 0; }
.sankey-mode-bar { display: flex; justify-content: flex-end; margin-bottom: 4px; flex-shrink: 0; }
.seg-group { display: inline-flex; gap: 2px; padding: 2px; background: var(--bg-subtle); border: 1px solid var(--border-subtle); border-radius: var(--radius-sm); }
.seg-btn { border: none; background: transparent; color: var(--text-secondary); font-size: 0.7rem; font-weight: 600; padding: 3px 9px; border-radius: 4px; cursor: pointer; }
.seg-btn.active { background: var(--bg-card); color: var(--color-brand); font-weight: 700; box-shadow: var(--shadow-sm); }
.sankey-canvas { flex: 1; min-height: 0; width: 100%; }
.sankey-legend {
  display: flex; flex-wrap: wrap; align-items: center; justify-content: center; gap: 8px 14px;
  padding: 6px 10px 2px; border-top: 1px solid var(--border-subtle); font-size: 0.71rem; font-weight: 600; color: var(--text-secondary);
}
.leg-item { display: inline-flex; align-items: center; gap: 5px; }
.leg-arrow { color: var(--text-muted); font-weight: 800; }
.dot { width: 8px; height: 8px; border-radius: 50%; display: inline-block; }
</style>

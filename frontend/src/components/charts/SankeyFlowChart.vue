<script setup lang="ts">
import { ref, watch } from 'vue';
import * as echarts from 'echarts';
import { useOperationsStore } from '../../stores/operationsStore';
import { getEChartsThemeTokens, getTipoColor, PRIO_COLORS } from '../../constants/themeTokens';
import { useChart } from '../../composables/useChart';

const opsStore = useOperationsStore();
const chartContainer = ref<HTMLDivElement | null>(null);

function renderSankey(chartInstance: echarts.ECharts, isDark: boolean) {
  const flow = opsStore.data?.sankey_flow;
  if (!flow || !flow.nodes.length || !flow.links.length) {
    chartInstance.clear();
    return;
  }

  const tokens = getEChartsThemeTokens(isDark);

  const styledNodes = flow.nodes.map((n) => {
    let color = tokens.textSecondary;
    if (n.category === 'tipo') {
      color = getTipoColor(n.name, isDark);
    } else if (n.category === 'prio') {
      color = PRIO_COLORS[n.name] || '#64748B';
    } else if (n.category === 'estado') {
      color = n.name === 'Cumple Plazo' ? tokens.sla.cumple : tokens.sla.excede;
    }
    return {
      name: n.name,
      itemStyle: {
        color,
        borderColor: 'transparent',
      },
    };
  });

  const option: echarts.EChartsOption = {
    backgroundColor: 'transparent',
    tooltip: {
      trigger: 'item',
      triggerOn: 'mousemove',
      backgroundColor: tokens.tooltipBg,
      borderColor: tokens.borderColor,
      textStyle: { color: tokens.textColor, fontFamily: tokens.fontFamily, fontSize: 12 },
      formatter: (params: any) => {
        if (params.dataType === 'edge') {
          return `
            <div style="font-weight:800;margin-bottom:3px">${params.data.source} → ${params.data.target}</div>
            <div>Volumen de flujo: <b>${Number(params.data.value).toLocaleString()} avisos</b></div>
          `;
        }
        return `
          <div style="font-weight:800;margin-bottom:3px">${params.name}</div>
          <div>Total en nodo: <b>${Number(params.value || 0).toLocaleString()} avisos</b></div>
        `;
      },
    },
    series: [
      {
        type: 'sankey',
        left: 8,
        right: 112,
        top: 10,
        bottom: 12,
        nodeWidth: 14,
        nodeGap: 10,
        draggable: false,
        emphasis: { focus: 'adjacency' },
        data: styledNodes,
        links: flow.links,
        lineStyle: {
          color: 'gradient',
          curveness: 0.48,
          opacity: isDark ? 0.35 : 0.28,
        },
        label: {
          color: tokens.textColor,
          fontFamily: tokens.fontFamily,
          fontSize: 11,
          fontWeight: 700,
        },
      },
    ],
  };

  chartInstance.setOption(option, true);
}

const { render } = useChart(chartContainer, renderSankey);

watch(
  () => opsStore.data?.sankey_flow,
  () => render(),
  { deep: true }
);
</script>

<template>
  <div class="sankey-wrapper">
    <div ref="chartContainer" class="sankey-canvas"></div>
    <div class="sankey-legend">
      <span class="leg-item"><i class="dot" style="background: var(--color-brand)"></i> Causa (Tipo de Aviso)</span>
      <span class="leg-arrow">→</span>
      <span class="leg-item"><i class="dot" style="background: var(--color-accent)"></i> Compromiso (Prioridad SLA)</span>
      <span class="leg-arrow">→</span>
      <span class="leg-item"><i class="dot" style="background: var(--sla-success)"></i> Cumple Plazo</span>
      <span class="leg-item"><i class="dot" style="background: var(--sla-danger)"></i> Excede Plazo</span>
    </div>
  </div>
</template>

<style scoped>
.sankey-wrapper {
  display: flex;
  flex-direction: column;
  width: 100%;
  height: 100%;
  min-height: 0;
}

.sankey-canvas {
  flex: 1;
  width: 100%;
  min-height: 260px;
}

.sankey-legend {
  display: flex;
  align-items: center;
  justify-content: center;
  flex-wrap: wrap;
  gap: 8px 14px;
  padding: 6px 10px 2px;
  border-top: 1px solid var(--border-subtle);
  font-size: 0.72rem;
  color: var(--text-secondary);
  flex-shrink: 0;
}

.leg-item {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  font-weight: 600;
}

.leg-arrow {
  color: var(--text-muted);
  font-weight: 700;
}

.dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  display: inline-block;
}
</style>


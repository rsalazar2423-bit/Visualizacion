<script setup lang="ts">
import { ref, watch } from 'vue';
import * as echarts from 'echarts';
import type { CapacityRegionItem } from '../../types/models';
import { getEChartsThemeTokens } from '../../constants/themeTokens';
import { useChart } from '../../composables/useChart';

const props = defineProps<{
  items: CapacityRegionItem[];
}>();

const chartRef = ref<HTMLDivElement | null>(null);

function renderScatterChart(chartInstance: echarts.ECharts, isDark: boolean) {
  const items = props.items || [];
  if (!items.length) {
    chartInstance.clear();
    return;
  }

  const tokens = getEChartsThemeTokens(isDark);

  const scatterData = items.map((m) => {
    const isCritical = m.cumple_pct < 45 || m.abiertos_vencidos >= 10;
    const isWarning = !isCritical && m.cumple_pct < 60;

    return {
      name: m.region,
      value: [m.total_avisos, m.cumple_pct, m.abiertos_vencidos, m.mediana_dias, m.torres],
      itemStyle: {
        color: isCritical
          ? tokens.sla.excede
          : isWarning
            ? tokens.sla.warning
            : (isDark ? 'rgba(56, 189, 248, 0.45)' : 'rgba(51, 65, 85, 0.35)'),
        opacity: isCritical ? 0.95 : 0.65,
        borderColor: isCritical ? '#FFFFFF' : (isDark ? '#38BDF8' : '#64748B'),
        borderWidth: isCritical ? 2 : 1,
      },
    };
  });

  const option: echarts.EChartsOption = {
    backgroundColor: 'transparent',
    tooltip: {
      trigger: 'item',
      backgroundColor: tokens.tooltipBg,
      borderColor: tokens.tooltipBorder,
      textStyle: { color: tokens.textColor, fontFamily: tokens.fontFamily, fontSize: 12 },
      formatter: (params: any) => {
        const d = params.data;
        if (!d) return '';
        const [total, cumple, vencidos, mediana, torres] = d.value;
        return `
          <div style="font-weight:800;margin-bottom:4px;color:${tokens.textColor};">${d.name}</div>
          <div style="color:${tokens.textColor};">Carga Total: <b>${total} avisos</b> (${torres} torres)</div>
          <div style="color:${tokens.sla.cumple};">Cumplimiento SLA: <b>${cumple}%</b></div>
          <div style="color:${tokens.sla.excede};">Abiertos Vencidos: <b>${vencidos}</b></div>
          <div style="color:${tokens.textSecondary};">Tiempo Típico (Mediana): <b>${mediana} días</b></div>
        `;
      },
    },
    toolbox: {
      right: 12,
      top: 0,
      feature: {
        dataZoom: {
          title: { zoom: 'Seleccionar zona (Caja)', back: 'Restablecer zoom' },
        },
        restore: { title: 'Restablecer vista' },
      },
      iconStyle: { borderColor: tokens.textSecondary },
    },
    dataZoom: [
      {
        type: 'inside',
        xAxisIndex: 0,
      },
      {
        type: 'inside',
        yAxisIndex: 0,
      },
    ],
    grid: {
      left: '4%',
      right: '5%',
      bottom: '12%',
      top: '36px',
      containLabel: true,
    },
    xAxis: {
      type: 'value',
      name: 'Carga de Trabajo (Volumen de Avisos)',
      nameLocation: 'middle',
      nameGap: 26,
      nameTextStyle: { color: tokens.textSecondary, fontWeight: 600, fontSize: 11 },
      axisLabel: { color: tokens.textSecondary, fontFamily: tokens.fontFamily, fontSize: 10.5 },
      splitLine: { lineStyle: { color: tokens.gridColor } },
    },
    yAxis: {
      type: 'value',
      name: '% Cumplimiento SLA',
      min: 0,
      max: 100,
      nameTextStyle: { color: tokens.textSecondary, fontWeight: 600, fontSize: 11, padding: [0, 0, 4, 0] },
      axisLabel: { formatter: '{value}%', color: tokens.textSecondary, fontFamily: tokens.fontFamily, fontSize: 10.5 },
      splitLine: { lineStyle: { color: tokens.gridColor } },
    },
    series: [
      {
        name: 'Municipios',
        type: 'scatter',
        symbolSize: (val: any) => {
          const vencidos = val[2] || 0;
          return Math.max(10, Math.min(32, 10 + Math.sqrt(vencidos) * 4));
        },
        label: {
          show: true,
          position: 'top',
          formatter: (p: any) => (p.data.value[0] >= 45 || p.data.value[2] >= 12 ? p.data.name : ''),
          color: tokens.textSecondary,
          fontSize: 10,
          fontWeight: 600,
        },
        data: scatterData,
      },
    ],
  };

  chartInstance.setOption(option, true);
}

const { render } = useChart(chartRef, renderScatterChart);

watch(
  () => props.items,
  () => {
    render();
  },
  { deep: true }
);
</script>

<template>
  <div class="scatter-chart-wrapper">
    <div ref="chartRef" class="cap-canvas"></div>
  </div>
</template>

<style scoped>
.scatter-chart-wrapper {
  width: 100%;
  height: 100%;
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
}

.cap-canvas {
  width: 100%;
  height: 100%;
  flex: 1;
  min-height: 320px;
}
</style>

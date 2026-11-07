<script setup lang="ts">
import { ref, watch } from 'vue';
import * as echarts from 'echarts';
import type { CapacityRegionItem } from '../../types/models';
import { getEChartsThemeTokens } from '../../constants/themeTokens';
import { useChart } from '../../composables/useChart';

const props = defineProps<{
  regions: CapacityRegionItem[];
}>();

const chartRef = ref<HTMLDivElement | null>(null);

function renderLoadChart(chartInstance: echarts.ECharts, isDark: boolean) {
  const regions = props.regions || [];
  if (!regions.length) {
    chartInstance.clear();
    return;
  }

  const tokens = getEChartsThemeTokens(isDark);
  const topRegions = regions.slice(0, 10);
  const names = topRegions.map((r) => r.region);
  const abiertosEnPlazo = topRegions.map((r) => Math.max(0, r.abiertos - r.abiertos_vencidos));
  const vencidos = topRegions.map((r) => r.abiertos_vencidos);
  const densidad = topRegions.map((r) => r.carga_por_100_torres);

  const option: echarts.EChartsOption = {
    backgroundColor: 'transparent',
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'shadow' },
      backgroundColor: tokens.tooltipBg,
      borderColor: tokens.tooltipBorder,
      textStyle: { color: tokens.textColor, fontFamily: tokens.fontFamily, fontSize: 12 },
    },
    legend: {
      top: 4,
      left: 'center',
      itemGap: 12,
      textStyle: { color: tokens.textColor, fontFamily: tokens.fontFamily, fontWeight: 600, fontSize: 11 },
    },
    dataZoom: [
      {
        type: 'inside',
        throttle: 50,
      },
    ],
    grid: {
      left: '3%',
      right: '4%',
      bottom: '16%',
      top: '72px', // Espacio holgado garantizado: la leyenda queda en 4-35px, y los nombres de ejes en 40-60px sin colisión
      containLabel: true,
    },
    xAxis: {
      type: 'category',
      data: names,
      axisLabel: {
        color: tokens.textColor,
        fontFamily: tokens.fontFamily,
        fontWeight: 600,
        fontSize: 10.5,
        interval: 0,
        margin: 12,
        lineHeight: 14,
        formatter: (val: string) => {
          if (val === 'Valle Del Cauca') return 'Valle del\nCauca';
          if (val.length > 10 && val.includes(' ')) {
            const parts = val.split(' ');
            return parts.slice(0, Math.ceil(parts.length / 2)).join(' ') + '\n' + parts.slice(Math.ceil(parts.length / 2)).join(' ');
          }
          return val;
        },
      },
      axisLine: { lineStyle: { color: tokens.gridColor } },
    },
    yAxis: [
      {
        type: 'value',
        name: 'Avisos Pendientes',
        nameLocation: 'end',
        nameTextStyle: {
          color: tokens.textSecondary,
          fontSize: 10.5,
          fontWeight: 600,
          padding: [0, 0, 6, 0],
        },
        axisLabel: { color: tokens.textSecondary, fontFamily: tokens.fontFamily, fontSize: 10.5 },
        splitLine: { lineStyle: { color: tokens.gridColor } },
      },
      {
        type: 'value',
        name: 'Avisos / 100 Torres',
        nameLocation: 'end',
        nameTextStyle: {
          color: tokens.textSecondary,
          fontSize: 10.5,
          fontWeight: 600,
          padding: [0, 0, 6, 0],
        },
        axisLabel: { color: tokens.textSecondary, fontFamily: tokens.fontFamily, fontSize: 10.5 },
        splitLine: { show: false },
      },
    ],
    series: [
      {
        name: 'Abiertos Vencidos (Prioritario)',
        type: 'bar',
        stack: 'backlog',
        barMaxWidth: 26,
        itemStyle: { color: tokens.sla.excede, borderRadius: [0, 0, 0, 0] },
        data: vencidos,
      },
      {
        name: 'Abiertos en Plazo',
        type: 'bar',
        stack: 'backlog',
        barMaxWidth: 26,
        itemStyle: { color: tokens.sla.abierto, borderRadius: [4, 4, 0, 0] },
        data: abiertosEnPlazo,
      },
      {
        name: 'Densidad (Avisos por 100 Torres)',
        type: 'line',
        yAxisIndex: 1,
        symbol: 'circle',
        symbolSize: 8,
        lineStyle: { width: 2.2, color: tokens.brandColor },
        itemStyle: { color: tokens.brandColor },
        data: densidad,
      },
    ],
  };

  chartInstance.setOption(option, true);
}

const emit = defineEmits<{
  (e: 'select-region', region: string): void;
}>();

function handleBarClick(params: any) {
  const name = params.name || params.value;
  if (name) {
    emit('select-region', String(name));
  }
}

const { render } = useChart(chartRef, renderLoadChart, handleBarClick);

watch(
  () => props.regions,
  () => {
    render();
  },
  { deep: true }
);
</script>

<template>
  <div class="regional-load-wrapper">
    <div ref="chartRef" class="cap-canvas"></div>
  </div>
</template>

<style scoped>
.regional-load-wrapper {
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

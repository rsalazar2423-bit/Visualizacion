<script setup lang="ts">
import { ref, watch } from 'vue';
import { BarChart2 } from 'lucide-vue-next';
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
      top: 0,
      textStyle: { color: tokens.textColor, fontFamily: tokens.fontFamily, fontWeight: 600 },
    },
    grid: {
      left: '3%',
      right: '5%',
      bottom: '8%',
      top: '42px',
      containLabel: true,
    },
    xAxis: {
      type: 'category',
      data: names,
      axisLabel: {
        color: tokens.textColor,
        fontFamily: tokens.fontFamily,
        fontWeight: 600,
        fontSize: 11,
        interval: 0,
        rotate: 15,
      },
      axisLine: { lineStyle: { color: tokens.gridColor } },
    },
    yAxis: [
      {
        type: 'value',
        name: 'Avisos Pendientes',
        nameTextStyle: { color: tokens.textSecondary, fontSize: 11 },
        axisLabel: { color: tokens.textSecondary, fontFamily: tokens.fontFamily },
        splitLine: { lineStyle: { color: tokens.gridColor } },
      },
      {
        type: 'value',
        name: 'Avisos / 100 Torres',
        nameTextStyle: { color: tokens.textSecondary, fontSize: 11 },
        axisLabel: { color: tokens.textSecondary, fontFamily: tokens.fontFamily },
        splitLine: { show: false },
      },
    ],
    series: [
      {
        name: 'Abiertos Vencidos (Prioritario)',
        type: 'bar',
        stack: 'backlog',
        barMaxWidth: 28,
        itemStyle: { color: tokens.sla.excede, borderRadius: [0, 0, 0, 0] },
        data: vencidos,
      },
      {
        name: 'Abiertos en Plazo',
        type: 'bar',
        stack: 'backlog',
        barMaxWidth: 28,
        itemStyle: { color: tokens.sla.abierto, borderRadius: [4, 4, 0, 0] },
        data: abiertosEnPlazo,
      },
      {
        name: 'Densidad (Avisos por 100 Torres)',
        type: 'line',
        yAxisIndex: 1,
        symbol: 'circle',
        symbolSize: 8,
        lineStyle: { width: 2.5, color: tokens.brandColor },
        itemStyle: { color: tokens.brandColor },
        data: densidad,
      },
    ],
  };

  chartInstance.setOption(option, true);
}

const { render } = useChart(chartRef, renderLoadChart);

watch(
  () => props.regions,
  () => {
    render();
  },
  { deep: true }
);
</script>

<template>
  <div class="card">
    <div class="chart-header-block">
      <div class="header-main-row">
        <div class="title-with-badge">
          <span class="badge">
            <BarChart2 :size="13" /> Carga Regional
          </span>
          <h3 class="card-title">Backlog Activo y Densidad por Territorio</h3>
        </div>
      </div>
      <p class="chart-reseña">
        Contraste entre el volumen de avisos abiertos (vencidos vs. en plazo) y la presión relativa por cada 100 torres instaladas.
      </p>
    </div>
    <div ref="chartRef" class="cap-canvas"></div>
  </div>
</template>

<style scoped>
.cap-canvas {
  width: 100%;
  height: 360px;
}
</style>


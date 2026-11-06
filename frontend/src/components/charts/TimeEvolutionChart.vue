<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import * as echarts from 'echarts';
import { useOperationsStore } from '../../stores/operationsStore';
import { getEChartsThemeTokens } from '../../constants/themeTokens';
import { useChart } from '../../composables/useChart';

const opsStore = useOperationsStore();
const metricOverlay = ref<'cumplimiento' | 'mediana'>('cumplimiento');

const seriesPoints = computed(() => opsStore.data?.time_series || []);

const summaryStats = computed(() => {
  const pts = seriesPoints.value;
  if (!pts.length) return { totalIngresos: 0, totalCierres: 0, peakYear: '-', peakIngresos: 0 };
  let totalIngresos = 0;
  let totalCierres = 0;
  let peakYear = '-';
  let peakIngresos = 0;
  for (const p of pts) {
    totalIngresos += p.ingresados;
    totalCierres += p.cerrados;
    if (p.ingresados > peakIngresos) {
      peakIngresos = p.ingresados;
      peakYear = p.periodo;
    }
  }
  return { totalIngresos, totalCierres, peakYear, peakIngresos };
});

function renderTimeEvolution(chartInstance: echarts.ECharts, isDark: boolean) {
  const pts = seriesPoints.value;
  if (!pts.length) {
    chartInstance.clear();
    return;
  }

  const tokens = getEChartsThemeTokens(isDark);
  const periods = pts.map((p) => p.periodo);
  const ingresados = pts.map((p) => p.ingresados);
  const cerrados = pts.map((p) => p.cerrados);
  const vencidos = pts.map((p) => p.abiertos_vencidos);
  const overlayData = pts.map((p) =>
    metricOverlay.value === 'cumplimiento' ? p.cumple_oportuno_pct : p.mediana_dias
  );

  const isCumpleMode = metricOverlay.value === 'cumplimiento';

  const option: echarts.EChartsOption = {
    backgroundColor: 'transparent',
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'cross' },
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
      right: '4%',
      bottom: '6%',
      top: '44px',
      containLabel: true,
    },
    xAxis: {
      type: 'category',
      data: periods,
      axisLabel: { color: tokens.textSecondary, fontFamily: tokens.fontFamily, fontWeight: 600 },
      axisLine: { lineStyle: { color: tokens.gridColor } },
    },
    yAxis: [
      {
        type: 'value',
        name: 'Volumen de Avisos',
        nameTextStyle: { color: tokens.textSecondary, fontSize: 11 },
        axisLabel: { color: tokens.textSecondary, fontFamily: tokens.fontFamily },
        splitLine: { lineStyle: { color: tokens.gridColor } },
      },
      {
        type: 'value',
        name: isCumpleMode ? '% Cumplimiento' : 'Mediana (Días)',
        max: isCumpleMode ? 100 : undefined,
        nameTextStyle: { color: tokens.textSecondary, fontSize: 11 },
        axisLabel: {
          formatter: isCumpleMode ? '{value}%' : '{value} d',
          color: tokens.textSecondary,
          fontFamily: tokens.fontFamily,
        },
        splitLine: { show: false },
      },
    ],
    series: [
      {
        name: 'Avisos Ingresados',
        type: 'line',
        smooth: 0.25,
        symbol: 'circle',
        symbolSize: 6,
        lineStyle: { width: 2.2, color: tokens.sla.abierto },
        itemStyle: { color: tokens.sla.abierto },
        areaStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: tokens.sla.abiertoSoft },
            { offset: 1, color: 'rgba(0,0,0,0)' },
          ]),
        },
        data: ingresados,
      },
      {
        name: 'Avisos Cerrados',
        type: 'line',
        smooth: 0.25,
        symbol: 'circle',
        symbolSize: 6,
        lineStyle: { width: 2.2, color: isDark ? '#38BDF8' : '#0284C7' },
        itemStyle: { color: isDark ? '#38BDF8' : '#0284C7' },
        data: cerrados,
      },
      {
        name: 'Abiertos Vencidos (del periodo)',
        type: 'bar',
        barMaxWidth: 16,
        itemStyle: {
          color: tokens.sla.excede,
          borderRadius: [2, 2, 0, 0],
          opacity: 0.75,
        },
        data: vencidos,
      },
      {
        name: isCumpleMode ? '% Cumplimiento Oportuno' : 'Tiempo Típico (Mediana Días)',
        type: 'line',
        yAxisIndex: 1,
        smooth: 0.25,
        symbol: 'diamond',
        symbolSize: 6,
        lineStyle: { width: 2, type: 'dashed', color: tokens.sla.warning },
        itemStyle: { color: tokens.sla.warning },
        data: overlayData,
      },
    ],
  };

  chartInstance.setOption(option, true);
}

const chartContainer = ref<HTMLDivElement | null>(null);
const { render } = useChart(chartContainer, renderTimeEvolution);

watch(() => [opsStore.data, metricOverlay.value], () => render(), { deep: true });
</script>

<template>
  <div class="time-evolution-wrapper">
    <div class="evolution-toolbar">
      <div class="evolution-kpis">
        <span class="evo-stat">
          Pico de demanda: <b>{{ summaryStats.peakYear }} ({{ summaryStats.peakIngresos }} avisos)</b>
        </span>
        <span class="evo-stat">
          Balance histórico: <b>{{ summaryStats.totalCierres.toLocaleString() }} cerrados</b> de
          <b>{{ summaryStats.totalIngresos.toLocaleString() }} ingresados</b>
        </span>
      </div>

      <div class="overlay-toggle">
        <span class="toggle-label">Eje Derecho:</span>
        <button
          class="btn-toggle-sm"
          :class="{ active: metricOverlay === 'cumplimiento' }"
          @click="metricOverlay = 'cumplimiento'"
        >
          % Cumplimiento
        </button>
        <button
          class="btn-toggle-sm"
          :class="{ active: metricOverlay === 'mediana' }"
          @click="metricOverlay = 'mediana'"
        >
          Mediana Días
        </button>
      </div>
    </div>

    <div ref="chartContainer" class="chart-canvas-evolution"></div>
  </div>
</template>

<style scoped>
.time-evolution-wrapper {
  width: 100%;
  height: 100%;
  min-height: 0;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.evolution-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 10px;
  padding-bottom: 4px;
  flex-shrink: 0;
}

.evolution-kpis {
  display: flex;
  gap: 16px;
  flex-wrap: wrap;
}

.evo-stat {
  font-size: 0.78rem;
  color: var(--text-secondary);
  background: var(--bg-subtle);
  padding: 4px 10px;
  border-radius: var(--radius-sm);
  border: 1px solid var(--border-subtle);
}

.evo-stat b {
  color: var(--text-primary);
}

.overlay-toggle {
  display: flex;
  align-items: center;
  gap: 6px;
}

.toggle-label {
  font-size: 0.75rem;
  font-weight: 600;
  color: var(--text-secondary);
}

.btn-toggle-sm {
  background: var(--bg-card);
  border: 1px solid var(--border-subtle);
  color: var(--text-secondary);
  font-size: 0.75rem;
  font-weight: 600;
  padding: 4px 10px;
  border-radius: var(--radius-sm);
  cursor: pointer;
  transition: all var(--transition-fast);
}

.btn-toggle-sm.active {
  background: var(--color-brand-soft);
  border-color: var(--color-brand);
  color: var(--color-brand);
  font-weight: 700;
}

.chart-canvas-evolution {
  width: 100%;
  flex: 1;
  min-height: 380px;
}
</style>

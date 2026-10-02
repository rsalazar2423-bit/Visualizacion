<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import { Filter, Check, X } from 'lucide-vue-next';
import * as echarts from 'echarts';
import { useOperationsStore } from '../../stores/operationsStore';
import { getEChartsThemeTokens } from '../../constants/themeTokens';
import { useChart } from '../../composables/useChart';
import { formatStackedBarTooltip } from '../../utils/chartFormatters';

const opsStore = useOperationsStore();

const stackedItems = computed(() => {
  return opsStore.data?.stacked_bar || [];
});

const PRIO_BORDER_COLORS: Record<string, string> = {
  'Muy Alta': '#E11D48',
  'Alta': '#F59E0B',
  'Media': '#0D9763',
  'Baja': '#84CC16',
};

function handlePriorityClick(prio: string) {
  opsStore.setPrioridad(prio);
}

function renderStackedBar(chartInstance: echarts.ECharts, isDark: boolean) {
  if (!opsStore.data?.stacked_bar) return;

  const tokens = getEChartsThemeTokens(isDark);
  const items = opsStore.data.stacked_bar;

  if (!items || items.length === 0) {
    chartInstance.clear();
    return;
  }

  const selectedPrio = opsStore.selectedPrioridad;
  const priorities = items.map((i) => i.prioridad);

  // Acabado satinado arquitectónico (elegante, sin brillo plástico)
  const cumpleGradient = new echarts.graphic.LinearGradient(0, 0, 0, 1, [
    { offset: 0, color: '#10B981' },    // Luz cenital suave
    { offset: 0.5, color: '#0D9763' },   // Color base esmeralda
    { offset: 1, color: '#086341' },    // Sombra de profundidad satinada
  ]);

  const excedeGradient = new echarts.graphic.LinearGradient(0, 0, 0, 1, [
    { offset: 0, color: '#FB7185' },    // Luz cenital suave
    { offset: 0.5, color: '#E11D48' },   // Color base frambuesa
    { offset: 1, color: '#9F1239' },    // Sombra de profundidad satinada
  ]);

  // Selected highlight gradients
  const cumpleGradientSelected = new echarts.graphic.LinearGradient(0, 0, 0, 1, [
    { offset: 0, color: '#34D399' },
    { offset: 0.5, color: '#10B981' },
    { offset: 1, color: '#047857' },
  ]);

  const excedeGradientSelected = new echarts.graphic.LinearGradient(0, 0, 0, 1, [
    { offset: 0, color: '#FDA4AF' },
    { offset: 0.5, color: '#F43F5E' },
    { offset: 1, color: '#BE123C' },
  ]);

  const cumpleSeriesData = items.map((i) => {
    const isSelected = selectedPrio === i.prioridad;
    const isAnySelected = Boolean(selectedPrio);
    const opacity = !isAnySelected || isSelected ? 1 : 0.45;

    return {
      name: i.prioridad,
      value: i.cumple_pct,
      itemStyle: {
        color: isSelected ? cumpleGradientSelected : cumpleGradient,
        opacity: opacity,
        borderColor: isSelected ? '#F59E0B' : (isDark ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.6)'),
        borderWidth: isSelected ? 2.5 : 1.5,
        shadowBlur: isSelected ? 16 : 8,
        shadowOffsetY: isSelected ? 6 : 4,
        shadowColor: isSelected ? 'rgba(245, 158, 11, 0.5)' : (isDark ? 'rgba(0,0,0,0.6)' : 'rgba(0,0,0,0.2)'),
      },
    };
  });

  const excedeSeriesData = items.map((i) => {
    const isSelected = selectedPrio === i.prioridad;
    const isAnySelected = Boolean(selectedPrio);
    const opacity = !isAnySelected || isSelected ? 1 : 0.45;

    return {
      name: i.prioridad,
      value: i.excede_pct,
      itemStyle: {
        color: isSelected ? excedeGradientSelected : excedeGradient,
        opacity: opacity,
        borderColor: isSelected ? '#F59E0B' : (isDark ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.6)'),
        borderWidth: isSelected ? 2.5 : 1.5,
        shadowBlur: isSelected ? 16 : 8,
        shadowOffsetY: isSelected ? 6 : 4,
        shadowColor: isSelected ? 'rgba(245, 158, 11, 0.5)' : (isDark ? 'rgba(0,0,0,0.6)' : 'rgba(0,0,0,0.2)'),
      },
    };
  });

  const option: echarts.EChartsOption = {
    backgroundColor: 'transparent',
    tooltip: {
      trigger: 'axis',
      axisPointer: {
        type: 'shadow',
        shadowStyle: {
          color: isDark ? 'rgba(16, 185, 129, 0.08)' : 'rgba(16, 185, 129, 0.05)',
        },
      },
      backgroundColor: tokens.tooltipBg,
      borderColor: tokens.tooltipBorder,
      textStyle: { color: tokens.textColor, fontFamily: tokens.fontFamily },
      formatter: (params: any) => formatStackedBarTooltip(params, items, selectedPrio, tokens),
    },
    color: ['#10B981', '#E11D48'],
    legend: {
      data: ['Cumple Plazo', 'Excede Plazo'],
      top: '0px',
      textStyle: { color: tokens.textColor, fontFamily: tokens.fontFamily },
    },
    grid: {
      left: '3%',
      right: '6%',
      bottom: '6%',
      top: '40px',
      containLabel: true,
    },
    xAxis: {
      type: 'value',
      max: 100,
      axisLabel: {
        formatter: '{value}%',
        color: tokens.textSecondary,
        fontFamily: tokens.fontFamily,
      },
      splitLine: {
        lineStyle: { color: tokens.gridColor },
      },
    },
    yAxis: {
      type: 'category',
      data: priorities,
      inverse: true,
      triggerEvent: true,
      axisLabel: {
        color: (val?: string | number) => (String(val) === selectedPrio ? '#F59E0B' : tokens.textColor),
        fontFamily: tokens.fontFamily,
        formatter: (val: string) => (val === selectedPrio ? `▶ ${val}` : val),
      },
      axisLine: { lineStyle: { color: tokens.gridColor } },
    },
    series: [
      {
        name: 'Cumple Plazo',
        type: 'bar',
        stack: 'total',
        barWidth: 22,
        label: {
          show: true,
          position: 'inside',
          formatter: (params: any) => {
            const val = Number(params.value);
            if (val < 6) return '';
            return Number.isInteger(val) ? `${val}%` : `${val.toFixed(1)}%`;
          },
          color: '#FFFFFF',
          fontSize: 11,
          fontWeight: 700,
          fontFamily: tokens.fontFamily,
          textShadowColor: 'rgba(0, 0, 0, 0.75)',
          textShadowBlur: 3,
        },
        itemStyle: {
          borderRadius: [5, 0, 0, 5],
        },
        data: cumpleSeriesData,
      },
      {
        name: 'Excede Plazo',
        type: 'bar',
        stack: 'total',
        barWidth: 22,
        label: {
          show: true,
          position: 'inside',
          formatter: (params: any) => {
            const val = Number(params.value);
            if (val < 6) return '';
            return Number.isInteger(val) ? `${val}%` : `${val.toFixed(1)}%`;
          },
          color: '#FFFFFF',
          fontSize: 11,
          fontWeight: 700,
          fontFamily: tokens.fontFamily,
          textShadowColor: 'rgba(0, 0, 0, 0.75)',
          textShadowBlur: 3,
        },
        itemStyle: {
          borderRadius: [0, 5, 5, 0],
        },
        data: excedeSeriesData,
      },
    ],
  };

  chartInstance.setOption(option, true);
}

function handleBarClick(params: any) {
  let prio: string | null = null;
  if (params.name) {
    prio = params.name;
  } else if (params.componentType === 'yAxis' && params.value) {
    prio = params.value;
  }

  if (prio) {
    const cleanPrio = String(prio).replace(/^▶\s*/, '').trim();
    handlePriorityClick(cleanPrio);
  }
}

const chartContainer = ref<HTMLDivElement | null>(null);
const { render } = useChart(chartContainer, renderStackedBar, handleBarClick);

watch(() => [opsStore.data, opsStore.selectedPrioridad], () => render(), { deep: true });
</script>

<template>
  <div class="stacked-bar-wrapper">
    <!-- Active Priority Filter Chip -->
    <div v-if="opsStore.selectedPrioridad" class="active-prio-bar">
      <span class="active-badge">
        <Filter :size="13" /> Filtrando por Plazo: <b>{{ opsStore.selectedPrioridad }}</b>
      </span>
      <button class="btn-clear-prio" @click="opsStore.setPrioridad(opsStore.selectedPrioridad)">
        <X :size="12" /> Ver Todos los Plazos
      </button>
    </div>

    <!-- Canvas de 100% de Ancho -->
    <div ref="chartContainer" class="chart-canvas-full"></div>

    <!-- Barra de Identificación de Colores / Leyenda Interactiva Abajo -->
    <div class="chart-legend-container">
      <div class="chart-legend-header">
        <span>Plazos de Resolución de Avisos</span>
        <span class="side-panel-hint">{{ stackedItems.length }} niveles de servicio</span>
      </div>

      <div class="chart-legend-grid">
        <button
          v-for="item in stackedItems"
          :key="item.prioridad"
          class="legend-chip"
          :class="{ active: opsStore.selectedPrioridad === item.prioridad }"
          :title="`Aislar plazo ${item.prioridad}`"
          @click="handlePriorityClick(item.prioridad)"
        >
          <span
            class="legend-chip-dot"
            :style="{ backgroundColor: PRIO_BORDER_COLORS[item.prioridad] || '#38BDF8' }"
          ></span>
          <span class="legend-chip-name">{{ item.prioridad }}</span>
          <span class="legend-chip-metric">
            {{ item.total.toLocaleString() }} <small>avisos</small>
          </span>
          <span class="legend-chip-badge cumple">
            <Check :size="10" /> {{ item.cumple_pct }}%
          </span>
          <span class="legend-chip-badge excede">
            <X :size="10" /> {{ item.excede_pct }}%
          </span>
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.stacked-bar-wrapper {
  width: 100%;
  position: relative;
  display: flex;
  flex-direction: column;
}

.active-prio-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: rgba(245, 158, 11, 0.12);
  border: 1px solid rgba(245, 158, 11, 0.4);
  border-radius: var(--radius-sm, 6px);
  padding: 6px 12px;
  margin-bottom: 8px;
}

.active-badge {
  font-size: 0.8rem;
  color: #F59E0B;
}

.btn-clear-prio {
  background: transparent;
  border: 1px solid rgba(245, 158, 11, 0.5);
  color: #F59E0B;
  font-size: 0.75rem;
  font-weight: 600;
  padding: 2px 8px;
  border-radius: 4px;
  cursor: pointer;
  transition: all var(--transition-fast);
}

.btn-clear-prio:hover {
  background: #F59E0B;
  color: #000000;
}

.prio-card {
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding-bottom: 6px;
  border-bottom: 1px dashed var(--border-subtle);
}

.prio-card:last-child {
  border-bottom: none;
}

.prio-metrics-row {
  display: flex;
  gap: 4px;
  padding-left: 8px;
  flex-wrap: wrap;
}

.metric-badge {
  font-size: 0.67rem;
  font-weight: 600;
  padding: 2px 6px;
  border-radius: 4px;
  display: inline-flex;
  align-items: center;
}

.metric-badge.cumple {
  background: rgba(16, 185, 129, 0.12);
  color: var(--color-emerald);
  border: 1px solid rgba(16, 185, 129, 0.3);
}

.metric-badge.excede {
  background: rgba(244, 63, 94, 0.12);
  color: #F43F5E;
  border: 1px solid rgba(244, 63, 94, 0.3);
}
</style>


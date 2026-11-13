<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import { Filter, Check, X } from 'lucide-vue-next';
import * as echarts from 'echarts';
import { useOperationsStore } from '../../stores/operationsStore';
import { getEChartsThemeTokens, PRIO_COLORS } from '../../constants/themeTokens';
import { useChart } from '../../composables/useChart';
import { formatStackedBarTooltip } from '../../utils/chartFormatters';

const opsStore = useOperationsStore();

const stackedItems = computed(() => {
  return opsStore.data?.stacked_bar || [];
});

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

  const cumpleSeriesData = items.map((i) => {
    const isSelected = selectedPrio === i.prioridad;
    const isAnySelected = Boolean(selectedPrio);
    const opacity = !isAnySelected || isSelected ? 0.94 : 0.35;

    return {
      name: i.prioridad,
      value: i.cumple_pct,
      itemStyle: {
        // GRIS PIZARRA NEUTRO: Actúa como fondo contextual pasivo (No compite con la alerta)
        color: isDark ? '#334155' : '#E2E8F0',
        opacity,
        borderColor: isSelected ? tokens.accentSelect : tokens.cardBg,
        borderWidth: isSelected ? 2 : 1,
      },
    };
  });

  const excedeSeriesData = items.map((i) => {
    const isSelected = selectedPrio === i.prioridad;
    const isAnySelected = Boolean(selectedPrio);
    const opacity = !isAnySelected || isSelected ? 0.92 : 0.35;

    return {
      name: i.prioridad,
      value: i.excede_pct,
      itemStyle: {
        // ROJO CARMÍN: El ÚNICO foco de atención cromático en la barra
        color: tokens.sla.excede,
        opacity,
        borderColor: isSelected ? tokens.accentSelect : tokens.cardBg,
        borderWidth: isSelected ? 2 : 1,
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
          color: isDark ? 'rgba(148, 163, 184, 0.08)' : 'rgba(15, 23, 42, 0.04)',
        },
      },
      backgroundColor: tokens.tooltipBg,
      borderColor: tokens.tooltipBorder,
      textStyle: { color: tokens.textColor, fontFamily: tokens.fontFamily },
      formatter: (params: any) => formatStackedBarTooltip(params, items, selectedPrio, tokens),
    },
    color: [isDark ? '#334155' : '#E2E8F0', tokens.sla.excede],
    legend: {
      data: ['Cumple Plazo', 'Excede Plazo'],
      top: '0px',
      textStyle: { color: tokens.textColor, fontFamily: tokens.fontFamily, fontWeight: 600 },
    },
    grid: {
      left: '2%',
      right: '5%',
      bottom: '4%',
      top: '38px',
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
        color: (val?: string | number) => (String(val) === selectedPrio ? tokens.accentSelect : tokens.textColor),
        fontFamily: tokens.fontFamily,
        fontWeight: 600,
        formatter: (val: string) => (val === selectedPrio ? `▸ ${val}` : val),
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
            if (val < 7) return '';
            return Number.isInteger(val) ? `${val}%` : `${val.toFixed(1)}%`;
          },
          color: isDark ? '#94A3B8' : '#475569', // Texto gris legible sobre fondo gris
          fontSize: 11,
          fontWeight: 700,
          fontFamily: tokens.fontFamily,
        },
        itemStyle: {
          borderRadius: [4, 0, 0, 4],
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
            if (val < 7) return '';
            return Number.isInteger(val) ? `${val}%` : `${val.toFixed(1)}%`;
          },
          color: '#FFFFFF',
          fontSize: 11,
          fontWeight: 700,
          fontFamily: tokens.fontFamily,
        },
        itemStyle: {
          borderRadius: [0, 4, 4, 0],
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
    const cleanPrio = String(prio).replace(/^▸\s*/, '').trim();
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

    <!-- Leyenda Interactiva con Rampa Secuencial de Plazos -->
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
            :style="{ backgroundColor: PRIO_COLORS[item.prioridad] || '#64748B' }"
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
  height: 100%;
  min-height: 0;
  position: relative;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
}

.chart-canvas-full {
  width: 100%;
  flex: 1;
  min-height: 320px;
}

.active-prio-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: var(--sla-info-bg);
  border: 1px solid var(--sla-info-border);
  border-radius: var(--radius-sm, 6px);
  padding: 6px 12px;
  margin-bottom: 8px;
}

.active-badge {
  font-size: 0.8rem;
  color: var(--sla-info);
  display: inline-flex;
  align-items: center;
  gap: 6px;
}

.btn-clear-prio {
  background: transparent;
  border: 1px solid var(--sla-info-border);
  color: var(--sla-info);
  font-size: 0.75rem;
  font-weight: 600;
  padding: 2px 8px;
  border-radius: 4px;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 4px;
  transition: all var(--transition-fast);
}

.btn-clear-prio:hover {
  background: var(--sla-info);
  color: #FFFFFF;
}
</style>

<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import { Tag, X } from 'lucide-vue-next';
import type * as echarts from 'echarts';
import { useOperationsStore } from '../../stores/operationsStore';
import { useThemeStore } from '../../stores/themeStore';
import { getEChartsThemeTokens, getTipoColor } from '../../constants/themeTokens';
import { useChart } from '../../composables/useChart';
import { formatDonutTooltip } from '../../utils/chartFormatters';

const opsStore = useOperationsStore();
const themeStore = useThemeStore();

const donutItems = computed(() => {
  const raw = opsStore.data?.donut || [];
  return raw.map((item) => ({
    ...item,
    color: getTipoColor(item.name, themeStore.isDark),
  }));
});

function handleTipoClick(name: string) {
  if (opsStore.isTipoSelected(name) && opsStore.selectedTipos.length === 1) {
    opsStore.setSingleTipo('Todos');
  } else {
    opsStore.setSingleTipo(name);
  }
}

function renderDonut(chartInstance: echarts.ECharts, isDark: boolean) {
  if (!opsStore.data?.donut) return;

  const tokens = getEChartsThemeTokens(isDark);
  const items = opsStore.data.donut;

  const chartData = items.map((i) => {
    const isSelected = opsStore.isTipoSelected(i.name);
    const isAnySelected = opsStore.selectedTipos.length > 0;
    const opacity = !isAnySelected || isSelected ? 1 : 0.32;
    const resolvedColor = getTipoColor(i.name, isDark);

    return {
      name: i.name,
      value: i.value,
      itemStyle: {
        color: resolvedColor,
        opacity,
        borderColor: isSelected ? tokens.accentSelect : tokens.cardBg,
        borderWidth: isSelected ? 3 : 2,
      },
    };
  });

  const total = items.reduce((acc, curr) => acc + curr.value, 0);

  const option: echarts.EChartsOption = {
    backgroundColor: 'transparent',
    tooltip: {
      trigger: 'item',
      backgroundColor: tokens.tooltipBg,
      borderColor: tokens.tooltipBorder,
      textStyle: { color: tokens.textColor, fontFamily: tokens.fontFamily },
      formatter: (params: any) => formatDonutTooltip(params, total, tokens),
    },
    legend: {
      show: false,
    },
    series: [
      {
        name: 'Tipo de Aviso',
        type: 'pie',
        radius: ['52%', '78%'],
        center: ['50%', '50%'],
        avoidLabelOverlap: true,
        itemStyle: {
          borderRadius: 6,
          borderColor: tokens.cardBg,
          borderWidth: 2,
        },
        label: {
          show: false,
          position: 'center',
        },
        emphasis: {
          scale: true,
          scaleSize: 6,
          label: {
            show: true,
            fontSize: 14,
            fontWeight: 'bold',
            color: tokens.textColor,
            fontFamily: tokens.fontFamily,
            formatter: '{b}\n{d}%',
          },
        },
        labelLine: {
          show: false,
        },
        data: chartData,
      },
    ],
  };

  chartInstance.setOption(option, true);
}

function handleDonutClick(params: any) {
  if (params.name) {
    handleTipoClick(params.name);
  }
}

const chartContainer = ref<HTMLDivElement | null>(null);
const { render } = useChart(chartContainer, renderDonut, handleDonutClick);

watch(() => [opsStore.data, opsStore.selectedTipos], () => render(), { deep: true });
</script>

<template>
  <div class="donut-wrapper">
    <!-- Active Tipo Filter Chip -->
    <div v-if="opsStore.selectedTipos.length > 0" class="active-tipo-bar">
      <span class="active-badge">
        <Tag :size="13" /> Filtrando por Tipo: <b>{{ opsStore.selectedTipos.join(', ') }}</b>
      </span>
      <button class="btn-clear-tipo" @click="opsStore.setSingleTipo('Todos')">
        <X :size="12" /> Ver Todos
      </button>
    </div>

    <!-- Canvas de 100% de Ancho -->
    <div ref="chartContainer" class="chart-canvas-full"></div>

    <!-- Leyenda Interactiva Abajo -->
    <div class="chart-legend-container">
      <div class="chart-legend-header">
        <span>Tipos de Aviso Registrados</span>
        <span class="side-panel-hint">{{ donutItems.length }} categorías</span>
      </div>

      <div class="chart-legend-grid">
        <button
          v-for="item in donutItems"
          :key="item.name"
          class="legend-chip"
          :class="{ active: opsStore.isTipoSelected(item.name) }"
          :title="`Filtrar por ${item.name}`"
          @click="handleTipoClick(item.name)"
        >
          <span class="legend-chip-dot" :style="{ backgroundColor: item.color }"></span>
          <span class="legend-chip-name">{{ item.name }}</span>
          <span class="legend-chip-metric">
            {{ item.value.toLocaleString() }}
            <small>({{ item.pct }}%)</small>
          </span>
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.donut-wrapper {
  width: 100%;
  position: relative;
  display: flex;
  flex-direction: column;
}

.active-tipo-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: var(--color-brand-soft);
  border: 1px solid var(--color-brand);
  border-radius: var(--radius-sm, 6px);
  padding: 6px 12px;
  margin-bottom: 8px;
}

.active-badge {
  font-size: 0.8rem;
  color: var(--color-brand);
  display: inline-flex;
  align-items: center;
  gap: 6px;
}

.btn-clear-tipo {
  background: transparent;
  border: 1px solid var(--color-brand);
  color: var(--color-brand);
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

.btn-clear-tipo:hover {
  background: var(--color-brand);
  color: #ffffff;
}
</style>

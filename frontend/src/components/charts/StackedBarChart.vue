<script setup lang="ts">
import { ref, watch } from 'vue';
import { Filter, X } from 'lucide-vue-next';
import type * as echarts from 'echarts';
import { useOperationsStore } from '../../stores/operationsStore';
import { useChart } from '../../composables/useChart';
import { buildStackedBarOption } from '../../services/analytics/stackedBarBuilder';

const opsStore = useOperationsStore();

function renderStackedBar(chartInstance: echarts.ECharts, isDark: boolean) {
  const items = opsStore.data?.stacked_bar;
  if (!items || items.length === 0) {
    chartInstance.clear();
    return;
  }
  chartInstance.setOption(buildStackedBarOption(items, opsStore.selectedPrioridad, isDark), true);
}

function handleBarClick(params: any) {
  let prio: string | null = null;
  if (params.name && !String(params.name).endsWith('av.')) {
    prio = params.name;
  } else if (params.componentType === 'yAxis' && params.value && !String(params.value).endsWith('av.')) {
    prio = params.value;
  }
  if (prio) {
    opsStore.setPrioridad(String(prio).replace(/^▸\s*/, '').trim());
  }
}

const chartContainer = ref<HTMLDivElement | null>(null);
const { render } = useChart(chartContainer, renderStackedBar, handleBarClick);

watch(() => [opsStore.data, opsStore.selectedPrioridad], () => render(), { deep: true });
</script>

<template>
  <div class="stacked-bar-wrapper">
    <div v-if="opsStore.selectedPrioridad" class="active-prio-bar">
      <span class="active-badge">
        <Filter :size="13" /> Filtrando por Plazo: <b>{{ opsStore.selectedPrioridad }}</b>
      </span>
      <button class="btn-clear-prio" @click="opsStore.setPrioridad(opsStore.selectedPrioridad)">
        <X :size="12" /> Ver Todos los Plazos
      </button>
    </div>

    <div ref="chartContainer" class="chart-canvas-full"></div>
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
}

.chart-canvas-full {
  width: 100%;
  flex: 1;
  min-height: 0;
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
  flex-shrink: 0;
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
  color: #ffffff;
}
</style>

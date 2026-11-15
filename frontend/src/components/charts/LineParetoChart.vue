<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import { TrendingDown } from 'lucide-vue-next';
import type * as echarts from 'echarts';
import { useTerritoryStore } from '../../stores/territoryStore';
import { getEChartsThemeTokens } from '../../constants/themeTokens';
import { useChart } from '../../composables/useChart';

const territoryStore = useTerritoryStore();
const chartContainer = ref<HTMLDivElement | null>(null);

const pareto = computed(() => territoryStore.data?.line_pareto || null);

function renderPareto(chartInstance: echarts.ECharts, isDark: boolean) {
  const p = pareto.value;
  if (!p || !p.items.length) {
    chartInstance.clear();
    return;
  }

  const tokens = getEChartsThemeTokens(isDark);
  const usingOverdue = p.total_vencidos > 0;
  const topItems = p.items.slice(0, 8);
  const labels = topItems.map((i) => i.linea);
  const barValues = topItems.map((i) => (usingOverdue ? i.vencidos : i.abiertos));
  const cumValues = topItems.map((i) => i.cum_pct);

  const option: echarts.EChartsOption = {
    backgroundColor: 'transparent',
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'shadow' },
      backgroundColor: tokens.tooltipBg,
      borderColor: tokens.tooltipBorder,
      textStyle: { color: tokens.textColor, fontFamily: tokens.fontFamily, fontSize: 12 },
      formatter: (params: any) => {
        const idx = params?.[0]?.dataIndex ?? 0;
        const item = topItems[idx];
        if (!item) return '';
        return [
          `<b>${item.linea}</b>`,
          `Abiertos vencidos: <b style="color:${tokens.sla.excede}">${item.vencidos.toLocaleString('es-CO')}</b>`,
          `Total abiertos: <b>${item.abiertos.toLocaleString('es-CO')}</b>`,
          `Aporte al total: <b>${item.pct_of_overdue}%</b> (Acum: <b>${item.cum_pct}%</b>)`,
          `Torres reincidentes (≥3 avisos): <b>${item.torres_reincidentes}</b>`,
        ].join('<br/>');
      },
    },
    legend: {
      top: 0,
      left: 'center',
      textStyle: { color: tokens.textSecondary, fontSize: 11 },
      data: [usingOverdue ? 'Abiertos Vencidos' : 'Avisos Abiertos', '% Acumulado (80/20)'],
    },
    grid: {
      top: 38,
      left: 44,
      right: 48,
      bottom: 64,
    },
    xAxis: {
      type: 'category',
      data: labels,
      axisLabel: {
        color: tokens.textColor,
        fontSize: 10,
        interval: 0,
        rotate: 28,
        width: 78,
        overflow: 'truncate',
      },
      axisLine: { lineStyle: { color: tokens.borderColor } },
    },
    yAxis: [
      {
        type: 'value',
        name: usingOverdue ? 'Vencidos' : 'Abiertos',
        nameTextStyle: { color: tokens.textSecondary, fontSize: 10 },
        axisLabel: { color: tokens.textSecondary, fontSize: 11 },
        splitLine: { lineStyle: { color: tokens.gridColor, type: 'dashed' } },
      },
      {
        type: 'value',
        name: 'Acum. %',
        min: 0,
        max: 100,
        nameTextStyle: { color: tokens.textSecondary, fontSize: 10 },
        axisLabel: { color: tokens.textSecondary, fontSize: 11, formatter: '{value}%' },
        splitLine: { show: false },
      },
    ],
    series: [
      {
        name: usingOverdue ? 'Abiertos Vencidos' : 'Avisos Abiertos',
        type: 'bar',
        data: barValues.map((v, idx) => ({
          value: v,
          itemStyle: {
            color:
              topItems[idx].cum_pct <= 80 || idx < p.lines_for_80_pct
                ? tokens.sla.excede
                : isDark
                  ? '#475569'
                  : '#94A3B8',
            borderRadius: [4, 4, 0, 0],
          },
        })),
        barMaxWidth: 28,
      },
      {
        name: '% Acumulado (80/20)',
        type: 'line',
        yAxisIndex: 1,
        smooth: 0.2,
        symbol: 'circle',
        symbolSize: 6,
        lineStyle: { color: tokens.brandColor, width: 2.5 },
        itemStyle: { color: tokens.brandColor },
        data: cumValues,
        markLine: {
          silent: true,
          symbol: 'none',
          lineStyle: { type: 'dashed', color: tokens.sla.warning, width: 1.5 },
          label: {
            formatter: '80% Pareto',
            color: tokens.sla.warning,
            fontSize: 10,
            fontWeight: 700,
            position: 'insideEndTop',
          },
          data: [{ yAxis: 80 }],
        },
      },
    ],
  };

  chartInstance.setOption(option, true);
}

const { render } = useChart(chartContainer, renderPareto);
watch(() => territoryStore.data?.line_pareto, () => render(), { deep: true });
</script>

<template>
  <div class="pareto-card card">
    <header class="pareto-head">
      <div class="pareto-title-wrap">
        <span class="badge-pill">
          <TrendingDown :size="12" />
          <span>Pareto 80/20</span>
        </span>
        <h3>Top 8 Líneas con Mayor Mora</h3>
      </div>

      <div v-if="pareto" class="pareto-chips">
        <span class="info-chip">
          <strong>{{ pareto.lines_for_80_pct }}</strong> de {{ pareto.total_lines_with_overdue }} líneas = 80% mora
        </span>
      </div>
    </header>

    <p class="pareto-sub">
      Corredores prioritarios (barras) y acumulado porcentual hasta la meta del <strong>80%</strong>.
    </p>

    <div ref="chartContainer" class="pareto-canvas"></div>
  </div>
</template>

<style scoped>
.pareto-card {
  display: flex;
  flex-direction: column;
  gap: 6px;
  height: 100%;
  min-height: 0;
  padding: 12px 14px;
  overflow: hidden;
}

.pareto-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  flex-wrap: wrap;
  flex-shrink: 0;
}

.pareto-title-wrap {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.pareto-title-wrap h3 {
  margin: 0;
  font-size: 0.9rem;
  font-weight: 700;
  color: var(--text-primary);
}

.badge-pill {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  font-size: 0.72rem;
  font-weight: 700;
  padding: 2px 8px;
  border-radius: 999px;
  background: var(--sla-danger-bg, rgba(190, 18, 60, 0.1));
  color: var(--sla-danger, #be123c);
}

.pareto-chips {
  display: flex;
  align-items: center;
  gap: 6px;
  flex-wrap: wrap;
}

.info-chip {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: 0.72rem;
  padding: 2px 8px;
  border-radius: 999px;
  background: var(--bg-subtle);
  color: var(--text-secondary);
  border: 1px solid var(--border-subtle);
}

.info-chip.warn {
  background: rgba(245, 158, 11, 0.12);
  color: #d97706;
  border-color: rgba(245, 158, 11, 0.25);
}

.pareto-sub {
  margin: 0;
  font-size: 0.75rem;
  color: var(--text-secondary);
  line-height: 1.35;
  flex-shrink: 0;
}

.pareto-canvas {
  width: 100%;
  flex: 1;
  min-height: 240px;
  position: relative;
}
</style>

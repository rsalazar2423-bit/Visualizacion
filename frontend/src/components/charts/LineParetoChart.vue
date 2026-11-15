<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import { TrendingDown, AlertTriangle } from 'lucide-vue-next';
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
  const labels = p.items.map((i) => i.linea);
  const barValues = p.items.map((i) => (usingOverdue ? i.vencidos : i.abiertos));
  const cumValues = p.items.map((i) => i.cum_pct);

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
        const item = p.items[idx];
        if (!item) return '';
        return [
          `<b>${item.linea}</b>`,
          `Abiertos vencidos: <b style="color:#dc2626">${item.vencidos.toLocaleString('es-CO')}</b>`,
          `Total abiertos: <b>${item.abiertos.toLocaleString('es-CO')}</b>`,
          `Aporte al total: <b>${item.pct_of_overdue}%</b> (Acum: <b>${item.cum_pct}%</b>)`,
          `Torres reincidentes (≥3 avisos): <b>${item.torres_reincidentes}</b>`,
        ].join('<br/>');
      },
    },
    legend: {
      top: 0,
      right: 6,
      textStyle: { color: tokens.textSecondary, fontSize: 11 },
      data: [usingOverdue ? 'Abiertos Vencidos' : 'Avisos Abiertos', '% Acumulado (80/20)'],
    },
    grid: {
      top: 32,
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
              p.items[idx].cum_pct <= 80 || idx < p.lines_for_80_pct
                ? isDark
                  ? '#F43F5E'
                  : '#DC2626'
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
        lineStyle: { color: isDark ? '#38BDF8' : '#0284C7', width: 2.5 },
        itemStyle: { color: isDark ? '#38BDF8' : '#0284C7' },
        data: cumValues,
        markLine: {
          silent: true,
          symbol: 'none',
          lineStyle: { type: 'dashed', color: '#D97706', width: 1.5 },
          label: {
            formatter: '80% Pareto',
            color: '#D97706',
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
          <span>Pareto 80/20 de Corredores</span>
        </span>
        <h3>Líneas de Transmisión que Concentran la Mora</h3>
      </div>

      <div v-if="pareto" class="pareto-chips">
        <span class="info-chip">
          <strong>{{ pareto.lines_for_80_pct }}</strong> de {{ pareto.total_lines_with_overdue }} líneas = 80% mora
        </span>
        <span class="info-chip warn">
          <AlertTriangle :size="11" />
          <strong>{{ pareto.recurrent_towers_count }}</strong> torres reincidentes (≥3)
        </span>
      </div>
    </header>

    <p class="pareto-sub">
      Las barras rojas identifican los corredores críticos necesarios para abatir el <strong>80% de los avisos vencidos</strong> en el filtro territorial actual.
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
  background: rgba(220, 38, 38, 0.12);
  color: #dc2626;
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

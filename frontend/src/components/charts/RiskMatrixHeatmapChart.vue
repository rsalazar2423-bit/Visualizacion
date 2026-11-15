<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import { Grid3X3 } from 'lucide-vue-next';
import type * as echarts from 'echarts';
import { useTerritoryStore } from '../../stores/territoryStore';
import { getEChartsThemeTokens } from '../../constants/themeTokens';
import { useChart } from '../../composables/useChart';

const territoryStore = useTerritoryStore();
const chartContainer = ref<HTMLDivElement | null>(null);
const matrixMode = ref<'time' | 'typology'>('time');

const matrix = computed(() => {
  if (matrixMode.value === 'time') {
    return territoryStore.data?.risk_matrix_time || null;
  }
  return territoryStore.data?.risk_matrix || null;
});

function renderHeatmap(chartInstance: echarts.ECharts, isDark: boolean) {
  const m = matrix.value;
  if (!m || !m.rows.length || !m.cols.length) {
    chartInstance.clear();
    return;
  }

  const tokens = getEChartsThemeTokens(isDark);
  const rowsAsc = [...m.rows].reverse();

  const seriesData = m.cells.map((cell) => {
    const xIdx = m.cols.indexOf(cell.col);
    const yIdx = rowsAsc.indexOf(cell.row);
    const labelColor =
      cell.vencidos <= 0
        ? tokens.textSecondary
        : isDark
          ? '#F8FAFC'
          : cell.excede_pct >= 58
            ? '#FFFFFF'
            : '#0F172A';
    return {
      value: [xIdx, yIdx, cell.total > 0 ? cell.excede_pct : -1],
      total: cell.total,
      vencidos: cell.vencidos,
      excedeTotal: cell.excede_total,
      excedePct: cell.excede_pct,
      rowName: cell.row,
      colName: cell.col,
      label: { color: labelColor },
    };
  });

  const option: echarts.EChartsOption = {
    backgroundColor: 'transparent',
    tooltip: {
      position: 'top',
      backgroundColor: tokens.tooltipBg,
      borderColor: tokens.tooltipBorder,
      textStyle: { color: tokens.textColor, fontFamily: tokens.fontFamily, fontSize: 12 },
      formatter: (p: any) => {
        const d = p.data;
        if (!d || d.total === 0) {
          return `<b>${d?.rowName || ''} · ${d?.colName || ''}</b><br/>Sin avisos registrados`;
        }
        return [
          `<b>${d.rowName} · ${d.colName}</b>`,
          `Total avisos: <b>${d.total.toLocaleString('es-CO')}</b>`,
          `Abiertos vencidos: <b style="color:${tokens.sla.excede}">${d.vencidos.toLocaleString('es-CO')}</b>`,
          `Incumplimiento SLA histórico: <b>${d.excedePct}%</b> (${d.excedeTotal}/${d.total})`,
        ].join('<br/>');
      },
    },
    grid: {
      top: 10,
      left: 112,
      right: 16,
      bottom: 54,
    },
    xAxis: {
      type: 'category',
      data: m.cols.map((c) => (c.length > 14 ? `${c.slice(0, 13)}…` : c)),
      axisLabel: {
        color: tokens.textColor,
        fontSize: 11,
        fontWeight: 600,
        interval: 0,
      },
      axisLine: { lineStyle: { color: tokens.borderColor } },
      splitArea: { show: false },
    },
    yAxis: {
      type: 'category',
      data: rowsAsc,
      axisLabel: {
        color: tokens.textColor,
        fontSize: 11,
        fontWeight: 700,
        width: 104,
        overflow: 'truncate',
      },
      axisLine: { lineStyle: { color: tokens.borderColor } },
      splitArea: { show: false },
    },
    visualMap: {
      min: 0,
      max: 85,
      calculable: false,
      orient: 'horizontal',
      left: 'center',
      bottom: 2,
      itemWidth: 12,
      itemHeight: 110,
      text: ['Mayor % Excede SLA', 'Menor %'],
      textStyle: { color: tokens.textSecondary, fontSize: 10 },
      inRange: {
        color: isDark
          ? ['#0F172A', '#1E293B', '#115E59', '#0D9488', '#2DD4BF']
          : ['#F8FAFC', '#CCFBF1', '#5EEAD4', '#0F766E', '#115E59'],
      },
      outOfRange: {
        color: isDark ? '#0F172A' : '#F8FAFC',
      },
    },
    series: [
      {
        name: 'Top 5 Ciudades',
        type: 'heatmap',
        data: seriesData,
        label: {
          show: true,
          fontSize: 12,
          fontWeight: 800,
          formatter: (p: any) => {
            const d = p.data;
            if (!d || d.vencidos <= 0) return '';
            return `${d.vencidos}`;
          },
        },
        itemStyle: {
          borderColor: tokens.cardBg,
          borderWidth: 2,
          borderRadius: 6,
        },
        emphasis: {
          itemStyle: {
            borderColor: tokens.accentSelect,
            borderWidth: 2,
          },
        },
      },
    ],
  };

  chartInstance.setOption(option, true);
}

const { render } = useChart(chartContainer, renderHeatmap);
watch([() => territoryStore.data, matrixMode], () => render(), { deep: true });
</script>

<template>
  <div class="risk-card card">
    <header class="risk-head">
      <div class="risk-title-wrap">
        <span class="badge-pill">
          <Grid3X3 :size="12" />
          <span>Top 5 Ciudades</span>
        </span>
        <h3>
          {{ matrixMode === 'time' ? 'Evolución de Mora por Ciudad' : 'Causa de Mora por Ciudad' }}
        </h3>
      </div>

      <div class="mode-switch">
        <button
          class="switch-btn"
          :class="{ active: matrixMode === 'time' }"
          @click="matrixMode = 'time'"
        >
          Por Tiempo
        </button>
        <button
          class="switch-btn"
          :class="{ active: matrixMode === 'typology' }"
          @click="matrixMode = 'typology'"
        >
          Por Tipología
        </button>
      </div>
    </header>

    <p class="risk-sub">
      Top 5 municipios con mayor mora: número = <strong>abiertos vencidos</strong> · color = <strong>% incumplimiento SLA</strong>.
    </p>

    <div ref="chartContainer" class="risk-canvas"></div>
  </div>
</template>

<style scoped>
.risk-card {
  display: flex;
  flex-direction: column;
  gap: 6px;
  height: 100%;
  min-height: 0;
  padding: 12px 14px;
  overflow: hidden;
}

.risk-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  flex-shrink: 0;
}

.risk-title-wrap {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.risk-title-wrap h3 {
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
  background: var(--color-brand-soft, rgba(15, 118, 110, 0.12));
  color: var(--color-brand, #0f766e);
}

.mode-switch {
  display: inline-flex;
  align-items: center;
  gap: 2px;
  background: var(--bg-subtle);
  padding: 2px;
  border-radius: var(--radius-sm);
  border: 1px solid var(--border-subtle);
  flex-shrink: 0;
}

.switch-btn {
  border: none;
  background: transparent;
  color: var(--text-secondary);
  font-size: 0.74rem;
  font-weight: 600;
  padding: 4px 10px;
  border-radius: var(--radius-sm);
  cursor: pointer;
  transition: all 0.15s ease;
}

.switch-btn.active {
  background: var(--bg-card);
  color: var(--color-brand);
  font-weight: 700;
  box-shadow: var(--shadow-sm);
}

.risk-sub {
  margin: 0;
  font-size: 0.75rem;
  color: var(--text-secondary);
  line-height: 1.35;
  flex-shrink: 0;
}

.risk-canvas {
  width: 100%;
  flex: 1;
  min-height: 240px;
  position: relative;
}
</style>

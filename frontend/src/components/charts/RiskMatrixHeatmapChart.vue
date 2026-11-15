<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import { Grid3X3, RotateCcw } from 'lucide-vue-next';
import type * as echarts from 'echarts';
import { useTerritoryStore } from '../../stores/territoryStore';
import { getEChartsThemeTokens } from '../../constants/themeTokens';
import { useChart } from '../../composables/useChart';

const territoryStore = useTerritoryStore();
const chartContainer = ref<HTMLDivElement | null>(null);
const showAllRows = ref(false);

const fullMatrix = computed(() => territoryStore.data?.risk_matrix || null);
const matrix = computed(() => {
  const m = fullMatrix.value;
  if (!m) return null;
  if (showAllRows.value || m.rows.length <= 6) return m;
  const topRows = new Set(m.rows.slice(0, 6));
  return {
    ...m,
    rows: m.rows.slice(0, 6),
    cells: m.cells.filter((c) => topRows.has(c.row)),
  };
});

function handleClick(params: any) {
  if (!matrix.value || !params?.value) return;
  const rowIdx = params.value[1];
  const rowName = matrix.value.rows[rowIdx];
  if (!rowName) return;

  if (matrix.value.level === 'departamento' && !territoryStore.selectedDepto) {
    territoryStore.drillIntoDepto(rowName);
  } else if (matrix.value.level === 'municipio' && territoryStore.selectedDepto && !territoryStore.selectedMunicipio) {
    territoryStore.drillIntoMunicipio(territoryStore.selectedDepto, rowName);
  }
}

function renderHeatmap(chartInstance: echarts.ECharts, isDark: boolean) {
  const m = matrix.value;
  if (!m || !m.rows.length || !m.cols.length) {
    chartInstance.clear();
    return;
  }

  const tokens = getEChartsThemeTokens(isDark);
  // Invert rows so highest-risk territory appears at top
  const rowsAsc = [...m.rows].reverse();

  const seriesData = m.cells.map((cell) => {
    const xIdx = m.cols.indexOf(cell.col);
    const yIdx = rowsAsc.indexOf(cell.row);
    const labelColor =
      cell.total === 0
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
      left: 118,
      right: 18,
      bottom: 58,
    },
    xAxis: {
      type: 'category',
      data: m.cols.map((c) => (c.length > 14 ? `${c.slice(0, 13)}…` : c)),
      axisLabel: {
        color: tokens.textColor,
        fontSize: 11,
        fontWeight: 600,
        interval: 0,
        rotate: 12,
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
        fontWeight: 600,
        width: 110,
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
          ? ['#1E293B', '#334155', '#B45309', '#E11D48', '#9F1239']
          : ['#F1F5F9', '#E2E8F0', '#FDE68A', '#FB7185', '#BE123C'],
      },
      outOfRange: {
        color: isDark ? '#1E293B' : '#F1F5F9',
      },
    },
    series: [
      {
        name: 'Matriz de Riesgo',
        type: 'heatmap',
        data: seriesData,
        label: {
          show: true,
          fontSize: 11,
          fontWeight: 700,
          formatter: (p: any) => {
            const d = p.data;
            if (!d || d.vencidos <= 0) return '';
            return `${d.vencidos}`;
          },
        },
        itemStyle: {
          borderColor: tokens.cardBg,
          borderWidth: 2,
          borderRadius: 4,
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

const { render } = useChart(chartContainer, renderHeatmap, handleClick);
watch([() => territoryStore.data?.risk_matrix, showAllRows], () => render(), { deep: true });
</script>

<template>
  <div class="risk-card card">
    <header class="risk-head">
      <div class="risk-title-wrap">
        <span class="badge-pill">
          <Grid3X3 :size="12" />
          <span>Focos de Mora</span>
        </span>
        <h3>
          {{ matrix?.level === 'municipio' ? `Municipios (${territoryStore.selectedDepto}) × Tipología` : 'Departamento × Tipología' }}
        </h3>
      </div>

      <div class="risk-actions">
        <button
          v-if="fullMatrix && fullMatrix.rows.length > 6"
          class="btn-back-chip"
          @click="showAllRows = !showAllRows"
        >
          <span>{{ showAllRows ? 'Top 6' : `Todos (${fullMatrix.rows.length})` }}</span>
        </button>
        <button
          v-if="territoryStore.selectedDepto"
          class="btn-back-chip"
          @click="territoryStore.resetToNational()"
        >
          <RotateCcw :size="12" />
          <span>Volver</span>
        </button>
      </div>
    </header>

    <p class="risk-sub">
      Número = <strong>abiertos vencidos</strong> · Color = <strong>% incumplimiento SLA</strong>. Clic en fila para detallar.
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
  color: var(--color-brand, #0F766E);
}

.risk-actions {
  display: flex;
  align-items: center;
  gap: 6px;
  flex-shrink: 0;
}

.btn-back-chip {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 4px 10px;
  font-size: 0.74rem;
  font-weight: 600;
  background: var(--bg-subtle);
  color: var(--text-primary);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-sm);
  cursor: pointer;
}

.btn-back-chip:hover {
  border-color: var(--color-brand);
  color: var(--color-brand);
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

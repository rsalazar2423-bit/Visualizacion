<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import { Grid3X3, BarChart3, RotateCcw } from 'lucide-vue-next';
import type * as echarts from 'echarts';
import type { OpenBacklogCell } from '../../types/models';
import { getEChartsThemeTokens, getTipoColor } from '../../constants/themeTokens';
import { useChart } from '../../composables/useChart';

const props = defineProps<{
  cells: OpenBacklogCell[];
}>();

const heatmapContainer = ref<HTMLDivElement | null>(null);
const tipoContainer = ref<HTMLDivElement | null>(null);

const onlyOverdue = ref(false);
const selectedTipo = ref<string | null>(null);
const selectedDepto = ref<string | null>(null);
const selectedAnio = ref<number | null>(null);

function metricOf(c: OpenBacklogCell): number {
  return onlyOverdue.value ? c.vencidos : c.total;
}

const hasActiveFilter = computed(
  () => selectedTipo.value !== null || selectedDepto.value !== null || selectedAnio.value !== null
);

function clearFilters() {
  selectedTipo.value = null;
  selectedDepto.value = null;
  selectedAnio.value = null;
}

// Datos filtrados por Tipo para la Matriz Departamento × Año
const matrixFilteredCells = computed(() => {
  if (!selectedTipo.value) return props.cells;
  return props.cells.filter((c) => c.tipo === selectedTipo.value);
});

const matrixData = computed(() => {
  const deptoTotals = new Map<string, number>();
  const yearsSet = new Set<number>();

  for (const c of matrixFilteredCells.value) {
    const val = metricOf(c);
    if (val <= 0) continue;
    deptoTotals.set(c.depto, (deptoTotals.get(c.depto) || 0) + val);
    yearsSet.add(c.anio);
  }

  // Top 10 departamentos con mayor backlog abierto
  const topDeptos = Array.from(deptoTotals.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([d]) => d);

  const years = Array.from(yearsSet).sort((a, b) => a - b);
  const rowsAsc = [...topDeptos].reverse();

  // Agregar (depto, anio) sumando todos los tipos seleccionados y guardando desglose para tooltip
  const cellMap = new Map<
    string,
    {
      depto: string;
      anio: number;
      val: number;
      total: number;
      vencidos: number;
      byTipo: Map<string, { total: number; vencidos: number }>;
    }
  >();

  for (const c of matrixFilteredCells.value) {
    if (!topDeptos.includes(c.depto) || !years.includes(c.anio)) continue;
    const key = `${c.depto}__${c.anio}`;
    const entry = cellMap.get(key) || {
      depto: c.depto,
      anio: c.anio,
      val: 0,
      total: 0,
      vencidos: 0,
      byTipo: new Map(),
    };
    const v = metricOf(c);
    entry.val += v;
    entry.total += c.total;
    entry.vencidos += c.vencidos;
    const prevT = entry.byTipo.get(c.tipo) || { total: 0, vencidos: 0 };
    prevT.total += c.total;
    prevT.vencidos += c.vencidos;
    entry.byTipo.set(c.tipo, prevT);
    cellMap.set(key, entry);
  }

  let maxVal = 1;
  for (const e of cellMap.values()) {
    if (e.val > maxVal) maxVal = e.val;
  }

  return { rowsAsc, years, cellMap, maxVal };
});

// Datos filtrados por Departamento / Año para la gráfica de Tipo
const tipoSummary = computed(() => {
  const byTipo = new Map<string, { tipo: string; total: number; vencidos: number; val: number }>();

  for (const c of props.cells) {
    if (selectedDepto.value && c.depto !== selectedDepto.value) continue;
    if (selectedAnio.value && c.anio !== selectedAnio.value) continue;
    const val = metricOf(c);
    if (val <= 0) continue;
    const prev = byTipo.get(c.tipo) || { tipo: c.tipo, total: 0, vencidos: 0, val: 0 };
    prev.total += c.total;
    prev.vencidos += c.vencidos;
    prev.val += val;
    byTipo.set(c.tipo, prev);
  }

  const items = Array.from(byTipo.values()).sort((a, b) => a.val - b.val);
  const grandTotal = items.reduce((acc, i) => acc + i.val, 0);
  return { items, grandTotal };
});

const totalVisibleOpen = computed(() => {
  let sum = 0;
  for (const c of props.cells) {
    if (selectedTipo.value && c.tipo !== selectedTipo.value) continue;
    if (selectedDepto.value && c.depto !== selectedDepto.value) continue;
    if (selectedAnio.value && c.anio !== selectedAnio.value) continue;
    sum += metricOf(c);
  }
  return sum;
});

function renderHeatmap(chartInstance: echarts.ECharts, isDark: boolean) {
  const { rowsAsc, years, cellMap, maxVal } = matrixData.value;
  if (!rowsAsc.length || !years.length) {
    chartInstance.clear();
    return;
  }

  const tokens = getEChartsThemeTokens(isDark);
  const seriesData: Array<Record<string, unknown>> = [];

  for (let yIdx = 0; yIdx < rowsAsc.length; yIdx++) {
    const depto = rowsAsc[yIdx];
    for (let xIdx = 0; xIdx < years.length; xIdx++) {
      const anio = years[xIdx];
      const cell = cellMap.get(`${depto}__${anio}`);
      const val = cell ? cell.val : 0;
      const isHigh = maxVal > 0 && val / maxVal >= 0.52;
      const isSelected =
        (selectedDepto.value === depto && (!selectedAnio.value || selectedAnio.value === anio)) ||
        (selectedAnio.value === anio && !selectedDepto.value);

      const tipoBreakdown = cell
        ? Array.from(cell.byTipo.entries())
            .sort((a, b) => b[1].total - a[1].total)
            .map(([t, s]) => ({
              tipo: t,
              val: onlyOverdue.value ? s.vencidos : s.total,
              vencidos: s.vencidos,
            }))
            .filter((x) => x.val > 0)
        : [];

      seriesData.push({
        value: [xIdx, yIdx, val > 0 ? val : -1],
        depto,
        anio,
        total: cell?.total ?? 0,
        vencidos: cell?.vencidos ?? 0,
        tipoBreakdown,
        itemStyle: isSelected
          ? {
              borderColor: isDark ? '#F8FAFC' : '#0F172A',
              borderWidth: 2,
            }
          : undefined,
        label: {
          color: val <= 0 ? 'transparent' : isHigh ? '#FFFFFF' : tokens.textColor,
        },
      });
    }
  }

  const palette = onlyOverdue.value
    ? isDark
      ? ['#1E293B', '#4C0519', '#9F1239', '#BE123C', '#F43F5E']
      : ['#FFF1F2', '#FECDD3', '#FB7185', '#E11D48', '#BE123C']
    : isDark
      ? ['#0F172A', '#134E4A', '#0F766E', '#0D9488', '#2DD4BF']
      : ['#F8FAFC', '#CCFBF1', '#5EEAD4', '#0D9488', '#0F766E'];

  chartInstance.setOption(
    {
      tooltip: {
        trigger: 'item',
        backgroundColor: tokens.tooltipBg,
        borderColor: tokens.borderColor,
        textStyle: { color: tokens.textColor, fontSize: 12 },
        formatter: (params: any) => {
          const d = params.data;
          if (!d || d.value[2] <= 0) {
            return `<div style="font-weight:700">${d?.depto ?? ''} · ${d?.anio ?? ''}</div><div style="opacity:.7">Sin avisos abiertos</div>`;
          }
          const pctVenc = d.total > 0 ? Math.round((d.vencidos / d.total) * 100) : 0;
          const lines = (d.tipoBreakdown || [])
            .map(
              (t: any) =>
                `<div style="display:flex;justify-content:space-between;gap:12px"><span>• ${t.tipo}</span><b>${t.val}</b></div>`
            )
            .join('');
          return `
            <div style="font-weight:800;margin-bottom:4px">${d.depto} · ${d.anio}</div>
            <div>Abiertos: <b>${d.total}</b> · Vencidos SLA: <b style="color:${isDark ? '#F43F5E' : '#BE123C'}">${d.vencidos} (${pctVenc}%)</b></div>
            ${lines ? `<div style="margin-top:6px;padding-top:5px;border-top:1px solid ${tokens.borderColor}">${lines}</div>` : ''}
          `;
        },
      },
      grid: { top: 8, right: 12, bottom: 44, left: 108, containLabel: false },
      xAxis: {
        type: 'category',
        data: years.map(String),
        axisLabel: { color: tokens.textSecondary, fontSize: 10.5, fontWeight: 600 },
        axisLine: { lineStyle: { color: tokens.borderColor } },
        axisTick: { show: false },
      },
      yAxis: {
        type: 'category',
        data: rowsAsc,
        axisLabel: {
          color: tokens.textColor,
          fontSize: 11,
          fontWeight: 700,
          width: 98,
          overflow: 'truncate',
        },
        axisLine: { lineStyle: { color: tokens.borderColor } },
        axisTick: { show: false },
      },
      visualMap: {
        min: 1,
        max: Math.max(2, maxVal),
        calculable: false,
        orient: 'horizontal',
        left: 'center',
        bottom: 2,
        itemWidth: 10,
        itemHeight: 110,
        text: [onlyOverdue.value ? 'Más vencidos' : 'Más abiertos', 'Menor'],
        textStyle: { color: tokens.textSecondary, fontSize: 10 },
        inRange: { color: palette },
        outOfRange: { color: isDark ? '#111827' : '#F8FAFC' },
      },
      series: [
        {
          type: 'heatmap',
          data: seriesData,
          label: {
            show: true,
            fontSize: 10.5,
            fontWeight: 700,
            formatter: (p: any) => (p.data.value[2] > 0 ? String(p.data.value[2]) : ''),
          },
          itemStyle: {
            borderRadius: 4,
            borderColor: isDark ? '#111827' : '#FFFFFF',
            borderWidth: 2,
          },
          emphasis: {
            itemStyle: {
              borderColor: isDark ? '#F8FAFC' : '#0F172A',
              borderWidth: 2,
            },
          },
        },
      ],
    },
    true
  );

  chartInstance.off('click');
  chartInstance.on('click', (params: any) => {
    const d = params?.data;
    if (!d || d.value?.[2] <= 0) return;
    if (selectedDepto.value === d.depto && selectedAnio.value === d.anio) {
      selectedDepto.value = null;
      selectedAnio.value = null;
    } else {
      selectedDepto.value = d.depto;
      selectedAnio.value = d.anio;
    }
  });
}

function renderTipoBars(chartInstance: echarts.ECharts, isDark: boolean) {
  const { items, grandTotal } = tipoSummary.value;
  if (!items.length) {
    chartInstance.clear();
    return;
  }

  const tokens = getEChartsThemeTokens(isDark);
  const categories = items.map((i) => i.tipo);
  const seriesData = items.map((i) => {
    const active = !selectedTipo.value || selectedTipo.value === i.tipo;
    return {
      value: i.val,
      tipo: i.tipo,
      total: i.total,
      vencidos: i.vencidos,
      pct: grandTotal > 0 ? Math.round((i.val / grandTotal) * 100) : 0,
      itemStyle: {
        color: getTipoColor(i.tipo, isDark),
        opacity: active ? 1 : 0.25,
        borderRadius: [0, 5, 5, 0],
      },
    };
  });

  chartInstance.setOption(
    {
      tooltip: {
        trigger: 'axis',
        axisPointer: { type: 'shadow' },
        backgroundColor: tokens.tooltipBg,
        borderColor: tokens.borderColor,
        textStyle: { color: tokens.textColor, fontSize: 12 },
        formatter: (params: any) => {
          const p = Array.isArray(params) ? params[0] : params;
          const d = p?.data;
          if (!d) return '';
          const pctMora = d.total > 0 ? Math.round((d.vencidos / d.total) * 100) : 0;
          return `
            <div style="font-weight:800;margin-bottom:4px">${d.tipo}</div>
            <div>Abiertos: <b>${d.total}</b> (${d.pct}% del filtro)</div>
            <div>Vencidos SLA: <b style="color:${isDark ? '#F43F5E' : '#BE123C'}">${d.vencidos} (${pctMora}%)</b></div>
          `;
        },
      },
      grid: { top: 8, right: 92, bottom: 16, left: 128, containLabel: false },
      xAxis: {
        type: 'value',
        splitLine: { lineStyle: { color: tokens.borderColor, type: 'dashed' } },
        axisLabel: { color: tokens.textSecondary, fontSize: 10 },
      },
      yAxis: {
        type: 'category',
        data: categories,
        axisLabel: {
          color: tokens.textColor,
          fontSize: 11,
          fontWeight: 700,
          width: 118,
          overflow: 'truncate',
        },
        axisLine: { lineStyle: { color: tokens.borderColor } },
        axisTick: { show: false },
      },
      series: [
        {
          type: 'bar',
          barMaxWidth: 22,
          data: seriesData,
          label: {
            show: true,
            position: 'right',
            color: tokens.textSecondary,
            fontSize: 10.5,
            fontWeight: 700,
            formatter: (p: any) => {
              const d = p.data;
              return `${d.val} (${d.pct}%)`;
            },
          },
        },
      ],
    },
    true
  );

  chartInstance.off('click');
  chartInstance.on('click', (params: any) => {
    const t = params?.data?.tipo || params?.name;
    if (!t) return;
    selectedTipo.value = selectedTipo.value === t ? null : t;
  });
}

const { render: renderHeat } = useChart(heatmapContainer, renderHeatmap);
const { render: renderBars } = useChart(tipoContainer, renderTipoBars);

watch(
  [() => props.cells, onlyOverdue, selectedTipo, selectedDepto, selectedAnio],
  () => {
    renderHeat();
    renderBars();
  },
  { deep: true }
);
</script>

<template>
  <section class="open-explorer-grid">
    <!-- Matriz Departamento × Año -->
    <div class="explorer-card card">
      <header class="exp-head">
        <div>
          <div class="exp-title-row">
            <span class="exp-badge">
              <Grid3X3 :size="12" />
              <span>Departamento × Año</span>
            </span>
            <h3 class="exp-title">
              {{ onlyOverdue ? 'Avisos Abiertos Vencidos (SLA)' : 'Backlog Abierto por Departamento y Año' }}
            </h3>
          </div>
          <p class="exp-sub">
            Haz clic en una celda para filtrar tipología · {{ totalVisibleOpen.toLocaleString() }} avisos visibles
          </p>
        </div>

        <div class="exp-controls">
          <div class="mode-switch">
            <button
              class="switch-btn"
              :class="{ active: !onlyOverdue }"
              @click="onlyOverdue = false"
            >
              Todos Abiertos
            </button>
            <button
              class="switch-btn danger"
              :class="{ active: onlyOverdue }"
              @click="onlyOverdue = true"
            >
              Solo Vencidos
            </button>
          </div>
        </div>
      </header>

      <div ref="heatmapContainer" class="exp-chart"></div>
    </div>

    <!-- Comparativa por Tipo -->
    <div class="explorer-card card">
      <header class="exp-head">
        <div>
          <div class="exp-title-row">
            <span class="exp-badge">
              <BarChart3 :size="12" />
              <span>Por Tipología</span>
            </span>
            <h3 class="exp-title">Composición por Tipo de Aviso</h3>
          </div>
          <p class="exp-sub">
            <template v-if="selectedDepto || selectedAnio">
              Filtrado por: <b>{{ selectedDepto || 'Todos' }}</b><span v-if="selectedAnio"> · <b>{{ selectedAnio }}</b></span>
            </template>
            <template v-else>
              Haz clic en una barra para filtrar la matriz por tipo
            </template>
          </p>
        </div>

        <button v-if="hasActiveFilter" class="reset-btn" @click="clearFilters" title="Limpiar filtros">
          <RotateCcw :size="12" />
          <span>Limpiar</span>
        </button>
      </header>

      <div ref="tipoContainer" class="exp-chart"></div>
    </div>
  </section>
</template>

<style scoped>
.open-explorer-grid {
  display: grid;
  grid-template-columns: 1.48fr 1fr;
  gap: 12px;
  flex: 1;
  min-height: 0;
}

.explorer-card {
  display: flex;
  flex-direction: column;
  padding: 12px 16px 8px;
  min-height: 0;
  height: 100%;
  overflow: hidden;
}

.exp-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 10px;
  flex-shrink: 0;
  margin-bottom: 4px;
}

.exp-title-row {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.exp-badge {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: 0.68rem;
  font-weight: 700;
  color: var(--color-brand);
  background: var(--color-brand-soft);
  padding: 2px 8px;
  border-radius: var(--radius-full);
}

.exp-title {
  margin: 0;
  font-size: 0.9rem;
  font-weight: 800;
  color: var(--text-primary);
}

.exp-sub {
  margin: 3px 0 0;
  font-size: 0.72rem;
  color: var(--text-secondary);
}

.exp-controls {
  display: flex;
  align-items: center;
  gap: 6px;
  flex-shrink: 0;
}

.mode-switch {
  display: inline-flex;
  background: var(--bg-subtle);
  padding: 2px;
  border-radius: var(--radius-sm);
  border: 1px solid var(--border-subtle);
}

.switch-btn {
  border: none;
  background: transparent;
  color: var(--text-secondary);
  font-size: 0.71rem;
  font-weight: 600;
  padding: 3px 9px;
  border-radius: 4px;
  cursor: pointer;
}

.switch-btn.active {
  background: var(--bg-card);
  color: var(--color-brand);
  font-weight: 700;
  box-shadow: var(--shadow-sm);
}

.switch-btn.danger.active {
  color: var(--sla-danger);
}

.reset-btn {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  height: 26px;
  padding: 0 9px;
  font-size: 0.71rem;
  font-weight: 700;
  color: var(--color-brand);
  background: var(--bg-subtle);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-sm);
  cursor: pointer;
  flex-shrink: 0;
}

.reset-btn:hover {
  border-color: var(--color-brand);
}

.exp-chart {
  flex: 1;
  width: 100%;
  min-height: 240px;
}

@media (max-width: 1024px) {
  .open-explorer-grid {
    grid-template-columns: 1fr;
  }
  .exp-chart {
    min-height: 300px;
  }
}
</style>


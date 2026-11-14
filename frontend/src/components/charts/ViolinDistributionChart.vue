<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import * as echarts from 'echarts';
import { useOperationsStore } from '../../stores/operationsStore';
import { getEChartsThemeTokens } from '../../constants/themeTokens';
import { useChart } from '../../composables/useChart';
import { computeViolinStats, type ViolinSummaryStats } from '../../utils/violinStats';
import type { ViolinGroupData } from '../../types/models';

const opsStore = useOperationsStore();

const groupBy = ref<'prioridad' | 'tipologia'>('prioridad');
const statusFilter = ref<'cerrados' | 'abiertos' | 'todos'>('cerrados');
const scaleMode = ref<'log' | 'linear'>('log');

interface PreparedViolin {
  group: string;
  slaDays: number | null;
  cumplePct: number;
  raw: number[];
  stats: ViolinSummaryStats;
  selected: boolean;
}

const preparedGroups = computed<PreparedViolin[]>(() => {
  const src: ViolinGroupData[] =
    groupBy.value === 'prioridad'
      ? opsStore.data?.violin_prioridad || []
      : opsStore.data?.violin_tipologia || [];

  const isLog = scaleMode.value === 'log';
  const result: PreparedViolin[] = [];

  for (const item of src) {
    let vals: number[] = [];
    if (statusFilter.value === 'cerrados') vals = item.cerrados;
    else if (statusFilter.value === 'abiertos') vals = item.abiertos;
    else vals = [...item.cerrados, ...item.abiertos].sort((a, b) => a - b);

    if (!vals.length) continue;
    const stats = computeViolinStats(vals, isLog);
    if (!stats) continue;

    result.push({
      group: item.group,
      slaDays: item.sla_days,
      cumplePct: item.cumple_pct,
      raw: vals,
      stats,
      selected: groupBy.value === 'prioridad' && opsStore.selectedPrioridad === item.group,
    });
  }

  return result;
});

const chartContainer = ref<HTMLDivElement | null>(null);
const { render } = useChart(chartContainer, renderViolinChart, (params: any) => {
  if (groupBy.value !== 'prioridad') return;
  const idx = params.dataIndex;
  const target = preparedGroups.value[idx];
  if (target) {
    opsStore.setPrioridad(target.group);
  }
});

function renderViolinChart(chartInstance: echarts.ECharts, isDark: boolean) {
  const groups = preparedGroups.value;
  if (!groups.length) {
    chartInstance.clear();
    return;
  }

  const tokens = getEChartsThemeTokens(isDark);
  const isLog = scaleMode.value === 'log';
  const categories = groups.map((g) => g.group);

  // En escala logarítmica ECharts requiere valores > 0; usamos (días + 1) en el eje
  const mapVal = (d: number) => (isLog ? Math.max(1, d + 1) : d);

  let maxDataVal = 10;
  for (const g of groups) {
    const lastKde = g.stats.kde[g.stats.kde.length - 1]?.[0] ?? g.stats.max;
    maxDataVal = Math.max(maxDataVal, lastKde, g.slaDays ?? 0);
  }

  // Puntos individuales para categorías con muestra pequeña (N < 15) evitando suavizado engañoso
  const smallSamplePoints: Array<{ value: [number, number]; group: string; days: number }> = [];
  groups.forEach((g, idx) => {
    if (g.stats.n < 15) {
      g.raw.forEach((d, j) => {
        const jitter = ((j % 5) - 2) * 0.05;
        smallSamplePoints.push({
          value: [idx + jitter, mapVal(d)],
          group: g.group,
          days: Math.round(d),
        });
      });
    }
  });

  // Marcas de límite máximo SLA cuando se agrupa por Prioridad SLA
  const slaMarkers =
    groupBy.value === 'prioridad'
      ? groups
          .map((g, idx) =>
            g.slaDays !== null ? { value: [idx, mapVal(g.slaDays)], slaDays: g.slaDays, group: g.group } : null
          )
          .filter((m): m is { value: [number, number]; slaDays: number; group: string } => m !== null)
      : [];

  const option: echarts.EChartsOption = {
    backgroundColor: 'transparent',
    tooltip: {
      trigger: 'item',
      backgroundColor: tokens.tooltipBg,
      borderColor: tokens.tooltipBorder,
      borderWidth: 1,
      textStyle: { color: tokens.textColor, fontFamily: tokens.fontFamily, fontSize: 12 },
      formatter: (params: any) => {
        if (params.seriesName === 'Límite SLA') {
          const d = params.data;
          return `<div style="font-weight:700;color:${tokens.textColor};">Límite SLA · ${d.group}</div>
                  <div>Plazo máximo normativo: <b>${d.slaDays.toLocaleString()} días</b></div>`;
        }
        if (params.seriesName === 'Muestra Individual (N < 15)') {
          const d = params.data;
          return `<div style="font-weight:700;color:${tokens.textColor};">${d.group}</div>
                  <div>Aviso individual: <b>${d.days.toLocaleString()} días</b></div>`;
        }
        const g = groups[params.dataIndex];
        if (!g) return '';
        const s = g.stats;
        const slaLine =
          g.slaDays !== null
            ? `<div>Plazo SLA: <b>${g.slaDays.toLocaleString()} días</b> · Cumplimiento: <b>${g.cumplePct}%</b></div>`
            : `<div>Cumplimiento en norma: <b>${g.cumplePct}%</b></div>`;
        const smallWarn =
          s.n < 15
            ? `<div style="color:#F59E0B;font-size:11px;margin-top:3px;">Muestra pequeña (N=${s.n}): se muestran puntos reales</div>`
            : '';

        return `
          <div style="font-weight:800;font-size:13px;margin-bottom:5px;color:${tokens.textColor};">
            ${g.group} <span style="font-weight:500;color:${tokens.textSecondary};">(N = ${s.n.toLocaleString()})</span>
          </div>
          <div>Mediana: <b style="color:${isDark ? '#38BDF8' : '#1D4ED8'};">${Math.round(s.median).toLocaleString()} días</b></div>
          <div>Rango IQR (Q1 – Q3): <b>${Math.round(s.q1).toLocaleString()} – ${Math.round(s.q3).toLocaleString()} días</b></div>
          <div>Mín / Máx: <b>${Math.round(s.min).toLocaleString()} – ${Math.round(s.max).toLocaleString()} días</b></div>
          ${slaLine}
          ${smallWarn}
        `;
      },
    },
    grid: {
      left: '4%',
      right: '3%',
      top: '28px',
      bottom: '34px',
      containLabel: true,
    },
    xAxis: {
      type: 'category',
      data: categories,
      axisLabel: {
        color: tokens.textSecondary,
        fontFamily: tokens.fontFamily,
        fontSize: 10.5,
        fontWeight: 600,
        interval: 0,
        rotate: categories.length > 6 ? 18 : 0,
      },
      axisLine: { lineStyle: { color: tokens.gridColor } },
    },
    yAxis: {
      type: isLog ? 'log' : 'value',
      name: isLog ? 'Días (Escala Log)' : 'Días',
      min: isLog ? 1 : 0,
      max: isLog ? undefined : Math.ceil(maxDataVal * 1.05),
      logBase: 10,
      nameTextStyle: { color: tokens.textSecondary, fontSize: 10.5, fontWeight: 600 },
      axisLabel: {
        color: tokens.textSecondary,
        fontFamily: tokens.fontFamily,
        fontSize: 10,
        formatter: (v: number) => {
          const real = isLog ? Math.max(0, Math.round(v - 1)) : Math.round(v);
          return real >= 1000 ? `${(real / 1000).toFixed(1)}k` : `${real}`;
        },
      },
      splitLine: { lineStyle: { color: tokens.gridColor, type: 'dashed' } },
    },
    series: [
      {
        name: 'Distribución Violín',
        type: 'custom',
        renderItem: (params: any, api: any) => {
          const idx = params.dataIndex;
          const g = groups[idx];
          if (!g) return null;

          const s = g.stats;
          const catWidth = api.size([1, 0])[0];
          const halfMaxW = Math.min(catWidth * 0.38, 34);

          const leftPts: number[][] = [];
          const rightPts: number[][] = [];
          for (const [val, normD] of s.kde) {
            const pt = api.coord([idx, mapVal(val)]);
            const dx = normD * halfMaxW;
            leftPts.push([pt[0] - dx, pt[1]]);
            rightPts.unshift([pt[0] + dx, pt[1]]);
          }
          const polygonPoints = [...leftPts, ...rightPts];

          const p5Pt = api.coord([idx, mapVal(s.p5)]);
          const p95Pt = api.coord([idx, mapVal(s.p95)]);
          const q1Pt = api.coord([idx, mapVal(s.q1)]);
          const q3Pt = api.coord([idx, mapVal(s.q3)]);
          const medPt = api.coord([idx, mapVal(s.median)]);

          const isOverSla = g.slaDays !== null && s.median > g.slaDays;
          const baseFill = isOverSla
            ? isDark ? 'rgba(225, 29, 72, 0.28)' : 'rgba(190, 18, 60, 0.20)'
            : isDark ? 'rgba(56, 189, 248, 0.26)' : 'rgba(29, 78, 216, 0.18)';
          const baseStroke = isOverSla
            ? isDark ? '#FB7185' : '#BE123C'
            : isDark ? '#38BDF8' : '#1D4ED8';

          return {
            type: 'group',
            children: [
              // Polígono KDE simétrico del violín
              {
                type: 'polygon',
                shape: { points: polygonPoints },
                style: {
                  fill: baseFill,
                  stroke: baseStroke,
                  lineWidth: g.selected ? 2.4 : 1.4,
                },
              },
              // Bigote P5–P95
              {
                type: 'line',
                shape: { x1: p5Pt[0], y1: p5Pt[1], x2: p95Pt[0], y2: p95Pt[1] },
                style: { stroke: tokens.textSecondary, lineWidth: 1.3 },
              },
              // Caja IQR (Q1–Q3)
              {
                type: 'rect',
                shape: {
                  x: q3Pt[0] - 4,
                  y: q3Pt[1],
                  width: 8,
                  height: Math.max(2, q1Pt[1] - q3Pt[1]),
                },
                style: {
                  fill: isDark ? '#0F172A' : '#1E293B',
                  stroke: baseStroke,
                  lineWidth: 1.2,
                },
              },
              // Punto central de la Mediana
              {
                type: 'circle',
                shape: { cx: medPt[0], cy: medPt[1], r: 3.6 },
                style: { fill: '#FFFFFF', stroke: baseStroke, lineWidth: 1.8 },
              },
            ],
          };
        },
        data: groups.map((g, idx) => [idx, mapVal(g.stats.median)]),
        z: 2,
      },
      {
        name: 'Límite SLA',
        type: 'scatter',
        symbol: 'rect',
        symbolSize: [28, 3],
        itemStyle: {
          color: '#F59E0B',
          borderColor: isDark ? '#0F172A' : '#FFFFFF',
          borderWidth: 0.8,
        },
        data: slaMarkers,
        z: 4,
      },
      {
        name: 'Muestra Individual (N < 15)',
        type: 'scatter',
        symbolSize: 5.5,
        itemStyle: {
          color: isDark ? '#E2E8F0' : '#334155',
          opacity: 0.85,
        },
        data: smallSamplePoints,
        z: 5,
      },
    ],
  };

  chartInstance.setOption(option, true);
}

watch(
  () => [opsStore.data, groupBy.value, statusFilter.value, scaleMode.value],
  () => render(),
  { deep: true }
);
</script>

<template>
  <div class="violin-wrapper">
    <div class="violin-toolbar">
      <div class="tool-group">
        <span class="tool-lbl">Agrupar:</span>
        <button
          class="btn-pill-sm"
          :class="{ active: groupBy === 'prioridad' }"
          @click="groupBy = 'prioridad'"
        >
          Prioridad SLA
        </button>
        <button
          class="btn-pill-sm"
          :class="{ active: groupBy === 'tipologia' }"
          @click="groupBy = 'tipologia'"
        >
          Tipología
        </button>
      </div>

      <div class="tool-group">
        <span class="tool-lbl">Estado:</span>
        <button
          class="btn-pill-sm"
          :class="{ active: statusFilter === 'cerrados' }"
          @click="statusFilter = 'cerrados'"
        >
          Cerrados
        </button>
        <button
          class="btn-pill-sm"
          :class="{ active: statusFilter === 'abiertos' }"
          @click="statusFilter = 'abiertos'"
        >
          Abiertos
        </button>
        <button
          class="btn-pill-sm"
          :class="{ active: statusFilter === 'todos' }"
          @click="statusFilter = 'todos'"
        >
          Todos
        </button>
      </div>

      <div class="tool-group right-group">
        <span class="tool-lbl">Escala:</span>
        <button
          class="btn-pill-sm"
          :class="{ active: scaleMode === 'log' }"
          title="Escala logarítmica para comparar desde días hasta años sin aplastar"
          @click="scaleMode = 'log'"
        >
          Log
        </button>
        <button
          class="btn-pill-sm"
          :class="{ active: scaleMode === 'linear' }"
          @click="scaleMode = 'linear'"
        >
          Lineal
        </button>
      </div>
    </div>

    <div ref="chartContainer" class="violin-canvas"></div>

    <div class="violin-footer-legend">
      <span><i class="swatch blue"></i> Mediana dentro de SLA</span>
      <span><i class="swatch red"></i> Mediana supera SLA</span>
      <span v-if="groupBy === 'prioridad'"><i class="swatch amber-bar"></i> Límite SLA</span>
      <span class="hint-text">Caja = Q1–Q3 · Punto = Mediana</span>
    </div>
  </div>
</template>

<style scoped>
.violin-wrapper {
  width: 100%;
  height: 100%;
  min-height: 0;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.violin-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 8px;
  flex-shrink: 0;
}

.tool-group {
  display: flex;
  align-items: center;
  gap: 4px;
}

.right-group {
  margin-left: auto;
}

.tool-lbl {
  font-size: 0.72rem;
  font-weight: 600;
  color: var(--text-secondary);
  white-space: nowrap;
}

.btn-pill-sm {
  background: var(--bg-card);
  border: 1px solid var(--border-subtle);
  color: var(--text-secondary);
  font-size: 0.72rem;
  font-weight: 600;
  padding: 3px 8px;
  border-radius: var(--radius-sm);
  cursor: pointer;
  white-space: nowrap;
  transition: all var(--transition-fast);
}

.btn-pill-sm.active {
  background: var(--color-brand-soft);
  border-color: var(--color-brand);
  color: var(--color-brand);
  font-weight: 700;
}

.violin-canvas {
  width: 100%;
  flex: 1;
  min-height: 0;
}

.violin-footer-legend {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 12px;
  font-size: 0.72rem;
  color: var(--text-secondary);
  padding: 4px 8px;
  background: var(--bg-subtle);
  border-radius: var(--radius-sm);
  border: 1px solid var(--border-subtle);
  flex-shrink: 0;
}

.violin-footer-legend span {
  display: inline-flex;
  align-items: center;
  gap: 5px;
}

.hint-text {
  margin-left: auto;
  color: var(--text-muted);
}

.swatch {
  display: inline-block;
  width: 9px;
  height: 9px;
  border-radius: 50%;
}

.swatch.blue { background: #38BDF8; }
.swatch.red { background: #E11D48; }
.swatch.amber-bar {
  width: 12px;
  height: 3px;
  border-radius: 2px;
  background: #F59E0B;
}
</style>

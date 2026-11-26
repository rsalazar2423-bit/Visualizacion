<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import { ZoomIn, Undo2, RotateCcw } from 'lucide-vue-next';
import * as echarts from 'echarts';
import { useOperationsStore } from '../../stores/operationsStore';
import { getEChartsThemeTokens } from '../../constants/themeTokens';
import { useChart } from '../../composables/useChart';

const opsStore = useOperationsStore();

const seriesPoints = computed(() => {
  const raw = opsStore.data?.time_series || [];
  const firstActiveIdx = raw.findIndex(
    (p) => p.ingresados > 0 || p.cerrados > 0 || (p.abiertos_vencidos ?? 0) > 0
  );
  return firstActiveIdx >= 0 ? raw.slice(firstActiveIdx) : raw;
});

const summaryStats = computed(() => {
  const pts = seriesPoints.value;
  if (!pts.length) {
    return {
      totalIngresos: 0,
      totalCierres: 0,
      cerradosATiempo: 0,
      cerradosFueraPlazo: 0,
      peakYear: '-',
      peakIngresos: 0,
    };
  }
  let totalIngresos = 0;
  let totalCierres = 0;
  let cerradosATiempo = 0;
  let cerradosFueraPlazo = 0;
  let peakYear = '-';
  let peakIngresos = 0;
  for (const p of pts) {
    totalIngresos += p.ingresados;
    totalCierres += p.cerrados;
    cerradosATiempo += (p.cerrados_a_tiempo ?? 0);
    cerradosFueraPlazo += (p.cerrados_fuera_plazo ?? 0);
    if (p.ingresados > peakIngresos) {
      peakIngresos = p.ingresados;
      peakYear = p.periodo;
    }
  }
  return { totalIngresos, totalCierres, cerradosATiempo, cerradosFueraPlazo, peakYear, peakIngresos };
});

const chartContainer = ref<HTMLDivElement | null>(null);
const { getChartInstance, render } = useChart(chartContainer, renderTimeEvolution);
const isZoomActive = ref(false);

function toggleZoomMode() {
  const inst = getChartInstance();
  if (!inst) return;
  isZoomActive.value = !isZoomActive.value;
  inst.dispatchAction({
    type: 'takeGlobalCursor',
    key: 'dataZoomSelect',
    dataZoomSelectActive: isZoomActive.value,
  });
}

function undoZoom() {
  const inst = getChartInstance();
  if (!inst) return;
  isZoomActive.value = false;
  inst.dispatchAction({
    type: 'takeGlobalCursor',
    key: 'dataZoomSelect',
    dataZoomSelectActive: false,
  });
  inst.dispatchAction({
    type: 'dataZoom',
    start: 0,
    end: 100,
  });
}

function resetView() {
  const inst = getChartInstance();
  if (!inst) return;
  isZoomActive.value = false;
  inst.dispatchAction({
    type: 'takeGlobalCursor',
    key: 'dataZoomSelect',
    dataZoomSelectActive: false,
  });
  inst.dispatchAction({
    type: 'dataZoom',
    start: 0,
    end: 100,
  });
  inst.dispatchAction({
    type: 'restore',
  });
}

function renderTimeEvolution(chartInstance: echarts.ECharts, isDark: boolean) {
  const pts = seriesPoints.value;
  if (!pts.length) {
    chartInstance.clear();
    return;
  }

  const tokens = getEChartsThemeTokens(isDark);
  const periods = pts.map((p) => p.periodo);
  const ingresados = pts.map((p) => p.ingresados);
  const cerrados = pts.map((p) => p.cerrados);
  const cerradosATiempo = pts.map((p) => p.cerrados_a_tiempo ?? 0);
  const cerradosFueraPlazo = pts.map((p) => p.cerrados_fuera_plazo ?? 0);
  const vencidos = pts.map((p) => p.abiertos_vencidos);

  const option: echarts.EChartsOption = {
    backgroundColor: 'transparent',
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'cross' },
      backgroundColor: tokens.tooltipBg,
      borderColor: tokens.tooltipBorder,
      textStyle: { color: tokens.textColor, fontFamily: tokens.fontFamily, fontSize: 12 },
      formatter: (params: any) => {
        if (!Array.isArray(params) || params.length === 0) return '';
        const yr = params[0].axisValue;
        const pt = pts.find((p) => String(p.periodo) === String(yr));
        let html = `<div style="font-weight:800;margin-bottom:6px;color:${tokens.textColor};">Año ${yr}</div>`;
        for (const s of params) {
          const val = s.value;
          let formattedVal = val;
          if (val == null) {
            formattedVal = `<span style="color:${tokens.textSecondary};font-style:italic;">Sin actividad</span>`;
          } else if (s.seriesName.includes('%')) {
            formattedVal = `<b>${val}%</b>`;
          } else if (s.seriesName.includes('Mediana') || s.seriesName.includes('Tiempo Típico')) {
            formattedVal = `<b>${val} días</b>`;
          } else {
            formattedVal = `<b>${Number(val).toLocaleString()}</b>`;
          }
          html += `<div style="display:flex;justify-content:space-between;gap:14px;margin:3px 0;">
            <span>${s.marker} ${s.seriesName}:</span>
            <span>${formattedVal}</span>
          </div>`;
        }
        if (pt && pt.cerrados > 0) {
          const aTiempo = pt.cerrados_a_tiempo ?? 0;
          const fPlazo = pt.cerrados_fuera_plazo ?? 0;
          const pct = Math.round((aTiempo / pt.cerrados) * 100);
          html += `<div style="margin-top:6px;padding-top:4px;border-top:1px dashed ${tokens.gridColor};font-size:10.5px;color:${tokens.textSecondary};">
            Efectividad cierres: <b style="color:${tokens.textColor};">${pct}% en plazo</b> (${aTiempo.toLocaleString('es-CO')} a tiempo / ${fPlazo.toLocaleString('es-CO')} vencidos)
          </div>`;
        }
        return html;
      },
    },
    legend: {
      top: 0,
      left: 'center',
      itemGap: 12,
      textStyle: { color: tokens.textColor, fontFamily: tokens.fontFamily, fontSize: 11, fontWeight: 600 },
    },
    // Mantiene el controlador nativo de selección de área (dataZoomSelect) activo en ECharts,
    // mientras los botones visibles viven limpiamente en el toolbar HTML superior sin colisiones.
    toolbox: {
      show: true,
      top: -100,
      right: 0,
      feature: {
        dataZoom: { yAxisIndex: 'none' },
        restore: {},
      },
    },
    dataZoom: [
      {
        type: 'inside',
        throttle: 50,
      },
      {
        type: 'slider',
        height: 18,
        bottom: 2,
        borderColor: 'transparent',
        backgroundColor: isDark ? 'rgba(30, 41, 59, 0.4)' : 'rgba(241, 245, 249, 0.8)',
        fillerColor: isDark ? 'rgba(56, 189, 248, 0.2)' : 'rgba(29, 78, 216, 0.15)',
        handleStyle: { color: isDark ? '#38BDF8' : '#1D4ED8', borderColor: '#FFFFFF' },
        textStyle: { color: tokens.textSecondary, fontSize: 10 },
      },
    ],
    grid: {
      left: '2%',
      right: '3%',
      bottom: '34px',
      top: '56px', // Margen limpio para leyenda de 1 fila + títulos de eje
      containLabel: true,
    },
    xAxis: {
      type: 'category',
      data: periods,
      axisLabel: { color: tokens.textSecondary, fontFamily: tokens.fontFamily, fontWeight: 600 },
      axisLine: { lineStyle: { color: tokens.gridColor } },
    },
    yAxis: {
      type: 'value',
      name: 'Volumen de Avisos',
      nameLocation: 'end',
      nameGap: 10,
      nameTextStyle: { color: tokens.textSecondary, fontSize: 10.5, align: 'left', padding: [0, 0, 4, 0] },
      axisLabel: { color: tokens.textSecondary, fontFamily: tokens.fontFamily },
      splitLine: { lineStyle: { color: tokens.gridColor } },
    },
    series: [
      {
        name: 'Ingresados',
        type: 'line',
        smooth: 0.25,
        symbol: 'circle',
        symbolSize: 4,
        lineStyle: { width: 1.5, color: isDark ? '#64748B' : '#94A3B8' }, // Gris Pizarra Tenue (Demanda de fondo)
        itemStyle: { color: isDark ? '#64748B' : '#94A3B8' },
        areaStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: isDark ? 'rgba(100, 116, 139, 0.08)' : 'rgba(148, 163, 184, 0.06)' },
            { offset: 1, color: 'rgba(0,0,0,0)' },
          ]),
        },
        data: ingresados,
      },
      {
        name: 'Cerrados a Tiempo',
        type: 'line',
        smooth: 0.25,
        symbol: 'circle',
        symbolSize: 5,
        lineStyle: { width: 2, color: tokens.sla.cumple }, // Teal Profundo / Esmeralda
        itemStyle: { color: tokens.sla.cumple },
        data: cerradosATiempo,
      },
      {
        name: 'Cerrados Vencidos',
        type: 'line',
        smooth: 0.25,
        symbol: 'triangle',
        symbolSize: 6,
        lineStyle: { width: 2, color: tokens.sla.warning }, // Ámbar / Cobre Mate
        itemStyle: { color: tokens.sla.warning },
        data: cerradosFueraPlazo,
      },
      {
        name: 'Cerrados (Total)',
        type: 'line',
        smooth: 0.25,
        symbol: 'none',
        lineStyle: { width: 1.5, type: 'dotted', color: isDark ? '#38BDF8' : '#0284C7' }, // Azul Acero Técnico (referencia total)
        itemStyle: { color: isDark ? '#38BDF8' : '#0284C7' },
        data: cerrados,
      },
      {
        name: 'Abiertos Vencidos',
        type: 'bar',
        barMaxWidth: 16,
        itemStyle: {
          color: tokens.sla.excede, // Carmín Ladrillo (Alerta Principal de Mora)
          borderRadius: [2, 2, 0, 0],
          opacity: 0.9,
        },
        data: vencidos,
      },
    ],
  };

  chartInstance.setOption(option, true);
}

watch(() => opsStore.data, () => render(), { deep: true });
</script>

<template>
  <div class="time-evolution-wrapper">
    <div class="evolution-toolbar">
      <div class="evolution-kpis">
        <span class="evo-stat">
          Pico de demanda: <b>{{ summaryStats.peakYear }} ({{ summaryStats.peakIngresos }} avisos)</b>
        </span>
        <span class="evo-stat">
          Balance histórico: <b>{{ summaryStats.totalCierres.toLocaleString('es-CO') }} cerrados</b>
          ({{ summaryStats.cerradosATiempo.toLocaleString('es-CO') }} a tiempo · {{ summaryStats.cerradosFueraPlazo.toLocaleString('es-CO') }} vencidos) de
          <b>{{ summaryStats.totalIngresos.toLocaleString('es-CO') }} ingresados</b>
        </span>
      </div>

      <div class="evolution-controls-right">
        <!-- Herramientas de Navegación ubicadas en el espacio vacío derecho (Cero superposición en el gráfico) -->
        <div class="zoom-tools-cluster">
          <button
            class="btn-tool-sm"
            :class="{ active: isZoomActive }"
            title="Seleccionar zona temporal para acercar"
            @click="toggleZoomMode"
          >
            <ZoomIn :size="13" />
          </button>
          <button
            class="btn-tool-sm"
            title="Restablecer zoom"
            @click="undoZoom"
          >
            <Undo2 :size="13" />
          </button>
          <button
            class="btn-tool-sm"
            title="Restablecer vista completa (2008 – 2023)"
            @click="resetView"
          >
            <RotateCcw :size="13" />
          </button>
        </div>
      </div>
    </div>

    <div ref="chartContainer" class="chart-canvas-evolution"></div>
  </div>
</template>

<style scoped>
.time-evolution-wrapper {
  width: 100%;
  height: 100%;
  min-height: 0;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.evolution-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 10px;
  padding-bottom: 4px;
  flex-shrink: 0;
}

.evolution-kpis {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
}

.evo-stat {
  font-size: 0.78rem;
  color: var(--text-secondary);
  background: var(--bg-subtle);
  padding: 4px 10px;
  border-radius: var(--radius-sm);
  border: 1px solid var(--border-subtle);
}

.evo-stat b {
  color: var(--text-primary);
}

.evolution-controls-right {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  flex: 1 1 360px;
  flex-wrap: nowrap;
}

.overlay-toggle {
  display: flex;
  align-items: center;
  gap: 6px;
  flex-shrink: 0;
}

.toggle-label {
  font-size: 0.75rem;
  font-weight: 600;
  color: var(--text-secondary);
  white-space: nowrap;
}

.btn-toggle-sm {
  background: var(--bg-card);
  border: 1px solid var(--border-subtle);
  color: var(--text-secondary);
  font-size: 0.75rem;
  font-weight: 600;
  padding: 4px 10px;
  border-radius: var(--radius-sm);
  cursor: pointer;
  white-space: nowrap;
  transition: all var(--transition-fast);
}

.btn-toggle-sm.active {
  background: var(--color-brand-soft);
  border-color: var(--color-brand);
  color: var(--color-brand);
  font-weight: 700;
}

.zoom-tools-cluster {
  display: flex;
  align-items: center;
  gap: 5px;
  margin-left: auto;
  flex-shrink: 0;
}

.btn-tool-sm {
  background: var(--bg-card);
  border: 1px solid var(--border-subtle);
  color: var(--text-secondary);
  font-size: 0.74rem;
  font-weight: 600;
  padding: 4px 9px;
  border-radius: var(--radius-sm);
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 5px;
  transition: all var(--transition-fast);
}

.btn-tool-sm:hover {
  background: var(--bg-hover);
  color: var(--text-primary);
  border-color: var(--color-brand);
}

.btn-tool-sm.active {
  background: var(--color-brand-soft);
  border-color: var(--color-brand);
  color: var(--color-brand);
}

.chart-canvas-evolution {
  width: 100%;
  flex: 1;
  min-height: 0;
}
</style>

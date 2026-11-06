<script setup lang="ts">
import { ref, watch } from 'vue';
import { AlertTriangle, Clock } from 'lucide-vue-next';
import * as echarts from 'echarts';
import { useTerritoryStore } from '../../stores/territoryStore';
import { getEChartsThemeTokens, getTipoColor } from '../../constants/themeTokens';
import { useChart } from '../../composables/useChart';

const territoryStore = useTerritoryStore();

function renderSectorRanking(chartInstance: echarts.ECharts, isDark: boolean) {
  const ranking = territoryStore.data?.sector_ranking || [];
  if (!ranking.length) {
    chartInstance.clear();
    return;
  }

  const tokens = getEChartsThemeTokens(isDark);
  const topItems = ranking.slice(0, 10);
  const labels = topItems.map((r) => r.name);
  const vencidos = topItems.map((r) => r.abiertos_vencidos);
  const cerradosAtrasados = topItems.map((r) => Math.max(0, r.excede_total - r.abiertos_vencidos));

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
        return `
          <div style="font-weight:800;margin-bottom:4px;color:${tokens.textColor};">${item.name} (${item.depto})</div>
          <div style="font-size:11px;color:${tokens.textSecondary};margin-bottom:6px;">
            Total avisos: <b>${item.total}</b> · Cumplimiento: <b>${item.cumple_pct}%</b> · Mediana: <b>${item.mediana_dias} d</b>
          </div>
          <div style="color:${tokens.sla.excede};font-weight:700;">● Abiertos Vencidos: ${item.abiertos_vencidos}</div>
          <div style="color:${tokens.sla.warning};">● Cerrados con Atraso: ${Math.max(0, item.excede_total - item.abiertos_vencidos)}</div>
        `;
      },
    },
    legend: {
      top: 0,
      textStyle: { color: tokens.textColor, fontFamily: tokens.fontFamily, fontWeight: 600 },
    },
    grid: {
      left: '2%',
      right: '5%',
      bottom: '4%',
      top: '36px',
      containLabel: true,
    },
    xAxis: {
      type: 'value',
      axisLabel: { color: tokens.textSecondary, fontFamily: tokens.fontFamily },
      splitLine: { lineStyle: { color: tokens.gridColor } },
    },
    yAxis: {
      type: 'category',
      data: labels,
      inverse: true,
      axisLabel: { color: tokens.textColor, fontFamily: tokens.fontFamily, fontWeight: 600, fontSize: 11 },
      axisLine: { lineStyle: { color: tokens.gridColor } },
    },
    series: [
      {
        name: 'Abiertos Vencidos (Prioritario)',
        type: 'bar',
        stack: 'atraso',
        barWidth: 16,
        itemStyle: { color: tokens.sla.excede, borderRadius: [3, 0, 0, 3] },
        data: vencidos,
      },
      {
        name: 'Cerrados fuera de plazo',
        type: 'bar',
        stack: 'atraso',
        barWidth: 16,
        itemStyle: { color: tokens.sla.warning, opacity: 0.78, borderRadius: [0, 3, 3, 0] },
        data: cerradosAtrasados,
      },
    ],
  };

  chartInstance.setOption(option, true);
}

function renderTypologyDurations(chartInstance: echarts.ECharts, isDark: boolean) {
  const items = territoryStore.data?.typology_durations || [];
  if (!items.length) {
    chartInstance.clear();
    return;
  }

  const tokens = getEChartsThemeTokens(isDark);
  const categories = items.map((i) => i.tipo);
  const medianas = items.map((i) => ({
    value: i.mediana_dias,
    itemStyle: { color: getTipoColor(i.tipo, isDark), borderRadius: [4, 4, 0, 0] },
  }));
  const promedios = items.map((i) => i.promedio_dias);
  const p75s = items.map((i) => i.p75_dias);

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
        const item = items[idx];
        if (!item) return '';
        return `
          <div style="font-weight:800;margin-bottom:4px;color:${tokens.textColor};">${item.tipo}</div>
          <div style="font-size:11px;color:${tokens.textSecondary};margin-bottom:6px;">
            Volumen: <b>${item.total.toLocaleString()}</b> avisos · Cumplimiento: <b>${item.cumple_pct}%</b>
          </div>
          <div style="color:${tokens.textColor};">● Tiempo Típico (Mediana): <b>${item.mediana_dias} días</b></div>
          <div style="color:${tokens.textSecondary};">● Rango Intercuartil (P25 – P75): <b>${item.p25_dias} – ${item.p75_dias} días</b></div>
          <div style="color:${tokens.sla.warning};">● Promedio (afectado por extremos): <b>${item.promedio_dias} días</b></div>
        `;
      },
    },
    legend: {
      top: 0,
      textStyle: { color: tokens.textColor, fontFamily: tokens.fontFamily, fontWeight: 600 },
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '8%',
      top: '38px',
      containLabel: true,
    },
    xAxis: {
      type: 'category',
      data: categories,
      axisLabel: {
        color: tokens.textColor,
        fontFamily: tokens.fontFamily,
        fontWeight: 600,
        fontSize: 11,
        interval: 0,
        rotate: 12,
      },
      axisLine: { lineStyle: { color: tokens.gridColor } },
    },
    yAxis: {
      type: 'value',
      name: 'Días de Atención',
      nameTextStyle: { color: tokens.textSecondary, fontSize: 11 },
      axisLabel: { formatter: '{value} d', color: tokens.textSecondary, fontFamily: tokens.fontFamily },
      splitLine: { lineStyle: { color: tokens.gridColor } },
    },
    series: [
      {
        name: 'Mediana (Tiempo Típico)',
        type: 'bar',
        barMaxWidth: 32,
        data: medianas,
      },
      {
        name: 'Promedio',
        type: 'line',
        symbol: 'circle',
        symbolSize: 8,
        lineStyle: { width: 2, color: tokens.sla.warning, type: 'dashed' },
        itemStyle: { color: tokens.sla.warning },
        data: promedios,
      },
      {
        name: 'Percentil 75 (P75)',
        type: 'scatter',
        symbol: 'diamond',
        symbolSize: 9,
        itemStyle: { color: tokens.sla.excede },
        data: p75s,
      },
    ],
  };

  chartInstance.setOption(option, true);
}

const rankingContainer = ref<HTMLDivElement | null>(null);
const durationContainer = ref<HTMLDivElement | null>(null);

const { render: renderRank } = useChart(rankingContainer, renderSectorRanking);
const { render: renderDur } = useChart(durationContainer, renderTypologyDurations);

watch(
  () => territoryStore.data,
  () => {
    renderRank();
    renderDur();
  },
  { deep: true }
);
</script>

<template>
  <div class="grid-2">
    <!-- Gráfico 1: Ranking de Municipios / Sectores con Mayores Retrasos -->
    <div class="card">
      <div class="chart-header-block">
        <div class="header-main-row">
          <div class="title-with-badge">
            <span class="badge badge-tag">
              <AlertTriangle :size="13" /> Cuellos de Botella
            </span>
            <h3 class="card-title">
              {{ territoryStore.selectedDepto ? `Sectores con Mayor Atraso (${territoryStore.selectedDepto})` : 'Municipios con Mayor Concentración de Retrasos' }}
            </h3>
          </div>
        </div>
        <p class="chart-reseña">
          Focalización de zonas donde se acumula el mayor número de avisos abiertos vencidos e incumplimientos históricos para priorizar el despliegue de cuadrillas.
        </p>
      </div>
      <div ref="rankingContainer" class="diag-canvas"></div>
    </div>

    <!-- Gráfico 2: Comparación de Tiempos de Atención por Tipo de Aviso -->
    <div class="card">
      <div class="chart-header-block">
        <div class="header-main-row">
          <div class="title-with-badge">
            <span class="badge badge-tag">
              <Clock :size="13" /> Diagnóstico Técnico
            </span>
            <h3 class="card-title">Tiempos de Atención por Tipo de Aviso (Mediana vs P75)</h3>
          </div>
        </div>
        <p class="chart-reseña">
          Comparación de la duración típica (mediana), el promedio y el percentil 75 (P75) entre tipos de incidente, evidenciando qué especialidades técnicas tardan más en resolverse.
        </p>
      </div>
      <div ref="durationContainer" class="diag-canvas"></div>
    </div>
  </div>
</template>

<style scoped>
.diag-canvas {
  width: 100%;
  height: 360px;
}
</style>

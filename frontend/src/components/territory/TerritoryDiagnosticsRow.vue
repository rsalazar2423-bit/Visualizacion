<script setup lang="ts">
import { ref, watch } from 'vue';
import * as echarts from 'echarts';
import { useTerritoryStore } from '../../stores/territoryStore';
import { getEChartsThemeTokens, getTipoColor } from '../../constants/themeTokens';
import { useChart } from '../../composables/useChart';
import ExpandableChartCard from '../common/ExpandableChartCard.vue';

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
      left: '3%',
      right: '6%',
      bottom: '3%',
      top: '14%',
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
      axisLabel: {
        color: tokens.textColor,
        fontFamily: tokens.fontFamily,
        fontSize: 11,
        formatter: (val: string) => (val.length > 20 ? val.substring(0, 18) + '…' : val),
      },
    },
    series: [
      {
        name: 'Abiertos Vencidos (Alerta)',
        type: 'bar',
        stack: 'total',
        data: vencidos,
        itemStyle: { color: tokens.sla.excede, borderRadius: [0, 0, 0, 0] },
      },
      {
        name: 'Cerrados con Atraso (Mitigados)',
        type: 'bar',
        stack: 'total',
        data: cerradosAtrasados,
        itemStyle: { color: tokens.sla.warning, borderRadius: [0, 4, 4, 0] },
      },
    ],
  };

  chartInstance.setOption(option, true);
}

function renderTypologyDurations(chartInstance: echarts.ECharts, isDark: boolean) {
  const durations = territoryStore.data?.typology_durations || [];
  if (!durations.length) {
    chartInstance.clear();
    return;
  }

  const tokens = getEChartsThemeTokens(isDark);
  const labels = durations.map((d) => d.tipo);
  const medianas = durations.map((d) => d.mediana_dias);
  const p75 = durations.map((d) => d.p75_dias);

  const option: echarts.EChartsOption = {
    backgroundColor: 'transparent',
    tooltip: {
      trigger: 'axis',
      backgroundColor: tokens.tooltipBg,
      borderColor: tokens.tooltipBorder,
      textStyle: { color: tokens.textColor, fontFamily: tokens.fontFamily, fontSize: 12 },
      formatter: (params: any) => {
        const idx = params?.[0]?.dataIndex ?? 0;
        const item = durations[idx];
        if (!item) return '';
        return `
          <div style="font-weight:800;margin-bottom:4px;color:${tokens.textColor};">${item.tipo}</div>
          <div style="font-size:11px;color:${tokens.textSecondary};margin-bottom:6px;">
            Total avisos: <b>${item.total}</b> · Cumplimiento: <b>${item.cumple_pct}%</b>
          </div>
          <div style="color:${tokens.brandColor};font-weight:700;">● Mediana de Duración: <b>${item.mediana_dias} días</b></div>
          <div style="color:${tokens.accentSelect};">● Percentil 75 (P75): <b>${item.p75_dias} días</b></div>
          <div style="color:${tokens.textSecondary};">● Promedio: <b>${item.promedio_dias} días</b></div>
          <div style="color:${tokens.sla.excede};">● Abiertos Vencidos: <b>${item.abiertos_vencidos}</b></div>
        `;
      },
    },
    legend: {
      top: 0,
      textStyle: { color: tokens.textColor, fontFamily: tokens.fontFamily, fontWeight: 600 },
    },
    grid: {
      left: '3%',
      right: '6%',
      bottom: '3%',
      top: '14%',
      containLabel: true,
    },
    xAxis: {
      type: 'category',
      data: labels,
      axisLabel: {
        color: tokens.textColor,
        fontFamily: tokens.fontFamily,
        fontSize: 11,
        interval: 0,
        formatter: (val: string) => (val.length > 12 ? val.substring(0, 10) + '…' : val),
      },
    },
    yAxis: {
      type: 'value',
      name: 'Días de Duración',
      nameTextStyle: { color: tokens.textSecondary, fontSize: 11 },
      axisLabel: { color: tokens.textSecondary, fontFamily: tokens.fontFamily },
      splitLine: { lineStyle: { color: tokens.gridColor } },
    },
    series: [
      {
        name: 'Mediana (Tiempo Típico)',
        type: 'bar',
        data: medianas,
        itemStyle: {
          color: (params: any) => getTipoColor(labels[params.dataIndex], isDark),
          borderRadius: [4, 4, 0, 0],
        },
      },
      {
        name: 'Percentil 75 (Cola de Atraso)',
        type: 'line',
        data: p75,
        lineStyle: { color: tokens.sla.warning, width: 2, type: 'dashed' },
        itemStyle: { color: tokens.sla.warning },
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
    <!-- Gráfico 1 con botón Ampliar -->
    <ExpandableChartCard
      :title="territoryStore.selectedDepto ? `Sectores con Mayor Atraso (${territoryStore.selectedDepto})` : 'Municipios con Mayor Concentración de Retrasos'"
      subtitle="Focalización de zonas donde se acumulan avisos abiertos vencidos para priorizar cuadrillas"
    >
      <div ref="rankingContainer" class="diag-canvas"></div>
    </ExpandableChartCard>

    <!-- Gráfico 2 con botón Ampliar -->
    <ExpandableChartCard
      title="Tiempos de Atención por Tipo de Aviso (Mediana vs P75)"
      subtitle="Comparación de la duración típica frente al percentil 75 evidenciando qué especialidades tardan más"
    >
      <div ref="durationContainer" class="diag-canvas"></div>
    </ExpandableChartCard>
  </div>
</template>

<style scoped>
.diag-canvas {
  width: 100%;
  height: 100%;
  min-height: 0;
}
</style>

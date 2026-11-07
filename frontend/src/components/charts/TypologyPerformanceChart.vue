<script setup lang="ts">
import { ref, watch } from 'vue';
import { Tag } from 'lucide-vue-next';
import type * as echarts from 'echarts';
import { useOperationsStore } from '../../stores/operationsStore';
import { useThemeStore } from '../../stores/themeStore';
import { getEChartsThemeTokens } from '../../constants/themeTokens';
import { useChart } from '../../composables/useChart';

const opsStore = useOperationsStore();
const themeStore = useThemeStore();

function handleTipoClick(tipo: string) {
  if (opsStore.isTipoSelected(tipo) && opsStore.selectedTipos.length === 1) {
    opsStore.setSingleTipo('Todos');
  } else {
    opsStore.setSingleTipo(tipo);
  }
}

function renderPerformance(chartInstance: echarts.ECharts, isDark: boolean) {
  const items = opsStore.data?.typology_performance || [];
  if (!items.length) {
    chartInstance.clear();
    return;
  }

  const tokens = getEChartsThemeTokens(isDark);
  const categories = items.map((i) => i.tipo);
  const selectedTipos = opsStore.selectedTipos;

  const cumpleSeries = items.map((i) => {
    const isSelected = selectedTipos.length === 0 || selectedTipos.includes(i.tipo);
    return {
      name: i.tipo,
      value: i.cumple_pct,
      raw: i,
      itemStyle: {
        color: isDark ? '#334155' : '#CBD5E1', // Gris neutro: Atendido a tiempo en norma (sin riesgo)
        opacity: isSelected ? 1 : 0.3,
        borderColor: tokens.cardBg,
        borderWidth: 1,
      },
    };
  });

  const excedeSeries = items.map((i) => {
    const isSelected = selectedTipos.length === 0 || selectedTipos.includes(i.tipo);
    return {
      name: i.tipo,
      value: i.excede_pct,
      raw: i,
      itemStyle: {
        color: tokens.sla.excede, // Carmín alarma: Mora acumulada / incumplimiento SLA
        opacity: isSelected ? 1 : 0.3,
        borderColor: tokens.cardBg,
        borderWidth: 1,
      },
    };
  });

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
          <div style="font-weight:800;font-size:13px;margin-bottom:4px;color:${tokens.textColor};">
            ${item.tipo} (${item.pct_total}% del total)
          </div>
          <div style="font-size:11px;color:${tokens.textSecondary};margin-bottom:8px;max-width:280px;line-height:1.4;">
            ${item.significado}
          </div>
          <div style="display:flex;justify-content:space-between;gap:12px;margin-bottom:3px;">
            <span style="color:${isDark ? '#94A3B8' : '#475569'};">● Cumple Plazo (En Norma):</span>
            <b>${item.cumple_pct}% (${item.cumple_count})</b>
          </div>
          <div style="display:flex;justify-content:space-between;gap:12px;margin-bottom:4px;">
            <span style="color:${tokens.sla.excede};font-weight:700;">● Excede Plazo (En Mora):</span>
            <b style="color:${tokens.sla.excede};">${item.excede_pct}% (${item.excede_count})</b>
          </div>
          <div style="margin-top:6px;padding-top:6px;border-top:1px solid ${tokens.gridColor};font-size:11px;color:${tokens.textSecondary};">
            Tiempo típico (mediana): <b>${item.mediana_dias} días</b> · Abiertos vencidos: <b>${item.abiertos_vencidos}</b>
          </div>
        `;
      },
    },
    legend: {
      top: 0,
      left: 'center',
      itemGap: 14,
      textStyle: { color: tokens.textColor, fontFamily: tokens.fontFamily, fontWeight: 600, fontSize: 11 },
      data: [
        { name: 'Cumple Plazo (En Norma)', itemStyle: { color: isDark ? '#334155' : '#CBD5E1' } },
        { name: 'Excede Plazo (En Mora)', itemStyle: { color: tokens.sla.excede } },
      ],
    },
    grid: {
      left: '3%',
      right: '12%',
      bottom: '6%',
      top: '36px',
      containLabel: true,
    },
    xAxis: {
      type: 'value',
      max: 100,
      axisLabel: { formatter: '{value}%', color: tokens.textSecondary, fontFamily: tokens.fontFamily, fontSize: 10.5 },
      splitLine: { lineStyle: { color: tokens.gridColor } },
    },
    yAxis: {
      type: 'category',
      data: categories,
      inverse: true,
      axisLabel: {
        color: tokens.textColor,
        fontFamily: tokens.fontFamily,
        fontWeight: 600,
        fontSize: 11,
      },
      axisLine: { lineStyle: { color: tokens.gridColor } },
    },
    series: [
      {
        name: 'Cumple Plazo (En Norma)',
        type: 'bar',
        stack: 'total',
        barWidth: 20,
        itemStyle: { borderRadius: [3, 0, 0, 3] },
        label: {
          show: true,
          position: 'inside',
          formatter: (p: any) => (p.value >= 12 ? `${p.value}%` : ''),
          color: isDark ? '#CBD5E1' : '#334155',
          fontSize: 10.5,
          fontWeight: 700,
        },
        data: cumpleSeries,
      },
      {
        name: 'Excede Plazo (En Mora)',
        type: 'bar',
        stack: 'total',
        barWidth: 20,
        itemStyle: { borderRadius: [0, 3, 3, 0] },
        label: {
          show: true,
          position: 'inside',
          formatter: (p: any) => (p.value >= 12 ? `${p.value}%` : ''),
          color: '#FFFFFF',
          fontSize: 10.5,
          fontWeight: 700,
        },
        data: excedeSeries,
      },
      {
        name: 'Tiempo Típico (Mediana)',
        type: 'scatter',
        symbol: 'pin',
        symbolSize: 0.1, // Elemento virtual para renderizar la etiqueta a la derecha
        label: {
          show: true,
          position: 'right',
          offset: [8, 0],
          formatter: (params: any) => {
            const item = items[params.dataIndex];
            return item ? `⏱ ${item.mediana_dias}d` : '';
          },
          color: tokens.textSecondary,
          fontSize: 10.5,
          fontWeight: 700,
          fontFamily: tokens.fontFamily,
        },
        data: items.map(() => 100),
      },
    ],
  };

  chartInstance.setOption(option, true);
}

function handleChartClick(params: any) {
  if (params.name) {
    handleTipoClick(params.name);
  }
}

const chartContainer = ref<HTMLDivElement | null>(null);
const { render } = useChart(chartContainer, renderPerformance, handleChartClick);

watch(() => [opsStore.data, opsStore.selectedTipos, themeStore.isDark], () => render(), { deep: true });
</script>

<template>
  <div class="performance-wrapper">
    <!-- Active Tipo Filter Indicator -->
    <div v-if="opsStore.selectedTipos.length > 0" class="active-tipo-bar">
      <span class="active-badge">
        <Tag :size="13" /> Filtrando: <b>{{ opsStore.selectedTipos.join(', ') }}</b>
      </span>
      <button class="btn-clear-tipo" @click="opsStore.setSingleTipo('Todos')">
        Ver Todas
      </button>
    </div>

    <!-- Canvas de la gráfica -->
    <div ref="chartContainer" class="performance-canvas"></div>

    <!-- Leyenda Semántica Explicativa (Qué significa cada color y métrica) -->
    <div class="semantic-legend-card">
      <div class="semantic-item">
        <span class="color-badge slate"></span>
        <div class="item-text">
          <span class="item-title">Gris Pizarra · En Norma</span>
          <span class="item-sub">SLA cumplido sin riesgo regulatorio</span>
        </div>
      </div>

      <div class="semantic-item">
        <span class="color-badge carmine"></span>
        <div class="item-text">
          <span class="item-title">Rojo Carmín · En Mora</span>
          <span class="item-sub">Superó el plazo máximo permitido</span>
        </div>
      </div>

      <div class="semantic-item">
        <span class="metric-badge">⏱</span>
        <div class="item-text">
          <span class="item-title">Tiempo Típico (Mediana)</span>
          <span class="item-sub">Días reales que toma cerrar el tipo de aviso</span>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.performance-wrapper {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  gap: 8px;
}

.performance-canvas {
  width: 100%;
  flex: 1;
  min-height: 280px;
}

.active-tipo-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 4px 10px;
  background: var(--color-brand-soft);
  border: 1px solid var(--color-brand);
  border-radius: var(--radius-sm);
}

.active-badge {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 0.76rem;
  color: var(--color-brand);
}

.btn-clear-tipo {
  background: transparent;
  border: none;
  font-size: 0.72rem;
  font-weight: 700;
  color: var(--color-brand);
  cursor: pointer;
  text-decoration: underline;
}

.semantic-legend-card {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 8px;
  padding: 8px 12px;
  background: var(--bg-subtle);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-md);
  margin-top: auto;
}

.semantic-item {
  display: flex;
  align-items: center;
  gap: 8px;
}

.color-badge {
  width: 12px;
  height: 12px;
  border-radius: 3px;
  flex-shrink: 0;
}

.color-badge.slate {
  background: #64748B;
}

.color-badge.carmine {
  background: var(--sla-danger);
}

.metric-badge {
  font-size: 0.85rem;
  line-height: 1;
}

.item-text {
  display: flex;
  flex-direction: column;
}

.item-title {
  font-size: 0.72rem;
  font-weight: 700;
  color: var(--text-primary);
  line-height: 1.1;
}

.item-sub {
  font-size: 0.65rem;
  color: var(--text-muted);
  line-height: 1.1;
  margin-top: 1px;
}

@media (max-width: 640px) {
  .semantic-legend-card {
    grid-template-columns: 1fr;
    gap: 6px;
  }
}
</style>

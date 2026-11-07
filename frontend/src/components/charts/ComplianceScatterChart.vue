<script setup lang="ts">
import { ref, watch } from 'vue';
import * as echarts from 'echarts';
import type { CapacityRegionItem } from '../../types/models';
import { getEChartsThemeTokens } from '../../constants/themeTokens';
import { useChart } from '../../composables/useChart';

const props = defineProps<{
  items: CapacityRegionItem[];
}>();

const chartRef = ref<HTMLDivElement | null>(null);

function renderScatterChart(chartInstance: echarts.ECharts, isDark: boolean) {
  const items = props.items || [];
  if (!items.length) {
    chartInstance.clear();
    return;
  }

  const tokens = getEChartsThemeTokens(isDark);

  const scatterData = items.map((m) => {
    // Clasificación de Severidad Operativa:
    // Rojo Carmín: Cumplimiento deficiente (<45%) o mora grave (>=10 vencidos)
    const isCritical = m.cumple_pct < 45 || m.abiertos_vencidos >= 10;
    // Ámbar Cobre: Alerta moderada (45% a 60%)
    const isWarning = !isCritical && m.cumple_pct < 60;

    return {
      name: m.region,
      value: [m.total_avisos, m.cumple_pct, m.abiertos_vencidos, m.mediana_dias, m.torres],
      itemStyle: {
        color: isCritical
          ? tokens.sla.excede // Carmín de Alarma
          : isWarning
            ? tokens.sla.warning // Ámbar de Advertencia
            : (isDark ? '#64748B' : '#94A3B8'), // Gris Pizarra Neutro (En norma)
        opacity: isCritical ? 0.95 : 0.7,
        borderColor: isCritical ? '#FFFFFF' : (isDark ? '#1E293B' : '#FFFFFF'),
        borderWidth: isCritical ? 2.2 : 1.2,
      },
    };
  });

  const option: echarts.EChartsOption = {
    backgroundColor: 'transparent',
    tooltip: {
      trigger: 'item',
      backgroundColor: tokens.tooltipBg,
      borderColor: tokens.tooltipBorder,
      textStyle: { color: tokens.textColor, fontFamily: tokens.fontFamily, fontSize: 12 },
      formatter: (params: any) => {
        const d = params.data;
        if (!d) return '';
        const [total, cumple, vencidos, mediana, torres] = d.value;
        const statusLabel = cumple < 45 || vencidos >= 10
          ? '🔴 Crítico (Bajo Cumplimiento / Alta Mora)'
          : cumple < 60
            ? '🟠 Advertencia (Cumplimiento Moderado)'
            : '⚪ Controlado (En Norma)';
        return `
          <div style="font-weight:800;font-size:13px;margin-bottom:4px;color:${tokens.textColor};">${d.name}</div>
          <div style="font-size:11px;font-weight:700;margin-bottom:6px;color:${d.itemStyle.color};">${statusLabel}</div>
          <div style="color:${tokens.textColor};font-size:12px;">Carga Total: <b>${total} avisos</b> (${torres} torres instaladas)</div>
          <div style="color:${tokens.textColor};font-size:12px;">Cumplimiento SLA: <b>${cumple}%</b></div>
          <div style="color:${tokens.sla.excede};font-size:12px;font-weight:700;">Abiertos Vencidos (Mora): <b>${vencidos} avisos</b></div>
          <div style="color:${tokens.textSecondary};font-size:11px;margin-top:4px;">Tiempo Típico (Mediana): <b>${mediana} días</b></div>
          <div style="font-size:10px;color:${tokens.accentSelect};margin-top:5px;">(El diámetro del nodo refleja la cantidad de vencidos)</div>
        `;
      },
    },
    toolbox: {
      right: 12,
      top: 0,
      feature: {
        dataZoom: {
          title: { zoom: 'Seleccionar zona (Caja)', back: 'Restablecer zoom' },
        },
        restore: { title: 'Restablecer vista' },
      },
      iconStyle: { borderColor: tokens.textSecondary },
    },
    dataZoom: [
      {
        type: 'inside',
        xAxisIndex: 0,
      },
      {
        type: 'inside',
        yAxisIndex: 0,
      },
    ],
    grid: {
      left: '4%',
      right: '6%',
      bottom: '12%',
      top: '40px',
      containLabel: true,
    },
    xAxis: {
      type: 'value',
      name: 'Carga de Trabajo (Volumen de Avisos Registrados)',
      nameLocation: 'middle',
      nameGap: 28,
      nameTextStyle: { color: tokens.textSecondary, fontWeight: 600, fontSize: 11 },
      axisLabel: { color: tokens.textSecondary, fontFamily: tokens.fontFamily, fontSize: 10.5 },
      splitLine: { lineStyle: { color: tokens.gridColor } },
    },
    yAxis: {
      type: 'value',
      name: '% Cumplimiento Oportuno SLA',
      min: 0,
      max: 100,
      nameTextStyle: { color: tokens.textSecondary, fontWeight: 600, fontSize: 11, padding: [0, 0, 6, 0] },
      axisLabel: { formatter: '{value}%', color: tokens.textSecondary, fontFamily: tokens.fontFamily, fontSize: 10.5 },
      splitLine: { lineStyle: { color: tokens.gridColor } },
    },
    series: [
      {
        name: 'Municipios',
        type: 'scatter',
        symbolSize: (val: any) => {
          const vencidos = val[2] || 0;
          return Math.max(11, Math.min(34, 11 + Math.sqrt(vencidos) * 4.2));
        },
        label: {
          show: true,
          position: 'top',
          formatter: (p: any) => {
            // Destaca automáticamente municipios con alta carga o mora extrema
            const total = p.data.value[0];
            const vencidos = p.data.value[2];
            const cumple = p.data.value[1];
            if (total >= 70 || vencidos >= 10 || cumple <= 30) {
              return p.data.name;
            }
            return '';
          },
          color: tokens.textColor,
          fontSize: 10.5,
          fontWeight: 700,
        },
        markLine: {
          silent: true,
          symbol: 'none',
          lineStyle: {
            color: isDark ? '#475569' : '#94A3B8',
            type: 'dashed',
            width: 1.5,
          },
          data: [
            {
              yAxis: 50,
              label: {
                formatter: 'Meta SLA: 50%',
                position: 'insideEndTop',
                color: tokens.textSecondary,
                fontSize: 10,
                fontWeight: 600,
              },
            },
            {
              xAxis: 60,
              label: {
                formatter: 'Umbral Carga: 60',
                position: 'insideEndTop',
                color: tokens.textSecondary,
                fontSize: 10,
                fontWeight: 600,
              },
            },
          ],
        },
        data: scatterData,
      },
    ],
  };

  chartInstance.setOption(option, true);
}

const { render } = useChart(chartRef, renderScatterChart);

watch(
  () => props.items,
  () => {
    render();
  },
  { deep: true }
);
</script>

<template>
  <div class="scatter-chart-wrapper">
    <!-- Lienzo de la Matriz de Dispersión -->
    <div ref="chartRef" class="cap-canvas"></div>

    <!-- Guía Explicativa Semántica Oficial de la Matriz -->
    <div class="scatter-legend-bar">
      <!-- Colores de Severidad -->
      <div class="legend-column">
        <span class="legend-col-title">Código de Color (Severidad):</span>
        <div class="legend-chips-row">
          <div class="legend-item">
            <span class="bubble-dot danger"></span>
            <span class="legend-label"><b>Rojo Carmín:</b> Crítico (&lt;45% SLA o ≥10 vencidos)</span>
          </div>
          <div class="legend-item">
            <span class="bubble-dot warning"></span>
            <span class="legend-label"><b>Ámbar:</b> Alerta moderada (45%–60% SLA)</span>
          </div>
          <div class="legend-item">
            <span class="bubble-dot neutral"></span>
            <span class="legend-label"><b>Gris Pizarra:</b> Estable (≥60% SLA)</span>
          </div>
        </div>
      </div>

      <!-- Dimensión y Cuadrantes -->
      <div class="legend-column">
        <span class="legend-col-title">Interpretación de Cuadrantes y Tamaño:</span>
        <div class="legend-chips-row">
          <div class="legend-item">
            <span class="size-symbol">◉</span>
            <span class="legend-label"><b>Diámetro:</b> Cantidad de abiertos vencidos en mora</span>
          </div>
          <div class="legend-item highlight-box">
            <span class="alert-icon">⚠</span>
            <span class="legend-label">
              <b>Cuadrante Inferior Derecho:</b> Alta carga y bajo cumplimiento (ej. <i>Ubalá, Santa María</i>) requieren refuerzo de cuadrillas.
            </span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.scatter-chart-wrapper {
  width: 100%;
  height: 100%;
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  gap: 8px;
}

.cap-canvas {
  width: 100%;
  flex: 1;
  min-height: 280px;
}

.scatter-legend-bar {
  display: grid;
  grid-template-columns: 1fr 1.3fr;
  gap: 12px;
  padding: 8px 14px;
  background: var(--bg-subtle);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-md);
  margin-top: auto;
}

.legend-column {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.legend-col-title {
  font-size: 0.72rem;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  color: var(--text-muted);
}

.legend-chips-row {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 7px;
  font-size: 0.74rem;
  color: var(--text-secondary);
}

.legend-item b {
  color: var(--text-primary);
}

.bubble-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  flex-shrink: 0;
}

.bubble-dot.danger {
  background: var(--sla-danger);
  box-shadow: 0 0 0 2px var(--sla-danger-bg);
}

.bubble-dot.warning {
  background: var(--sla-warning);
}

.bubble-dot.neutral {
  background: #64748B;
}

.size-symbol {
  font-size: 0.95rem;
  color: #1D4ED8;
  line-height: 1;
}

[data-theme="dark"] .size-symbol {
  color: #38BDF8;
}

.highlight-box {
  background: rgba(190, 18, 60, 0.08);
  border: 1px solid rgba(190, 18, 60, 0.2);
  padding: 3px 6px;
  border-radius: var(--radius-sm);
  color: var(--text-primary);
}

.alert-icon {
  color: var(--sla-danger);
  font-weight: 800;
}

@media (max-width: 900px) {
  .scatter-legend-bar {
    grid-template-columns: 1fr;
    gap: 8px;
  }
}
</style>

<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import { Target, Clock } from 'lucide-vue-next';
import type * as echarts from 'echarts';
import { useTerritoryStore } from '../../stores/territoryStore';
import { getEChartsThemeTokens } from '../../constants/themeTokens';
import { useChart } from '../../composables/useChart';
import { formatSunburstTooltip } from '../../utils/chartFormatters';

const territoryStore = useTerritoryStore();
const mode = ref<'sla' | 'plazos'>('sla');

function setMode(m: 'sla' | 'plazos') {
  mode.value = m;
  render();
}

// Extraer tipologías y sus métricas para los botones laterales
const sunburstCategories = computed(() => {
  if (!territoryStore.data?.sunburst) return [];
  const raw = mode.value === 'sla'
    ? (territoryStore.data.sunburst_sla || territoryStore.data.sunburst)
    : (territoryStore.data.sunburst_plazos || territoryStore.data.sunburst);

  const totalAvisos = raw.reduce((acc, curr) => {
    const sumChild = (curr.children || []).reduce((cAcc, cCurr) => cAcc + (cCurr.value || 0), 0);
    return acc + (sumChild || curr.value || 0);
  }, 0);

  return raw.map((cat) => {
    const catTotal = (cat.children || []).reduce((acc: number, c: any) => acc + (c.value || 0), 0) || cat.value || 0;
    const pct = totalAvisos > 0 ? Number(((catTotal / totalAvisos) * 100).toFixed(1)) : 0;
    return {
      name: cat.name,
      value: catTotal,
      pct,
      color: cat.itemStyle?.color || '#38BDF8',
      children: (cat.children || []).map((ch: any) => ({
        name: ch.name,
        value: ch.value,
        pct: catTotal > 0 ? Number(((ch.value / catTotal) * 100).toFixed(1)) : 0,
        color: ch.itemStyle?.color || '#10B981',
      })),
    };
  });
});

function renderSunburst(chartInstance: echarts.ECharts, isDark: boolean) {
  if (!territoryStore.data?.sunburst) return;

  const tokens = getEChartsThemeTokens(isDark);
  const sunburstData = mode.value === 'sla'
    ? (territoryStore.data.sunburst_sla || territoryStore.data.sunburst)
    : (territoryStore.data.sunburst_plazos || territoryStore.data.sunburst);

  const totalAvisos = sunburstData.reduce((acc, curr) => {
    const sumChild = (curr.children || []).reduce((cAcc, cCurr) => cAcc + (cCurr.value || 0), 0);
    return acc + sumChild;
  }, 0);

  const option: any = {
    backgroundColor: 'transparent',
    tooltip: {
      backgroundColor: tokens.tooltipBg,
      borderColor: tokens.tooltipBorder,
      textStyle: {
        color: tokens.textColor,
        fontFamily: tokens.fontFamily,
        fontSize: 12,
      },
      formatter: (info: any) => formatSunburstTooltip(info, totalAvisos, tokens),
    },
    series: [
      {
        type: 'sunburst',
        data: sunburstData,
        radius: ['16%', '92%'],
        nodeClick: 'rootToNode',
        sort: undefined,
        emphasis: {
          focus: 'ancestor',
        },
        levels: [
          {},
          {
            // Nivel 1: Tipo de Aviso (Anillo Interior Satinado)
            r0: '18%',
            r: '52%',
            itemStyle: {
              borderWidth: 1.5,
              borderColor: isDark ? '#091522' : '#FFFFFF',
              borderRadius: 3,
              shadowBlur: 6,
              shadowOffsetY: 2,
              shadowColor: isDark ? 'rgba(0, 0, 0, 0.35)' : 'rgba(0, 0, 0, 0.08)',
            },
            emphasis: {
              itemStyle: {
                borderColor: '#F59E0B',
                borderWidth: 2.5,
                shadowBlur: 14,
                shadowOffsetY: 2,
                shadowColor: 'rgba(245, 158, 11, 0.4)',
              },
            },
            label: {
              show: false,
            },
          },
          {
            // Nivel 2: Prioridad / Plazos (Anillo Exterior Satinado)
            r0: '54%',
            r: '90%',
            itemStyle: {
              borderWidth: 1.5,
              borderColor: isDark ? '#091522' : '#FFFFFF',
              borderRadius: 2,
              shadowBlur: 6,
              shadowOffsetY: 2,
              shadowColor: isDark ? 'rgba(0, 0, 0, 0.3)' : 'rgba(0, 0, 0, 0.06)',
            },
            emphasis: {
              itemStyle: {
                borderColor: '#38BDF8',
                borderWidth: 2.5,
                shadowBlur: 12,
                shadowOffsetY: 2,
                shadowColor: 'rgba(56, 189, 248, 0.4)',
              },
            },
            label: {
              show: false,
            },
          },
        ],
      },
    ],
  };

  chartInstance.setOption(option, true);
}

const chartContainer = ref<HTMLDivElement | null>(null);
const { render } = useChart(chartContainer, renderSunburst);

watch(() => territoryStore.data, () => render(), { deep: true });
</script>

<template>
  <div class="sunburst-wrapper">
    <!-- Selector de Jerarquía Analítica -->
    <div class="sunburst-controls">
      <span class="mode-label">Jerarquía Externa:</span>
      <div class="mode-buttons">
        <button
          class="btn-mode"
          :class="{ active: mode === 'sla' }"
          @click="setMode('sla')"
          title="Ver distribución por cumplimiento: Cumple Plazo vs Excede Plazo"
        >
          <Target :size="13" /> Cumplimiento SLA
        </button>
        <button
          class="btn-mode"
          :class="{ active: mode === 'plazos' }"
          @click="setMode('plazos')"
          title="Ver desglose por plazos de resolución específicos"
        >
          <Clock :size="13" /> Plazos de Resolución
        </button>
      </div>
    </div>

    <!-- Canvas de 100% de Ancho -->
    <div ref="chartContainer" class="chart-canvas-full"></div>

    <!-- Barra de Identificación de Colores / Leyenda Interactiva Abajo -->
    <div class="chart-legend-container">
      <div class="chart-legend-header">
        <span>Distribución por Tipología</span>
        <span class="side-panel-hint">{{ mode === 'sla' ? 'Cumplimiento SLA' : 'Plazos de Resolución' }}</span>
      </div>

      <div class="chart-legend-grid">
        <div
          v-for="cat in sunburstCategories"
          :key="cat.name"
          class="legend-chip"
        >
          <span class="legend-chip-dot" :style="{ backgroundColor: cat.color }"></span>
          <span class="legend-chip-name">{{ cat.name }}</span>
          <span class="legend-chip-metric">
            {{ cat.value.toLocaleString() }}
            <small>({{ cat.pct }}%)</small>
          </span>

          <!-- Sub-indicadores de Cumplimiento -->
          <template v-if="mode === 'sla'">
            <span
              v-for="child in cat.children"
              :key="child.name"
              class="legend-chip-badge"
              :class="child.name.startsWith('Cumple') ? 'cumple' : 'excede'"
            >
              {{ child.name }}
            </span>
          </template>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.sunburst-wrapper {
  width: 100%;
  position: relative;
  display: flex;
  flex-direction: column;
}

.sunburst-controls {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 4px 8px 12px;
  flex-wrap: wrap;
}

.mode-label {
  font-size: 0.8rem;
  font-weight: 700;
  color: var(--text-secondary);
}

.mode-buttons {
  display: flex;
  gap: 8px;
}

.btn-mode {
  background: var(--bg-card);
  border: 1px solid var(--border-subtle);
  color: var(--text-secondary);
  font-size: 0.78rem;
  font-weight: 700;
  padding: 5px 12px;
  border-radius: 20px;
  cursor: pointer;
  transition: all var(--transition-fast);
}

.btn-mode:hover {
  border-color: var(--color-emerald);
  color: var(--text-primary);
}

.btn-mode.active {
  background: rgba(16, 185, 129, 0.15);
  border-color: var(--color-emerald);
  color: var(--color-emerald);
  box-shadow: 0 0 10px rgba(16, 185, 129, 0.25);
}

/* Card contenedora por categoría en el panel lateral */
.sunburst-cat-card {
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding-bottom: 6px;
  border-bottom: 1px dashed var(--border-subtle);
}

.sunburst-cat-card:last-child {
  border-bottom: none;
}

.cat-children-list {
  display: flex;
  flex-direction: column;
  gap: 3px;
  padding-left: 10px;
}

.cat-child-pill {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 6px;
  font-size: 0.68rem;
  color: var(--text-secondary);
  background: var(--bg-card);
  padding: 2px 6px;
  border-radius: 4px;
  border: 1px solid var(--border-subtle);
}

.child-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  flex-shrink: 0;
}

.child-name {
  flex: 1;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.child-count {
  font-weight: 700;
  color: var(--text-primary);
}
</style>


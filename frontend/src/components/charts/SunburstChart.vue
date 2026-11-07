<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import { Target, Clock } from 'lucide-vue-next';
import type * as echarts from 'echarts';
import { useTerritoryStore } from '../../stores/territoryStore';
import { useThemeStore } from '../../stores/themeStore';
import { getEChartsThemeTokens, getTipoColor, getSlaColors } from '../../constants/themeTokens';
import { useChart } from '../../composables/useChart';
import { formatSunburstTooltip } from '../../utils/chartFormatters';

const territoryStore = useTerritoryStore();
const themeStore = useThemeStore();
const mode = ref<'sla' | 'plazos'>('sla');

function setMode(m: 'sla' | 'plazos') {
  mode.value = m;
  render();
}

const sunburstCategories = computed(() => {
  if (!territoryStore.data?.sunburst) return [];
  const sla = getSlaColors(themeStore.isDark);
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
      color: getTipoColor(cat.name, themeStore.isDark),
      children: (cat.children || []).map((ch: any) => {
        const isCumple = String(ch.name).startsWith('Cumple');
        const isExcede = String(ch.name).startsWith('Excede');
        const neutralSlate = themeStore.isDark ? '#64748B' : '#94A3B8';
        return {
          name: ch.name,
          value: ch.value,
          pct: catTotal > 0 ? Number(((ch.value / catTotal) * 100).toFixed(1)) : 0,
          color: isCumple ? neutralSlate : isExcede ? sla.excede : (ch.itemStyle?.color || sla.neutral),
        };
      }),
    };
  });
});

function renderSunburst(chartInstance: echarts.ECharts, isDark: boolean) {
  if (!territoryStore.data?.sunburst) return;

  const tokens = getEChartsThemeTokens(isDark);
  const rawData = mode.value === 'sla'
    ? (territoryStore.data.sunburst_sla || territoryStore.data.sunburst)
    : (territoryStore.data.sunburst_plazos || territoryStore.data.sunburst);

  const sunburstData = rawData.map((cat) => ({
    ...cat,
    itemStyle: { color: getTipoColor(cat.name, isDark) },
    children: (cat.children || []).map((ch) => {
      const isCumple = String(ch.name).startsWith('Cumple');
      const isExcede = String(ch.name).startsWith('Excede');
      const neutralSlate = isDark ? '#64748B' : '#94A3B8';
      return {
        ...ch,
        itemStyle: {
          color: isCumple ? neutralSlate : isExcede ? tokens.sla.excede : (ch.itemStyle?.color || tokens.sla.neutral),
        },
      };
    }),
  }));

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
        radius: ['18%', '90%'],
        nodeClick: 'rootToNode',
        sort: undefined,
        emphasis: {
          focus: 'ancestor',
        },
        levels: [
          {},
          {
            r0: '18%',
            r: '52%',
            itemStyle: {
              borderWidth: 2,
              borderColor: tokens.cardBg,
              borderRadius: 3,
            },
            emphasis: {
              itemStyle: {
                borderColor: tokens.accentSelect,
                borderWidth: 2.5,
              },
            },
            label: {
              show: false,
            },
          },
          {
            r0: '54%',
            r: '90%',
            itemStyle: {
              borderWidth: 1.5,
              borderColor: tokens.cardBg,
              borderRadius: 2,
            },
            emphasis: {
              itemStyle: {
                borderColor: tokens.accentSelect,
                borderWidth: 2,
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

    <!-- Leyenda Abajo -->
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

      <!-- Guía Semántica de Interpretación Concéntrica -->
      <div class="sunburst-semantic-bar">
        <div class="sem-col">
          <span class="sem-title">Estructura Concéntrica:</span>
          <div class="sem-badges">
            <span class="sem-chip"><b>Núcleo Interior:</b> Causa técnica del aviso (55% Vegetación, Obras, Estructuras).</span>
            <span class="sem-chip" v-if="mode === 'sla'">
              <b>Anillo Exterior:</b>
              <span class="badge-dot-danger"></span> <b>Rojo Carmín:</b> Excede Plazo (Alerta SLA)
              <span class="badge-dot-neutral"></span> <b>Gris:</b> Cumple Plazo en norma
            </span>
            <span class="sem-chip" v-else>
              <b>Anillo Exterior:</b> Desglose por horizonte de tiempo comprometido (Semana a Años).
            </span>
          </div>
        </div>
        <div class="sem-col interaction">
          <span class="sem-title">Navegación:</span>
          <span class="sem-desc">Haz clic en cualquier segmento del círculo para aislar la tipología y profundizar en su tasa de cumplimiento.</span>
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
  display: inline-flex;
  align-items: center;
  gap: 5px;
  transition: all var(--transition-fast);
}

.btn-mode:hover {
  border-color: var(--color-brand);
  color: var(--text-primary);
}

.btn-mode.active {
  background: var(--color-brand-soft);
  border-color: var(--color-brand);
  color: var(--color-brand);
}

.sunburst-semantic-bar {
  display: grid;
  grid-template-columns: 1.6fr 1fr;
  gap: 12px;
  padding: 10px 14px;
  margin-top: 10px;
  background: var(--bg-subtle, rgba(241, 245, 249, 0.6));
  border: 1px solid var(--border-subtle, rgba(226, 232, 240, 0.8));
  border-radius: 8px;
  font-size: 0.76rem;
}

.sem-col {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.sem-title {
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  font-size: 0.68rem;
  color: var(--text-secondary);
}

.sem-badges {
  display: flex;
  flex-direction: column;
  gap: 3px;
  color: var(--text-primary);
}

.sem-chip {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  flex-wrap: wrap;
}

.badge-dot-danger {
  width: 9px;
  height: 9px;
  border-radius: 50%;
  background: #BE123C;
  display: inline-block;
}

.badge-dot-neutral {
  width: 9px;
  height: 9px;
  border-radius: 50%;
  background: #94A3B8;
  display: inline-block;
  margin-left: 6px;
}

.sem-desc {
  color: var(--text-secondary);
  line-height: 1.4;
}

@media (max-width: 768px) {
  .sunburst-semantic-bar {
    grid-template-columns: 1fr;
    gap: 8px;
  }
}
</style>

<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import type * as echarts from 'echarts';
import { useTerritoryStore } from '../../stores/territoryStore';
import { getEChartsThemeTokens } from '../../constants/themeTokens';
import { useChart } from '../../composables/useChart';
import { formatTreemapTooltip } from '../../utils/chartFormatters';

const territoryStore = useTerritoryStore();

function handleClick(params: any) {
  if (!params) return;
  const rawName = params.name || params.data?.name;
  if (!rawName) return;
  const cleanName = rawName.split(' (')[0].trim();

  if (!territoryStore.selectedDepto) {
    if (cleanName && cleanName !== 'Toda Colombia' && !cleanName.startsWith('CTE')) {
      territoryStore.drillIntoDepto(cleanName);
    }
  } else if (!territoryStore.selectedMunicipio) {
    territoryStore.drillIntoMunicipio(territoryStore.selectedDepto, cleanName);
  }
}

// Extraer items para botones laterales interactivos
const treemapItems = computed(() => {
  if (!territoryStore.data?.treemap) return [];
  const rawTreemap = territoryStore.data.treemap;
  const nodes = (rawTreemap.children && rawTreemap.children.length > 0) ? rawTreemap.children : [rawTreemap];
  const total = rawTreemap.value || nodes.reduce((acc, curr) => acc + (curr.value || 0), 0);
  return nodes.map((n) => {
    const val = n.value || 0;
    const pct = total > 0 ? Number(((val / total) * 100).toFixed(1)) : 0;
    return {
      name: n.name,
      value: val,
      pct,
      color: n.itemStyle?.color || '#0D9763',
    };
  });
});

function renderTreemap(chartInstance: echarts.ECharts, isDark: boolean) {
  if (!territoryStore.data?.treemap) return;

  const tokens = getEChartsThemeTokens(isDark);
  const rawTreemap = territoryStore.data.treemap;
  const nodes = (rawTreemap.children && rawTreemap.children.length > 0) ? rawTreemap.children : [rawTreemap];
  const totalValue = rawTreemap.value || nodes.reduce((acc, curr) => acc + (curr.value || 0), 0);

  const isNationalView = !territoryStore.selectedDepto && !territoryStore.selectedMunicipio;
  const isDeptoView = Boolean(territoryStore.selectedDepto && !territoryStore.selectedMunicipio);

  const option: echarts.EChartsOption = {
    backgroundColor: 'transparent',
    tooltip: {
      backgroundColor: tokens.tooltipBg,
      borderColor: tokens.tooltipBorder,
      textStyle: { color: tokens.textColor, fontFamily: tokens.fontFamily, fontSize: 13 },
      formatter: (info: any) =>
        formatTreemapTooltip(info, totalValue, isNationalView, isDeptoView, territoryStore.selectedDepto, tokens),
    },
    series: [
      {
        type: 'treemap',
        data: nodes,
        roam: false,
        nodeClick: false,
        breadcrumb: { show: false },
        itemStyle: {
          borderColor: isDark ? '#131D28' : '#FFFFFF',
          borderWidth: 2,
          gapWidth: 2,
          borderRadius: 4,
        },
        label: {
          show: true,
          position: 'inside',
          formatter: (params: any) => {
            const name = params.name || '';
            const val = params.value || 0;
            const pct = totalValue > 0 ? ((val / totalValue) * 100).toFixed(1) : '0';
            if (totalValue > 0 && (val / totalValue) < 0.025) {
              return `{name|${name}}`;
            }
            return `{name|${name}}\n{val|${Number(val).toLocaleString()} (${pct}%)}`;
          },
          rich: {
            name: {
              fontSize: 12,
              fontWeight: 700,
              color: '#FFFFFF',
              lineHeight: 18,
              align: 'center',
              textShadowColor: 'rgba(0, 0, 0, 0.75)',
              textShadowBlur: 4,
            },
            val: {
              fontSize: 10,
              fontWeight: 600,
              color: 'rgba(255, 255, 255, 0.95)',
              lineHeight: 14,
              align: 'center',
              textShadowColor: 'rgba(0, 0, 0, 0.75)',
              textShadowBlur: 3,
            },
          },
        },
      },
    ],
  };

  chartInstance.setOption(option, true);
}

const chartContainer = ref<HTMLDivElement | null>(null);
const { render } = useChart(chartContainer, renderTreemap, handleClick);

watch(() => territoryStore.data, () => render(), { deep: true });
</script>

<template>
  <div class="treemap-wrapper">
    <!-- Canvas de 100% de Ancho -->
    <div ref="chartContainer" class="chart-canvas-full"></div>

    <!-- Barra de Identificación de Colores / Leyenda Interactiva Abajo -->
    <div class="chart-legend-container">
      <div class="chart-legend-header">
        <span>{{ territoryStore.selectedDepto ? 'Municipios (' + territoryStore.selectedDepto + ')' : 'Departamentos de Cobertura' }}</span>
        <span class="side-panel-hint">{{ treemapItems.length }} zonas</span>
      </div>

      <div class="chart-legend-grid">
        <button
          v-for="item in treemapItems"
          :key="item.name"
          class="legend-chip"
          :class="{
            active: territoryStore.selectedMunicipio === item.name || (!territoryStore.selectedMunicipio && territoryStore.selectedDepto === item.name)
          }"
          :title="`Desglosar ${item.name}`"
          @click="handleClick({ name: item.name })"
        >
          <span class="legend-chip-dot" :style="{ backgroundColor: item.color }"></span>
          <span class="legend-chip-name">{{ item.name }}</span>
          <span class="legend-chip-metric">
            {{ item.value.toLocaleString() }}
            <small>({{ item.pct }}%)</small>
          </span>
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.treemap-wrapper {
  width: 100%;
  position: relative;
  display: flex;
  flex-direction: column;
}

.treemap-context-indicator {
  margin-bottom: 8px;
}

.indicator-badge {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  padding: 5px 12px;
  border-radius: var(--radius-sm, 6px);
  font-size: 0.8rem;
  font-weight: 500;
  width: 100%;
  box-sizing: border-box;
}

.indicator-badge.national {
  background: rgba(16, 185, 129, 0.12);
  color: var(--color-emerald, #0D9763);
  border: 1px solid rgba(16, 185, 129, 0.25);
}

.indicator-badge.depto {
  background: rgba(56, 189, 248, 0.12);
  color: #0284C7;
  border: 1px solid rgba(56, 189, 248, 0.25);
}

.indicator-badge.mpio {
  background: rgba(245, 158, 11, 0.12);
  color: #D97706;
  border: 1px solid rgba(245, 158, 11, 0.25);
}

.btn-indicator-back {
  background: rgba(0, 0, 0, 0.2);
  border: 1px solid rgba(255, 255, 255, 0.2);
  color: inherit;
  font-size: 0.75rem;
  font-weight: 700;
  padding: 3px 8px;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.2s ease;
  white-space: nowrap;
}

.btn-indicator-back:hover {
  background: rgba(0, 0, 0, 0.35);
  transform: translateY(-1px);
}
</style>


<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import type * as echarts from 'echarts';
import { useTerritoryStore } from '../../stores/territoryStore';
import { useThemeStore } from '../../stores/themeStore';
import { getEChartsThemeTokens, getSequentialTerritoryPalette } from '../../constants/themeTokens';
import { useChart } from '../../composables/useChart';
import { formatTreemapTooltip } from '../../utils/chartFormatters';

const territoryStore = useTerritoryStore();
const themeStore = useThemeStore();

function handleClick(params: any) {
  if (!params) return;
  const rawName = params.name || params.data?.name;
  if (!rawName) return;
  const cleanName = rawName.split(' (')[0].trim();

  if (!territoryStore.selectedDepto) {
    if (cleanName && cleanName !== 'Toda Colombia' && cleanName !== 'Red Nacional' && !cleanName.startsWith('Zona')) {
      territoryStore.drillIntoDepto(cleanName);
    }
  } else if (!territoryStore.selectedMunicipio) {
    territoryStore.drillIntoMunicipio(territoryStore.selectedDepto, cleanName);
  }
}

const treemapItems = computed(() => {
  if (!territoryStore.data?.treemap) return [];
  const palette = getSequentialTerritoryPalette(themeStore.isDark);
  const rawTreemap = territoryStore.data.treemap;
  const nodes = (rawTreemap.children && rawTreemap.children.length > 0) ? rawTreemap.children : [rawTreemap];
  const total = rawTreemap.value || nodes.reduce((acc, curr) => acc + (curr.value || 0), 0);
  return nodes.map((n, idx) => {
    const val = n.value || 0;
    const pct = total > 0 ? Number(((val / total) * 100).toFixed(1)) : 0;
    return {
      name: n.name,
      value: val,
      pct,
      color: palette[idx % palette.length],
    };
  });
});

function renderTreemap(chartInstance: echarts.ECharts, isDark: boolean) {
  if (!territoryStore.data?.treemap) return;

  const tokens = getEChartsThemeTokens(isDark);
  const palette = getSequentialTerritoryPalette(isDark);
  const rawTreemap = territoryStore.data.treemap;
  const rawNodes = (rawTreemap.children && rawTreemap.children.length > 0) ? rawTreemap.children : [rawTreemap];
  const totalValue = rawTreemap.value || rawNodes.reduce((acc, curr) => acc + (curr.value || 0), 0);

  const nodes = rawNodes.map((n, idx) => ({
    ...n,
    itemStyle: {
      color: palette[idx % palette.length],
    },
  }));

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
          borderColor: tokens.cardBg,
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
              textShadowColor: 'rgba(15, 23, 42, 0.65)',
              textShadowBlur: 3,
            },
            val: {
              fontSize: 10,
              fontWeight: 600,
              color: 'rgba(255, 255, 255, 0.92)',
              lineHeight: 14,
              align: 'center',
              textShadowColor: 'rgba(15, 23, 42, 0.65)',
              textShadowBlur: 2,
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

    <!-- Escala Secuencial de Concentración Territorial -->
    <div class="chart-legend-container">
      <div class="chart-legend-header">
        <span>{{ territoryStore.selectedDepto ? 'Municipios (' + territoryStore.selectedDepto + ')' : 'Departamentos (Escala Secuencial de Volumen)' }}</span>
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
</style>

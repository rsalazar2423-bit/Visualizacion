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
  return nodes.map((n: any, idx) => {
    const val = n.value || 0;
    const pct = total > 0 ? Number(((val / total) * 100).toFixed(1)) : 0;
    return {
      name: n.name,
      value: val,
      pct,
      cumple_pct: n.cumple_pct,
      vencidos: n.vencidos || 0,
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
            const ratio = totalValue > 0 ? (val / totalValue) : 0;
            // Si el cuadrante es muy pequeño (<1.8%), no ensuciar con texto mutilado ("Mo...", "Su...")
            if (ratio < 0.018) {
              return '';
            }
            if (ratio < 0.038) {
              return `{name|${name}}\n{val|${Number(val).toLocaleString()}}`;
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
    <!-- Canvas de 100% de Ancho y Altura Proporcional Ampliada -->
    <div ref="chartContainer" class="treemap-canvas"></div>

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
          :title="`Desglosar ${item.name} (${item.value} avisos, ${item.vencidos} vencidos)`"
          @click="handleClick({ name: item.name })"
        >
          <span class="legend-chip-dot" :style="{ backgroundColor: item.color }"></span>
          <span class="legend-chip-name">{{ item.name }}</span>
          <span class="legend-chip-metric">
            {{ item.value.toLocaleString() }}
            <small>({{ item.pct }}%)</small>
          </span>
          <span v-if="item.vencidos > 0" class="badge-venc-chip">
            ⚠ {{ item.vencidos }}
          </span>
        </button>
      </div>

      <!-- Guía Semántica Oficial del Treemap -->
      <div class="treemap-semantic-bar">
        <div class="sem-col">
          <span class="sem-title">Codificación Jerárquica:</span>
          <div class="sem-chips">
            <span class="sem-chip"><b>Superficie:</b> Proporcional a la concentración histórica de avisos (100% de la red).</span>
            <span class="sem-chip">
              <b>Gradiente Secuencial:</b>
              <span class="gradient-preview"></span>
              <span>Teal profundo (mayor volumen de intervenciones) a Pizarra neutro (volumen base).</span>
            </span>
          </div>
        </div>
        <div class="sem-col interaction">
          <span class="sem-title">Navegación Interactiva:</span>
          <span class="sem-desc">Haz clic en cualquier cuadrante para realizar <b>Drill-Down</b> (País ➔ Departamento ➔ Municipio) y auditar su bitácora en la pestaña de Auditoría.</span>
        </div>
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

.treemap-canvas {
  width: 100%;
  flex: 1;
  min-height: 0;
  position: relative;
}

.badge-venc-chip {
  background: var(--sla-danger-bg, rgba(190, 18, 60, 0.12));
  color: var(--sla-danger, #BE123C);
  font-size: 0.68rem;
  font-weight: 700;
  padding: 1px 5px;
  border-radius: 4px;
}

.treemap-semantic-bar {
  display: grid;
  grid-template-columns: 1.5fr 1fr;
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

.sem-chips {
  display: flex;
  flex-direction: column;
  gap: 4px;
  color: var(--text-primary);
}

.sem-chip {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  flex-wrap: wrap;
}

.gradient-preview {
  width: 50px;
  height: 8px;
  border-radius: 4px;
  background: linear-gradient(to right, #115E59, #0F766E, #0284C7, #2563EB, #94A3B8);
  display: inline-block;
}

.sem-desc {
  color: var(--text-secondary);
  line-height: 1.4;
}

@media (max-width: 768px) {
  .treemap-semantic-bar {
    grid-template-columns: 1fr;
    gap: 8px;
  }
}
</style>

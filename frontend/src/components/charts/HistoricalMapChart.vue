<script setup lang="ts">
import { ref, computed, watch, onMounted, onBeforeUnmount } from 'vue';
import { Compass } from 'lucide-vue-next';
import * as echarts from 'echarts';
import { useTerritoryStore } from '../../stores/territoryStore';
import { useThemeStore } from '../../stores/themeStore';
import { getEChartsThemeTokens } from '../../constants/themeTokens';
import MapLayerPills from '../map/MapLayerPills.vue';
import MapSideSummary from '../map/MapSideSummary.vue';
import MapTimelineBar from '../map/MapTimelineBar.vue';

const territoryStore = useTerritoryStore();
const themeStore = useThemeStore();

const chartContainer = ref<HTMLDivElement | null>(null);
let chartInstance: echarts.ECharts | null = null;
let resizeObserver: ResizeObserver | null = null;
let mapRegistered = false;

// Estado de la Línea de Tiempo Histórica
const timeMode = ref<'all' | 'cumulative' | 'single'>('cumulative');
const selectedYear = ref<number>(2023);
const isPlaying = ref<boolean>(false);
const layerFilter = ref<'all' | 'vencidos' | 'abiertos'>('all');
let playTimer: ReturnType<typeof setInterval> | null = null;

const availableYears = computed(() => {
  const yrs = territoryStore.data?.years_catalog || [];
  return yrs.length > 0 ? yrs : [2011, 2012, 2013, 2014, 2015, 2016, 2017, 2018, 2019, 2020, 2021, 2022, 2023];
});

const filteredPoints = computed(() => {
  const allPts = territoryStore.data?.map_points || [];
  const yr = selectedYear.value;

  return allPts.filter((p) => {
    if (timeMode.value === 'cumulative' && p.year > yr) return false;
    if (timeMode.value === 'single' && p.year !== yr) return false;

    if (layerFilter.value === 'vencidos') {
      return p.estado === 'Abierto' && p.cumplimiento !== 'Cumple Plazo';
    }
    if (layerFilter.value === 'abiertos') {
      return p.estado === 'Abierto';
    }
    return true;
  });
});

const yearStats = computed(() => {
  const pts = filteredPoints.value;
  let cumple = 0;
  let excedeCerrado = 0;
  let abiertoVencido = 0;
  let abiertoEnPlazo = 0;

  for (const p of pts) {
    if (p.estado === 'Abierto') {
      if (p.cumplimiento === 'Cumple Plazo') abiertoEnPlazo++;
      else abiertoVencido++;
    } else {
      if (p.cumplimiento === 'Cumple Plazo') cumple++;
      else excedeCerrado++;
    }
  }

  return {
    total: pts.length,
    cumple,
    excedeCerrado,
    abiertoVencido,
    abiertoEnPlazo,
  };
});

function togglePlay() {
  if (isPlaying.value) {
    stopPlay();
    return;
  }
  if (timeMode.value === 'all') {
    timeMode.value = 'cumulative';
  }
  const yrs = availableYears.value;
  const currentIdx = yrs.indexOf(selectedYear.value);
  if (currentIdx === -1 || currentIdx >= yrs.length - 1) {
    selectedYear.value = yrs[0] || 2011;
  }
  isPlaying.value = true;
  playTimer = setInterval(() => {
    const list = availableYears.value;
    const idx = list.indexOf(selectedYear.value);
    if (idx < list.length - 1) {
      selectedYear.value = list[idx + 1];
    } else {
      stopPlay();
    }
  }, 950);
}

function stopPlay() {
  isPlaying.value = false;
  if (playTimer) {
    clearInterval(playTimer);
    playTimer = null;
  }
}

function resetTimeline() {
  stopPlay();
  const yrs = availableYears.value;
  selectedYear.value = yrs[yrs.length - 1] || 2023;
  timeMode.value = 'cumulative';
  layerFilter.value = 'all';
}

function onSliderInput(yr: number) {
  if (timeMode.value === 'all') {
    timeMode.value = 'cumulative';
  }
  selectedYear.value = yr;
}

function selectYearTick(yr: number) {
  stopPlay();
  if (timeMode.value === 'all') {
    timeMode.value = 'cumulative';
  }
  selectedYear.value = yr;
}

function setMode(mode: 'all' | 'cumulative' | 'single') {
  if (mode === 'all') {
    stopPlay();
  }
  timeMode.value = mode;
}

async function ensureGeoJsonLoaded() {
  if (mapRegistered) return;
  try {
    const res = await fetch('/data/colombia_deptos.json');
    if (res.ok) {
      const geojson = await res.json();
      echarts.registerMap('colombia_red', geojson);
      mapRegistered = true;
    }
  } catch (err) {
    console.warn('No se pudo cargar colombia_deptos.json:', err);
  }
}

function renderMap() {
  if (!chartInstance || !mapRegistered) return;

  const isDark = themeStore.isDark;
  const tokens = getEChartsThemeTokens(isDark);
  const pts = filteredPoints.value;
  const lines = territoryStore.data?.map_lines || [];

  const cumplePoints: any[] = [];
  const atrasadoPoints: any[] = [];
  const vencidoPoints: any[] = [];

  for (const p of pts) {
    const item = {
      name: `${p.mpio} (${p.aviso})`,
      value: [p.lon, p.lat, p.dias_abierto],
      raw: p,
    };
    if (p.estado === 'Abierto' && p.cumplimiento !== 'Cumple Plazo') {
      vencidoPoints.push(item);
    } else if (p.cumplimiento === 'Cumple Plazo') {
      cumplePoints.push(item);
    } else {
      atrasadoPoints.push(item);
    }
  }

  const lineData = lines.map((l) => ({
    name: l.linea,
    coords: l.coords,
  }));

  const option: any = {
    backgroundColor: 'transparent',
    tooltip: {
      trigger: 'item',
      backgroundColor: tokens.tooltipBg,
      borderColor: tokens.tooltipBorder,
      textStyle: { color: tokens.textColor, fontFamily: tokens.fontFamily, fontSize: 12 },
      formatter: (params: any) => {
        if (params.seriesType === 'lines') {
          return `<div style="font-weight:700;color:${tokens.textColor};">Línea de Transmisión: ${params.name}</div>`;
        }
        const p = params.data?.raw;
        if (!p) {
          return `<div style="font-weight:700;color:${tokens.textColor};">${params.name}</div>`;
        }
        const statusColor = p.cumplimiento === 'Cumple Plazo' ? tokens.sla.cumple : tokens.sla.excede;
        return `
          <div style="font-weight:800;font-size:13px;margin-bottom:4px;color:${tokens.textColor};">
            Aviso #${p.aviso} · ${p.mpio} (${p.depto})
          </div>
          <div style="font-size:11px;color:${tokens.textSecondary};margin-bottom:6px;">
            Torre/Equipo: <b>${p.equipo}</b> · Línea: <b>${p.linea}</b> · Año: <b>${p.year}</b>
          </div>
          <div style="color:${tokens.textColor};font-size:12px;">Tipo: <b>${p.tipo}</b> (${p.prioridad})</div>
          <div style="color:${tokens.textColor};font-size:12px;">Estado: <b>${p.estado}</b> · Duración: <b>${p.dias_abierto} días</b></div>
          <div style="color:${statusColor};font-weight:700;margin-top:4px;">● ${p.cumplimiento}</div>
          <div style="font-size:10px;color:${tokens.accentSelect};margin-top:5px;">(Clic para filtrar departamento/municipio)</div>
        `;
      },
    },
    geo: {
      map: 'colombia_red',
      roam: true,
      scaleLimit: { min: 0.85, max: 12 },
      label: {
        show: true,
        color: isDark ? 'rgba(248, 250, 252, 0.72)' : 'rgba(15, 23, 42, 0.68)',
        fontSize: 10,
        fontWeight: 700,
        fontFamily: tokens.fontFamily,
      },
      itemStyle: {
        areaColor: isDark ? '#162032' : '#EEF2F6',
        borderColor: isDark ? '#334155' : '#CBD5E1',
        borderWidth: 1.2,
      },
      emphasis: {
        label: {
          color: tokens.textColor,
          fontWeight: 800,
        },
        itemStyle: {
          areaColor: isDark ? '#1E293B' : '#E2E8F0',
          borderColor: tokens.brandColor,
          borderWidth: 2,
        },
      },
    },
    series: [
      {
        name: 'Líneas de Transmisión',
        type: 'lines',
        coordinateSystem: 'geo',
        polyline: true,
        data: lineData,
        lineStyle: {
          color: isDark ? 'rgba(45, 212, 191, 0.28)' : 'rgba(13, 148, 136, 0.32)',
          width: 1.6,
          type: 'solid',
        },
        silent: false,
        zlevel: 1,
      },
      {
        name: 'Cumple Plazo',
        type: 'scatter',
        coordinateSystem: 'geo',
        symbolSize: 6.5,
        itemStyle: {
          color: tokens.sla.cumple,
          opacity: 0.78,
          borderColor: tokens.cardBg,
          borderWidth: 0.8,
        },
        data: cumplePoints,
        zlevel: 2,
      },
      {
        name: 'Cerrado Fuera de Plazo',
        type: 'scatter',
        coordinateSystem: 'geo',
        symbolSize: 6.5,
        itemStyle: {
          color: tokens.sla.warning,
          opacity: 0.78,
          borderColor: tokens.cardBg,
          borderWidth: 0.8,
        },
        data: atrasadoPoints,
        zlevel: 2,
      },
      {
        name: 'Abierto Vencido (Crítico)',
        type: 'effectScatter',
        coordinateSystem: 'geo',
        symbolSize: 8.5,
        showEffectOn: 'render',
        rippleEffect: {
          brushType: 'stroke',
          scale: 2.4,
          period: 4,
        },
        itemStyle: {
          color: tokens.sla.excede,
          opacity: 0.95,
          borderColor: '#FFFFFF',
          borderWidth: 1,
        },
        data: vencidoPoints,
        zlevel: 3,
      },
    ],
  };

  chartInstance.setOption(option, true);
}

onMounted(async () => {
  await ensureGeoJsonLoaded();
  if (chartContainer.value) {
    chartInstance = echarts.init(chartContainer.value);
    chartInstance.on('click', (params: any) => {
      const raw = params.data?.raw;
      if (raw?.depto) {
        if (!territoryStore.selectedDepto) {
          territoryStore.drillIntoDepto(raw.depto);
        } else if (!territoryStore.selectedMunicipio && raw.mpio) {
          territoryStore.drillIntoMunicipio(raw.depto, raw.mpio);
        }
      } else if (params.componentType === 'geo' && params.name) {
        territoryStore.drillIntoDepto(params.name);
      }
    });

    resizeObserver = new ResizeObserver(() => {
      chartInstance?.resize();
    });
    resizeObserver.observe(chartContainer.value);
    renderMap();
  }
});

onBeforeUnmount(() => {
  stopPlay();
  resizeObserver?.disconnect();
  chartInstance?.dispose();
});

watch(
  () => [territoryStore.data, themeStore.isDark, selectedYear.value, timeMode.value, layerFilter.value],
  () => {
    renderMap();
  },
  { deep: true }
);
</script>

<template>
  <div class="historical-map-card card">
    <div class="chart-header-block">
      <div class="header-main-row">
        <div class="title-with-badge">
          <span class="badge">
            <Compass :size="13" /> Georreferenciación & Evolución Histórica
          </span>
          <h3 class="card-title">
            Mapa Geográfico de Torres, Líneas de Transmisión y Avisos (2008 – 2023)
          </h3>
        </div>

        <!-- Filtro de Capas Semánticas (Componente SRP) -->
        <MapLayerPills
          v-model:layer-filter="layerFilter"
          :total-count="yearStats.total"
          :open-count="yearStats.abiertoVencido + yearStats.abiertoEnPlazo"
          :overdue-count="yearStats.abiertoVencido"
        />
      </div>

      <p class="chart-reseña">
        Recorrido espacial e histórico sobre las 44 líneas de transmisión y 5.409 torres georreferenciadas. Usa el reproductor inferior para observar cómo evolucionó la concentración territorial de incidentes y dónde se acumulan los avisos abiertos vencidos.
      </p>
    </div>

    <!-- Lienzo del Mapa + Panel de Resumen Temporal (Componente SRP) -->
    <div class="map-body-grid">
      <div ref="chartContainer" class="map-canvas"></div>

      <MapSideSummary
        :time-mode="timeMode"
        :selected-year="selectedYear"
        :stats="yearStats"
        :transmission-lines-count="(territoryStore.data?.map_lines || []).length"
      />
    </div>

    <!-- Controlador de Línea de Tiempo Histórica (Componente SRP) -->
    <MapTimelineBar
      :is-playing="isPlaying"
      :time-mode="timeMode"
      :selected-year="selectedYear"
      :available-years="availableYears"
      @toggle-play="togglePlay"
      @reset-timeline="resetTimeline"
      @set-mode="setMode"
      @select-year="selectYearTick"
      @slider-input="onSliderInput"
    />
  </div>
</template>

<style scoped>
.historical-map-card {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.map-body-grid {
  display: grid;
  grid-template-columns: 1fr 290px;
  gap: 16px;
  align-items: stretch;
}

.map-canvas {
  width: 100%;
  height: 460px;
  background: var(--bg-subtle);
  border-radius: var(--radius-md);
  border: 1px solid var(--border-subtle);
}

@media (max-width: 960px) {
  .map-body-grid {
    grid-template-columns: 1fr;
  }
}
</style>

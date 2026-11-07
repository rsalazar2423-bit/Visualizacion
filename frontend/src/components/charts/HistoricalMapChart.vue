<script setup lang="ts">
import { ref, computed, watch, onMounted, onBeforeUnmount, nextTick } from 'vue';
import { Compass, Maximize2 } from 'lucide-vue-next';
import * as echarts from 'echarts';
import { useTerritoryStore } from '../../stores/territoryStore';
import { useThemeStore } from '../../stores/themeStore';
import { getEChartsThemeTokens } from '../../constants/themeTokens';
import MapLayerPills from '../map/MapLayerPills.vue';
import MapSideSummary from '../map/MapSideSummary.vue';
import MapTimelineBar from '../map/MapTimelineBar.vue';
import ChartModal from '../common/ChartModal.vue';
import { getAdaptiveGeoView } from '../../utils/geoBounds';

const territoryStore = useTerritoryStore();
const themeStore = useThemeStore();

const chartContainer = ref<HTMLDivElement | null>(null);
const modalChartContainer = ref<HTMLDivElement | null>(null);
let chartInstance: echarts.ECharts | null = null;
let modalChartInstance: echarts.ECharts | null = null;
let resizeObserver: ResizeObserver | null = null;
let modalResizeObserver: ResizeObserver | null = null;
let mapRegistered = false;

// Estado de Modal de Ampliación
const isModalOpen = ref(false);

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

const OPERATIVE_DEPTOS = [
  'Bogotá, D.C.',
  'Boyacá',
  'Caldas',
  'Cauca',
  'Cundinamarca',
  'Huila',
  'Nariño',
  'Risaralda',
  'Tolima',
  'Valle Del Cauca',
];

function getActiveGeoView(): { center: [number, number]; zoom: number } {
  // Pasamos los puntos de torres del departamento seleccionado para enfocar exactamente el corredor
  const depto = territoryStore.selectedDepto;
  if (!depto || depto === 'Todos') {
    return getAdaptiveGeoView(null);
  }
  const allPts = territoryStore.data?.map_points || [];
  const deptoPts = allPts.filter((p) => p.depto === depto);
  return getAdaptiveGeoView(depto, deptoPts);
}

function buildMapOption(tokens: any, isDark: boolean) {
  const activeGeoView = getActiveGeoView();
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

  return {
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
      center: activeGeoView.center,
      zoom: activeGeoView.zoom,
      aspectScale: 0.88,
      label: {
        show: false,
      },
      itemStyle: {
        areaColor: isDark ? '#0F172A' : '#F8FAFC',
        borderColor: isDark ? '#1E293B' : '#E2E8F0',
        borderWidth: 0.8,
      },
      emphasis: {
        label: {
          show: true,
          color: tokens.textColor,
          fontWeight: 700,
          fontSize: 11,
        },
        itemStyle: {
          areaColor: isDark ? '#1E293B' : '#E2E8F0',
          borderColor: isDark ? '#38BDF8' : '#1D4ED8',
          borderWidth: 1.5,
        },
      },
      regions: OPERATIVE_DEPTOS.map((name) => {
        const isSelected = territoryStore.selectedDepto === name;
        return {
          name,
          itemStyle: {
            areaColor: isSelected
              ? (isDark ? '#1E293B' : '#E8EEF5') // Plano técnico cartográfico con contraste nítido
              : (isDark ? '#0F172A' : '#F8FAFC'),
            borderColor: isSelected
              ? (isDark ? '#38BDF8' : '#1D4ED8') // Borde azul corporativo nítido de ingeniería
              : (isDark ? '#334155' : '#CBD5E1'),
            borderWidth: isSelected ? 2.2 : 0.8,
          },
          emphasis: {
            itemStyle: {
              areaColor: isDark ? '#1E293B' : '#E2E8F0',
              borderColor: isDark ? '#38BDF8' : '#1D4ED8',
              borderWidth: 2,
            },
          },
        };
      }),
    },
    series: [
      {
        name: 'Líneas de Transmisión',
        type: 'lines',
        coordinateSystem: 'geo',
        polyline: true,
        data: lineData,
        lineStyle: {
          color: isDark ? '#60A5FA' : '#475569', // Trazo de alta tensión balanceado
          width: 2.0,
          opacity: 0.65,
          type: 'solid',
        },
        silent: false,
        zlevel: 1,
      },
      {
        name: 'Cumple Plazo (A Tiempo)',
        type: 'scatter',
        coordinateSystem: 'geo',
        symbolSize: 8, // Nodo visible y nítido para contraste espacial inmediato
        itemStyle: {
          color: isDark ? '#10B981' : '#059669', // Verde Esmeralda / Teal de Operación Conforme (BIEN)
          opacity: 0.9,
          borderColor: '#FFFFFF',
          borderWidth: 1.4,
          shadowColor: isDark ? 'rgba(16, 185, 129, 0.4)' : 'rgba(5, 150, 105, 0.35)',
          shadowBlur: 5,
        },
        emphasis: {
          scale: true,
          itemStyle: {
            borderColor: '#FFFFFF',
            borderWidth: 2.2,
            shadowBlur: 8,
            shadowColor: isDark ? 'rgba(16, 185, 129, 0.7)' : 'rgba(5, 150, 105, 0.6)',
          },
        },
        data: cumplePoints,
        zlevel: 2,
      },
      {
        name: 'Cerrados con Retraso',
        type: 'scatter',
        coordinateSystem: 'geo',
        symbolSize: 8.5, // Legibilidad inmediata en el corredor (aumentado de 5.5)
        itemStyle: {
          color: isDark ? '#F59E0B' : '#D97706', // Ámbar cálido visible
          opacity: 0.9,
          borderColor: '#FFFFFF',
          borderWidth: 1.2,
          shadowColor: 'rgba(217, 119, 6, 0.35)',
          shadowBlur: 4,
        },
        emphasis: {
          scale: true,
          itemStyle: {
            borderColor: '#FFFFFF',
            borderWidth: 2.2,
            shadowBlur: 8,
            shadowColor: 'rgba(217, 119, 6, 0.6)',
          },
        },
        data: atrasadoPoints,
        zlevel: 3,
      },
      {
        name: 'Abiertos Vencidos (Alerta)',
        type: 'effectScatter', // Efecto de radar/pulsación continua para alerta crítica
        coordinateSystem: 'geo',
        showEffectOn: 'render',
        rippleEffect: {
          brushType: 'stroke',
          scale: 3.2,
          period: 3,
        },
        symbolSize: 12, // Gran visibilidad focal prioritaria (aumentado de 8)
        itemStyle: {
          color: tokens.sla.excede, // Carmín Ladrillo de Alarma
          borderColor: '#FFFFFF',
          borderWidth: 2,
          shadowColor: 'rgba(190, 18, 60, 0.75)',
          shadowBlur: 10,
        },
        emphasis: {
          scale: true,
          itemStyle: {
            borderColor: '#FFFFFF',
            borderWidth: 2.5,
            shadowBlur: 14,
            shadowColor: 'rgba(190, 18, 60, 0.9)',
          },
        },
        data: vencidoPoints,
        zlevel: 4,
      },
    ],
  };
}

function renderMap(preserveView = false) {
  if (!chartInstance || !mapRegistered) return;
  const isDark = themeStore.isDark;
  const tokens = getEChartsThemeTokens(isDark);
  const option = buildMapOption(tokens, isDark);
  
  if (preserveView && option.geo) {
    // Si solo estamos reproduciendo el año, no reseteamos el zoom/pan del usuario
    delete (option.geo as any).center;
    delete (option.geo as any).zoom;
  }
  
  chartInstance.setOption(option, !preserveView);
}

function renderModalMap(preserveView = false) {
  if (!modalChartInstance || !mapRegistered) return;
  const isDark = themeStore.isDark;
  const tokens = getEChartsThemeTokens(isDark);
  const option = buildMapOption(tokens, isDark);
  
  if (preserveView && option.geo) {
    delete (option.geo as any).center;
    delete (option.geo as any).zoom;
  }
  
  modalChartInstance.setOption(option, !preserveView);
}

function attachChartEvents(inst: echarts.ECharts) {
  inst.on('click', (params: any) => {
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
}

function openModal() {
  isModalOpen.value = true;
  nextTick(() => {
    if (modalChartContainer.value && !modalChartInstance) {
      modalChartInstance = echarts.init(modalChartContainer.value);
      attachChartEvents(modalChartInstance);
      modalResizeObserver = new ResizeObserver(() => {
        modalChartInstance?.resize();
      });
      modalResizeObserver.observe(modalChartContainer.value);
    }
    renderModalMap();
  });
}

function closeModal() {
  isModalOpen.value = false;
  if (modalResizeObserver) {
    modalResizeObserver.disconnect();
    modalResizeObserver = null;
  }
  if (modalChartInstance) {
    modalChartInstance.dispose();
    modalChartInstance = null;
  }
}

onMounted(async () => {
  await ensureGeoJsonLoaded();
  if (chartContainer.value) {
    chartInstance = echarts.init(chartContainer.value);
    attachChartEvents(chartInstance);

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
  closeModal();
});

// Vigilante del departamento: si cambia el departamento o el tema, se actualiza el encuadre completo (zoom/centro)
watch(
  () => [territoryStore.selectedDepto, territoryStore.selectedMunicipio, themeStore.isDark],
  () => {
    renderMap(false);
    if (isModalOpen.value) {
      renderModalMap(false);
    }
  }
);

// Vigilante de la línea de tiempo (reproductor, años, filtros de capas):
// preserveView = true -> preserva el zoom y el encuadre para que NO se reinicie ni se reduzca al reproducir
watch(
  () => [territoryStore.data, selectedYear.value, timeMode.value, layerFilter.value],
  () => {
    renderMap(true);
    if (isModalOpen.value) {
      renderModalMap(true);
    }
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

        <div class="header-actions-row">
          <!-- Botón de Ampliación de Gráfica (Modal SRP) -->
          <button
            class="btn-expand"
            title="Ampliar mapa a pantalla completa"
            @click="openModal"
          >
            <Maximize2 :size="14" />
            <span>Ampliar</span>
          </button>

          <!-- Filtro de Capas Semánticas (Componente SRP) -->
          <MapLayerPills
            v-model:layer-filter="layerFilter"
            :total-count="yearStats.total"
            :open-count="yearStats.abiertoVencido + yearStats.abiertoEnPlazo"
            :overdue-count="yearStats.abiertoVencido"
          />
        </div>
      </div>

      <p class="chart-reseña">
        Recorrido espacial e histórico sobre las 44 líneas de transmisión y 5.409 torres georreferenciadas. La silueta nacional completa sitúa los corredores operativos; haz zoom o usa el reproductor para auditar la evolución de avisos sin saturación visual.
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

    <!-- Modal de Visualización a Gran Escala -->
    <ChartModal
      :is-open="isModalOpen"
      title="Mapa Geográfico y Red de Transmisión (2008 – 2023)"
      subtitle="Visualización ampliada de alta fidelidad con interactividad de zoom, arrastre y filtros temporales."
      @close="closeModal"
    >
      <div class="modal-map-wrapper">
        <div class="modal-map-body-grid">
          <div ref="modalChartContainer" class="modal-map-canvas"></div>
          <MapSideSummary
            :time-mode="timeMode"
            :selected-year="selectedYear"
            :stats="yearStats"
            :transmission-lines-count="(territoryStore.data?.map_lines || []).length"
          />
        </div>
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
    </ChartModal>
  </div>
</template>

<style scoped>
.historical-map-card {
  display: flex;
  flex-direction: column;
  gap: 8px;
  height: 100%;
  min-height: 0;
}

.header-actions-row {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}

.btn-expand {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  background: var(--bg-card);
  color: var(--text-primary);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-sm);
  font-size: 0.8rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.15s ease;
}

.btn-expand:hover {
  background: var(--bg-hover);
  border-color: var(--brand-primary);
  color: var(--brand-primary);
}

.map-body-grid {
  display: grid;
  grid-template-columns: 1fr 290px;
  gap: 12px;
  flex: 1;
  min-height: 0;
  align-items: stretch;
}

.map-canvas {
  width: 100%;
  height: 100%;
  min-height: 380px;
  background: var(--bg-subtle);
  border-radius: var(--radius-md);
  border: 1px solid var(--border-subtle);
}

/* Estilos dentro del Modal */
.modal-map-wrapper {
  display: flex;
  flex-direction: column;
  gap: 14px;
  height: 100%;
}

.modal-map-body-grid {
  display: grid;
  grid-template-columns: 1fr 310px;
  gap: 16px;
  flex: 1;
  min-height: 520px;
}

.modal-map-canvas {
  width: 100%;
  height: 100%;
  min-height: 520px;
  background: var(--bg-subtle);
  border-radius: var(--radius-md);
  border: 1px solid var(--border-subtle);
}

@media (max-width: 960px) {
  .map-body-grid,
  .modal-map-body-grid {
    grid-template-columns: 1fr;
  }
}
</style>

import { onMounted, onUnmounted, watch, type Ref } from 'vue';
import * as echarts from 'echarts';
import { useThemeStore } from '../stores/themeStore';

/**
 * Composable reutilizable para gestión del ciclo de vida, temas y redimensionamiento de ECharts.
 * Elimina código duplicado y anidamientos en los componentes visuales.
 */
export function useChart(
  containerRef: Ref<HTMLDivElement | null>,
  renderFn: (instance: echarts.ECharts, isDark: boolean) => void,
  onClick?: (params: any) => void,
  onEvents?: Record<string, (params: any) => void>
) {
  let chartInstance: echarts.ECharts | null = null;
  let resizeObserver: ResizeObserver | null = null;
  const themeStore = useThemeStore();

  function init() {
    if (!containerRef.value) return;

    if (chartInstance) {
      chartInstance.dispose();
    }

    chartInstance = echarts.init(containerRef.value);

    if (onClick) {
      chartInstance.on('click', onClick);
    }

    if (onEvents) {
      for (const [eventName, handler] of Object.entries(onEvents)) {
        chartInstance.on(eventName, handler);
      }
    }

    render();
  }

  function render() {
    if (!chartInstance) return;
    renderFn(chartInstance, themeStore.isDark);
  }

  function resize() {
    chartInstance?.resize();
  }

  onMounted(() => {
    init();

    if (containerRef.value && typeof ResizeObserver !== 'undefined') {
      resizeObserver = new ResizeObserver(() => resize());
      resizeObserver.observe(containerRef.value);
    } else {
      window.addEventListener('resize', resize);
    }
  });

  onUnmounted(() => {
    if (resizeObserver) {
      resizeObserver.disconnect();
    } else {
      window.removeEventListener('resize', resize);
    }
    chartInstance?.dispose();
    chartInstance = null;
  });

  watch(() => themeStore.isDark, () => init());

  return {
    getChartInstance: () => chartInstance,
    render,
    resize,
  };
}

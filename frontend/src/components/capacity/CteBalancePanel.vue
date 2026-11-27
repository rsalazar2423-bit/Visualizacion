<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted } from 'vue';
import { Scale } from 'lucide-vue-next';
import * as echarts from 'echarts';
import { getCoordinatorWorkspace } from '../../services/api';
import type { CoordinatorWorkspaceResponse } from '../../types/models';
import { useThemeStore } from '../../stores/themeStore';

const props = defineProps<{
  cte: string;
  depto: string;
}>();

const themeStore = useThemeStore();
const data = ref<CoordinatorWorkspaceResponse | null>(null);
const loading = ref(false);
const chartEl = ref<HTMLElement | null>(null);
let chartInstance: echarts.ECharts | null = null;

async function fetchBalance() {
  loading.value = true;
  try {
    data.value = await getCoordinatorWorkspace({ cte: props.cte, depto: props.depto });
  } finally {
    loading.value = false;
  }
}

const chartOption = computed(() => {
  if (!data.value) return {};
  const isDark = themeStore.isDark;
  const textPrimary = isDark ? '#f1f5f9' : '#0f172a';
  const textSecondary = isDark ? '#cbd5e1' : '#475569';
  const textMuted = isDark ? '#94a3b8' : '#64748b';
  const splitLine = isDark ? 'rgba(148,163,184,0.16)' : '#e2e8f0';
  const tooltipBg = isDark ? '#0f172a' : '#ffffff';
  const tooltipBorder = isDark ? '#334155' : '#e2e8f0';
  const rows = [...data.value.cte_balance].reverse();

  return {
    backgroundColor: 'transparent',
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'shadow' },
      backgroundColor: tooltipBg,
      borderColor: tooltipBorder,
      textStyle: { color: textPrimary, fontSize: 12 },
      formatter: (params: any[]) => {
        const idx = params[0]?.dataIndex ?? 0;
        const r = rows[idx];
        if (!r) return '';
        return `
          <div style="font-weight:700;margin-bottom:4px;">${r.region}</div>
          <div style="font-size:11px;opacity:0.85;margin-bottom:6px;">${r.trabajo_principal || 'Mixto'}</div>
          <div>Abiertos: <b>${r.abiertos.toLocaleString('es-CO')}</b></div>
          <div>Vencidos: <b style="color:#e11d48">${r.vencidos.toLocaleString('es-CO')}</b></div>
          <div>Tasa Cierre: <b>${r.tasa_cierre_pct.toFixed(1)}%</b></div>
          <div>Carga Equipo: <b style="color:${(r.carga_pct ?? 0) > 100 ? '#e11d48' : '#10b981'}">${r.carga_pct ?? 0}%</b></div>
        `;
      },
    },
    legend: {
      top: 0,
      left: 0,
      itemWidth: 10,
      itemHeight: 10,
      textStyle: { color: textSecondary, fontSize: 11 },
      data: ['Abiertos (Total)', 'Abiertos Vencidos'],
    },
    grid: { left: 115, right: 95, top: 34, bottom: 24 },
    xAxis: {
      type: 'value',
      splitLine: { lineStyle: { color: splitLine, type: 'dashed' } },
      axisLabel: { color: textMuted, fontSize: 11 },
    },
    yAxis: {
      type: 'category',
      data: rows.map((r) => r.region),
      axisLine: { show: false },
      axisTick: { show: false },
      axisLabel: { color: textPrimary, fontSize: 11.5, fontWeight: 600 },
    },
    series: [
      {
        name: 'Abiertos (Total)',
        type: 'bar',
        barMaxWidth: 16,
        itemStyle: { color: isDark ? '#38bdf8' : '#0284c7', borderRadius: [0, 4, 4, 0] },
        data: rows.map((r) => r.abiertos),
      },
      {
        name: 'Abiertos Vencidos',
        type: 'bar',
        barMaxWidth: 16,
        itemStyle: { color: '#e11d48', borderRadius: [0, 4, 4, 0] },
        label: {
          show: true,
          position: 'right',
          color: textSecondary,
          fontSize: 11,
          fontWeight: 600,
          formatter: (p: any) => {
            const r = rows[p.dataIndex];
            return r ? `Carga ${r.carga_pct ?? 0}%` : '';
          },
        },
        data: rows.map((r) => r.vencidos),
      },
    ],
  };
});

function renderChart() {
  if (!chartEl.value || !data.value) return;
  if (!chartInstance) {
    chartInstance = echarts.init(chartEl.value);
  }
  chartInstance.setOption(chartOption.value, true);
}

function handleResize() {
  chartInstance?.resize();
}

watch(() => [props.cte, props.depto], fetchBalance);
watch([data, () => themeStore.isDark], () => {
  setTimeout(renderChart, 0);
});

onMounted(async () => {
  window.addEventListener('resize', handleResize);
  await fetchBalance();
});

onUnmounted(() => {
  window.removeEventListener('resize', handleResize);
  chartInstance?.dispose();
  chartInstance = null;
});
</script>

<template>
  <div v-if="data" class="balance-page">
    <article class="card balance-card">
      <header class="card-head">
        <div class="head-title">
          <Scale :size="15" class="icon-brand" />
          <h3>Carga Operativa y Especialidad por CTE / Región</h3>
        </div>
        <span class="head-badge">{{ data.cte_balance.length }} regiones</span>
      </header>

      <div ref="chartEl" class="chart-box"></div>
    </article>

    <article class="card balance-card">
      <header class="card-head">
        <div class="head-title">
          <Scale :size="15" class="icon-brand" />
          <h3>Detalle de Equilibrio Operativo (Ingresos vs. Cierres)</h3>
        </div>
      </header>

      <div class="mini-table-wrap">
        <table class="mini-table">
          <thead>
            <tr>
              <th>Región / CTE</th>
              <th>Trabajo Principal</th>
              <th class="num">Ingresados</th>
              <th class="num">Cerrados</th>
              <th class="num">Tasa Cierre</th>
              <th class="num">Abiertos</th>
              <th class="num">Vencidos</th>
              <th>Carga Equipo</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="row in data.cte_balance" :key="row.region">
              <td class="region-cell">{{ row.region }}</td>
              <td>
                <span class="type-pill">{{ row.trabajo_principal || 'Mixto' }}</span>
              </td>
              <td class="num">{{ row.ingresados.toLocaleString('es-CO') }}</td>
              <td class="num">{{ row.cerrados.toLocaleString('es-CO') }}</td>
              <td class="num">
                <span
                  class="rate-pill"
                  :class="row.tasa_cierre_pct >= 90 ? 'rate-ok' : row.tasa_cierre_pct >= 75 ? 'rate-warn' : 'rate-bad'"
                >
                  {{ row.tasa_cierre_pct.toFixed(1) }}%
                </span>
              </td>
              <td class="num">{{ row.abiertos.toLocaleString('es-CO') }}</td>
              <td class="num overdue-txt">{{ row.vencidos.toLocaleString('es-CO') }}</td>
              <td>
                <div class="workload-cell" :title="`Carga estimada: ${row.carga_pct ?? 0}% respecto a su ritmo anual de cierres`">
                  <div class="workload-track">
                    <div
                      class="workload-fill"
                      :class="(row.carga_pct ?? 0) > 100 ? 'wl-bad' : (row.carga_pct ?? 0) >= 80 ? 'wl-warn' : 'wl-ok'"
                      :style="{ width: `${Math.min(100, row.carga_pct ?? 0)}%` }"
                    ></div>
                  </div>
                  <span
                    class="workload-pct"
                    :class="(row.carga_pct ?? 0) > 100 ? 'wl-txt-bad' : (row.carga_pct ?? 0) >= 80 ? 'wl-txt-warn' : 'wl-txt-ok'"
                  >
                    {{ row.carga_pct ?? 0 }}%
                  </span>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </article>
  </div>
</template>

<style scoped>
.balance-page {
  display: flex;
  flex-direction: column;
  gap: 12px;
  height: 100%;
  overflow-y: auto;
}

.balance-card {
  padding: 12px 16px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.card-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}

.head-title {
  display: flex;
  align-items: center;
  gap: 7px;
}

.head-title h3 {
  margin: 0;
  font-size: 0.92rem;
  font-weight: 700;
  color: var(--text-primary);
}

.icon-brand {
  color: var(--color-brand);
}

.head-badge {
  font-size: 0.72rem;
  font-weight: 700;
  padding: 2px 8px;
  border-radius: 999px;
  background: var(--bg-soft, #f1f5f9);
  color: var(--text-secondary);
  border: 1px solid var(--border-subtle, #e2e8f0);
}

.chart-box {
  width: 100%;
  height: 260px;
}

.mini-table-wrap {
  overflow-x: auto;
}

.mini-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.78rem;
}

.mini-table th {
  text-align: left;
  font-weight: 600;
  color: var(--text-muted);
  padding: 6px 8px;
  border-bottom: 1px solid var(--border-subtle, #e2e8f0);
}

.mini-table td {
  padding: 7px 8px;
  border-bottom: 1px solid var(--border-subtle, #f1f5f9);
  color: var(--text-primary);
}

.mini-table th.num,
.mini-table td.num {
  text-align: right;
  font-variant-numeric: tabular-nums;
}

.region-cell {
  font-weight: 700;
}

.overdue-txt {
  color: #e11d48;
  font-weight: 700;
}

.rate-pill {
  display: inline-block;
  padding: 2px 7px;
  border-radius: 999px;
  font-size: 0.72rem;
  font-weight: 700;
}

.rate-ok { background: rgba(16, 185, 129, 0.14); color: #059669; }
.rate-warn { background: rgba(245, 158, 11, 0.16); color: #d97706; }
.rate-bad { background: rgba(225, 29, 72, 0.14); color: #e11d48; }

.type-pill {
  display: inline-block;
  padding: 0.15rem 0.5rem;
  border-radius: 999px;
  font-size: 0.72rem;
  font-weight: 600;
  background: var(--bg-soft, #f1f5f9);
  color: var(--text-secondary, #475569);
  border: 1px solid var(--border-subtle, #e2e8f0);
  white-space: nowrap;
}

.workload-cell {
  display: flex;
  align-items: center;
  gap: 0.45rem;
  min-width: 100px;
}

.workload-track {
  flex: 1;
  height: 6px;
  border-radius: 999px;
  background: var(--bg-soft, #e2e8f0);
  overflow: hidden;
}

.workload-fill {
  height: 100%;
  border-radius: 999px;
  transition: width 0.25s ease;
}

.wl-ok { background: #10b981; }
.wl-warn { background: #f59e0b; }
.wl-bad { background: #e11d48; }

.workload-pct {
  font-size: 0.75rem;
  font-weight: 700;
  font-variant-numeric: tabular-nums;
  min-width: 38px;
  text-align: right;
}

.wl-txt-ok { color: #059669; }
.wl-txt-warn { color: #d97706; }
.wl-txt-bad { color: #e11d48; }
</style>

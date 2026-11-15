<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { RefreshCw, ArrowRight } from 'lucide-vue-next';
import { apiService } from '../services/api';
import type { PortadaKpis, ActionableInsightsResponse, FilterOptionsResponse } from '../types/models';
import KpiCard from '../components/common/KpiCard.vue';

const loading = ref(true);
const kpis = ref<PortadaKpis | null>(null);
const insights = ref<ActionableInsightsResponse | null>(null);
const filterOptions = ref<FilterOptionsResponse>({
  ctes: ['Todos'],
  departamentos: ['Todos'],
  municipios: [],
  tipos: ['Todos'],
});

const selectedCte = ref('Todos');
const selectedDepto = ref('Todos');
const selectedTipo = ref('Todos');

const topParetoLineas = computed(() => {
  const list = insights.value?.pareto_lineas || [];
  const top8 = list.slice(0, 8);
  const maxVencidos = top8[0]?.vencidos || 1;
  return top8.map((item) => ({
    ...item,
    barWidth: Number(((item.vencidos / maxVencidos) * 100).toFixed(1)),
  }));
});

const topCriticalList = computed(() => {
  return (insights.value?.top_critical_notices || []).slice(0, 15);
});

const overOneYearStats = computed(() => {
  const buckets = insights.value?.aging_buckets || [];
  const oldBuckets = buckets.filter((b) => b.label.includes('1 – 3') || b.label.includes('> 3'));
  const count = oldBuckets.reduce((acc, b) => acc + b.count, 0);
  const total = insights.value?.total_vencidos || 0;
  const pct = total > 0 ? Number(((count / total) * 100).toFixed(1)) : 0;
  const topCum = topParetoLineas.value[topParetoLineas.value.length - 1]?.cum_pct ?? 0;
  return { count, pct, topCum, lineCount: topParetoLineas.value.length };
});

const recurrencePct = computed(() => {
  const total = kpis.value?.total_avisos || 0;
  const rec = insights.value?.recurrent_notices_count || 0;
  return total > 0 ? Number(((rec / total) * 100).toFixed(1)) : 0;
});

function formatOverdueYears(days: number): string {
  if (days >= 365) {
    return `${(days / 365).toFixed(1)} años vencido`;
  }
  return `+${days.toLocaleString()}d vencido`;
}

async function refreshAll() {
  loading.value = true;
  try {
    const params = {
      cte: selectedCte.value,
      depto: selectedDepto.value,
      tipo: selectedTipo.value,
    };
    const [optsRes, portadaRes, insightsRes] = await Promise.all([
      apiService.getFilterOptions(selectedCte.value, selectedDepto.value),
      apiService.getPortadaKpis(params),
      apiService.getActionableInsights(params),
    ]);
    filterOptions.value = optsRes;
    kpis.value = portadaRes;
    insights.value = insightsRes;
  } catch (err) {
    console.error('Error cargando resumen ejecutivo:', err);
  } finally {
    loading.value = false;
  }
}

async function onCteChange(val: string) {
  selectedCte.value = val;
  selectedDepto.value = 'Todos';
  await refreshAll();
}

async function onDeptoChange(val: string) {
  selectedDepto.value = val;
  await refreshAll();
}

async function onTipoChange(val: string) {
  selectedTipo.value = val;
  await refreshAll();
}

async function resetFilters() {
  selectedCte.value = 'Todos';
  selectedDepto.value = 'Todos';
  selectedTipo.value = 'Todos';
  await refreshAll();
}

onMounted(() => {
  refreshAll();
});
</script>

<template>
  <div class="home-view">
    <!-- Barra Superior de Control y Filtros Globales del Resumen -->
    <header class="compact-control-bar card">
      <div class="brand-zone">
        <span class="badge badge-tag">Resumen Ejecutivo</span>
        <span class="brand-desc">Gestión Operativa & Cumplimiento SLA (2008–2023)</span>
      </div>

      <div class="minimal-filters">
        <select
          :value="selectedCte"
          class="form-select-sm"
          @change="onCteChange(($event.target as HTMLSelectElement).value)"
        >
          <option v-for="c in filterOptions.ctes" :key="c" :value="c">
            {{ c === 'Todos' ? 'Todas las CTEs' : `CTE ${c}` }}
          </option>
        </select>

        <select
          :value="selectedDepto"
          class="form-select-sm"
          @change="onDeptoChange(($event.target as HTMLSelectElement).value)"
        >
          <option v-for="d in filterOptions.departamentos" :key="d" :value="d">
            {{ d === 'Todos' ? 'Todos Deptos' : d }}
          </option>
        </select>

        <select
          :value="selectedTipo"
          class="form-select-sm"
          @change="onTipoChange(($event.target as HTMLSelectElement).value)"
        >
          <option v-for="t in filterOptions.tipos" :key="t" :value="t">
            {{ t === 'Todos' ? 'Todas las Tipologías' : t }}
          </option>
        </select>

        <button
          v-if="selectedCte !== 'Todos' || selectedDepto !== 'Todos' || selectedTipo !== 'Todos'"
          class="btn-reset-icon"
          title="Restablecer filtros"
          @click="resetFilters"
        >
          <RefreshCw :size="13" />
        </button>
      </div>

      <router-link to="/operaciones" class="btn-quick-go">
        <span>Ir a Análisis Detallado</span>
        <ArrowRight :size="14" />
      </router-link>
    </header>

    <!-- KPIs Ejecutivos Dinámicos -->
    <section v-if="kpis" class="kpi-section">
      <div class="grid-4">
        <KpiCard
          title="Total Avisos"
          :value="kpis.total_avisos"
          badge="2008–2023"
          :subtitle="`Sobre ${kpis.total_equipos.toLocaleString()} torres en red`"
          color="brand"
        />
        <KpiCard
          title="Cumplimiento SLA"
          :value="`${kpis.pct_cumplimiento}%`"
          badge="Global"
          subtitle="Atención dentro del plazo normativo"
          color="success"
        />
        <KpiCard
          title="Abiertos Vencidos"
          :value="kpis.abiertos_vencidos ?? 0"
          badge="Crítico"
          :subtitle="`De ${(kpis.avisos_abiertos ?? 0).toLocaleString()} avisos aún abiertos`"
          color="danger"
        />
        <KpiCard
          title="Tiempo Típico"
          :value="`${kpis.tiempo_tipico_mediana ?? 0} días`"
          badge="Mediana Cerrados"
          subtitle="Duración mediana de resolución"
          color="warning"
        />
      </div>
    </section>

    <!-- Escenario Principal de Datos Prioritarios (Ocupa todo el alto restante) -->
    <section v-if="kpis && insights" class="executive-pulse-grid">
      <div class="pulse-card card">
        <div class="pulse-header">
          <div>
            <h3 class="pulse-title">Envejecimiento del Backlog y Pareto por Línea</h3>
            <p class="pulse-sub">
              Antigüedad de los {{ insights.total_vencidos.toLocaleString() }} abiertos vencidos y líneas que concentran la mora
            </p>
          </div>
          <span class="badge">
            {{ insights.lines_for_80_pct }}/{{ insights.total_lines_with_overdue }} líneas = 80% mora
          </span>
        </div>

        <div class="stacked-portfolio-bar" v-if="insights.total_vencidos > 0">
          <div
            v-for="seg in insights.aging_buckets"
            :key="seg.label"
            class="port-seg"
            :class="seg.cls"
            :style="{ width: `${seg.pct}%` }"
            :title="`${seg.label}: ${seg.count.toLocaleString()} (${seg.pct}%)`"
          ></div>
        </div>

        <div class="portfolio-legend">
          <div v-for="seg in insights.aging_buckets" :key="seg.label" class="port-leg-item">
            <span class="leg-dot" :class="seg.cls"></span>
            <span class="leg-txt">{{ seg.label }}: <b>{{ seg.count.toLocaleString() }}</b> ({{ seg.pct }}%)</span>
          </div>
        </div>

        <p v-if="insights.total_vencidos > 0" class="insight-callout">
          El <b>{{ overOneYearStats.pct }}%</b> de la mora ({{ overOneYearStats.count.toLocaleString() }} avisos) supera <b>1 año</b> de atraso; intervenir las <b>{{ overOneYearStats.lineCount }} líneas principales</b> resuelve el <b>{{ overOneYearStats.topCum }}%</b> del rezago.
        </p>

        <div class="typology-bars scroll-inner">
          <div v-if="topParetoLineas.length === 0" class="empty-msg">
            No se registran avisos abiertos vencidos con los filtros actuales.
          </div>
          <div v-for="l in topParetoLineas" :key="l.linea" class="typo-row">
            <span class="typo-name" :title="`${l.linea} (${l.cte})`">{{ l.linea }}</span>
            <div class="typo-track">
              <div class="typo-fill danger-fill" :style="{ width: `${l.barWidth}%` }"></div>
            </div>
            <span class="typo-val">{{ l.vencidos }} venc. · {{ l.cum_pct }}%</span>
          </div>
        </div>
      </div>

      <div class="pulse-card card">
        <div class="pulse-header">
          <div>
            <h3 class="pulse-title">Cola de Atención Inmediata y Reincidencia</h3>
            <p class="pulse-sub">
              Top {{ topCriticalList.length }} avisos abiertos ordenados por exceso sobre su plazo SLA
            </p>
          </div>
          <router-link to="/territorio?tab=audit" class="pulse-link">Auditar todos →</router-link>
        </div>

        <div class="critical-list scroll-inner">
          <div v-if="topCriticalList.length === 0" class="empty-msg">
            No hay avisos abiertos en mora bajo los filtros seleccionados.
          </div>
          <div v-for="item in topCriticalList" :key="item.aviso" class="critical-row">
            <div class="crit-main">
              <span class="crit-id">#{{ item.aviso }}</span>
              <span class="crit-loc">{{ item.municipio }} · {{ item.linea }} · Torre {{ item.equipo }}</span>
            </div>
            <span v-if="item.reincidencias_torre >= 2" class="crit-rec" title="Avisos históricos en la misma torre">
              {{ item.reincidencias_torre }}× torre
            </span>
            <span class="crit-tipo">{{ item.tipo }}</span>
            <span
              class="crit-excess"
              :title="`Abierto ${item.dias_abierto.toLocaleString()}d (SLA ${item.prioridad_dias}d, +${item.exceso_dias.toLocaleString()}d exceso)`"
            >
              {{ formatOverdueYears(item.exceso_dias) }}
            </span>
          </div>
        </div>

        <div class="recurrence-footer">
          <span class="rec-badge">
            <b>{{ insights.recurrent_towers_count.toLocaleString() }}</b> torres reincidentes (≥2 avisos) explican el
            <b>{{ recurrencePct }}%</b> del historial (<b>{{ insights.recurrent_notices_count.toLocaleString() }}</b> registros)
          </span>
          <router-link to="/territorio" class="pulse-link">Ver mapa →</router-link>
        </div>
      </div>
    </section>
  </div>
</template>

<style scoped>
.home-view {
  display: flex;
  flex-direction: column;
  gap: 10px;
  flex: 1;
  height: 100%;
  min-height: 0;
  overflow: hidden;
}

.compact-control-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 8px 16px;
  background: var(--bg-card);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-md);
  flex-shrink: 0;
}

.brand-zone {
  display: flex;
  align-items: center;
  gap: 10px;
  min-width: 0;
}

.brand-desc {
  font-size: 0.82rem;
  font-weight: 600;
  color: var(--text-secondary);
  white-space: nowrap;
}

.minimal-filters {
  display: flex;
  align-items: center;
  gap: 8px;
  flex: 1;
  max-width: 660px;
}

.form-select-sm {
  height: 32px;
  padding: 0 10px;
  font-size: 0.82rem;
  background: var(--bg-subtle);
  color: var(--text-primary);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-sm);
  outline: none;
  cursor: pointer;
}

.btn-reset-icon {
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--bg-subtle);
  color: var(--text-secondary);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-sm);
  cursor: pointer;
}

.btn-reset-icon:hover {
  color: var(--color-brand);
  border-color: var(--color-brand);
}

.btn-quick-go {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  border-radius: var(--radius-sm);
  background: var(--color-brand);
  color: #ffffff;
  font-size: 0.8rem;
  font-weight: 700;
  text-decoration: none;
  white-space: nowrap;
  flex-shrink: 0;
}

.btn-quick-go:hover {
  opacity: 0.92;
}

.kpi-section {
  flex-shrink: 0;
}

.grid-4 {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 10px;
}

.executive-pulse-grid {
  display: grid;
  grid-template-columns: 1fr 1.15fr;
  gap: 12px;
  flex: 1;
  min-height: 0;
  overflow: hidden;
}

.pulse-card {
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 14px 18px;
  min-height: 0;
  height: 100%;
  overflow: hidden;
}

.pulse-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
  flex-shrink: 0;
}

.pulse-title {
  font-size: 0.95rem;
  font-weight: 800;
  color: var(--text-primary);
  margin: 0;
}

.pulse-sub {
  font-size: 0.76rem;
  color: var(--text-secondary);
  margin: 2px 0 0;
}

.pulse-link {
  font-size: 0.78rem;
  font-weight: 700;
  color: var(--color-brand);
  text-decoration: none;
  white-space: nowrap;
}

.pulse-link:hover {
  text-decoration: underline;
}

.stacked-portfolio-bar {
  display: flex;
  height: 10px;
  width: 100%;
  border-radius: var(--radius-full);
  overflow: hidden;
  background: var(--bg-subtle);
  gap: 1px;
  flex-shrink: 0;
}

.port-seg {
  height: 100%;
  transition: width 0.3s ease;
}

.seg-success { background: var(--sla-success, #10B981); }
.seg-sla-ok { background: #475569; }
.seg-warning { background: var(--sla-warning, #F59E0B); }
.seg-warning-alt { background: #EA580C; }
.seg-info { background: var(--sla-info, #38BDF8); }
.seg-danger { background: var(--sla-danger, #E11D48); }

.portfolio-legend {
  display: flex;
  flex-wrap: wrap;
  gap: 10px 14px;
  flex-shrink: 0;
}

.port-leg-item {
  display: flex;
  align-items: center;
  gap: 5px;
  font-size: 0.74rem;
  color: var(--text-secondary);
}

.port-leg-item b {
  color: var(--text-primary);
}

.leg-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  display: inline-block;
  flex-shrink: 0;
}

.insight-callout {
  margin: 0;
  padding: 7px 12px;
  font-size: 0.77rem;
  line-height: 1.4;
  color: var(--text-primary);
  background: var(--bg-subtle);
  border-left: 3px solid var(--color-brand, #0f766e);
  border-radius: 4px;
  flex-shrink: 0;
}

.scroll-inner {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  padding-right: 4px;
}

.typology-bars {
  display: flex;
  flex-direction: column;
  gap: 9px;
}

.typo-row {
  display: grid;
  grid-template-columns: 155px 1fr 122px;
  align-items: center;
  gap: 10px;
  font-size: 0.77rem;
}

.typo-name {
  color: var(--text-primary);
  font-weight: 600;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.typo-track {
  height: 9px;
  background: var(--bg-subtle);
  border-radius: var(--radius-full);
  overflow: hidden;
}

.typo-fill {
  height: 100%;
  background: var(--color-brand);
  border-radius: var(--radius-full);
}

.typo-fill.danger-fill {
  background: var(--sla-danger, #E11D48);
}

.typo-val {
  text-align: right;
  color: var(--text-secondary);
  font-variant-numeric: tabular-nums;
  font-weight: 600;
  white-space: nowrap;
}

.critical-list {
  display: flex;
  flex-direction: column;
  gap: 7px;
}

.critical-row {
  display: grid;
  grid-template-columns: 1fr auto auto auto;
  align-items: center;
  gap: 8px;
  padding: 7px 11px;
  background: var(--bg-subtle);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-sm);
  font-size: 0.76rem;
}

.crit-main {
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
}

.crit-id {
  font-weight: 800;
  color: var(--text-primary);
  font-variant-numeric: tabular-nums;
  flex-shrink: 0;
}

.crit-loc {
  color: var(--text-secondary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.crit-rec {
  font-size: 0.69rem;
  font-weight: 700;
  color: var(--color-brand, #0f766e);
  background: var(--color-brand-soft, rgba(15, 118, 110, 0.1));
  padding: 2px 6px;
  border-radius: var(--radius-full);
  white-space: nowrap;
}

.crit-tipo {
  font-size: 0.7rem;
  font-weight: 600;
  color: var(--text-secondary);
  background: var(--bg-card);
  border: 1px solid var(--border-subtle);
  padding: 2px 7px;
  border-radius: var(--radius-full);
  white-space: nowrap;
}

.crit-excess {
  font-size: 0.73rem;
  font-weight: 800;
  color: var(--sla-danger, #E11D48);
  font-variant-numeric: tabular-nums;
  white-space: nowrap;
}

.recurrence-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  padding-top: 8px;
  border-top: 1px solid var(--border-subtle);
  font-size: 0.75rem;
  color: var(--text-secondary);
  flex-shrink: 0;
}

.rec-badge b {
  color: var(--text-primary);
}

.empty-msg {
  padding: 24px;
  text-align: center;
  color: var(--text-secondary);
  font-size: 0.82rem;
}

@media (max-width: 1024px) {
  .home-view,
  .executive-pulse-grid {
    height: auto;
    overflow: visible;
  }
  .compact-control-bar {
    flex-direction: column;
    align-items: stretch;
  }
  .brand-desc {
    display: none;
  }
  .grid-4 {
    grid-template-columns: repeat(2, 1fr);
  }
  .executive-pulse-grid {
    grid-template-columns: 1fr;
  }
  .scroll-inner {
    max-height: 340px;
  }
}

@media (max-width: 600px) {
  .grid-4 {
    grid-template-columns: 1fr;
  }
}
</style>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { Activity, Palette } from 'lucide-vue-next';
import { apiService } from '../services/api';
import type { PortadaKpis, ActionableInsightsResponse } from '../types/models';
import KpiCard from '../components/common/KpiCard.vue';
import { useThemeStore } from '../stores/themeStore';

const themeStore = useThemeStore();
const loading = ref(true);
const kpis = ref<PortadaKpis | null>(null);
const insights = ref<ActionableInsightsResponse | null>(null);

// Filtros contextuales dentro de las tarjetas (sin recargar la portada)
const selectedAging = ref<string>('Todos');
const selectedQueueScope = ref<'all' | 'campo' | 'predial'>('all');
const selectedCity = ref<string>('Todas');

const topParetoLineas = computed(() => {
  const list = insights.value?.pareto_lineas || [];
  const top8 = list.slice(0, 8);
  const maxVencidos = top8[0]?.vencidos || 1;
  return top8.map((item) => ({
    ...item,
    barWidth: Number(((item.vencidos / maxVencidos) * 100).toFixed(1)),
  }));
});

const cityOptions = computed(() => {
  const list = insights.value?.top_critical_notices || [];
  const cities = Array.from(new Set(list.map((i) => i.municipio).filter(Boolean))).sort();
  return ['Todas', ...cities];
});

const filteredCriticalList = computed(() => {
  let list = insights.value?.top_critical_notices || [];

  if (selectedAging.value !== 'Todos') {
    list = list.filter((item) => {
      const d = item.exceso_dias;
      if (selectedAging.value.includes('< 90')) return d < 90;
      if (selectedAging.value.includes('90')) return d >= 90 && d <= 365;
      if (selectedAging.value.includes('1 – 3')) return d > 365 && d <= 1095;
      if (selectedAging.value.includes('> 3')) return d > 1095;
      return true;
    });
  }

  if (selectedQueueScope.value !== 'all') {
    const campoTypes = ['VEGETACI', 'OBRAS'];
    list = list.filter((item) => {
      const upper = (item.tipo || '').toUpperCase();
      const isCampo = campoTypes.some((k) => upper.includes(k));
      return selectedQueueScope.value === 'campo' ? isCampo : !isCampo;
    });
  }

  if (selectedCity.value !== 'Todas') {
    list = list.filter((item) => item.municipio === selectedCity.value);
  }

  return list.slice(0, 7);
});

const overOneYearStats = computed(() => {
  const buckets = insights.value?.aging_buckets || [];
  const oldBuckets = buckets.filter((b) => b.label.includes('1 – 3') || b.label.includes('> 3'));
  const count = oldBuckets.reduce((acc, b) => acc + b.count, 0);
  const total = insights.value?.total_vencidos || 0;
  const pct = total > 0 ? Number(((count / total) * 100).toFixed(1)) : 0;
  const topLinesCum = topParetoLineas.value[topParetoLineas.value.length - 1]?.cum_pct ?? 0;
  return { count, pct, topLinesCum };
});

const recurrencePct = computed(() => {
  const total = kpis.value?.total_avisos || 0;
  const rec = insights.value?.recurrent_notices_count || 0;
  return total > 0 ? Number(((rec / total) * 100).toFixed(1)) : 0;
});

function toggleAging(label: string) {
  selectedAging.value = selectedAging.value === label ? 'Todos' : label;
}

function formatOverdueYears(days: number): string {
  if (days >= 365) {
    return `${(days / 365).toFixed(1)} años vencido`;
  }
  return `+${days.toLocaleString()}d vencido`;
}

onMounted(async () => {
  try {
    const [portadaRes, insightsRes] = await Promise.all([
      apiService.getPortadaKpis(),
      apiService.getActionableInsights(),
    ]);
    kpis.value = portadaRes;
    insights.value = insightsRes;
  } catch (err) {
    console.error('Error cargando KPIs de portada:', err);
  } finally {
    loading.value = false;
  }
});
</script>

<template>
  <div class="home-view">
    <!-- Hero Banner (Identidad de Portada) -->
    <section class="hero-card card">
      <div class="hero-layout">
        <div class="hero-content">
          <div class="badge">EcoGrid DEC · Dirección de Operaciones</div>
          <h1 class="hero-title">
            Dashboard de Gestión Operativa y Cumplimiento de la Atención
          </h1>
          <p class="hero-description">
            Herramienta táctico-operacional para evaluar el cumplimiento de plazos por prioridad, localizar retrasos en el territorio (2008–2023) y optimizar la asignación de cuadrillas sobre la red de transmisión eléctrica.
          </p>
          <div class="hero-actions">
            <router-link to="/operaciones" class="btn">
              <Activity :size="16" />
              <span>01 · Iniciar en Operaciones</span>
            </router-link>
            <router-link to="/diseno" class="btn btn-secondary">
              <Palette :size="16" />
              <span>Gobernanza de Color</span>
            </router-link>
          </div>
        </div>

        <div class="hero-logo-box">
          <img
            :src="themeStore.isDark ? '/assets/icon_dark.png' : '/assets/icon_light.png'"
            alt="EcoGrid Colombia"
            class="hero-brand-logo"
          />
          <span class="hero-brand-label">EcoGrid DEC · Colombia</span>
          <span class="hero-brand-sublabel">Control de Red & Sostenibilidad</span>
        </div>
      </div>
    </section>

    <!-- KPIs Nacionales -->
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
          subtitle="Avisos atendidos dentro del plazo"
          color="brand"
        />
        <KpiCard
          title="Avisos Abiertos"
          :value="kpis.avisos_abiertos ?? 0"
          badge="Pendientes"
          :subtitle="`${(kpis.abiertos_vencidos ?? 0).toLocaleString()} ya superaron el plazo SLA`"
          color="brand"
        />
        <KpiCard
          title="Tiempo Típico"
          :value="`${kpis.tiempo_tipico_mediana ?? 0} días`"
          badge="Mediana Cerrados"
          subtitle="Duración mediana de resolución"
          color="brand"
        />
      </div>
    </section>

    <!-- Inteligencia Accionable con Filtros Contextuales dentro de las Tarjetas -->
    <section v-if="kpis && insights" class="executive-pulse-grid">
      <div class="pulse-card card">
        <div class="pulse-header">
          <div>
            <h3 class="pulse-title">Envejecimiento del Backlog y Pareto por Línea</h3>
            <p class="pulse-sub">
              Haz clic en un rango de antigüedad para filtrar la cola derecha
            </p>
          </div>
          <span class="badge">
            {{ insights.lines_for_80_pct }}/{{ insights.total_lines_with_overdue }} líneas = 80% mora
          </span>
        </div>

        <div class="stacked-portfolio-bar">
          <div
            v-for="seg in insights.aging_buckets"
            :key="seg.label"
            class="port-seg clickable"
            :class="[seg.cls, { dimmed: selectedAging !== 'Todos' && selectedAging !== seg.label }]"
            :style="{ width: `${seg.pct}%` }"
            :title="`Filtrar ${seg.label}: ${seg.count.toLocaleString()} (${seg.pct}%)`"
            @click="toggleAging(seg.label)"
          ></div>
        </div>

        <div class="portfolio-legend">
          <button
            v-for="seg in insights.aging_buckets"
            :key="seg.label"
            class="port-leg-btn"
            :class="{ active: selectedAging === seg.label }"
            @click="toggleAging(seg.label)"
          >
            <span class="leg-dot" :class="seg.cls"></span>
            <span class="leg-txt">{{ seg.label }}: <b>{{ seg.count.toLocaleString() }}</b> ({{ seg.pct }}%)</span>
          </button>
        </div>

        <p class="insight-callout">
          El <b>{{ overOneYearStats.pct }}%</b> de la mora ({{ overOneYearStats.count.toLocaleString() }} avisos) supera <b>1 año</b>; intervenir las <b>8 líneas principales</b> resuelve el <b>{{ overOneYearStats.topLinesCum }}%</b> del rezago.
        </p>

        <div class="typology-bars">
          <div v-for="l in topParetoLineas" :key="l.linea" class="typo-row">
            <span class="typo-name" :title="`${l.linea} (${l.cte})`">{{ l.linea }}</span>
            <div class="typo-track">
              <div class="typo-fill" :style="{ width: `${l.barWidth}%` }"></div>
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
              Filtra dentro de la cola por ciudad o naturaleza operativa
            </p>
          </div>
          <div class="card-inline-filters">
            <select v-model="selectedCity" class="mini-select" title="Filtrar por ciudad">
              <option v-for="c in cityOptions" :key="c" :value="c">
                {{ c === 'Todas' ? 'Todas las ciudades' : c }}
              </option>
            </select>
            <div class="mini-pills">
              <button
                class="mini-pill"
                :class="{ active: selectedQueueScope === 'all' }"
                @click="selectedQueueScope = 'all'"
              >
                Todos
              </button>
              <button
                class="mini-pill"
                :class="{ active: selectedQueueScope === 'campo' }"
                @click="selectedQueueScope = 'campo'"
              >
                Campo
              </button>
              <button
                class="mini-pill"
                :class="{ active: selectedQueueScope === 'predial' }"
                @click="selectedQueueScope = 'predial'"
              >
                Predial
              </button>
            </div>
          </div>
        </div>

        <div class="critical-list">
          <div v-if="filteredCriticalList.length === 0" class="empty-msg">
            Sin avisos en el Top crítico para este filtro.
            <button class="btn-link" @click="selectedAging = 'Todos'; selectedQueueScope = 'all'; selectedCity = 'Todas';">
              Limpiar filtros
            </button>
          </div>
          <div v-for="item in filteredCriticalList" :key="item.aviso" class="critical-row">
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
          <router-link to="/territorio?tab=audit" class="pulse-link">Auditar todos →</router-link>
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

.hero-card {
  background: var(--bg-card);
  border: 1px solid var(--border-subtle);
  padding: 14px 24px;
  flex-shrink: 0;
}

.hero-layout {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 24px;
}

.hero-content {
  flex: 1;
}

.hero-title {
  font-size: 1.38rem;
  font-weight: 800;
  line-height: 1.2;
  margin: 6px 0 6px;
  color: var(--text-primary);
  letter-spacing: -0.02em;
}

.hero-description {
  font-size: 0.84rem;
  color: var(--text-secondary);
  line-height: 1.45;
  margin-bottom: 10px;
  max-width: 760px;
}

.hero-actions {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}

.hero-logo-box {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 4px;
  padding: 10px 20px;
  border-radius: var(--radius-lg);
  background: var(--bg-subtle);
  border: 1px solid var(--border-subtle);
  flex-shrink: 0;
}

.hero-brand-logo {
  height: 46px;
  width: auto;
  object-fit: contain;
}

.hero-brand-label {
  font-size: 0.78rem;
  font-weight: 800;
  color: var(--text-primary);
}

.hero-brand-sublabel {
  font-size: 0.68rem;
  font-weight: 600;
  color: var(--text-secondary);
}

.kpi-section {
  flex-shrink: 0;
}

.grid-4 {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 12px;
}

.executive-pulse-grid {
  display: grid;
  grid-template-columns: 1fr 1.12fr;
  gap: 12px;
  flex: 1;
  min-height: 0;
}

.pulse-card {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 12px 16px;
  min-height: 0;
  height: 100%;
  overflow: hidden;
}

.pulse-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 10px;
  flex-shrink: 0;
}

.pulse-title {
  font-size: 0.9rem;
  font-weight: 800;
  color: var(--text-primary);
  margin: 0;
}

.pulse-sub {
  font-size: 0.72rem;
  color: var(--text-secondary);
  margin: 2px 0 0;
}

.pulse-link {
  font-size: 0.74rem;
  font-weight: 700;
  color: var(--color-brand);
  text-decoration: none;
  white-space: nowrap;
}

.pulse-link:hover {
  text-decoration: underline;
}

.card-inline-filters {
  display: flex;
  align-items: center;
  gap: 6px;
  flex-shrink: 0;
}

.mini-select {
  height: 26px;
  padding: 0 8px;
  font-size: 0.72rem;
  background: var(--bg-subtle);
  color: var(--text-primary);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-sm);
  outline: none;
  cursor: pointer;
}

.mini-pills {
  display: inline-flex;
  background: var(--bg-subtle);
  padding: 2px;
  border-radius: var(--radius-sm);
  border: 1px solid var(--border-subtle);
}

.mini-pill {
  border: none;
  background: transparent;
  color: var(--text-secondary);
  font-size: 0.7rem;
  font-weight: 600;
  padding: 2px 8px;
  border-radius: 4px;
  cursor: pointer;
}

.mini-pill.active {
  background: var(--bg-card);
  color: var(--color-brand);
  font-weight: 700;
  box-shadow: var(--shadow-sm);
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
  transition: width 0.3s ease, opacity 0.15s ease;
}

.port-seg.clickable {
  cursor: pointer;
}

.port-seg.dimmed {
  opacity: 0.28;
}

.seg-success { background: #14b8a6; }
.seg-sla-ok { background: #cbd5e1; }
.seg-warning { background: #94a3b8; }
.seg-warning-alt { background: #475569; }
.seg-info { background: #64748b; }
.seg-danger { background: #0f766e; }

.portfolio-legend {
  display: flex;
  flex-wrap: wrap;
  gap: 6px 10px;
  flex-shrink: 0;
}

.port-leg-btn {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  font-size: 0.71rem;
  color: var(--text-secondary);
  background: transparent;
  border: 1px solid transparent;
  border-radius: 999px;
  padding: 1px 6px;
  cursor: pointer;
}

.port-leg-btn:hover,
.port-leg-btn.active {
  background: var(--bg-subtle);
  border-color: var(--color-brand);
  color: var(--text-primary);
}

.port-leg-btn b {
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
  padding: 6px 10px;
  font-size: 0.73rem;
  line-height: 1.35;
  color: var(--text-primary);
  background: var(--bg-subtle);
  border-left: 3px solid var(--color-brand, #0f766e);
  border-radius: 4px;
  flex-shrink: 0;
}

.typology-bars {
  display: flex;
  flex-direction: column;
  gap: 8px;
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  justify-content: flex-start;
  padding-top: 2px;
}

.typo-row {
  display: grid;
  grid-template-columns: 150px 1fr 122px;
  align-items: center;
  gap: 10px;
  font-size: 0.74rem;
}

.typo-name {
  color: var(--text-primary);
  font-weight: 600;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.typo-track {
  height: 8px;
  background: var(--bg-subtle);
  border-radius: var(--radius-full);
  overflow: hidden;
}

.typo-fill {
  height: 100%;
  background: var(--color-brand, #0f766e);
  border-radius: var(--radius-full);
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
  gap: 6px;
  flex: 1;
  justify-content: flex-start;
  min-height: 0;
  overflow-y: auto;
}

.critical-row {
  display: grid;
  grid-template-columns: 1fr auto auto auto;
  align-items: center;
  gap: 8px;
  padding: 5px 10px;
  background: var(--bg-subtle);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-sm);
  font-size: 0.74rem;
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
  font-size: 0.68rem;
  font-weight: 700;
  color: var(--text-primary);
  background: var(--bg-card);
  border: 1px solid var(--border-subtle);
  padding: 2px 6px;
  border-radius: var(--radius-full);
  white-space: nowrap;
}

.crit-tipo {
  font-size: 0.69rem;
  font-weight: 600;
  color: var(--text-secondary);
  background: var(--bg-card);
  border: 1px solid var(--border-subtle);
  padding: 2px 7px;
  border-radius: var(--radius-full);
  white-space: nowrap;
}

.crit-excess {
  font-size: 0.72rem;
  font-weight: 700;
  color: var(--text-primary);
  font-variant-numeric: tabular-nums;
  white-space: nowrap;
}

.recurrence-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  padding-top: 6px;
  border-top: 1px solid var(--border-subtle);
  font-size: 0.72rem;
  color: var(--text-secondary);
  flex-shrink: 0;
}

.rec-badge b {
  color: var(--text-primary);
}

.empty-msg {
  padding: 16px;
  text-align: center;
  color: var(--text-secondary);
  font-size: 0.78rem;
}

.btn-link {
  border: none;
  background: transparent;
  color: var(--color-brand);
  font-weight: 700;
  cursor: pointer;
  margin-left: 6px;
  text-decoration: underline;
}

@media (max-width: 1024px) {
  .home-view {
    height: auto;
    overflow: visible;
  }
  .hero-layout {
    flex-direction: column;
    align-items: flex-start;
  }
  .grid-4,
  .executive-pulse-grid {
    grid-template-columns: 1fr;
  }
}
</style>

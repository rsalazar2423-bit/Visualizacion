<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { Activity, Map, Sliders, ChevronRight, Palette } from 'lucide-vue-next';
import { apiService } from '../services/api';
import type { PortadaKpis, ActionableInsightsResponse } from '../types/models';
import KpiCard from '../components/common/KpiCard.vue';
import { useThemeStore } from '../stores/themeStore';

const themeStore = useThemeStore();
const loading = ref(true);
const kpis = ref<PortadaKpis | null>(null);
const insights = ref<ActionableInsightsResponse | null>(null);

const topParetoLineas = computed(() => {
  const list = insights.value?.pareto_lineas || [];
  const top5 = list.slice(0, 5);
  const maxVencidos = top5[0]?.vencidos || 1;
  return top5.map((item) => ({
    ...item,
    barWidth: Number(((item.vencidos / maxVencidos) * 100).toFixed(1)),
  }));
});

const topCriticalList = computed(() => {
  return (insights.value?.top_critical_notices || []).slice(0, 5);
});

const overOneYearStats = computed(() => {
  const buckets = insights.value?.aging_buckets || [];
  const oldBuckets = buckets.filter((b) => b.label.includes('1 – 3') || b.label.includes('> 3'));
  const count = oldBuckets.reduce((acc, b) => acc + b.count, 0);
  const total = insights.value?.total_vencidos || 0;
  const pct = total > 0 ? Number(((count / total) * 100).toFixed(1)) : 0;
  const top5Cum = topParetoLineas.value[topParetoLineas.value.length - 1]?.cum_pct ?? 0;
  return { count, pct, top5Cum };
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
    <!-- Hero Banner -->
    <section class="hero-card card">
      <div class="hero-layout">
        <div class="hero-content">
          <div class="badge">EcoGrid DEC · Dirección de Operaciones</div>
          <h1 class="hero-title">
            Dashboard de Gestión Operativa y Cumplimiento de la Atención
          </h1>
          <p class="hero-description">
            Herramienta táctico-operacional para evaluar el cumplimiento de plazos por prioridad, localizar retrasos en el territorio a lo largo de la historia (2008–2023) y optimizar la asignación de equipos especializados sobre la infraestructura de transmisión eléctrica.
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

    <!-- 4 Indicadores Principales del Documento Rector -->
    <section class="kpi-section">
      <div class="section-header">
        <div>
          <h2 class="section-title">Indicadores Principales de la Operación (KPIs)</h2>
          <p class="section-subtitle">Lectura inmediata del estado de atención sobre {{ kpis ? kpis.total_avisos.toLocaleString() : '...' }} avisos y {{ kpis ? kpis.total_equipos.toLocaleString() : '...' }} torres georreferenciadas</p>
        </div>
        <span class="badge">Corte Histórico 2008 – 2023</span>
      </div>

      <div v-if="loading" class="spinner-container">
        <div class="spinner"></div>
      </div>

      <div v-else-if="kpis" class="grid-4">
        <KpiCard
          title="Cumplimiento Oportuno"
          :value="`${kpis.cumplimiento_oportuno_pct ?? kpis.pct_cumplimiento}%`"
          :badge="`Total red: ${kpis.pct_cumplimiento}%`"
          subtitle="Porcentaje de avisos cerrados dentro del plazo de su prioridad"
          color="success"
        />
        <KpiCard
          title="Avisos Abiertos"
          :value="(kpis.avisos_abiertos ?? 0).toLocaleString()"
          :badge="`${kpis.total_avisos.toLocaleString()} históricos`"
          subtitle="Cantidad de avisos pendientes de cierre a la fecha de corte"
          color="info"
        />
        <KpiCard
          title="Abiertos Vencidos"
          :value="(kpis.abiertos_vencidos ?? 0).toLocaleString()"
          badge="Atención Inmediata"
          subtitle="Avisos pendientes cuyo plazo de atención ya se superó"
          color="danger"
        />
        <KpiCard
          title="Tiempo Típico de Atención"
          :value="`${Math.round(kpis.tiempo_tipico_mediana ?? 383)} días`"
          badge="Mediana Cerrados"
          subtitle="Duración mediana en días de los avisos cerrados"
          color="warning"
        />
      </div>
    </section>

    <!-- Inteligencia Accionable (Sin duplicar gráficas de las vistas) -->
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

        <div class="stacked-portfolio-bar">
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

        <p class="insight-callout">
          El <b>{{ overOneYearStats.pct }}%</b> de la mora ({{ overOneYearStats.count.toLocaleString() }} avisos) supera <b>1 año</b> de atraso; intervenir las <b>5 líneas principales</b> resuelve el <b>{{ overOneYearStats.top5Cum }}%</b> del rezago.
        </p>

        <div class="typology-bars">
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
              Avisos abiertos con mayor tiempo vencido sobre su SLA y recurrencia por torre
            </p>
          </div>
          <router-link to="/territorio?tab=audit" class="pulse-link">Auditar todos →</router-link>
        </div>

        <div class="critical-list">
          <div v-for="item in topCriticalList" :key="item.aviso" class="critical-row">
            <div class="crit-main">
              <span class="crit-id">#{{ item.aviso }}</span>
              <span class="crit-loc">{{ item.municipio }} · {{ item.linea }} · Torre {{ item.equipo }}</span>
            </div>
            <span v-if="item.reincidencias_torre >= 2" class="crit-rec" title="Avisos históricos en la misma torre">
              {{ item.reincidencias_torre }}× torre
            </span>
            <span class="crit-tipo">{{ item.tipo }}</span>
            <span class="crit-excess" :title="`Abierto ${item.dias_abierto.toLocaleString()}d (SLA ${item.prioridad_dias}d, +${item.exceso_dias.toLocaleString()}d exceso)`">
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

    <!-- Acceso Rápido Compacto a las 3 Vistas -->
    <section class="features-section grid-3">
      <router-link to="/operaciones" class="feature-card-compact card">
        <div class="fc-head">
          <span class="step-num">VISTA 01</span>
          <Activity :size="18" class="feat-icon brand" />
        </div>
        <h3 class="feature-title">Seguimiento y Cumplimiento</h3>
        <p class="feature-text">Evolución 2008–2023, plazos SLA y composición por tipología técnica.</p>
        <span class="fc-cta">Abrir Vista 01 <ChevronRight :size="14" /></span>
      </router-link>

      <router-link to="/territorio" class="feature-card-compact card">
        <div class="fc-head">
          <span class="step-num">VISTA 02</span>
          <Map :size="18" class="feat-icon accent" />
        </div>
        <h3 class="feature-title">Diagnóstico Territorial y Técnico</h3>
        <p class="feature-text">
          Mapa georreferenciado sobre {{ kpis ? kpis.total_deptos : 10 }} deptos y {{ kpis ? kpis.total_municipios : 166 }} municipios, ranking y tabla.
        </p>
        <span class="fc-cta">Abrir Vista 02 <ChevronRight :size="14" /></span>
      </router-link>

      <router-link to="/capacidad" class="feature-card-compact card">
        <div class="fc-head">
          <span class="step-num">VISTA 03</span>
          <Sliders :size="18" class="feat-icon brand" />
        </div>
        <h3 class="feature-title">Capacidad y Mejora Operativa</h3>
        <p class="feature-text">
          Carga sobre {{ kpis ? kpis.total_equipos.toLocaleString() : '5,409' }} torres, dispersión y simulador de cuadrillas.
        </p>
        <span class="fc-cta">Abrir Vista 03 <ChevronRight :size="14" /></span>
      </router-link>
    </section>
  </div>
</template>

<style scoped>
.home-view {
  display: flex;
  flex-direction: column;
  gap: 14px;
  flex: 1;
  min-height: 0;
  padding: 2px 4px;
}

.hero-card {
  background: linear-gradient(135deg, var(--color-brand-soft) 0%, var(--color-accent-soft) 100%), var(--bg-card);
  padding: 16px 22px;
  border: 1px solid var(--border-strong);
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
  max-width: 780px;
}

.hero-logo-box {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 14px 22px;
  background: var(--bg-card);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-sm);
  min-width: 210px;
  flex-shrink: 0;
}

.hero-brand-logo {
  height: 60px;
  width: auto;
  max-width: 160px;
  object-fit: contain;
  margin-bottom: 6px;
}

.hero-brand-label {
  font-size: 0.9rem;
  font-weight: 800;
  color: var(--text-primary);
  text-align: center;
}

.hero-brand-sublabel {
  font-size: 0.72rem;
  font-weight: 600;
  color: var(--color-brand);
  text-align: center;
  margin-top: 1px;
}

.scope-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px 14px;
}

.scope-item {
  display: flex;
  flex-direction: column;
}

.scope-val {
  font-size: 0.92rem;
  font-weight: 800;
  color: var(--text-primary);
  line-height: 1.15;
}

.scope-lbl {
  font-size: 0.7rem;
  color: var(--text-secondary);
}

.hero-title {
  font-size: 1.45rem;
  font-weight: 800;
  color: var(--text-primary);
  line-height: 1.2;
  margin: 6px 0 6px;
  letter-spacing: -0.4px;
}

.hero-description {
  font-size: 0.88rem;
  color: var(--text-secondary);
  line-height: 1.45;
  margin-bottom: 14px;
}

.hero-actions {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}

.section-header {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  margin-bottom: 10px;
  gap: 12px;
  flex-wrap: wrap;
}

.section-title {
  font-size: 1.25rem;
  font-weight: 800;
  color: var(--text-primary);
}

.section-subtitle {
  font-size: 0.85rem;
  color: var(--text-secondary);
  margin-top: 2px;
}

.executive-pulse-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 14px;
  flex: 1;
  min-height: 0;
}

.pulse-card {
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  gap: 10px;
  padding: 14px 18px;
  min-height: 0;
  overflow: hidden;
}

.pulse-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 10px;
}

.pulse-title {
  font-size: 0.98rem;
  font-weight: 800;
  color: var(--text-primary);
  margin: 0;
}

.pulse-sub {
  font-size: 0.76rem;
  color: var(--text-secondary);
  margin-top: 2px;
}

.pulse-link {
  font-size: 0.76rem;
  font-weight: 700;
  color: var(--color-brand);
  white-space: nowrap;
}

.stacked-portfolio-bar {
  display: flex;
  height: 12px;
  border-radius: var(--radius-full);
  overflow: hidden;
  background: var(--bg-subtle);
  gap: 2px;
}

.port-seg {
  height: 100%;
}

.seg-success { background: var(--sla-success, #10B981); }
.seg-sla-ok { background: #475569; }
.seg-warning { background: var(--sla-warning, #F59E0B); }
.seg-orange { background: #F97316; }
.seg-info { background: var(--sla-info, #38BDF8); }
.seg-danger { background: var(--sla-danger, #E11D48); }

.portfolio-legend {
  display: flex;
  flex-wrap: wrap;
  gap: 8px 14px;
}

.port-leg-item {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  font-size: 0.73rem;
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
  padding: 6px 10px;
  font-size: 0.74rem;
  line-height: 1.35;
  color: var(--text-primary);
  background: var(--bg-subtle);
  border-left: 3px solid var(--color-brand, #0f766e);
  border-radius: 4px;
}

.typology-bars {
  display: flex;
  flex-direction: column;
  gap: 6px;
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
  gap: 6px;
  flex: 1;
  justify-content: center;
}

.critical-row {
  display: grid;
  grid-template-columns: 1fr auto auto auto;
  align-items: center;
  gap: 8px;
  padding: 6px 10px;
  background: var(--bg-subtle);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-sm);
  font-size: 0.75rem;
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
  font-size: 0.72rem;
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
  padding-top: 6px;
  border-top: 1px solid var(--border-subtle);
  font-size: 0.73rem;
}

.rec-badge {
  color: var(--text-secondary);
}

.rec-badge b {
  color: var(--text-primary);
}

.grid-3 {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
  flex-shrink: 0;
}

.feature-card-compact {
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 12px 16px;
  cursor: pointer;
}

.feature-card-compact:hover {
  border-color: var(--color-brand);
  transform: translateY(-2px);
}

.fc-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.step-num {
  font-size: 0.7rem;
  font-weight: 800;
  letter-spacing: 0.6px;
  padding: 2px 8px;
  border-radius: var(--radius-full);
  background: var(--bg-subtle);
  color: var(--text-secondary);
  border: 1px solid var(--border-subtle);
}

.feat-icon.brand {
  color: var(--color-brand);
}

.feat-icon.accent {
  color: var(--color-accent);
}

.feature-title {
  font-size: 0.95rem;
  font-weight: 800;
  color: var(--text-primary);
  margin: 2px 0 0;
}

.feature-text {
  font-size: 0.78rem;
  color: var(--text-secondary);
  line-height: 1.35;
}

.fc-cta {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  margin-top: 4px;
  font-size: 0.78rem;
  font-weight: 700;
  color: var(--color-brand);
}

@media (max-width: 1024px) {
  .executive-pulse-grid,
  .grid-3 {
    grid-template-columns: 1fr;
  }
  .hero-layout {
    flex-direction: column;
    align-items: stretch;
  }
}
</style>

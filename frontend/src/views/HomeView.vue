<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { Activity, Map, Sliders, ChevronRight, Palette } from 'lucide-vue-next';
import { apiService } from '../services/api';
import type { PortadaKpis } from '../types/models';
import KpiCard from '../components/common/KpiCard.vue';

const loading = ref(true);
const kpis = ref<PortadaKpis | null>(null);

onMounted(async () => {
  try {
    kpis.value = await apiService.getPortadaKpis();
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

        <div class="hero-scope-card">
          <div class="scope-header">Alcance del Tablero</div>
          <div class="scope-grid">
            <div class="scope-item">
              <span class="scope-val">{{ kpis ? kpis.total_avisos.toLocaleString() : '3,118' }}</span>
              <span class="scope-lbl">Avisos históricos</span>
            </div>
            <div class="scope-item">
              <span class="scope-val">{{ kpis ? kpis.total_equipos.toLocaleString() : '5,409' }}</span>
              <span class="scope-lbl">Torres en red</span>
            </div>
            <div class="scope-item">
              <span class="scope-val">2008 – 2023</span>
              <span class="scope-lbl">Ventana temporal</span>
            </div>
            <div class="scope-item">
              <span class="scope-val">Transmisión</span>
              <span class="scope-lbl">Suroccidente & Centro</span>
            </div>
          </div>
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

    <!-- Secuencia de Navegación en 3 Vistas -->
    <section class="features-section grid-3">
      <div class="feature-card card">
        <div class="feature-top">
          <div class="feature-step-row">
            <span class="step-num">VISTA 01</span>
            <Activity :size="20" class="feat-icon brand" />
          </div>
          <h3 class="feature-title">Seguimiento y Cumplimiento</h3>
          <p class="feature-text">
            Panorama de la operación: evolución temporal de ingresos vs. cierres, cumplimiento por prioridad SLA y composición técnica.
          </p>
        </div>

        <div class="feature-highlights">
          <div class="mini-stat-pair">
            <div class="mini-stat">
              <span class="mini-val">{{ kpis ? `${kpis.pct_vegetacion}%` : '...' }}</span>
              <span class="mini-lbl">Causa Vegetación</span>
            </div>
            <div class="mini-stat">
              <span class="mini-val">{{ kpis ? (kpis.total_avisos - (kpis.avisos_abiertos ?? 0)).toLocaleString() : '...' }}</span>
              <span class="mini-lbl">Avisos Cerrados</span>
            </div>
          </div>
          <div class="module-tags">
            <span class="mod-tag">Evolución 2008–2023</span>
            <span class="mod-tag">Plazos SLA</span>
            <span class="mod-tag">Tipología Técnica</span>
          </div>
        </div>

        <div class="feature-footer">
          <router-link to="/operaciones" class="btn btn-sm feat-btn">
            <span>Abrir Vista 01</span>
            <ChevronRight :size="14" />
          </router-link>
        </div>
      </div>

      <div class="feature-card card">
        <div class="feature-top">
          <div class="feature-step-row">
            <span class="step-num">VISTA 02</span>
            <Map :size="20" class="feat-icon accent" />
          </div>
          <h3 class="feature-title">Diagnóstico Territorial y Técnico</h3>
          <p class="feature-text">
            Mapa geográfico interactivo (2008–2023), ranking de sectores con retrasos, duración por tipología y desglose jerárquico.
          </p>
        </div>

        <div class="feature-highlights">
          <div class="mini-stat-pair">
            <div class="mini-stat">
              <span class="mini-val">{{ kpis ? kpis.total_deptos : '...' }}</span>
              <span class="mini-lbl">Departamentos</span>
            </div>
            <div class="mini-stat">
              <span class="mini-val">{{ kpis ? kpis.total_municipios : '...' }}</span>
              <span class="mini-lbl">Municipios</span>
            </div>
          </div>
          <div class="module-tags">
            <span class="mod-tag">Mapa & Líneas</span>
            <span class="mod-tag">Ranking Crítico</span>
            <span class="mod-tag">Tabla Auditable</span>
          </div>
        </div>

        <div class="feature-footer">
          <router-link to="/territorio" class="btn btn-sm feat-btn">
            <span>Abrir Vista 02</span>
            <ChevronRight :size="14" />
          </router-link>
        </div>
      </div>

      <div class="feature-card card">
        <div class="feature-top">
          <div class="feature-step-row">
            <span class="step-num">VISTA 03</span>
            <Sliders :size="20" class="feat-icon brand" />
          </div>
          <h3 class="feature-title">Capacidad y Mejora Operativa</h3>
          <p class="feature-text">
            Comparación de carga regional frente a infraestructura instalada, matriz carga vs. cumplimiento y simulador de cuadrillas.
          </p>
        </div>

        <div class="feature-highlights">
          <div class="mini-stat-pair">
            <div class="mini-stat">
              <span class="mini-val">{{ kpis ? kpis.total_equipos.toLocaleString() : '...' }}</span>
              <span class="mini-lbl">Torres en Red</span>
            </div>
            <div class="mini-stat">
              <span class="mini-val danger">{{ kpis ? (kpis.abiertos_vencidos ?? 0).toLocaleString() : '...' }}</span>
              <span class="mini-lbl">Backlog Vencido</span>
            </div>
          </div>
          <div class="module-tags">
            <span class="mod-tag">Carga Regional</span>
            <span class="mod-tag">Matriz Dispersión</span>
            <span class="mod-tag">Simulador Cuadrillas</span>
          </div>
        </div>

        <div class="feature-footer">
          <router-link to="/capacidad" class="btn btn-sm feat-btn">
            <span>Abrir Vista 03</span>
            <ChevronRight :size="14" />
          </router-link>
        </div>
      </div>
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

.hero-scope-card {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 12px 16px;
  background: var(--bg-card);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-sm);
  min-width: 280px;
  flex-shrink: 0;
}

.scope-header {
  font-size: 0.72rem;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.6px;
  color: var(--color-brand);
  border-bottom: 1px solid var(--border-subtle);
  padding-bottom: 4px;
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

.grid-3 {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 14px;
  flex: 1;
  min-height: 0;
}

.feature-card {
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  gap: 12px;
  padding: 16px 20px;
}

.feature-top {
  display: flex;
  flex-direction: column;
}

.feature-step-row {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 8px;
}

.step-num {
  font-size: 0.72rem;
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
  font-size: 1.05rem;
  font-weight: 800;
  color: var(--text-primary);
  margin-bottom: 6px;
}

.feature-text {
  font-size: 0.82rem;
  color: var(--text-secondary);
  line-height: 1.45;
}

.feature-highlights {
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin-top: auto;
}

.mini-stat-pair {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
}

.mini-stat {
  display: flex;
  flex-direction: column;
  padding: 8px 10px;
  background: var(--bg-subtle);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-sm);
}

.mini-val {
  font-size: 1.05rem;
  font-weight: 800;
  color: var(--text-primary);
  font-variant-numeric: tabular-nums;
  line-height: 1.15;
}

.mini-val.danger {
  color: var(--sla-danger);
}

.mini-lbl {
  font-size: 0.7rem;
  color: var(--text-secondary);
  margin-top: 2px;
}

.module-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.mod-tag {
  font-size: 0.7rem;
  font-weight: 600;
  color: var(--text-secondary);
  background: var(--bg-subtle);
  border: 1px solid var(--border-subtle);
  padding: 2px 8px;
  border-radius: var(--radius-full);
}

.feature-footer {
  display: flex;
  align-items: center;
  justify-content: flex-start;
  padding-top: 10px;
  border-top: 1px solid var(--border-subtle);
}

.feat-btn {
  margin-top: 0;
}

@media (max-width: 1024px) {
  .grid-3 {
    grid-template-columns: 1fr;
  }
  .hero-layout {
    flex-direction: column;
    align-items: stretch;
  }
}
</style>

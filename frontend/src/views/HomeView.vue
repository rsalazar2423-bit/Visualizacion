<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { Activity, Map, Sliders, ChevronRight, Palette } from 'lucide-vue-next';
import { apiService } from '../services/api';
import type { PortadaKpis } from '../types/models';
import KpiCard from '../components/common/KpiCard.vue';
import { useThemeStore } from '../stores/themeStore';

const themeStore = useThemeStore();
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
              <span>01 · Seguimiento y Cumplimiento</span>
            </router-link>
            <router-link to="/territorio" class="btn btn-secondary">
              <Map :size="16" />
              <span>02 · Mapa Histórico y Territorio</span>
            </router-link>
            <router-link to="/capacidad" class="btn btn-secondary">
              <Sliders :size="16" />
              <span>03 · Capacidad y Mejora</span>
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
          :badge="`Global: ${kpis.pct_cumplimiento}%`"
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

    <!-- Secuencia de Navegación en 3 Vistas (Definición de Construcción) -->
    <section class="features-section grid-3">
      <div class="feature-card card">
        <div class="feature-step-row">
          <span class="step-num">VISTA 01</span>
          <Activity :size="22" class="feat-icon brand" />
        </div>
        <h3 class="feature-title">Seguimiento y Cumplimiento</h3>
        <p class="feature-text">
          Panorama de la operación: estado actual, evolución temporal de avisos ingresados vs. cerrados, cumplimiento al 100% entre prioridades y composición técnica.
        </p>
        <router-link to="/operaciones" class="btn btn-sm feat-btn">
          <span>Abrir Vista 01</span>
          <ChevronRight :size="14" />
        </router-link>
      </div>

      <div class="feature-card card">
        <div class="feature-step-row">
          <span class="step-num">VISTA 02</span>
          <Map :size="22" class="feat-icon accent" />
        </div>
        <h3 class="feature-title">Diagnóstico Territorial y Técnico</h3>
        <p class="feature-text">
          Mapa geográfico interactivo a lo largo de la historia (2008–2023), ranking de sectores con mayores retrasos, tiempos por tipo de aviso y desglose jerárquico.
        </p>
        <router-link to="/territorio" class="btn btn-sm feat-btn">
          <span>Abrir Vista 02</span>
          <ChevronRight :size="14" />
        </router-link>
      </div>

      <div class="feature-card card">
        <div class="feature-step-row">
          <span class="step-num">VISTA 03</span>
          <Sliders :size="22" class="feat-icon brand" />
        </div>
        <h3 class="feature-title">Capacidad y Mejora Operativa</h3>
        <p class="feature-text">
          Comparación de carga regional frente a infraestructura instalada, matriz de dispersión carga vs. cumplimiento y simulador de asignación de cuadrillas.
        </p>
        <router-link to="/capacidad" class="btn btn-sm feat-btn">
          <span>Abrir Vista 03</span>
          <ChevronRight :size="14" />
        </router-link>
      </div>
    </section>
  </div>
</template>

<style scoped>
.home-view {
  display: flex;
  flex-direction: column;
  gap: 32px;
}

.hero-card {
  background: linear-gradient(135deg, var(--color-brand-soft) 0%, var(--color-accent-soft) 100%), var(--bg-card);
  padding: 36px 34px;
  border: 1px solid var(--border-strong);
}

.hero-layout {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 32px;
}

.hero-content {
  max-width: 760px;
}

.hero-logo-box {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 28px 24px;
  background: var(--bg-card);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-md);
  min-width: 250px;
}

.hero-brand-logo {
  height: 100px;
  width: auto;
  max-width: 200px;
  object-fit: contain;
  margin-bottom: 14px;
}

.hero-brand-label {
  font-size: 1rem;
  font-weight: 800;
  color: var(--text-primary);
  text-align: center;
}

.hero-brand-sublabel {
  font-size: 0.78rem;
  font-weight: 600;
  color: var(--color-brand);
  text-align: center;
  margin-top: 2px;
}

.hero-title {
  font-size: 2rem;
  font-weight: 800;
  color: var(--text-primary);
  line-height: 1.22;
  margin: 14px 0 12px;
  letter-spacing: -0.5px;
}

.hero-description {
  font-size: 1rem;
  color: var(--text-secondary);
  line-height: 1.6;
  margin-bottom: 24px;
}

.hero-actions {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
}

.section-header {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  margin-bottom: 16px;
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
  gap: 20px;
}

.feature-card {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  padding: 24px;
}

.feature-step-row {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
}

.step-num {
  font-size: 0.72rem;
  font-weight: 800;
  letter-spacing: 0.6px;
  padding: 3px 9px;
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
  font-size: 1.12rem;
  font-weight: 800;
  color: var(--text-primary);
  margin-bottom: 8px;
}

.feature-text {
  font-size: 0.88rem;
  color: var(--text-secondary);
  line-height: 1.55;
  flex: 1;
}

.feat-btn {
  margin-top: 16px;
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

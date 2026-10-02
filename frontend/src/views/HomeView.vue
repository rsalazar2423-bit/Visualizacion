<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { Zap, Map, ChevronRight } from 'lucide-vue-next';
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
          <div class="badge badge-tag">Sistema Oficial de Supervisión · EcoGrid DEC</div>
          <h1 class="hero-title">
            Monitoreo Sostenible de Infraestructura y Mantenimiento
          </h1>
          <p class="hero-description">
            Plataforma analítica integral para la supervisión operativa, cumplimiento de SLA de mantenimiento de torres y desglose territorial en 10 departamentos de Colombia.
          </p>
          <div class="hero-actions">
            <router-link to="/operaciones" class="btn">
              <Zap :size="16" />
              <span>Explorar Tablero 1: Operaciones</span>
            </router-link>
            <router-link to="/territorio" class="btn btn-secondary">
              <Map :size="16" />
              <span>Explorar Tablero 2: Jerarquía Territorial</span>
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
          <span class="hero-brand-sublabel">Aliado de Sostenibilidad</span>
        </div>
      </div>
    </section>

    <!-- Executive KPIs -->
    <section class="kpi-section">
      <div class="section-header">
        <h2 class="section-title">Métricas Clave de la Red</h2>
        <span class="badge">Datos Consolidados 2026</span>
      </div>

      <div v-if="loading" class="spinner-container">
        <div class="spinner"></div>
      </div>

      <div v-else-if="kpis" class="grid-4">
        <KpiCard
          title="Torres Georreferenciadas"
          :value="kpis.total_equipos.toLocaleString()"
          subtitle="Activos de transmisión eléctrica"
          color="emerald"
        />
        <KpiCard
          title="Avisos de Mantenimiento"
          :value="kpis.total_avisos.toLocaleString()"
          subtitle="Tickets históricos registrados"
          color="cyan"
        />
        <KpiCard
          title="Cumplimiento de SLA"
          :value="`${kpis.pct_cumplimiento}%`"
          subtitle="Avisos atendidos en plazo"
          color="mint"
        />
        <KpiCard
          title="Incidentes por Vegetación"
          :value="`${kpis.pct_vegetacion}%`"
          subtitle="Principal causa de intervención"
          color="amber"
        />
      </div>
    </section>

    <!-- Feature Cards -->
    <section class="features-section grid-2">
      <div class="feature-card card">
        <div class="feature-icon">
          <Zap :size="28" color="#0D9763" />
        </div>
        <h3 class="feature-title">Tablero 1: Eficiencia Operativa y Tiempos</h3>
        <p class="feature-text">
          Análisis de cumplimiento por nivel de prioridad (Muy Alta, Alta, Media, Baja), correlación de días abiertos y distribución por tipología de aviso.
        </p>
        <router-link to="/operaciones" class="btn btn-sm" style="margin-top: 14px;">
          <span>Abrir Tablero Operativo</span>
          <ChevronRight :size="14" />
        </router-link>
      </div>

      <div class="feature-card card">
        <div class="feature-icon">
          <Map :size="28" color="#0284C7" />
        </div>
        <h3 class="feature-title">Tablero 2: Estructura Jerárquica y Cobertura</h3>
        <p class="feature-text">
          Navegación interactiva con Treemap multinivel (País ➔ Depto ➔ Municipio), Sunburst concéntrico de 3 capas y auditoría detallada de tickets por ciudad.
        </p>
        <router-link to="/territorio" class="btn btn-sm" style="margin-top: 14px;">
          <span>Abrir Tablero Territorial</span>
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
  background: linear-gradient(135deg, rgba(13, 151, 99, 0.12) 0%, rgba(2, 132, 199, 0.08) 100%), var(--bg-card);
  padding: 40px 36px;
  border: 1px solid rgba(16, 185, 129, 0.25);
}

.hero-layout {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 32px;
}

.hero-content {
  max-width: 700px;
}

.hero-logo-box {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 32px 28px;
  background: var(--bg-card);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-md);
  min-width: 280px;
}

.hero-brand-logo {
  height: 110px;
  width: auto;
  max-width: 220px;
  object-fit: contain;
  margin-bottom: 16px;
  filter: drop-shadow(0 6px 10px rgba(0, 0, 0, 0.12));
}

.hero-brand-label {
  font-size: 1.05rem;
  font-weight: 800;
  color: var(--text-primary);
  text-align: center;
  letter-spacing: -0.2px;
}

.hero-brand-sublabel {
  font-size: 0.8rem;
  font-weight: 600;
  color: var(--color-emerald);
  text-align: center;
  margin-top: 2px;
}

.hero-title {
  font-size: 2.2rem;
  font-weight: 800;
  color: var(--text-primary);
  line-height: 1.25;
  margin: 14px 0 12px;
  letter-spacing: -0.5px;
}

.hero-description {
  font-size: 1.05rem;
  color: var(--text-secondary);
  line-height: 1.6;
  margin-bottom: 24px;
}

.hero-actions {
  display: flex;
  gap: 14px;
  flex-wrap: wrap;
}

.section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
}

.section-title {
  font-size: 1.3rem;
  font-weight: 700;
  color: var(--text-primary);
}

.features-section {
  margin-top: 8px;
}

.feature-card {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  padding: 28px;
}

.feature-icon {
  font-size: 2rem;
  margin-bottom: 12px;
}

.feature-title {
  font-size: 1.2rem;
  font-weight: 700;
  color: var(--text-primary);
  margin-bottom: 8px;
}

.feature-text {
  font-size: 0.9rem;
  color: var(--text-secondary);
  line-height: 1.6;
  flex: 1;
}

@media (max-width: 768px) {
  .hero-title {
    font-size: 1.6rem;
  }
}
</style>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { Activity } from 'lucide-vue-next';
import { apiService } from '../services/api';
import type { PortadaKpis, OpenBacklogCell } from '../types/models';
import KpiCard from '../components/common/KpiCard.vue';
import OpenBacklogExplorer from '../components/charts/OpenBacklogExplorer.vue';
import { useThemeStore } from '../stores/themeStore';

const themeStore = useThemeStore();
const loading = ref(true);
const kpis = ref<PortadaKpis | null>(null);
const openMatrix = ref<OpenBacklogCell[]>([]);

onMounted(async () => {
  try {
    const [portadaRes, matrixRes] = await Promise.all([
      apiService.getPortadaKpis(),
      apiService.getOpenBacklogMatrix(),
    ]);
    kpis.value = portadaRes;
    openMatrix.value = matrixRes;
  } catch (err) {
    console.error('Error cargando portada:', err);
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
          :value="`${kpis.cumplimiento_oportuno_pct ?? kpis.pct_cumplimiento}%`"
          badge="Cerrados"
          :subtitle="kpis.cerrados_a_tiempo != null && kpis.cerrados_fuera_plazo != null ? `${kpis.cerrados_a_tiempo.toLocaleString()} a tiempo · ${kpis.cerrados_fuera_plazo.toLocaleString()} fuera de plazo` : 'Cerrados en plazo (corte 2023-05-06)'"
          color="brand"
        />
        <KpiCard
          title="Avisos Abiertos"
          :value="kpis.avisos_abiertos ?? 0"
          badge="Pendientes"
          :subtitle="`${(kpis.abiertos_vencidos ?? 0).toLocaleString()} ya superaron el plazo SLA`"
          color="danger"
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

    <!-- Comparativa Tridimensional de Avisos Abiertos: Departamento × Año × Tipo -->
    <OpenBacklogExplorer v-if="openMatrix.length" :cells="openMatrix" />
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
  padding: 12px 22px;
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
  font-size: 1.35rem;
  font-weight: 800;
  line-height: 1.2;
  margin: 5px 0 5px;
  color: var(--text-primary);
  letter-spacing: -0.02em;
}

.hero-description {
  font-size: 0.83rem;
  color: var(--text-secondary);
  line-height: 1.42;
  margin-bottom: 9px;
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
  height: 44px;
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

@media (max-width: 1024px) {
  .home-view {
    height: auto;
    overflow: visible;
  }
  .hero-layout {
    flex-direction: column;
    align-items: flex-start;
  }
  .grid-4 {
    grid-template-columns: 1fr;
  }
}
</style>

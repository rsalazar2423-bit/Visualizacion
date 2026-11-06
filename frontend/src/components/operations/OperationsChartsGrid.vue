<script setup lang="ts">
import { ref } from 'vue';
import { Target, PieChart, TrendingUp, X, LayoutGrid } from 'lucide-vue-next';
import { useOperationsStore } from '../../stores/operationsStore';
import TimeEvolutionChart from '../charts/TimeEvolutionChart.vue';
import StackedBarChart from '../charts/StackedBarChart.vue';
import DonutChart from '../charts/DonutChart.vue';

const opsStore = useOperationsStore();
const activeTab = ref<'evolution' | 'breakdown' | 'all'>('evolution');
</script>

<template>
  <section class="step-section">
    <div class="step-title-bar">
      <span class="badge badge-step">PASO 3</span>
      <b>Evolución Temporal, Cumplimiento por Prioridad y Composición</b>
    </div>

    <!-- Pestañas Tácticas para Eliminar Scroll -->
    <div class="tactical-tabs-nav" role="tablist">
      <button
        class="tab-btn"
        :class="{ active: activeTab === 'evolution' }"
        role="tab"
        :aria-selected="activeTab === 'evolution'"
        @click="activeTab = 'evolution'"
      >
        <TrendingUp :size="15" />
        <span>1. Dinámica Temporal (Ingresos vs. Cierres)</span>
      </button>

      <button
        class="tab-btn"
        :class="{ active: activeTab === 'breakdown' }"
        role="tab"
        :aria-selected="activeTab === 'breakdown'"
        @click="activeTab = 'breakdown'"
      >
        <Target :size="15" />
        <span>2. Compromisos SLA y Tipologías</span>
      </button>

      <button
        class="tab-btn"
        :class="{ active: activeTab === 'all' }"
        role="tab"
        :aria-selected="activeTab === 'all'"
        @click="activeTab = 'all'"
      >
        <LayoutGrid :size="15" />
        <span>Vista Integral (Ambos Bloques)</span>
      </button>
    </div>

    <!-- Bloque 1: Evolución Histórica Ingresos vs. Cierres -->
    <div v-show="activeTab === 'evolution' || activeTab === 'all'" class="card tab-pane">
      <div class="chart-header-block">
        <div class="header-main-row">
          <div class="title-with-badge">
            <span class="badge">
              <TrendingUp :size="13" /> Dinámica Operativa
            </span>
            <h3 class="card-title">Evolución de Avisos Ingresados vs. Cerrados y Cumplimiento</h3>
          </div>
        </div>
        <p class="chart-reseña">
          Comportamiento histórico de la demanda de incidentes frente a la capacidad de cierre anual, permitiendo identificar periodos de acumulación de trabajo (backlog) y cambios en el tiempo típico de respuesta.
        </p>
      </div>
      <TimeEvolutionChart />
    </div>

    <!-- Bloque 2: Cumplimiento por Prioridad (100% Apilada) + Composición por Tipología -->
    <div v-show="activeTab === 'breakdown' || activeTab === 'all'" class="grid-2 tab-pane">
      <!-- Tarjeta 1: Gráfico de Cumplimiento de Plazo (SLA) -->
      <div class="card">
        <div class="chart-header-block">
          <div class="header-main-row">
            <div class="title-with-badge">
              <span class="badge badge-tag">
                <Target :size="13" /> Compromisos SLA
              </span>
              <h3 class="card-title">Cumplimiento de Plazo por Prioridad (100%)</h3>
            </div>
            <button
              v-if="opsStore.selectedPrioridad"
              class="btn btn-sm btn-clear-tag"
              @click="opsStore.setPrioridad(opsStore.selectedPrioridad)"
            >
              <X :size="12" /> Quitar Plazo: {{ opsStore.selectedPrioridad }}
            </button>
          </div>

          <p class="chart-reseña">
            Comparación porcentual al 100% entre atención oportuna (Cumple) e incumplimiento (Excede) según el horizonte de prioridad asignado al aviso.
          </p>
        </div>
        <StackedBarChart />
      </div>

      <!-- Tarjeta 2: Gráfico de Distribución por Tipo de Aviso -->
      <div class="card">
        <div class="chart-header-block">
          <div class="header-main-row">
            <div class="title-with-badge">
              <span class="badge badge-tag">
                <PieChart :size="13" /> Composición Técnica
              </span>
              <h3 class="card-title">Distribución por Tipología de Aviso</h3>
            </div>
            <button
              v-if="opsStore.selectedTipos.length > 0"
              class="btn btn-sm btn-clear-tag"
              @click="opsStore.toggleTipo('Todos')"
            >
              <X :size="12" /> Restablecer Tipos
            </button>
          </div>

          <p class="chart-reseña">
            Participación relativa de cada factor técnico sobre la red de transmisión (Vegetación, Construcciones, Obras, Permisos e Invasión de servidumbre).
          </p>
        </div>
        <DonutChart />
      </div>
    </div>
  </section>
</template>

<style scoped>
.tactical-tabs-nav {
  display: flex;
  align-items: center;
  gap: 8px;
  background: var(--bg-subtle);
  padding: 6px;
  border-radius: var(--radius-md);
  border: 1px solid var(--border-subtle);
  margin-bottom: 14px;
  overflow-x: auto;
}

.tab-btn {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  background: transparent;
  color: var(--text-secondary);
  border: none;
  border-radius: var(--radius-sm);
  font-size: 0.86rem;
  font-weight: 600;
  cursor: pointer;
  transition: all var(--transition-fast);
  white-space: nowrap;
}

.tab-btn:hover {
  color: var(--text-primary);
  background: var(--bg-card-hover);
}

.tab-btn.active {
  background: var(--bg-card);
  color: var(--color-brand);
  box-shadow: var(--shadow-sm);
  border: 1px solid var(--border-subtle);
  font-weight: 700;
}

.tab-pane {
  animation: fadeIn 0.18s ease-in-out;
}

@keyframes fadeIn {
  from {
    opacity: 0.8;
    transform: translateY(2px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>

<script setup lang="ts">
import { Target, PieChart, TrendingUp, X } from 'lucide-vue-next';
import { useOperationsStore } from '../../stores/operationsStore';
import TimeEvolutionChart from '../charts/TimeEvolutionChart.vue';
import StackedBarChart from '../charts/StackedBarChart.vue';
import DonutChart from '../charts/DonutChart.vue';

const opsStore = useOperationsStore();
</script>

<template>
  <section class="step-section">
    <div class="step-title-bar">
      <span class="badge badge-step">PASO 3</span>
      <b>Evolución Temporal, Cumplimiento por Prioridad y Composición</b>
    </div>

    <!-- Fila 1: Evolución Histórica Ingresos vs. Cierres -->
    <div class="card">
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

    <!-- Fila 2: Cumplimiento por Prioridad (100% Apilada) + Composición por Tipología -->
    <div class="grid-2">
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

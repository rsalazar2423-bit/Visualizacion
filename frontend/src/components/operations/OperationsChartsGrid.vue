<script setup lang="ts">
import { Target, PieChart, X } from 'lucide-vue-next';
import { useOperationsStore } from '../../stores/operationsStore';
import StackedBarChart from '../charts/StackedBarChart.vue';
import DonutChart from '../charts/DonutChart.vue';

const opsStore = useOperationsStore();
</script>

<template>
  <section class="step-section">
    <div class="step-title-bar">
      <span class="badge badge-step">PASO 3</span>
      <b>Distribución Visual de SLA y Categorías</b>
    </div>

    <div class="grid-2">
      <!-- Tarjeta 1: Gráfico de Cumplimiento de Plazo (SLA) -->
      <div class="card">
        <div class="chart-header-block">
          <div class="header-main-row">
            <div class="title-with-badge">
              <span class="badge badge-tag">
                <Target :size="13" /> Eficiencia Operativa
              </span>
              <h3 class="card-title">Cumplimiento de Plazo por Prioridad (SLA)</h3>
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
            Evaluación porcentual acumulada (100% apilada) del cumplimiento de tiempos de respuesta: contraste entre atención oportuna (Cumple) y morosidad (Excede) en cada nivel de criticidad técnica.
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
            Participación relativa de cada factor de afectación a la red de transmisión (Vegetación, Construcciones, Obras Civiles y Permisos de Ingreso) sobre el total de tickets gestionados.
          </p>
        </div>
        <DonutChart />
      </div>
    </div>
  </section>
</template>


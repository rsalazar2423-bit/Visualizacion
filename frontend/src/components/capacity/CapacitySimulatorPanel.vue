<script setup lang="ts">
import { Sliders, Users } from 'lucide-vue-next';
import { useCapacityStore } from '../../stores/capacityStore';

const store = useCapacityStore();
</script>

<template>
  <section class="step-section">
    <div class="step-title-bar">
      <span class="badge badge-step">PASO 4</span>
      <b>Simulador de Escenarios de Asignación de Cuadrillas (Supuestos Explícitos)</b>
    </div>

    <div class="card simulator-card">
      <div class="sim-controls-col">
        <h3 class="sim-title">
          <Sliders :size="18" /> Parámetros de Capacidad Operativa
        </h3>
        <p class="sim-desc">
          Ajusta los supuestos de disponibilidad de cuadrillas especializadas y ritmo mensual de intervención para estimar el tiempo de evacuación del backlog en la zona seleccionada.
        </p>

        <div class="sim-slider-group">
          <div class="sim-label-row">
            <span>Cuadrillas Especializadas Asignadas</span>
            <b>{{ store.crewsCount }} cuadrillas</b>
          </div>
          <input v-model.number="store.crewsCount" type="range" min="1" max="25" step="1" class="sim-range" />
        </div>

        <div class="sim-slider-group">
          <div class="sim-label-row">
            <span>Capacidad Media de Cierre por Cuadrilla / Mes</span>
            <b>{{ store.closuresPerCrewMonth }} avisos / mes</b>
          </div>
          <input v-model.number="store.closuresPerCrewMonth" type="range" min="2" max="20" step="1" class="sim-range" />
        </div>

        <div class="sim-slider-group">
          <div class="sim-label-row">
            <span>Dedicación Prioritaria a Abiertos Vencidos</span>
            <b>{{ store.pctFocusVencidos }}% de la capacidad ({{ store.scenarioProjection.monthlyVencidosCleared }} avisos/mes)</b>
          </div>
          <input v-model.number="store.pctFocusVencidos" type="range" min="20" max="100" step="5" class="sim-range" />
        </div>
      </div>

      <div class="sim-results-col">
        <div class="sim-result-header">
          <Users :size="16" />
          <span>Resultado Proyectado del Escenario</span>
        </div>

        <div class="sim-metrics-grid">
          <div class="sim-metric-box">
            <span class="sim-m-label">Capacidad Total de Cierre</span>
            <div class="sim-m-val brand">{{ store.scenarioProjection.monthlyCapacity }} <small>avisos / mes</small></div>
            <span class="sim-m-sub">Con {{ store.crewsCount }} cuadrillas activas</span>
          </div>

          <div class="sim-metric-box">
            <span class="sim-m-label">Evacuación de Abiertos Vencidos</span>
            <div class="sim-m-val danger">{{ store.scenarioProjection.monthsToClearVencidos }} <small>meses</small></div>
            <span class="sim-m-sub">Para cerrar {{ store.capacityData?.kpis.abiertos_vencidos || 0 }} vencidos</span>
          </div>

          <div class="sim-metric-box">
            <span class="sim-m-label">Saneamiento Total de Abiertos</span>
            <div class="sim-m-val info">{{ store.scenarioProjection.monthsToClearAllOpen }} <small>meses</small></div>
            <span class="sim-m-sub">Para evacuar {{ store.capacityData?.kpis.avisos_abiertos || 0 }} pendientes</span>
          </div>

          <div class="sim-metric-box">
            <span class="sim-m-label">Cumplimiento Oportuno (Horizonte 6M)</span>
            <div class="sim-m-val success">{{ store.scenarioProjection.projectedCompliance6m }}%</div>
            <span class="sim-m-sub">Desde {{ store.capacityData?.kpis.cumplimiento_oportuno_pct || 0 }}% actual</span>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

<style scoped>
.simulator-card {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 28px;
  align-items: center;
}

.sim-controls-col {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.sim-title {
  font-size: 1.1rem;
  font-weight: 800;
  color: var(--text-primary);
  display: inline-flex;
  align-items: center;
  gap: 8px;
}

.sim-desc {
  font-size: 0.85rem;
  color: var(--text-secondary);
  line-height: 1.5;
}

.sim-slider-group {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.sim-label-row {
  display: flex;
  justify-content: space-between;
  font-size: 0.82rem;
  color: var(--text-secondary);
}

.sim-label-row b {
  color: var(--color-brand);
}

.sim-range {
  width: 100%;
  accent-color: var(--color-brand);
  cursor: pointer;
}

.sim-results-col {
  background: var(--bg-subtle);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-md);
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.sim-result-header {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  font-size: 0.82rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  color: var(--text-secondary);
}

.sim-metrics-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
}

.sim-metric-box {
  background: var(--bg-card);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-sm);
  padding: 14px;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.sim-m-label {
  font-size: 0.74rem;
  font-weight: 600;
  color: var(--text-secondary);
}

.sim-m-val {
  font-size: 1.5rem;
  font-weight: 800;
  font-variant-numeric: tabular-nums;
}

.sim-m-val small {
  font-size: 0.8rem;
  font-weight: 600;
}

.sim-m-val.brand { color: var(--color-brand); }
.sim-m-val.danger { color: var(--sla-danger); }
.sim-m-val.info { color: var(--sla-info); }
.sim-m-val.success { color: var(--sla-success); }

.sim-m-sub {
  font-size: 0.72rem;
  color: var(--text-muted);
}

@media (max-width: 900px) {
  .simulator-card {
    grid-template-columns: 1fr;
  }
}
</style>


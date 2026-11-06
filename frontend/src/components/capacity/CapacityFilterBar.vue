<script setup lang="ts">
import { RotateCcw } from 'lucide-vue-next';
import { useCapacityStore } from '../../stores/capacityStore';

const store = useCapacityStore();
</script>

<template>
  <section class="step-section">
    <div class="step-title-bar">
      <span class="badge badge-step">PASO 1</span>
      <b>Segmentación Regional de Capacidad</b>
    </div>

    <div class="card filter-grid">
      <div class="filter-group">
        <label class="filter-label">Zona / Centro de Transmisión (CTE)</label>
        <select
          :value="store.selectedCte"
          class="form-select"
          @change="store.setCte(($event.target as HTMLSelectElement).value)"
        >
          <option v-for="c in store.filterOptions.ctes" :key="c" :value="c">
            {{ c === 'Todos' ? 'Todas las Zonas (Suroccidente & Centro)' : c }}
          </option>
        </select>
      </div>

      <div class="filter-group">
        <label class="filter-label">Departamento</label>
        <select
          :value="store.selectedDepto"
          class="form-select"
          @change="store.setDepto(($event.target as HTMLSelectElement).value)"
        >
          <option v-for="d in store.filterOptions.departamentos" :key="d" :value="d">
            {{ d === 'Todos' ? 'Todos los Departamentos' : d }}
          </option>
        </select>
      </div>

      <div class="filter-group">
        <button class="btn btn-secondary" @click="store.resetFilters">
          <RotateCcw :size="15" />
          <span>Restablecer Vista</span>
        </button>
      </div>
    </div>
  </section>
</template>


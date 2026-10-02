<script setup lang="ts">
import { useOperationsStore } from '../../stores/operationsStore';

const opsStore = useOperationsStore();
</script>

<template>
  <section class="step-section">
    <div class="step-title-bar">
      <span class="badge badge-step">PASO 1</span>
      <b>Filtros de Control Operativo</b>
    </div>

    <div class="filter-card card">
      <div class="filter-grid">
        <div class="filter-group">
          <label class="filter-label">Macro-Región (CTE):</label>
          <select
            :value="opsStore.selectedCte"
            class="form-select"
            @change="opsStore.setCte(($event.target as HTMLSelectElement).value)"
          >
            <option v-for="c in opsStore.filterOptions.ctes" :key="c" :value="c">
              {{ c === 'Todos' ? 'Todas las CTEs (Nacional)' : `CTE ${c}` }}
            </option>
          </select>
        </div>

        <div class="filter-group">
          <label class="filter-label">Departamento:</label>
          <select
            :value="opsStore.selectedDepto"
            class="form-select"
            @change="opsStore.setDepto(($event.target as HTMLSelectElement).value)"
          >
            <option v-for="d in opsStore.filterOptions.departamentos" :key="d" :value="d">
              {{ d === 'Todos' ? 'Todos los Departamentos' : d }}
            </option>
          </select>
        </div>

        <div class="filter-group">
          <label class="filter-label">Tipo de Aviso:</label>
          <select
            :value="opsStore.selectedTipos.length === 1 ? opsStore.selectedTipos[0] : (opsStore.selectedTipos.length === 0 ? 'Todos' : '__multi__')"
            class="form-select"
            @change="opsStore.setSingleTipo(($event.target as HTMLSelectElement).value)"
          >
            <option value="Todos">Todos los Tipos de Aviso</option>
            <option v-if="opsStore.selectedTipos.length > 1" value="__multi__" disabled>
              {{ opsStore.selectedTipos.length }} tipos seleccionados (ver botones)
            </option>
            <option
              v-for="t in opsStore.filterOptions.tipos.filter((x: string) => x !== 'Todos')"
              :key="t"
              :value="t"
            >
              {{ t }}
            </option>
          </select>
        </div>

        <div class="filter-group">
          <label class="filter-label">Ciudad / Municipio:</label>
          <select
            :value="opsStore.selectedMunicipio"
            class="form-select"
            @change="opsStore.setMunicipio(($event.target as HTMLSelectElement).value)"
          >
            <option
              v-for="m in opsStore.filterOptions.municipios"
              :key="m.value"
              :value="m.value"
            >
              {{ m.label }}
            </option>
          </select>
        </div>

        <div class="filter-group filter-actions">
          <label class="filter-label">Restablecer:</label>
          <button class="btn btn-secondary" @click="opsStore.resetFilters">
            Restablecer Filtros ↺
          </button>
        </div>
      </div>
    </div>
  </section>
</template>


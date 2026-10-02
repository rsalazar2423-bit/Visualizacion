<script setup lang="ts">
import { useTerritoryStore } from '../../stores/territoryStore';

const territoryStore = useTerritoryStore();
</script>

<template>
  <section class="step-section">
    <div class="step-title-bar">
      <span class="badge badge-step">PASO 1</span>
      <b>Filtro Territorial & Búsqueda por Ciudad</b>
    </div>

    <div class="filter-card card">
      <div class="filter-grid">
        <div class="filter-group">
          <label class="filter-label">Macro-Región (CTE):</label>
          <select
            :value="territoryStore.selectedCte"
            class="form-select"
            @change="territoryStore.setCte(($event.target as HTMLSelectElement).value)"
          >
            <option v-for="c in territoryStore.filterOptions.ctes" :key="c" :value="c">
              {{ c === 'Todos' ? 'Todas las CTEs (Nacional)' : `CTE ${c}` }}
            </option>
          </select>
        </div>

        <div class="filter-group">
          <label class="filter-label">Departamento:</label>
          <select
            :value="territoryStore.selectedDepto || 'Todos'"
            class="form-select"
            @change="territoryStore.setDepto(($event.target as HTMLSelectElement).value)"
          >
            <option
              v-for="d in territoryStore.filterOptions.departamentos"
              :key="d"
              :value="d"
            >
              {{ d === 'Todos' ? 'Todos los Departamentos' : d }}
            </option>
          </select>
        </div>

        <div class="filter-group">
          <label class="filter-label">Consultar Tickets por Ciudad / Municipio:</label>
          <select
            :value="territoryStore.selectedMunicipio || 'Todos'"
            class="form-select"
            @change="territoryStore.setCityDropdown(($event.target as HTMLSelectElement).value)"
          >
            <option
              v-for="m in territoryStore.filterOptions.municipios"
              :key="m.value"
              :value="m.value"
            >
              {{ m.label }}
            </option>
          </select>
        </div>

        <div class="filter-group filter-status">
          <label class="filter-label">Filtro Activo / Restablecer:</label>
          <div class="status-box">
            <span class="badge badge-active-territory">{{ territoryStore.activeFilterBadge }}</span>
            <button class="btn btn-secondary btn-sm" @click="territoryStore.resetAllFilters">
              Restablecer Filtros ↺
            </button>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>


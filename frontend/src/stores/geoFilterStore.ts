import { defineStore } from 'pinia';
import { ref } from 'vue';
import { apiService } from '../services/api';
import type { FilterOptionsResponse } from '../types/models';

export const useGeoFilterStore = defineStore('geoFilter', () => {
  const selectedCte = ref('Todos');
  const selectedDepto = ref('Todos');
  const selectedMunicipio = ref('Todos');

  const filterOptions = ref<FilterOptionsResponse>({
    ctes: ['Todos'],
    tipos: ['Todos'],
    departamentos: ['Todos'],
    municipios: [{ label: 'Todas las Ciudades / Municipios', value: 'Todos' }],
  });

  async function loadFilterOptions() {
    try {
      filterOptions.value = await apiService.getFilterOptions(
        selectedCte.value,
        selectedDepto.value !== 'Todos' ? selectedDepto.value : null
      );
    } catch (err: any) {
      console.error('Error loading filter options:', err);
    }
  }

  async function setCte(val: string) {
    selectedCte.value = val;
    selectedDepto.value = 'Todos';
    selectedMunicipio.value = 'Todos';
    await loadFilterOptions();
  }

  async function setDepto(val: string) {
    selectedDepto.value = val;
    selectedMunicipio.value = 'Todos';
    await loadFilterOptions();
  }

  function setMunicipio(val: string) {
    selectedMunicipio.value = val;
  }

  async function resetGeoFilters() {
    selectedCte.value = 'Todos';
    selectedDepto.value = 'Todos';
    selectedMunicipio.value = 'Todos';
    await loadFilterOptions();
  }

  return {
    selectedCte,
    selectedDepto,
    selectedMunicipio,
    filterOptions,
    loadFilterOptions,
    setCte,
    setDepto,
    setMunicipio,
    resetGeoFilters,
  };
});

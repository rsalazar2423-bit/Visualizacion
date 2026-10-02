import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { apiService } from '../services/api';
import { useGeoFilterStore } from './geoFilterStore';
import type { OperationsDataResponse } from '../types/models';

export const useOperationsStore = defineStore('operations', () => {
  const geoStore = useGeoFilterStore();
  const loading = ref(false);
  const error = ref<string | null>(null);

  // Operational Filters
  const selectedTipos = ref<string[]>([]);
  const selectedPrioridad = ref<string | null>(null);

  // Backward-compatible single tipo computed string
  const selectedTipo = computed(() => {
    if (selectedTipos.value.length === 1) return selectedTipos.value[0];
    if (selectedTipos.value.length === 0) return 'Todos';
    return 'Multi';
  });

  // Data
  const data = ref<OperationsDataResponse | null>(null);

  async function fetchData() {
    loading.value = true;
    error.value = null;
    try {
      const tipoParam = selectedTipos.value.length > 0 ? selectedTipos.value.join(',') : 'Todos';
      data.value = await apiService.getOperationsData({
        cte: geoStore.selectedCte,
        depto: geoStore.selectedDepto,
        municipio: geoStore.selectedMunicipio,
        tipo: tipoParam,
        prioridad: selectedPrioridad.value,
      });
    } catch (err: any) {
      error.value = err.message || 'Error cargando datos operativos';
    } finally {
      loading.value = false;
    }
  }

  function isTipoSelected(val: string): boolean {
    if (val === 'Todos') {
      return selectedTipos.value.length === 0;
    }
    return selectedTipos.value.includes(val);
  }

  async function toggleTipo(val: string) {
    if (val === 'Todos') {
      selectedTipos.value = [];
    } else {
      const idx = selectedTipos.value.indexOf(val);
      if (idx >= 0) {
        selectedTipos.value.splice(idx, 1);
      } else {
        selectedTipos.value.push(val);
      }
    }
    await fetchData();
  }

  async function setSingleTipo(val: string) {
    if (val === 'Todos') {
      selectedTipos.value = [];
    } else {
      selectedTipos.value = [val];
    }
    await fetchData();
  }

  async function setPrioridad(val: string) {
    if (selectedPrioridad.value === val) {
      selectedPrioridad.value = null;
    } else {
      selectedPrioridad.value = val;
    }
    await fetchData();
  }

  async function resetFilters() {
    await geoStore.resetGeoFilters();
    selectedTipos.value = [];
    selectedPrioridad.value = null;
    await fetchData();
  }

  return {
    loading,
    error,
    data,
    selectedTipos,
    selectedTipo,
    selectedPrioridad,
    // Delegated to geoStore (avoiding duplication)
    selectedCte: computed(() => geoStore.selectedCte),
    selectedDepto: computed(() => geoStore.selectedDepto),
    selectedMunicipio: computed(() => geoStore.selectedMunicipio),
    filterOptions: computed(() => geoStore.filterOptions),
    setCte: async (val: string) => {
      await geoStore.setCte(val);
      await fetchData();
    },
    setDepto: async (val: string) => {
      await geoStore.setDepto(val);
      await fetchData();
    },
    setMunicipio: async (val: string) => {
      geoStore.setMunicipio(val);
      await fetchData();
    },
    loadFilterOptions: () => geoStore.loadFilterOptions(),
    isTipoSelected,
    toggleTipo,
    setTipo: toggleTipo,
    setSingleTipo,
    setPrioridad,
    fetchData,
    resetFilters,
  };
});

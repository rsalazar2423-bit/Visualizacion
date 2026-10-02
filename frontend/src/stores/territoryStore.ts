import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { apiService } from '../services/api';
import { useGeoFilterStore } from './geoFilterStore';
import type { TerritorialDataResponse } from '../types/models';

export interface BreadcrumbItem {
  label: string;
  level: 'root' | 'depto' | 'mpio';
  depto?: string;
  mpio?: string;
}

export const useTerritoryStore = defineStore('territory', () => {
  const geoStore = useGeoFilterStore();
  const loading = ref(false);
  const error = ref<string | null>(null);

  // Data
  const data = ref<TerritorialDataResponse | null>(null);

  // Delegated geo state (read-through to central store)
  const selectedCte = computed(() => geoStore.selectedCte);
  const selectedDepto = computed({
    get: () => geoStore.selectedDepto !== 'Todos' ? geoStore.selectedDepto : null,
    set: (val: string | null) => { geoStore.selectedDepto = val ?? 'Todos'; },
  });
  const selectedMunicipio = computed({
    get: () => geoStore.selectedMunicipio !== 'Todos' ? geoStore.selectedMunicipio : null,
    set: (val: string | null) => { geoStore.selectedMunicipio = val ?? 'Todos'; },
  });
  const filterOptions = computed(() => geoStore.filterOptions);

  // Dynamic Breadcrumb
  const breadcrumbs = computed<BreadcrumbItem[]>(() => {
    const rootTitle = geoStore.selectedCte !== 'Todos' ? `CTE ${geoStore.selectedCte}` : 'Toda Colombia';
    const items: BreadcrumbItem[] = [
      { label: rootTitle, level: 'root' },
    ];

    if (selectedDepto.value) {
      items.push({
        label: selectedDepto.value,
        level: 'depto',
        depto: selectedDepto.value,
      });
    }

    if (selectedMunicipio.value) {
      items.push({
        label: selectedMunicipio.value,
        level: 'mpio',
        depto: selectedDepto.value || undefined,
        mpio: selectedMunicipio.value,
      });
    }

    return items;
  });

  // Current Active Badge Text
  const activeFilterBadge = computed(() => {
    if (selectedMunicipio.value) {
      return `Ciudad: ${selectedMunicipio.value} (${selectedDepto.value || 'Colombia'})`;
    }
    if (selectedDepto.value) {
      return `Depto: ${selectedDepto.value}`;
    }
    if (geoStore.selectedCte !== 'Todos') {
      return `CTE: ${geoStore.selectedCte}`;
    }
    return 'Mostrando: Todo el Territorio';
  });

  async function loadFilterOptions() {
    await geoStore.loadFilterOptions();
  }

  async function fetchData() {
    loading.value = true;
    error.value = null;
    try {
      data.value = await apiService.getTerritorialData({
        cte: geoStore.selectedCte,
        depto: selectedDepto.value,
        municipio: selectedMunicipio.value,
      });
    } catch (err: any) {
      error.value = err.message || 'Error cargando datos territoriales';
    } finally {
      loading.value = false;
    }
  }

  async function setCte(val: string) {
    await geoStore.setCte(val);
    await fetchData();
  }

  async function setDepto(val: string) {
    if (!val || val === 'Todos') {
      selectedDepto.value = null;
    } else {
      selectedDepto.value = val;
    }
    selectedMunicipio.value = null;
    await geoStore.loadFilterOptions();
    await fetchData();
  }

  async function setCityDropdown(val: string) {
    if (!val || val === 'Todos') {
      selectedMunicipio.value = null;
    } else {
      selectedMunicipio.value = val;
    }
    await fetchData();
  }

  async function drillIntoDepto(deptoName: string) {
    selectedDepto.value = deptoName;
    selectedMunicipio.value = null;
    await geoStore.loadFilterOptions();
    await fetchData();
  }

  async function drillIntoMunicipio(deptoName: string, mpioName: string) {
    selectedDepto.value = deptoName;
    selectedMunicipio.value = mpioName;
    await geoStore.loadFilterOptions();
    await fetchData();
  }

  async function ascendLevel() {
    if (selectedMunicipio.value) {
      selectedMunicipio.value = null;
    } else if (selectedDepto.value) {
      selectedDepto.value = null;
    }
    await geoStore.loadFilterOptions();
    await fetchData();
  }

  async function resetToNational() {
    selectedDepto.value = null;
    selectedMunicipio.value = null;
    await geoStore.loadFilterOptions();
    await fetchData();
  }

  async function resetAllFilters() {
    await geoStore.resetGeoFilters();
    await fetchData();
  }

  return {
    loading,
    error,
    selectedCte,
    selectedDepto,
    selectedMunicipio,
    filterOptions,
    data,
    breadcrumbs,
    activeFilterBadge,
    loadFilterOptions,
    fetchData,
    setCte,
    setDepto,
    setCityDropdown,
    drillIntoDepto,
    drillIntoMunicipio,
    ascendLevel,
    resetToNational,
    resetAllFilters,
  };
});

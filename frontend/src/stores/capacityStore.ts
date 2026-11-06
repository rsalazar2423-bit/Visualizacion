/**
 * Responsabilidad Única (SRP):
 * Estado reactivo de la Vista 03 (Capacidad y Mejora Operativa), carga de datos regionales
 * y cálculo del Simulador de Escenarios de Asignación de Cuadrillas.
 */

import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { apiService } from '../services/api';
import type { CapacityDataResponse, FilterOptionsResponse } from '../types/models';

export const useCapacityStore = defineStore('capacity', () => {
  const loading = ref(true);
  const filterOptions = ref<FilterOptionsResponse>({
    ctes: ['Todos'],
    departamentos: ['Todos'],
    municipios: [],
    tipos: ['Todos'],
  });

  const selectedCte = ref<string>('Todos');
  const selectedDepto = ref<string>('Todos');
  const capacityData = ref<CapacityDataResponse | null>(null);

  // Parámetros del Simulador de Capacidad y Asignación de Recursos (Vista 3 del Documento)
  const crewsCount = ref<number>(8);
  const closuresPerCrewMonth = ref<number>(6);
  const pctFocusVencidos = ref<number>(70);

  async function loadAll() {
    loading.value = true;
    try {
      filterOptions.value = await apiService.getFilterOptions(selectedCte.value, selectedDepto.value);
      capacityData.value = await apiService.getCapacityData({
        cte: selectedCte.value,
        depto: selectedDepto.value,
      });
    } finally {
      loading.value = false;
    }
  }

  function setCte(cte: string) {
    selectedCte.value = cte;
    selectedDepto.value = 'Todos';
    loadAll();
  }

  function setDepto(depto: string) {
    selectedDepto.value = depto;
    loadAll();
  }

  function resetFilters() {
    selectedCte.value = 'Todos';
    selectedDepto.value = 'Todos';
    loadAll();
  }

  const scenarioProjection = computed(() => {
    const k = capacityData.value?.kpis;
    if (!k) {
      return {
        monthlyCapacity: 0,
        monthlyVencidosCleared: 0,
        monthsToClearVencidos: 0,
        monthsToClearAllOpen: 0,
        projectedCompliance6m: 0,
      };
    }
    const monthlyCapacity = crewsCount.value * closuresPerCrewMonth.value;
    const monthlyVencidosCleared = Math.max(1, Math.round(monthlyCapacity * (pctFocusVencidos.value / 100)));
    const monthsToClearVencidos =
      k.abiertos_vencidos > 0 ? Number((k.abiertos_vencidos / monthlyVencidosCleared).toFixed(1)) : 0;
    const monthsToClearAllOpen =
      k.avisos_abiertos > 0 ? Number((k.avisos_abiertos / Math.max(1, monthlyCapacity)).toFixed(1)) : 0;

    const onTimeClearedIn6m = Math.min(
      k.avisos_abiertos - k.abiertos_vencidos,
      Math.round(monthlyCapacity * ((100 - pctFocusVencidos.value) / 100) * 6)
    );
    const currentClosedEstimate = Math.max(
      1,
      Math.round((k.total_torres * k.carga_por_100_torres) / 100) - k.avisos_abiertos
    );
    const currentCumpleCount = Math.round((currentClosedEstimate * k.cumplimiento_oportuno_pct) / 100);
    const newTotalClosed = currentClosedEstimate + onTimeClearedIn6m;
    const projectedCompliance6m =
      newTotalClosed > 0
        ? Number(Math.min(100, ((currentCumpleCount + onTimeClearedIn6m) / newTotalClosed) * 100).toFixed(1))
        : k.cumplimiento_oportuno_pct;

    return {
      monthlyCapacity,
      monthlyVencidosCleared,
      monthsToClearVencidos,
      monthsToClearAllOpen,
      projectedCompliance6m,
    };
  });

  return {
    loading,
    filterOptions,
    selectedCte,
    selectedDepto,
    capacityData,
    crewsCount,
    closuresPerCrewMonth,
    pctFocusVencidos,
    scenarioProjection,
    loadAll,
    setCte,
    setDepto,
    resetFilters,
  };
});


/**
 * Responsabilidad Única (SRP):
 * Estado reactivo de la Vista 03 (Capacidad y Mejora Operativa), carga de datos regionales
 * y cálculo del Simulador de Escenarios de Asignación de Cuadrillas.
 */

import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { apiService } from '../services/api';
import type { CapacityDataResponse, CoordinatorWorkspaceResponse, FilterOptionsResponse } from '../types/models';

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
  const workspaceData = ref<CoordinatorWorkspaceResponse | null>(null);

  // Parámetros del Simulador de Capacidad y Asignación de Recursos
  const crewsCount = ref<number>(8);
  const closuresPerCrewMonth = ref<number>(6);
  const pctFocusVencidos = ref<number>(70);
  const expectedMonthlyIntake = ref<number>(18);

  async function loadAll() {
    loading.value = true;
    try {
      const [opts, cap, ws] = await Promise.all([
        apiService.getFilterOptions(selectedCte.value, selectedDepto.value),
        apiService.getCapacityData({
          cte: selectedCte.value,
          depto: selectedDepto.value,
        }),
        typeof apiService.getCoordinatorWorkspace === 'function'
          ? apiService.getCoordinatorWorkspace({
              cte: selectedCte.value,
              depto: selectedDepto.value,
            })
          : Promise.resolve(null),
      ]);
      filterOptions.value = opts;
      capacityData.value = cap;
      workspaceData.value = ws;
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
        netMonthlyCapacity: 0,
        isDeficit: false,
        campoAbiertos: 0,
        campoVencidos: 0,
        predialAbiertos: 0,
        predialVencidos: 0,
        monthlyVencidosCleared: 0,
        monthsToClearVencidos: 0,
        monthsToClearAllOpen: 0,
        monthsToClearCampoVencidos: null as number | null,
        monthsToClearAllCampo: null as number | null,
        projectedCompliance6m: 0,
      };
    }

    const campoBucket = workspaceData.value?.execution_split.find((b) => b.category === 'campo');
    const predialBucket = workspaceData.value?.execution_split.find((b) => b.category === 'predial');
    const campoAbiertos = campoBucket ? campoBucket.abiertos : k.avisos_abiertos;
    const campoVencidos = campoBucket ? campoBucket.vencidos : k.abiertos_vencidos;
    const predialAbiertos = predialBucket ? predialBucket.abiertos : 0;
    const predialVencidos = predialBucket ? predialBucket.vencidos : 0;

    const monthlyCapacity = crewsCount.value * closuresPerCrewMonth.value;
    const netMonthlyCapacity = monthlyCapacity - expectedMonthlyIntake.value;
    const isDeficit = netMonthlyCapacity <= 0;

    const monthlyVencidosCleared = Math.max(1, Math.round(monthlyCapacity * (pctFocusVencidos.value / 100)));
    const netVencidosCleared = Math.max(0, Math.round(netMonthlyCapacity * (pctFocusVencidos.value / 100)));

    const monthsToClearVencidos =
      k.abiertos_vencidos > 0 ? Number((k.abiertos_vencidos / monthlyVencidosCleared).toFixed(1)) : 0;
    const monthsToClearAllOpen =
      k.avisos_abiertos > 0 ? Number((k.avisos_abiertos / Math.max(1, monthlyCapacity)).toFixed(1)) : 0;

    const monthsToClearCampoVencidos =
      campoVencidos <= 0
        ? 0
        : isDeficit || netVencidosCleared <= 0
          ? null
          : Number((campoVencidos / netVencidosCleared).toFixed(1));

    const monthsToClearAllCampo =
      campoAbiertos <= 0
        ? 0
        : isDeficit
          ? null
          : Number((campoAbiertos / netMonthlyCapacity).toFixed(1));

    const effectiveNet = Math.max(0, netMonthlyCapacity);
    const onTimeClearedIn6m = Math.min(
      Math.max(0, campoAbiertos - campoVencidos),
      Math.round(effectiveNet * ((100 - pctFocusVencidos.value) / 100) * 6)
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
      netMonthlyCapacity,
      isDeficit,
      campoAbiertos,
      campoVencidos,
      predialAbiertos,
      predialVencidos,
      monthlyVencidosCleared,
      monthsToClearVencidos,
      monthsToClearAllOpen,
      monthsToClearCampoVencidos,
      monthsToClearAllCampo,
      projectedCompliance6m,
    };
  });

  return {
    loading,
    filterOptions,
    selectedCte,
    selectedDepto,
    capacityData,
    workspaceData,
    crewsCount,
    closuresPerCrewMonth,
    pctFocusVencidos,
    expectedMonthlyIntake,
    scenarioProjection,
    loadAll,
    setCte,
    setDepto,
    resetFilters,
  };
});


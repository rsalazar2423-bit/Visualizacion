/**
 * Fachada del Servicio Analítico en Cliente (SRP)
 * Delega cada consulta a su módulo de dominio especializado dentro de `services/analytics/`.
 */

import {
  computePortadaKpis,
  computeFilterOptions,
  computeOperationsData,
} from './analytics/operationsAnalytics';
import { computeTerritorialData } from './analytics/territoryAnalytics';
import { computeCapacityData } from './analytics/capacityAnalytics';

export const clientDataService = {
  getPortadaKpis: computePortadaKpis,
  getFilterOptions: computeFilterOptions,
  getOperationsData: computeOperationsData,
  getTerritorialData: computeTerritorialData,
  getCapacityData: computeCapacityData,
};

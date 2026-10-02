import axios from 'axios';
import type {
  PortadaKpis,
  FilterOptionsResponse,
  OperationsDataResponse,
  TerritorialDataResponse,
} from '../types/models';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000,
});

export const apiService = {
  async getPortadaKpis(): Promise<PortadaKpis> {
    const res = await apiClient.get<PortadaKpis>('/portada/kpis');
    return res.data;
  },

  async getFilterOptions(cte?: string | null, depto?: string | null): Promise<FilterOptionsResponse> {
    const params: Record<string, string> = {};
    if (cte && cte !== 'Todos') params.cte = cte;
    if (depto && depto !== 'Todos') params.depto = depto;
    const res = await apiClient.get<FilterOptionsResponse>('/filtros/opciones', { params });
    return res.data;
  },

  async getOperationsData(params: {
    cte?: string | null;
    depto?: string | null;
    tipo?: string | null;
    municipio?: string | null;
    prioridad?: string | null;
  }): Promise<OperationsDataResponse> {
    const query: Record<string, string> = {};
    if (params.cte && params.cte !== 'Todos') query.cte = params.cte;
    if (params.depto && params.depto !== 'Todos') query.depto = params.depto;
    if (params.tipo && params.tipo !== 'Todos') query.tipo = params.tipo;
    if (params.municipio && params.municipio !== 'Todos') query.municipio = params.municipio;
    if (params.prioridad && params.prioridad !== 'Todos') query.prioridad = params.prioridad;

    const res = await apiClient.get<OperationsDataResponse>('/operaciones/data', { params: query });
    return res.data;
  },

  async getTerritorialData(params: {
    cte?: string | null;
    depto?: string | null;
    municipio?: string | null;
  }): Promise<TerritorialDataResponse> {
    const query: Record<string, string> = {};
    if (params.cte && params.cte !== 'Todos') query.cte = params.cte;
    if (params.depto && params.depto !== 'Todos') query.depto = params.depto;
    if (params.municipio && params.municipio !== 'Todos') query.municipio = params.municipio;

    const res = await apiClient.get<TerritorialDataResponse>('/territorio/data', { params: query });
    return res.data;
  },
};

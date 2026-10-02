import { describe, it, expect, beforeEach, vi } from 'vitest';
import { setActivePinia, createPinia } from 'pinia';
import { useTerritoryStore } from '../stores/territoryStore';
import { useGeoFilterStore } from '../stores/geoFilterStore';

vi.mock('../services/api', () => ({
  apiService: {
    getFilterOptions: vi.fn().mockResolvedValue({
      ctes: ['Todos'],
      departamentos: ['Todos'],
      municipios: [],
      tipos: ['Todos'],
    }),
    getTerritorialData: vi.fn().mockResolvedValue({
      kpis: { ctes: 5, deptos: 10, mpios: 166, equipos: 5409 },
      treemap: { name: 'Toda Colombia', children: [] },
      sunburst: [],
      tickets: [],
      total_tickets_matching: 3118,
    }),
  },
}));

describe('territoryStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    vi.clearAllMocks();
  });

  it('delegates geo state to geoFilterStore', async () => {
    const geoStore = useGeoFilterStore();
    const terrStore = useTerritoryStore();

    expect(terrStore.selectedCte).toBe('Todos');
    expect(terrStore.selectedDepto).toBeNull();

    await terrStore.setCte('CTE 1');
    expect(geoStore.selectedCte).toBe('CTE 1');
    expect(terrStore.selectedCte).toBe('CTE 1');
  });

  it('generates dynamic breadcrumbs correctly', async () => {
    const terrStore = useTerritoryStore();
    expect(terrStore.breadcrumbs).toHaveLength(1);
    expect(terrStore.breadcrumbs[0].label).toBe('Toda Colombia');

    await terrStore.drillIntoDepto('Antioquia');
    expect(terrStore.breadcrumbs).toHaveLength(2);
    expect(terrStore.breadcrumbs[1].label).toBe('Antioquia');

    await terrStore.drillIntoMunicipio('Antioquia', 'Medellín');
    expect(terrStore.breadcrumbs).toHaveLength(3);
    expect(terrStore.breadcrumbs[2].label).toBe('Medellín');
  });

  it('ascends hierarchy level properly', async () => {
    const terrStore = useTerritoryStore();
    await terrStore.drillIntoMunicipio('Antioquia', 'Medellín');
    expect(terrStore.selectedMunicipio).toBe('Medellín');

    // Ascend from Municipio back to Depto
    await terrStore.ascendLevel();
    expect(terrStore.selectedMunicipio).toBeNull();
    expect(terrStore.selectedDepto).toBe('Antioquia');

    // Ascend from Depto back to National
    await terrStore.ascendLevel();
    expect(terrStore.selectedDepto).toBeNull();
  });
});

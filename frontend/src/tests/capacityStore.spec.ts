import { describe, it, expect, beforeEach, vi } from 'vitest';
import { setActivePinia, createPinia } from 'pinia';
import { useCapacityStore } from '../stores/capacityStore';

vi.mock('../services/api', () => ({
  apiService: {
    getFilterOptions: vi.fn().mockResolvedValue({
      ctes: ['Todos', 'Centro', 'Suroccidente'],
      departamentos: ['Todos', 'Antioquia', 'Valle del Cauca'],
      municipios: [],
      tipos: ['Todos'],
    }),
    getCapacityData: vi.fn().mockResolvedValue({
      kpis: {
        total_torres: 1000,
        avisos_abiertos: 200,
        abiertos_vencidos: 80,
        carga_por_100_torres: 20.0,
        cumplimiento_oportuno_pct: 50.0,
        mediana_dias_cerrados: 120.0,
      },
      regions: [],
      municipios_scatter: [],
    }),
  },
}));

describe('capacityStore (SRP)', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    vi.clearAllMocks();
  });

  it('initializes with default crew parameters and filters', () => {
    const store = useCapacityStore();
    expect(store.crewsCount).toBe(8);
    expect(store.closuresPerCrewMonth).toBe(6);
    expect(store.pctFocusVencidos).toBe(70);
    expect(store.selectedCte).toBe('Todos');
    expect(store.selectedDepto).toBe('Todos');
  });

  it('updates filters and reloads data', async () => {
    const store = useCapacityStore();
    await store.loadAll();

    expect(store.capacityData?.kpis.abiertos_vencidos).toBe(80);

    await store.setCte('Centro');
    expect(store.selectedCte).toBe('Centro');
    expect(store.selectedDepto).toBe('Todos');

    await store.setDepto('Antioquia');
    expect(store.selectedDepto).toBe('Antioquia');

    store.resetFilters();
    expect(store.selectedCte).toBe('Todos');
    expect(store.selectedDepto).toBe('Todos');
  });

  it('computes scenario projections correctly based on crew parameters', async () => {
    const store = useCapacityStore();
    await store.loadAll();

    // With 8 crews and 6 closures/month -> capacity = 48 avisos/mes
    // 70% of 48 = 34 vencidos/mes
    // Overdue = 80 -> 80 / 34 = 2.4 months
    const proj = store.scenarioProjection;
    expect(proj.monthlyCapacity).toBe(48);
    expect(proj.monthlyVencidosCleared).toBe(34);
    expect(proj.monthsToClearVencidos).toBe(2.4);
    expect(proj.monthsToClearAllOpen).toBe(4.2);
    expect(proj.projectedCompliance6m).toBeGreaterThan(50.0);
  });
});


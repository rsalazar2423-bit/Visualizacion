import { describe, it, expect, beforeEach, vi } from 'vitest';
import { setActivePinia, createPinia } from 'pinia';
import { useOperationsStore } from '../stores/operationsStore';

vi.mock('../services/api', () => ({
  apiService: {
    getFilterOptions: vi.fn().mockResolvedValue({
      ctes: ['Todos'],
      departamentos: ['Todos'],
      municipios: [],
      tipos: ['Todos'],
    }),
    getOperationsData: vi.fn().mockResolvedValue({
      kpis: { total: 100, cumple_pct: 60.0, excede: 40, dias_prom: 25.5 },
      donut: [],
      stacked_bar: [],
    }),
  },
}));

describe('operationsStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    vi.clearAllMocks();
  });

  it('handles multi-selection of tipologías', async () => {
    const store = useOperationsStore();
    expect(store.selectedTipos).toEqual([]);
    expect(store.selectedTipo).toBe('Todos');

    await store.toggleTipo('Vegetación');
    expect(store.selectedTipos).toEqual(['Vegetación']);
    expect(store.selectedTipo).toBe('Vegetación');

    await store.toggleTipo('Construcciones');
    expect(store.selectedTipos).toEqual(['Vegetación', 'Construcciones']);
    expect(store.selectedTipo).toBe('Multi');

    // Deselect one
    await store.toggleTipo('Vegetación');
    expect(store.selectedTipos).toEqual(['Construcciones']);
    expect(store.selectedTipo).toBe('Construcciones');

    // Toggle 'Todos' resets the selection
    await store.toggleTipo('Todos');
    expect(store.selectedTipos).toEqual([]);
    expect(store.selectedTipo).toBe('Todos');
  });

  it('toggles prioridad filter', async () => {
    const store = useOperationsStore();
    expect(store.selectedPrioridad).toBeNull();

    await store.setPrioridad('Año');
    expect(store.selectedPrioridad).toBe('Año');

    // Clicking again deselects
    await store.setPrioridad('Año');
    expect(store.selectedPrioridad).toBeNull();
  });

  it('resets all filters cleanly', async () => {
    const store = useOperationsStore();
    await store.toggleTipo('Obras');
    await store.setPrioridad('Semana');

    await store.resetFilters();
    expect(store.selectedTipos).toEqual([]);
    expect(store.selectedPrioridad).toBeNull();
  });
});

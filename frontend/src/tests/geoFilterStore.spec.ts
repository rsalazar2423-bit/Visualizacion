import { describe, it, expect, beforeEach, vi } from 'vitest';
import { setActivePinia, createPinia } from 'pinia';
import { useGeoFilterStore } from '../stores/geoFilterStore';
import { apiService } from '../services/api';

vi.mock('../services/api', () => ({
  apiService: {
    getFilterOptions: vi.fn().mockResolvedValue({
      ctes: ['Todos', 'CTE 1', 'CTE 2'],
      departamentos: ['Todos', 'Antioquia', 'Caldas'],
      municipios: [{ label: 'Todos', value: 'Todos' }],
      tipos: ['Todos'],
    }),
  },
}));

describe('geoFilterStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    vi.clearAllMocks();
  });

  it('initializes with default "Todos" filters', () => {
    const store = useGeoFilterStore();
    expect(store.selectedCte).toBe('Todos');
    expect(store.selectedDepto).toBe('Todos');
    expect(store.selectedMunicipio).toBe('Todos');
  });

  it('updates CTE and resets downstream filters', async () => {
    const store = useGeoFilterStore();
    store.selectedDepto = 'Antioquia';
    store.selectedMunicipio = 'Medellín';

    await store.setCte('CTE 1');
    expect(store.selectedCte).toBe('CTE 1');
    expect(store.selectedDepto).toBe('Todos');
    expect(store.selectedMunicipio).toBe('Todos');
    expect(apiService.getFilterOptions).toHaveBeenCalledWith('CTE 1', null);
  });

  it('updates Departamento and resets Municipio', async () => {
    const store = useGeoFilterStore();
    store.selectedMunicipio = 'Medellín';

    await store.setDepto('Antioquia');
    expect(store.selectedDepto).toBe('Antioquia');
    expect(store.selectedMunicipio).toBe('Todos');
    expect(apiService.getFilterOptions).toHaveBeenCalledWith('Todos', 'Antioquia');
  });

  it('resets all geo filters cleanly', async () => {
    const store = useGeoFilterStore();
    store.selectedCte = 'CTE 2';
    store.selectedDepto = 'Caldas';
    store.selectedMunicipio = 'Manizales';

    await store.resetGeoFilters();
    expect(store.selectedCte).toBe('Todos');
    expect(store.selectedDepto).toBe('Todos');
    expect(store.selectedMunicipio).toBe('Todos');
  });
});

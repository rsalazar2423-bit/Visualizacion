import boundsData from '../constants/geoBounds.json';

export interface DepartmentBound {
  bbox: [number, number, number, number]; // [minLon, minLat, maxLon, maxLat]
  center: [number, number];               // [centerLon, centerLat]
  spanLon: number;
  spanLat: number;
}

export const GEO_BOUNDS: Record<string, DepartmentBound> = boundsData as any;

/**
 * Calcula dinámicamente el centroide y el zoom adaptativo de ECharts geo
 * para cualquier departamento o conjunto de coordenadas.
 */
export function getAdaptiveGeoView(selectedDepto: string | null | undefined): { center: [number, number]; zoom: number } {
  if (!selectedDepto || selectedDepto === 'Todos' || !GEO_BOUNDS[selectedDepto]) {
    // Vista panorámica de Colombia completa
    return { center: [-74.8, 4.3], zoom: 1.25 };
  }

  const bound = GEO_BOUNDS[selectedDepto];
  const maxSpan = Math.max(bound.spanLon, bound.spanLat);

  // Fórmula de escala logarítmica/inversa basada en el ancho angular del polígono
  // Un departamento pequeño (Quindío, Risaralda, Bogotá) recibe zoom ~6.5 - 7.5x
  // Un departamento mediano/grande (Valle, Cauca, Nariño) recibe zoom ~4.2 - 5.5x
  const calculatedZoom = Math.min(8.0, Math.max(2.8, Number((8.8 / maxSpan).toFixed(2))));

  return {
    center: [bound.center[0], bound.center[1]],
    zoom: calculatedZoom,
  };
}

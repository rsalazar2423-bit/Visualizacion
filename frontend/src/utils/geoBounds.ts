/**
 * Motor Geoespacial de Auto-Encuadre Dinámico
 * 
 * En lugar de centrar en el polígono político administrativo completo (que en Nariño o Cauca
 * se extiende hasta la selva amazónica y el Océano Pacífico donde no hay infraestructura),
 * el encuadre profesional calcula el centro y la escala sobre el corredor real de infraestructura
 * eléctrica y torres monitoreadas.
 */

export interface GeoViewTarget {
  center: [number, number];
  zoom: number;
}

// Bounding box y centroide enfocado en las torres y líneas operativas de cada departamento
const OPERATIVE_CORRIDOR_VIEW: Record<string, GeoViewTarget> = {
  'Nariño': {
    center: [-77.46, 1.23],
    zoom: 6.8, // Encuadra nítidamente el corredor Pasto - Túquerres - Ipiales
  },
  'Cauca': {
    center: [-76.57, 2.53],
    zoom: 5.2, // Encuadra Popayán - Santander de Quilichao - Patía
  },
  'Valle Del Cauca': {
    center: [-76.25, 3.98],
    zoom: 4.8, // Corredor Cali - Yumbo - Palmira - Tuluá - Cartago
  },
  'Tolima': {
    center: [-75.03, 4.34],
    zoom: 4.8, // Corredor Ibagué - Espinal - Honda
  },
  'Huila': {
    center: [-75.62, 2.88],
    zoom: 5.6, // Corredor Neiva - Garzón - Pitalito
  },
  'Caldas': {
    center: [-75.28, 5.25],
    zoom: 6.5, // Corredor Manizales - Chinchiná - La Dorada
  },
  'Risaralda': {
    center: [-75.76, 4.89],
    zoom: 8.5, // Corredor Pereira - Dosquebradas - Santa Rosa
  },
  'Cundinamarca': {
    center: [-74.06, 5.14],
    zoom: 4.8, // Corredor Bogotá - Zipaquirá - Ubalá
  },
  'Boyacá': {
    center: [-73.18, 5.27],
    zoom: 5.2, // Corredor Tunja - Duitama - Sogamoso - Chivor
  },
  'Bogotá, D.C.': {
    center: [-74.06, 4.77],
    zoom: 9.5, // Anillo metropolitano de alta tensión
  },
};

export function getAdaptiveGeoView(
  selectedDepto: string | null | undefined,
  currentPoints?: Array<{ lon: number; lat: number }>
): GeoViewTarget {
  if (!selectedDepto || selectedDepto === 'Todos') {
    // Si no hay depto, encuadra toda la red de transmisión del país
    return { center: [-75.2, 4.1], zoom: 1.45 };
  }

  // 1. Si tenemos los puntos filtrados activos, calculamos el centroide de masa exacto
  if (currentPoints && currentPoints.length > 0) {
    const lons = currentPoints.map((p) => p.lon);
    const lats = currentPoints.map((p) => p.lat);
    const minLon = Math.min(...lons);
    const maxLon = Math.max(...lons);
    const minLat = Math.min(...lats);
    const maxLat = Math.max(...lats);
    const span = Math.max(maxLon - minLon, maxLat - minLat);
    const cLon = Number(((minLon + maxLon) / 2).toFixed(4));
    const cLat = Number(((minLat + maxLat) / 2).toFixed(4));
    const zoom = Math.min(10.0, Math.max(3.2, Number((6.2 / Math.max(0.4, span)).toFixed(2))));
    return { center: [cLon, cLat], zoom };
  }

  // 2. Si está en catálogo de corredores
  if (OPERATIVE_CORRIDOR_VIEW[selectedDepto]) {
    return OPERATIVE_CORRIDOR_VIEW[selectedDepto];
  }

  // 3. Fallback general
  return { center: [-75.2, 4.1], zoom: 1.45 };
}

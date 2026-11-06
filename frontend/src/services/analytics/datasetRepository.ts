/**
 * Responsabilidad Única (SRP):
 * Carga, validación y almacenamiento en caché en memoria del dataset estático (`ecogrid_data.json`).
 */

export interface EquipoRecord {
  Equipo: number;
  Torre?: string;
  Linea?: string;
  Latitud?: number | null;
  Longitud?: number | null;
  CTE: string;
  Departamento: string;
  Municipio: string;
}

export interface AvisoRecord {
  Aviso: string;
  Equipo: number;
  'Tipo de aviso': string;
  'Fecha de aviso': string;
  'Fecha de cierre'?: string;
  'Estado aviso'?: string;
  Sector?: string;
  Prioridad: string;
  'Prioridad días'?: number;
  'Días abierto': number;
  'Cumple prioridad días': number;
  Cumplimiento_Estado: string;
  Año?: number;
  'Año cierre'?: number;
  CTE: string;
  Departamento: string;
  Municipio: string;
  Linea?: string;
  Latitud?: number | null;
  Longitud?: number | null;
}

export interface DatasetPayload {
  equipos: EquipoRecord[];
  avisos: AvisoRecord[];
}

let cachedDataset: DatasetPayload | null = null;
let loadPromise: Promise<DatasetPayload> | null = null;

export async function getDataset(): Promise<DatasetPayload> {
  if (cachedDataset) return cachedDataset;
  if (loadPromise) return loadPromise;

  loadPromise = (async () => {
    const urls = [
      '/data/ecogrid_data.json',
      'https://raw.githubusercontent.com/rsalazar2423-bit/Visualizacion/main/frontend/public/data/ecogrid_data.json',
    ];

    for (const url of urls) {
      try {
        const res = await fetch(url);
        if (res.ok) {
          cachedDataset = await res.json();
          return cachedDataset!;
        }
      } catch (err) {
        console.warn(`Error cargando dataset desde ${url}, intentando fallback...`, err);
      }
    }
    throw new Error('No se pudo cargar el dataset analítico de EcoGrid.');
  })();

  return loadPromise;
}


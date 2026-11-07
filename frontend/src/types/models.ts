export interface PortadaKpis {
  total_equipos: number;
  total_avisos: number;
  pct_cumplimiento: number;
  pct_vegetacion: number;
  total_deptos: number;
  total_municipios: number;
  cumplimiento_oportuno_pct?: number;
  avisos_abiertos?: number;
  abiertos_vencidos?: number;
  tiempo_tipico_mediana?: number;
}

export interface FilterOption {
  label: string;
  value: string;
}

export interface FilterOptionsResponse {
  ctes: string[];
  tipos: string[];
  departamentos: string[];
  municipios: FilterOption[];
}

export interface OperationsKpis {
  total: number;
  cumple_pct: number;
  excede: number;
  dias_prom: number | null;
  cumplimiento_oportuno_pct?: number;
  avisos_abiertos?: number;
  abiertos_vencidos?: number;
  tiempo_tipico_mediana?: number | null;
  avisos_cerrados?: number;
}

export interface StackedBarItem {
  prioridad: string;
  total: number;
  cumple_count: number;
  excede_count: number;
  cumple_pct: number;
  excede_pct: number;
  selected?: boolean;
}

export interface DonutItem {
  name: string;
  value: number;
  pct: number;
  color: string;
}

export interface TimeSeriesPoint {
  periodo: string;
  year: number;
  ingresados: number;
  cerrados: number;
  abiertos_vencidos: number;
  cumple_oportuno_pct: number;
  mediana_dias: number;
}

export interface TypologyPerformanceItem {
  tipo: string;
  total: number;
  pct_total: number;
  cumple_count: number;
  cumple_pct: number;
  excede_count: number;
  excede_pct: number;
  mediana_dias: number;
  abiertos_vencidos: number;
  color: string;
  significado: string;
}

export interface OperationsDataResponse {
  kpis: OperationsKpis;
  stacked_bar: StackedBarItem[];
  donut: DonutItem[];
  tipos_catalogo?: DonutItem[];
  selected_prioridad?: string;
  time_series?: TimeSeriesPoint[];
  typology_performance?: TypologyPerformanceItem[];
}

export interface TerritorialKpis {
  ctes: number | string | null;
  deptos: number | string | null;
  mpios: number;
  equipos: number;
  abiertos_vencidos?: number;
  cumple_pct?: number;
}

export interface TreemapNode {
  name: string;
  value?: number;
  depto?: string;
  pct?: number;
  cumple_pct?: number;
  vencidos?: number;
  itemStyle?: { color?: string };
  children?: TreemapNode[];
}

export interface SunburstNode {
  name: string;
  value?: number;
  itemStyle?: { color?: string };
  children?: SunburstNode[];
}

export interface TicketItem {
  numero_aviso: string;
  fecha_aviso: string;
  fecha_cierre?: string;
  estado_aviso?: string;
  sector?: string;
  equipo: string;
  departamento: string;
  municipio: string;
  tipo_aviso: string;
  prioridad: string;
  cumplimiento: string;
  dias_abierto: number;
}

export interface MapAvisoPoint {
  aviso: string;
  equipo: number;
  lat: number;
  lon: number;
  depto: string;
  mpio: string;
  sector: string;
  linea: string;
  tipo: string;
  prioridad: string;
  estado: string; // 'Abierto' | 'Cerrado'
  cumplimiento: string; // 'Cumple Plazo' | 'Excede Plazo'
  dias_abierto: number;
  year: number;
  year_cierre: number;
}

export interface MapLineTrace {
  linea: string;
  cte: string;
  coords: [number, number][];
}

export interface SectorDelayItem {
  name: string;
  depto: string;
  total: number;
  abiertos: number;
  abiertos_vencidos: number;
  excede_total: number;
  cumple_pct: number;
  mediana_dias: number;
}

export interface TypologyDurationItem {
  tipo: string;
  color: string;
  total: number;
  cerrados: number;
  abiertos_vencidos: number;
  cumple_pct: number;
  p25_dias: number;
  mediana_dias: number;
  p75_dias: number;
  promedio_dias: number;
}

export interface TerritorialDataResponse {
  kpis: TerritorialKpis;
  treemap: TreemapNode;
  sunburst: SunburstNode[];
  sunburst_sla?: SunburstNode[];
  sunburst_plazos?: SunburstNode[];
  tickets: TicketItem[];
  total_tickets_matching: number;
  map_points?: MapAvisoPoint[];
  map_lines?: MapLineTrace[];
  years_catalog?: number[];
  sector_ranking?: SectorDelayItem[];
  typology_durations?: TypologyDurationItem[];
}

export interface CapacityRegionItem {
  region: string;
  cte: string;
  torres: number;
  total_avisos: number;
  abiertos: number;
  abiertos_vencidos: number;
  cerrados: number;
  cumple_pct: number;
  mediana_dias: number;
  carga_por_100_torres: number;
  indice_presion: number;
}

export interface CapacityDataResponse {
  kpis: {
    total_torres: number;
    avisos_abiertos: number;
    abiertos_vencidos: number;
    carga_por_100_torres: number;
    cumplimiento_oportuno_pct: number;
    mediana_dias_cerrados: number;
  };
  regions: CapacityRegionItem[];
  municipios_scatter: CapacityRegionItem[];
}

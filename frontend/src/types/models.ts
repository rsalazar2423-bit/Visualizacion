export interface PortadaKpis {
  total_equipos: number;
  total_avisos: number;
  pct_cumplimiento: number;
  pct_vegetacion: number;
  total_deptos: number;
  total_municipios: number;
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

export interface OperationsDataResponse {
  kpis: OperationsKpis;
  stacked_bar: StackedBarItem[];
  donut: DonutItem[];
  tipos_catalogo?: DonutItem[];
  selected_prioridad?: string;
}

export interface TerritorialKpis {
  ctes: number | string | null;
  deptos: number | string | null;
  mpios: number;
  equipos: number;
}

export interface TreemapNode {
  name: string;
  value?: number;
  depto?: string;
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
  equipo: string;
  departamento: string;
  municipio: string;
  tipo_aviso: string;
  prioridad: string;
  cumplimiento: string;
  dias_abierto: number;
}

export interface TerritorialDataResponse {
  kpis: TerritorialKpis;
  treemap: TreemapNode;
  sunburst: SunburstNode[];
  sunburst_sla?: SunburstNode[];
  sunburst_plazos?: SunburstNode[];
  tickets: TicketItem[];
  total_tickets_matching: number;
}

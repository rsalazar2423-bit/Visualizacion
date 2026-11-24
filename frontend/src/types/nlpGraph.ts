/**
 * nlpGraph.ts — Tipos para Triaje Operativo, 5 Causales y Banderas Críticas NLP.
 */

export type NlpRouteId = 'r_campo' | 'r_electro' | 'r_predial' | 'r_ambiental' | 'r_servidumbre';
export type NlpEstado = 'abierto' | 'cerrado';
export type NlpEstadoFilter = 'abiertos' | 'cerrados' | 'ambos';
export type NlpUrgency = 'vencido' | 'proximo' | 'en_plazo';
export type NlpUrgencyFilter = 'todos' | NlpUrgency;
export type NlpHorizon = 'corto' | 'largo';
export type NlpHorizonFilter = 'todas' | NlpHorizon;

export interface NlpRouteMeta {
  id: NlpRouteId;
  name: string;
  short_name: string;
  action: string;
}

export interface NlpTicket {
  aviso: string;
  tipo: string;
  estado: NlpEstado;
  ruta: NlpRouteId;
  urgencia: NlpUrgency;
  horizonte: NlpHorizon;
  prioridad: string;
  dias_abierto: number;
  dias_restantes: number;
  cte: string;
  depto: string;
  mpio: string;
  vereda: string;
  linea: string;
  torre: string;
  etapa: string;
  desc: string;
  tags: string[];
}

export interface NlpGeoRankItem {
  name: string;
  total: number;
  vencidos: number;
}

export interface NlpTagStat {
  tag: string;
  total: number;
  vencidos: number;
  vencimiento_pct: number;
}

export interface NlpRouteSummary extends NlpRouteMeta {
  total: number;
  vencidos_total: number;
  vencimiento_pct: number;
  ab_vencidos: number;
  ab_proximos: number;
  ab_en_plazo: number;
  ce_vencidos: number;
  ce_a_tiempo: number;
  mediana_dias: number;
  top_territories: NlpGeoRankItem[];
  critical_tags: NlpTagStat[];
  tickets: NlpTicket[];
}

export interface NlpGraphPayload {
  metadata: {
    title: string;
    total: number;
    lexical_coverage_pct: number;
  };
  routes: NlpRouteMeta[];
  tickets: NlpTicket[];
}

export interface NlpTowerSummary {
  key: string;
  label: string;
  linea: string;
  torre: string;
  mpio: string;
  total: number;
  vencidos_total: number;
  vencimiento_pct: number;
  ab_vencidos: number;
  ab_en_plazo: number;
  ce_vencidos: number;
  ce_a_tiempo: number;
  tickets: NlpTicket[];
}

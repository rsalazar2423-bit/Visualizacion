/**
 * nlpGraph.ts — Tipos para Triaje Operativo y Análisis de Vencimiento por Causal (NLP).
 */

export type NlpRouteId = 'r_campo' | 'r_predial' | 'r_ambiental' | 'r_servidumbre';
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
  linea: string;
  torre: string;
  desc: string;
}

export interface NlpGeoRankItem {
  name: string;
  total: number;
  vencidos: number;
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
  tickets: NlpTicket[];
}

export interface NlpGraphPayload {
  metadata: {
    title: string;
    total: number;
  };
  routes: NlpRouteMeta[];
  tickets: NlpTicket[];
}

/**
 * nlpGraph.ts — Tipos para el Triaje Operativo NLP del Coordinador.
 */

export type NlpRouteId = 'r_campo' | 'r_predial' | 'r_ambiental' | 'r_servidumbre';
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

export interface NlpClosedStat {
  ruta: NlpRouteId;
  cte: string;
  depto: string;
  count: number;
  mediana_dias: number;
}

export interface NlpOpenTicket {
  aviso: string;
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
  vencidos: number;
  proximos: number;
  en_plazo: number;
  cerrados_hist: number;
  tasa_exito_pct: number;
  mediana_cierre_dias: number;
  top_territories: NlpGeoRankItem[];
  tickets: NlpOpenTicket[];
}

export interface NlpGraphPayload {
  metadata: {
    title: string;
    total_abiertos: number;
  };
  routes: NlpRouteMeta[];
  closed_stats: NlpClosedStat[];
  open_tickets: NlpOpenTicket[];
}

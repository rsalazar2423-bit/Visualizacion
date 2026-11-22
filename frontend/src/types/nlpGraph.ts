/**
 * nlpGraph.ts — Tipos para Treemaps comparativos VS de causas operativas (NLP).
 */

export type NlpGroupMode = 'cluster' | 'depto';
export type NlpSlaFilter = 'todos' | 'vencidos' | 'a_tiempo';

export interface NlpTermFreq {
  term: string;
  freq: number;
}

export interface NlpDeptoCount {
  depto: string;
  count: number;
  mora: number;
}

export interface NlpTreemapChild {
  name: string;
  value: number;
  mora: number;
  vencidos_pct: number;
}

export interface NlpTreemapNode {
  name: string;
  value: number;
  mora: number;
  vencidos_pct: number;
  color: string;
  children: NlpTreemapChild[];
}

export interface NlpTreemapData {
  name: string;
  children: NlpTreemapNode[];
}

export interface NlpClusterSummary {
  id: string;
  name: string;
  color: string;
  count: number;
  pct: number;
  mediana_dias: number;
  vencidos_pct: number;
  desc: string;
  top_terms: NlpTermFreq[];
  deptos: NlpDeptoCount[];
  quotes: string[];
}

export interface NlpModeData {
  total_avisos: number;
  clusters: NlpClusterSummary[];
  treemap: NlpTreemapData;
}

export interface NlpClusterComparison {
  id: string;
  name: string;
  color: string;
  abiertos_count: number;
  abiertos_pct: number;
  abiertos_mora: number;
  cerrados_count: number;
  cerrados_pct: number;
  cerrados_atencion: number;
  tasa_cierre: number;
  brecha_mora_dias: number;
  desc: string;
  abiertos_terms: NlpTermFreq[];
  cerrados_terms: NlpTermFreq[];
  abiertos_deptos: NlpDeptoCount[];
  cerrados_deptos: NlpDeptoCount[];
  abiertos_quotes: string[];
  cerrados_quotes: string[];
}

export interface NlpScopeData {
  abiertos: NlpModeData;
  cerrados: NlpModeData;
  comparativa_vs: NlpClusterComparison[];
}

export interface NlpSlaScopes {
  todos: NlpScopeData;
  vencidos: NlpScopeData;
  a_tiempo: NlpScopeData;
}

export interface NlpGraphPayload {
  metadata: {
    title: string;
    total: number;
  };
  departamentos: string[];
  nacional: NlpSlaScopes;
  by_depto: Record<string, NlpSlaScopes>;
}

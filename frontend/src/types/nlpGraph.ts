/**
 * nlpGraph.ts — Tipos para la red semántica de causas operativas (NLP).
 */

export interface NlpDeptoCount {
  depto: string;
  count: number;
}

export interface NlpClusterSummary {
  id: string;
  name: string;
  color: string;
  count: number;
  pct: number;
  mediana_dias: number;
  desc: string;
  quotes: string[];
  deptos: NlpDeptoCount[];
}

export interface NlpNode {
  id: string;
  name: string;
  symbolSize: number;
  category: number;
  value: number;
  mediana_dias?: number;
  cluster_name?: string;
  is_hub: boolean;
  itemStyle?: {
    color?: string;
    opacity?: number;
  };
  label?: {
    show?: boolean;
    fontSize?: number;
    fontWeight?: 'normal' | 'bold' | 'bolder' | 'lighter' | number;
  };
}

export interface NlpLink {
  source: string;
  target: string;
  value: number;
  lineStyle?: {
    width?: number;
    type?: string;
    opacity?: number;
  };
}

export interface NlpModeData {
  total_avisos: number;
  clusters: NlpClusterSummary[];
  nodes: NlpNode[];
  links: NlpLink[];
  categories: Array<{ name: string }>;
}

export interface NlpGraphPayload {
  metadata: {
    title: string;
    fuente: string;
    total_registros: number;
  };
  abiertos: NlpModeData;
  cerrados: NlpModeData;
}

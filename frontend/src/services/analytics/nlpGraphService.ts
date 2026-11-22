/**
 * nlpGraphService.ts — Servicio para la carga y entrega de la red semántica NLP.
 */

import type { NlpGraphPayload } from '../../types/nlpGraph';

let cachedPayload: NlpGraphPayload | null = null;
let pendingPromise: Promise<NlpGraphPayload> | null = null;

export async function fetchNlpGraphData(): Promise<NlpGraphPayload> {
  if (cachedPayload) {
    return cachedPayload;
  }
  if (pendingPromise) {
    return pendingPromise;
  }

  pendingPromise = (async () => {
    const res = await fetch('/data/nlp_graph_data.json');
    if (!res.ok) {
      throw new Error(`Error HTTP ${res.status} al cargar /data/nlp_graph_data.json`);
    }
    const data: NlpGraphPayload = await res.json();
    cachedPayload = data;
    return data;
  })().finally(() => {
    pendingPromise = null;
  });

  return pendingPromise;
}

export function clearNlpCache(): void {
  cachedPayload = null;
  pendingPromise = null;
}

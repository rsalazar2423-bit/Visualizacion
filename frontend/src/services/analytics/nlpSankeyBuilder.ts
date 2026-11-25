/**
 * nlpSankeyBuilder.ts — Construye flujos Sankey (Tipo → Causal NLP → Resultado SLA)
 * separados para Abiertos (vivos) y Cerrados (históricos), respetando themeTokens.ts.
 */
import { getEChartsThemeTokens, getTipoColor } from '../../constants/themeTokens';
import type { NlpGraphPayload } from '../../types/nlpGraph';

export interface SankeyFilter {
  estado: 'abiertos' | 'cerrados';
  cte: string | null;
  depto: string | null;
  tipo: string | null;
  includeEtapa?: boolean;
}

function normalizeEtapa(raw: string): string {
  if (raw.includes('Jurídica')) return 'Etapa: Gestión Jurídica';
  if (raw.includes('Predial')) return 'Etapa: Gestión Predial';
  if (raw.includes('Espera')) return 'Etapa: En Espera / Punto';
  if (raw.includes('Ambiental')) return 'Etapa: Gestión Ambiental';
  return 'Etapa: Iniciado / Otros';
}

const ROUTE_COLORS: Record<string, string> = {
  r_campo: '#0D9488',
  r_electro: '#0284C7',
  r_predial: '#475569',
  r_ambiental: '#D97706',
  r_servidumbre: '#1D4ED8',
};

export function buildNlpSankeyData(payload: NlpGraphPayload, filter: SankeyFilter, isDark: boolean) {
  const tokens = getEChartsThemeTokens(isDark);
  const targetEstado = filter.estado === 'abiertos' ? 'abierto' : 'cerrado';
  const routeNames = new Map(payload.routes.map((r) => [r.id, r.short_name]));

  const filtered = payload.tickets.filter((t) => {
    if (t.estado !== targetEstado) return false;
    if (filter.cte && filter.cte !== 'Todos' && t.cte !== filter.cte) return false;
    if (filter.depto && filter.depto !== 'Todos' && t.depto !== filter.depto) return false;
    if (filter.tipo && filter.tipo !== 'Todos' && t.tipo !== filter.tipo) return false;
    return true;
  });

  const edgeCounts = new Map<string, number>();
  const nodeColors = new Map<string, string>();

  const inc = (src: string, dst: string) => {
    const k = `${src}|||${dst}`;
    edgeCounts.set(k, (edgeCounts.get(k) ?? 0) + 1);
  };

  for (const t of filtered) {
    const tipoNode = `Tipo: ${t.tipo}`;
    const causalNode = routeNames.get(t.ruta) ?? t.ruta;
    const outcomeNode =
      targetEstado === 'abierto'
        ? t.urgencia === 'vencido'
          ? 'Abiertos Vencidos'
          : 'Abiertos en Plazo'
        : t.urgencia === 'vencido'
          ? 'Cerrados Vencidos'
          : 'Cerrados a Tiempo';

    nodeColors.set(tipoNode, getTipoColor(t.tipo, isDark));
    nodeColors.set(causalNode, ROUTE_COLORS[t.ruta] ?? '#64748B');
    nodeColors.set(
      outcomeNode,
      outcomeNode === 'Abiertos Vencidos'
        ? tokens.sla.excede
        : outcomeNode === 'Cerrados Vencidos'
          ? tokens.sla.warning
          : outcomeNode === 'Abiertos en Plazo'
            ? tokens.sla.abierto
            : tokens.sla.cumple,
    );

    inc(tipoNode, causalNode);
    if (filter.includeEtapa) {
      const etapaNode = normalizeEtapa(t.etapa);
      nodeColors.set(etapaNode, isDark ? '#94A3B8' : '#64748B');
      inc(causalNode, etapaNode);
      inc(etapaNode, outcomeNode);
    } else {
      inc(causalNode, outcomeNode);
    }
  }

  const nodes = Array.from(nodeColors.entries()).map(([name, color]) => ({
    name,
    itemStyle: { color, borderColor: 'transparent' },
  }));

  const links = Array.from(edgeCounts.entries()).map(([k, value]) => {
    const [source, target] = k.split('|||');
    return { source, target, value };
  });

  return { nodes, links, total: filtered.length };
}

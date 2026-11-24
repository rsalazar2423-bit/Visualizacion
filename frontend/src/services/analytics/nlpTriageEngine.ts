/**
 * nlpTriageEngine.ts — Motor puro de filtrado, banderas críticas NLP y barras SLA
 * 100% alineado con themeTokens.ts (Carmín = Abierto Vencido, Ámbar = Retraso/Próximo,
 * Azul Acero = Abierto en Plazo, Teal = Cumple/A Tiempo).
 */
import type * as echarts from 'echarts';
import { getEChartsThemeTokens } from '../../constants/themeTokens';
import type {
  NlpEstadoFilter,
  NlpGraphPayload,
  NlpHorizonFilter,
  NlpRouteId,
  NlpRouteSummary,
  NlpUrgencyFilter,
} from '../../types/nlpGraph';

export interface TriageFilters {
  estado: NlpEstadoFilter;
  tipo: string | null;
  cte: string | null;
  depto: string | null;
  municipio: string | null;
  urgencia: NlpUrgencyFilter;
  horizonte: NlpHorizonFilter;
}

export const ESTADO_OPTS: Array<{ id: NlpEstadoFilter; label: string }> = [
  { id: 'abiertos', label: 'Abiertos Hoy' },
  { id: 'cerrados', label: 'Cerrados Hist.' },
  { id: 'ambos', label: 'Total' },
];

export const URGENCY_OPTS: Array<{ id: NlpUrgencyFilter; label: string }> = [
  { id: 'todos', label: 'Todos los Plazos' },
  { id: 'vencido', label: 'Solo Vencidos' },
  { id: 'proximo', label: 'Próximos a Vencer (≤90d)' },
  { id: 'en_plazo', label: 'A Tiempo / En Plazo' },
];

export const HORIZON_OPTS: Array<{ id: NlpHorizonFilter; label: string }> = [
  { id: 'todas', label: 'Toda Prioridad' },
  { id: 'corto', label: 'Corto Plazo (≤1 Año)' },
  { id: 'largo', label: 'Largo Plazo (2–6 Años)' },
];

function medianOf(nums: number[]): number {
  if (!nums.length) return 0;
  const s = [...nums].sort((a, b) => a - b);
  const m = Math.floor(s.length / 2);
  return s.length % 2 ? s[m] : Math.round((s[m - 1] + s[m]) / 2);
}

export function computeTriageSummaries(payload: NlpGraphPayload, filters: TriageFilters): NlpRouteSummary[] {
  const { estado, tipo, cte, depto, municipio, urgencia, horizonte } = filters;
  const baseFiltered = payload.tickets.filter((t) => {
    if (estado === 'abiertos' && t.estado !== 'abierto') return false;
    if (estado === 'cerrados' && t.estado !== 'cerrado') return false;
    if (tipo && tipo !== 'Todos' && t.tipo !== tipo) return false;
    if (cte && cte !== 'Todos' && t.cte !== cte) return false;
    if (depto && depto !== 'Todos' && t.depto !== depto) return false;
    if (municipio && municipio !== 'Todos' && t.mpio !== municipio) return false;
    if (horizonte !== 'todas' && t.horizonte !== horizonte) return false;
    return true;
  });

  const groupGeoByMpio = Boolean(depto && depto !== 'Todos');

  return payload.routes.map((route) => {
    const routeBase = baseFiltered.filter((t) => t.ruta === route.id);
    const baseOverdue = routeBase.filter((t) => t.urgencia === 'vencido').length;
    const vencimiento_pct = routeBase.length > 0 ? Math.round((baseOverdue / routeBase.length) * 1000) / 10 : 0;
    const visible = urgencia === 'todos' ? routeBase : routeBase.filter((t) => t.urgencia === urgencia);

    let ab_vencidos = 0, ab_proximos = 0, ab_en_plazo = 0, ce_vencidos = 0, ce_a_tiempo = 0;
    const geoCounts = new Map<string, { total: number; vencidos: number }>();
    const tagCounts = new Map<string, { total: number; vencidos: number }>();

    for (const t of visible) {
      if (t.estado === 'abierto') {
        if (t.urgencia === 'vencido') ab_vencidos++;
        else if (t.urgencia === 'proximo') ab_proximos++;
        else ab_en_plazo++;
      } else if (t.urgencia === 'vencido') ce_vencidos++;
      else ce_a_tiempo++;

      const gKey = groupGeoByMpio ? t.mpio : t.depto;
      const prevG = geoCounts.get(gKey) ?? { total: 0, vencidos: 0 };
      prevG.total++;
      if (t.urgencia === 'vencido') prevG.vencidos++;
      geoCounts.set(gKey, prevG);

      for (const tg of t.tags) {
        const prevT = tagCounts.get(tg) ?? { total: 0, vencidos: 0 };
        prevT.total++;
        if (t.urgencia === 'vencido') prevT.vencidos++;
        tagCounts.set(tg, prevT);
      }
    }

    const critical_tags = Array.from(tagCounts.entries())
      .map(([tag, v]) => ({
        tag,
        total: v.total,
        vencidos: v.vencidos,
        vencimiento_pct: Math.round((v.vencidos / v.total) * 1000) / 10,
      }))
      .sort((a, b) => b.vencidos - a.vencidos || b.total - a.total)
      .slice(0, 5);

    return {
      ...route,
      total: visible.length,
      vencidos_total: ab_vencidos + ce_vencidos,
      vencimiento_pct,
      ab_vencidos,
      ab_proximos,
      ab_en_plazo,
      ce_vencidos,
      ce_a_tiempo,
      mediana_dias: medianOf(visible.map((t) => t.dias_abierto)),
      top_territories: Array.from(geoCounts.entries())
        .map(([name, v]) => ({ name, total: v.total, vencidos: v.vencidos }))
        .sort((a, b) => b.vencidos - a.vencidos || b.total - a.total)
        .slice(0, 4),
      critical_tags,
      tickets: visible,
    };
  });
}

export function buildTriageBarOption(
  summaries: NlpRouteSummary[],
  estado: NlpEstadoFilter,
  selectedId: NlpRouteId,
  isDark: boolean,
): echarts.EChartsOption {
  const tokens = getEChartsThemeTokens(isDark);
  const openOkColor = isDark ? '#38BDF8' : '#0284C7'; // Azul Acero Institucional
  const rows = [...summaries].reverse();
  const endLabel = {
    show: true, position: 'right' as const, color: tokens.textSecondary, fontSize: 11, fontWeight: 600,
    formatter: (p: any) => { const r = rows[p.dataIndex]; return r ? `${r.total.toLocaleString()}  (${r.vencimiento_pct}% venc.)` : ''; },
  };

  const series: echarts.SeriesOption[] =
    estado === 'abiertos'
      ? [
          { name: 'Abiertos Vencidos', type: 'bar', stack: 's', barMaxWidth: 28, itemStyle: { color: tokens.sla.excede }, data: rows.map((r) => r.ab_vencidos) },
          { name: 'Próximos (≤90d)', type: 'bar', stack: 's', barMaxWidth: 28, itemStyle: { color: tokens.sla.warning }, data: rows.map((r) => r.ab_proximos) },
          { name: 'Abiertos en Plazo', type: 'bar', stack: 's', barMaxWidth: 28, itemStyle: { color: tokens.sla.cumple }, label: endLabel, data: rows.map((r) => r.ab_en_plazo) },
        ]
      : estado === 'cerrados'
        ? [
            { name: 'Cerrados Vencidos', type: 'bar', stack: 's', barMaxWidth: 28, itemStyle: { color: tokens.sla.warning }, data: rows.map((r) => r.ce_vencidos) },
            { name: 'Cerrados a Tiempo', type: 'bar', stack: 's', barMaxWidth: 28, itemStyle: { color: tokens.sla.cumple }, label: endLabel, data: rows.map((r) => r.ce_a_tiempo) },
          ]
        : [
            { name: 'Abiertos Vencidos', type: 'bar', stack: 's', barMaxWidth: 28, itemStyle: { color: tokens.sla.excede }, data: rows.map((r) => r.ab_vencidos) },
            { name: 'Cerrados Vencidos', type: 'bar', stack: 's', barMaxWidth: 28, itemStyle: { color: tokens.sla.warning }, data: rows.map((r) => r.ce_vencidos) },
            { name: 'Abiertos en Plazo', type: 'bar', stack: 's', barMaxWidth: 28, itemStyle: { color: openOkColor }, data: rows.map((r) => r.ab_proximos + r.ab_en_plazo) },
            { name: 'Cerrados a Tiempo', type: 'bar', stack: 's', barMaxWidth: 28, itemStyle: { color: tokens.sla.cumple }, label: endLabel, data: rows.map((r) => r.ce_a_tiempo) },
          ];

  return {
    backgroundColor: 'transparent',
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'shadow' },
      backgroundColor: tokens.tooltipBg,
      borderColor: tokens.tooltipBorder,
      textStyle: { color: tokens.textColor, fontSize: 11.5, fontFamily: tokens.fontFamily },
      formatter: (params: any) => {
        const r = rows[params?.[0]?.dataIndex ?? 0];
        if (!r) return '';
        const lines = params.map((p: any) => `<div>${p.marker} ${p.seriesName}: <b>${Number(p.value).toLocaleString()}</b></div>`).join('');
        return `<div style="font-weight:700;margin-bottom:4px;">${r.name}</div>${lines}
          <div style="margin-top:4px;padding-top:4px;border-top:1px solid ${tokens.gridColor};font-size:10.5px;color:${tokens.textSecondary};">
            Vencimiento causal: <b>${r.vencimiento_pct}%</b> · Mediana: <b>${r.mediana_dias} d</b>
          </div>`;
      },
    },
    legend: { top: 0, left: 0, itemWidth: 10, itemHeight: 10, textStyle: { color: tokens.textSecondary, fontSize: 11 } },
    grid: { top: 34, left: 6, right: 128, bottom: 10, containLabel: true },
    xAxis: { type: 'value', splitLine: { lineStyle: { color: tokens.gridColor, type: 'dashed' } }, axisLabel: { color: tokens.textSecondary, fontSize: 10.5 } },
    yAxis: {
      type: 'category',
      data: rows.map((r) => (r.id === selectedId ? `▸ ${r.short_name}` : r.short_name)),
      axisLine: { show: false },
      axisTick: { show: false },
      axisLabel: { color: tokens.textColor, fontSize: 11.5, fontWeight: 700 },
    },
    series,
  };
}

/**
 * nlpTriageEngine.ts — Motor puro de filtrado, banderas críticas NLP y barras SLA.
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
  { id: 'ambos', label: 'Total (Abiertos + Cerrados)' },
];

export const URGENCY_OPTS: Array<{ id: NlpUrgencyFilter; label: string; cls?: string }> = [
  { id: 'todos', label: 'Todos' },
  { id: 'vencido', label: 'Vencidos / Fuera Plazo', cls: 'danger' },
  { id: 'proximo', label: 'Próximos (≤90d)', cls: 'warn' },
  { id: 'en_plazo', label: 'A Tiempo / En Plazo', cls: 'ok' },
];

export const HORIZON_OPTS: Array<{ id: NlpHorizonFilter; label: string }> = [
  { id: 'todas', label: 'Toda Prioridad' },
  { id: 'corto', label: '≤1 Año' },
  { id: 'largo', label: '2–6 Años' },
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
    const vencimiento_pct =
      routeBase.length > 0 ? Math.round((baseOverdue / routeBase.length) * 1000) / 10 : 0;
    const visible =
      urgencia === 'todos' ? routeBase : routeBase.filter((t) => t.urgencia === urgencia);

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
      .slice(0, 7);

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
        .slice(0, 5),
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
  const rows = [...summaries].reverse();
  const endLabel = {
    show: true, position: 'right' as const, color: tokens.textColor, fontSize: 10.5, fontWeight: 700,
    formatter: (p: any) => { const r = rows[p.dataIndex]; return r ? `${r.total.toLocaleString()} (${r.vencimiento_pct}% venc.)` : ''; },
  };

  const series: echarts.SeriesOption[] =
    estado === 'abiertos'
      ? [
          { name: 'Abiertos Vencidos', type: 'bar', stack: 's', barMaxWidth: 24, itemStyle: { color: tokens.sla.excede }, data: rows.map((r) => r.ab_vencidos) },
          { name: 'Próximos (≤90d)', type: 'bar', stack: 's', barMaxWidth: 24, itemStyle: { color: tokens.sla.warning }, data: rows.map((r) => r.ab_proximos) },
          { name: 'Abiertos en Plazo', type: 'bar', stack: 's', barMaxWidth: 24, itemStyle: { color: tokens.sla.cumple }, label: endLabel, data: rows.map((r) => r.ab_en_plazo) },
        ]
      : estado === 'cerrados'
        ? [
            { name: 'Cerrados Fuera de Plazo', type: 'bar', stack: 's', barMaxWidth: 24, itemStyle: { color: tokens.sla.excede }, data: rows.map((r) => r.ce_vencidos) },
            { name: 'Cerrados a Tiempo', type: 'bar', stack: 's', barMaxWidth: 24, itemStyle: { color: tokens.sla.cumple }, label: endLabel, data: rows.map((r) => r.ce_a_tiempo) },
          ]
        : [
            { name: 'Abiertos Vencidos', type: 'bar', stack: 's', barMaxWidth: 24, itemStyle: { color: tokens.sla.excede }, data: rows.map((r) => r.ab_vencidos) },
            { name: 'Cerrados Fuera de Plazo', type: 'bar', stack: 's', barMaxWidth: 24, itemStyle: { color: '#fb7185' }, data: rows.map((r) => r.ce_vencidos) },
            { name: 'Abiertos en Plazo', type: 'bar', stack: 's', barMaxWidth: 24, itemStyle: { color: tokens.sla.warning }, data: rows.map((r) => r.ab_proximos + r.ab_en_plazo) },
            { name: 'Cerrados a Tiempo', type: 'bar', stack: 's', barMaxWidth: 24, itemStyle: { color: tokens.sla.cumple }, label: endLabel, data: rows.map((r) => r.ce_a_tiempo) },
          ];

  return {
    backgroundColor: 'transparent',
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'shadow' },
      backgroundColor: tokens.tooltipBg,
      borderColor: tokens.tooltipBorder,
      textStyle: { color: tokens.textColor, fontSize: 11.5 },
      formatter: (params: any) => {
        const r = rows[params?.[0]?.dataIndex ?? 0];
        if (!r) return '';
        const lines = params.map((p: any) => `<div>${p.marker} ${p.seriesName}: <b>${Number(p.value).toLocaleString()}</b></div>`).join('');
        return `<div style="font-weight:700;margin-bottom:4px;">${r.name}</div>${lines}
          <div style="margin-top:4px;padding-top:4px;border-top:1px solid ${tokens.gridColor};font-size:10.5px;">
            Tasa de vencimiento: <b>${r.vencimiento_pct}%</b> · Mediana: <b>${r.mediana_dias} d</b>
          </div>`;
      },
    },
    legend: { top: 2, right: 6, itemWidth: 10, itemHeight: 10, textStyle: { color: tokens.textSecondary, fontSize: 10.5 } },
    grid: { top: 32, left: 8, right: 118, bottom: 12, containLabel: true },
    xAxis: { type: 'value', splitLine: { lineStyle: { color: tokens.gridColor, type: 'dashed' } }, axisLabel: { color: tokens.textSecondary, fontSize: 10.5 } },
    yAxis: {
      type: 'category',
      data: rows.map((r) => (r.id === selectedId ? `▸ ${r.short_name}` : r.short_name)),
      axisLine: { show: false },
      axisTick: { show: false },
      axisLabel: { color: tokens.textColor, fontSize: 11, fontWeight: 700 },
    },
    series,
  };
}

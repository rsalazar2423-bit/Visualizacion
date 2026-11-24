/**
 * nlpTriageEngine.ts — Motor puro de filtrado y gráfico de barras apiladas SLA
 * para el Triaje Operativo del Coordinador.
 */
import type * as echarts from 'echarts';
import { getEChartsThemeTokens } from '../../constants/themeTokens';
import type {
  NlpGraphPayload,
  NlpHorizonFilter,
  NlpRouteId,
  NlpRouteSummary,
  NlpUrgencyFilter,
} from '../../types/nlpGraph';

export interface TriageFilters {
  cte: string | null;
  depto: string | null;
  municipio: string | null;
  urgencia: NlpUrgencyFilter;
  horizonte: NlpHorizonFilter;
}

export function computeTriageSummaries(
  payload: NlpGraphPayload,
  filters: TriageFilters,
): NlpRouteSummary[] {
  const { cte, depto, municipio, urgencia, horizonte } = filters;

  const geoFiltered = payload.open_tickets.filter((t) => {
    if (cte && cte !== 'Todos' && t.cte !== cte) return false;
    if (depto && depto !== 'Todos' && t.depto !== depto) return false;
    if (municipio && municipio !== 'Todos' && t.mpio !== municipio) return false;
    if (horizonte !== 'todas' && t.horizonte !== horizonte) return false;
    return true;
  });

  const closedFiltered = payload.closed_stats.filter((s) => {
    if (cte && cte !== 'Todos' && s.cte !== cte) return false;
    if (depto && depto !== 'Todos' && s.depto !== depto) return false;
    return true;
  });

  const groupGeoByMpio = Boolean(depto && depto !== 'Todos');

  return payload.routes.map((route) => {
    const routeAllUrgencies = geoFiltered.filter((t) => t.ruta === route.id);
    const routeTickets =
      urgencia === 'todos'
        ? routeAllUrgencies
        : routeAllUrgencies.filter((t) => t.urgencia === urgencia);

    let vencidos = 0;
    let proximos = 0;
    let en_plazo = 0;
    const geoCounts = new Map<string, { total: number; vencidos: number }>();

    for (const t of routeTickets) {
      if (t.urgencia === 'vencido') vencidos++;
      else if (t.urgencia === 'proximo') proximos++;
      else en_plazo++;

      const gKey = groupGeoByMpio ? t.mpio : t.depto;
      const prev = geoCounts.get(gKey) ?? { total: 0, vencidos: 0 };
      prev.total++;
      if (t.urgencia === 'vencido') prev.vencidos++;
      geoCounts.set(gKey, prev);
    }

    const cRows = closedFiltered.filter((s) => s.ruta === route.id);
    const cerrados_hist = cRows.reduce((acc, s) => acc + s.count, 0);
    const weightedMed =
      cerrados_hist > 0
        ? Math.round(cRows.reduce((acc, s) => acc + s.mediana_dias * s.count, 0) / cerrados_hist)
        : 0;
    const denom = routeAllUrgencies.length + cerrados_hist;
    const tasa_exito_pct = denom > 0 ? Math.round((cerrados_hist / denom) * 1000) / 10 : 0;

    const top_territories = Array.from(geoCounts.entries())
      .map(([name, v]) => ({ name, total: v.total, vencidos: v.vencidos }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 6);

    return {
      ...route,
      total: routeTickets.length,
      vencidos,
      proximos,
      en_plazo,
      cerrados_hist,
      tasa_exito_pct,
      mediana_cierre_dias: weightedMed,
      top_territories,
      tickets: routeTickets,
    };
  });
}

export function buildTriageBarOption(
  summaries: NlpRouteSummary[],
  selectedId: NlpRouteId,
  isDark: boolean,
): echarts.EChartsOption {
  const tokens = getEChartsThemeTokens(isDark);
  const rows = [...summaries].reverse();

  return {
    backgroundColor: 'transparent',
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'shadow' },
      backgroundColor: tokens.tooltipBg,
      borderColor: tokens.tooltipBorder,
      textStyle: { color: tokens.textColor, fontSize: 11.5 },
      formatter: (params: any) => {
        const idx = params?.[0]?.dataIndex ?? 0;
        const r = rows[idx];
        if (!r) return '';
        return `<div style="font-weight:700;margin-bottom:4px;">${r.name}</div>
          <div>🔴 Vencidos: <b>${r.vencidos}</b></div>
          <div>🟠 Próximos (≤90d): <b>${r.proximos}</b></div>
          <div>🟢 En Plazo: <b>${r.en_plazo}</b></div>
          <div style="margin-top:4px;padding-top:4px;border-top:1px solid ${tokens.gridColor};font-size:10.5px;color:${tokens.textSecondary};">
            Histórico: <b>${r.tasa_exito_pct}% resuelto</b> (~${r.mediana_cierre_dias} d)
          </div>`;
      },
    },
    legend: {
      top: 4,
      right: 8,
      itemWidth: 10,
      itemHeight: 10,
      textStyle: { color: tokens.textSecondary, fontSize: 11 },
    },
    grid: { top: 34, left: 12, right: 64, bottom: 18, containLabel: true },
    xAxis: {
      type: 'value',
      splitLine: { lineStyle: { color: tokens.gridColor, type: 'dashed' } },
      axisLabel: { color: tokens.textSecondary, fontSize: 10.5 },
    },
    yAxis: {
      type: 'category',
      data: rows.map((r) => (r.id === selectedId ? `▸ ${r.short_name}` : r.short_name)),
      axisLine: { show: false },
      axisTick: { show: false },
      axisLabel: {
        color: tokens.textColor,
        fontSize: 11.5,
        fontWeight: 700,
      },
    },
    series: [
      {
        name: 'Vencidos',
        type: 'bar',
        stack: 'sla',
        barMaxWidth: 28,
        itemStyle: { color: tokens.sla.excede, borderRadius: [4, 0, 0, 4] },
        data: rows.map((r) => r.vencidos),
      },
      {
        name: 'Próximos (≤90d)',
        type: 'bar',
        stack: 'sla',
        barMaxWidth: 28,
        itemStyle: { color: tokens.sla.warning },
        data: rows.map((r) => r.proximos),
      },
      {
        name: 'En Plazo',
        type: 'bar',
        stack: 'sla',
        barMaxWidth: 28,
        itemStyle: { color: tokens.sla.cumple, borderRadius: [0, 4, 4, 0] },
        label: {
          show: true,
          position: 'right',
          color: tokens.textColor,
          fontSize: 11,
          fontWeight: 700,
          formatter: (p: any) => `${rows[p.dataIndex]?.total ?? 0}`,
        },
        data: rows.map((r) => r.en_plazo),
      },
    ],
  };
}

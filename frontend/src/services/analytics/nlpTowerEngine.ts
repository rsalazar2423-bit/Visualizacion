/**
 * nlpTowerEngine.ts — Agregador y constructor ECharts para Torres Reincidentes.
 * Identifica torres que acumulan avisos repetidos y su historial de vencimientos.
 */
import type * as echarts from 'echarts';
import { getEChartsThemeTokens } from '../../constants/themeTokens';
import type { NlpEstadoFilter, NlpTicket, NlpTowerSummary } from '../../types/nlpGraph';

export function computeTopRepeatTowers(tickets: NlpTicket[], limit = 10): NlpTowerSummary[] {
  const map = new Map<string, NlpTowerSummary>();

  for (const t of tickets) {
    if (!t.torre || t.torre === '-' || t.linea === 'Sin Línea') continue;
    const key = `${t.linea}::${t.torre}`;
    let entry = map.get(key);
    if (!entry) {
      entry = {
        key,
        label: `${t.linea} · ${t.torre}`,
        linea: t.linea,
        torre: t.torre,
        mpio: t.mpio,
        total: 0,
        vencidos_total: 0,
        vencimiento_pct: 0,
        ab_vencidos: 0,
        ab_en_plazo: 0,
        ce_vencidos: 0,
        ce_a_tiempo: 0,
        tickets: [],
      };
      map.set(key, entry);
    }
    entry.total++;
    entry.tickets.push(t);
    if (t.estado === 'abierto') {
      if (t.urgencia === 'vencido') entry.ab_vencidos++;
      else entry.ab_en_plazo++;
    } else if (t.urgencia === 'vencido') {
      entry.ce_vencidos++;
    } else {
      entry.ce_a_tiempo++;
    }
    if (t.urgencia === 'vencido') entry.vencidos_total++;
  }

  return Array.from(map.values())
    .map((e) => ({
      ...e,
      vencimiento_pct: e.total > 0 ? Math.round((e.vencidos_total / e.total) * 1000) / 10 : 0,
    }))
    .sort((a, b) => b.vencidos_total - a.vencidos_total || b.total - a.total)
    .slice(0, limit);
}

export function buildTowerBarOption(
  towers: NlpTowerSummary[],
  estado: NlpEstadoFilter,
  selectedKey: string | null,
  isDark: boolean,
): echarts.EChartsOption {
  const tokens = getEChartsThemeTokens(isDark);
  const openOkColor = isDark ? '#38BDF8' : '#0284C7';
  const rows = [...towers].reverse();
  const endLabel = {
    show: true,
    position: 'right' as const,
    color: tokens.textSecondary,
    fontSize: 10.5,
    fontWeight: 600,
    formatter: (p: any) => {
      const r = rows[p.dataIndex];
      return r ? `${r.total} (${r.vencimiento_pct}% venc.)` : '';
    },
  };

  const series: echarts.SeriesOption[] =
    estado === 'abiertos'
      ? [
          { name: 'Abiertos Vencidos', type: 'bar', stack: 's', barMaxWidth: 20, itemStyle: { color: tokens.sla.excede }, data: rows.map((r) => r.ab_vencidos) },
          { name: 'Abiertos en Plazo', type: 'bar', stack: 's', barMaxWidth: 20, itemStyle: { color: tokens.sla.cumple }, label: endLabel, data: rows.map((r) => r.ab_en_plazo) },
        ]
      : estado === 'cerrados'
        ? [
            { name: 'Cerrados Vencidos', type: 'bar', stack: 's', barMaxWidth: 20, itemStyle: { color: tokens.sla.warning }, data: rows.map((r) => r.ce_vencidos) },
            { name: 'Cerrados a Tiempo', type: 'bar', stack: 's', barMaxWidth: 20, itemStyle: { color: tokens.sla.cumple }, label: endLabel, data: rows.map((r) => r.ce_a_tiempo) },
          ]
        : [
            { name: 'Abiertos Vencidos', type: 'bar', stack: 's', barMaxWidth: 20, itemStyle: { color: tokens.sla.excede }, data: rows.map((r) => r.ab_vencidos) },
            { name: 'Cerrados Vencidos', type: 'bar', stack: 's', barMaxWidth: 20, itemStyle: { color: tokens.sla.warning }, data: rows.map((r) => r.ce_vencidos) },
            { name: 'Abiertos en Plazo', type: 'bar', stack: 's', barMaxWidth: 20, itemStyle: { color: openOkColor }, data: rows.map((r) => r.ab_en_plazo) },
            { name: 'Cerrados a Tiempo', type: 'bar', stack: 's', barMaxWidth: 20, itemStyle: { color: tokens.sla.cumple }, label: endLabel, data: rows.map((r) => r.ce_a_tiempo) },
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
        const lines = params.map((p: any) => `<div>${p.marker} ${p.seriesName}: <b>${p.value}</b></div>`).join('');
        return `<div style="font-weight:700;">${r.label}</div><div style="font-size:10.5px;color:${tokens.textSecondary};margin-bottom:4px;">${r.mpio}</div>${lines}
          <div style="margin-top:4px;padding-top:4px;border-top:1px solid ${tokens.gridColor};font-size:10.5px;">Reincidencia vencida: <b>${r.vencimiento_pct}%</b></div>`;
      },
    },
    legend: { top: 0, left: 0, itemWidth: 10, itemHeight: 10, textStyle: { color: tokens.textSecondary, fontSize: 10.5 } },
    grid: { top: 32, left: 6, right: 112, bottom: 8, containLabel: true },
    xAxis: { type: 'value', minInterval: 1, splitLine: { lineStyle: { color: tokens.gridColor, type: 'dashed' } }, axisLabel: { color: tokens.textSecondary, fontSize: 10.5 } },
    yAxis: {
      type: 'category',
      data: rows.map((r) => (r.key === selectedKey ? `▸ ${r.label}` : r.label)),
      axisLine: { show: false },
      axisTick: { show: false },
      axisLabel: { color: tokens.textColor, fontSize: 10.5, fontWeight: 700 },
    },
    series,
  };
}

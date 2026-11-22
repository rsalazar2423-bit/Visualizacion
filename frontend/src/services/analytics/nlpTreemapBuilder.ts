/**
 * nlpTreemapBuilder.ts — Constructor puro de opciones ECharts Treemap
 * con soporte para jerarquía Clúster → Territorio y pivote Territorio → Clúster.
 */
import type * as echarts from 'echarts';
import { getEChartsThemeTokens } from '../../constants/themeTokens';
import type { NlpGroupMode, NlpModeData } from '../../types/nlpGraph';

function buildClusterHierarchy(modeData: NlpModeData) {
  return modeData.treemap.children
    .filter((c) => c.value > 0)
    .map((c) => ({
      name: c.name,
      value: c.value,
      mora: c.mora,
      clusterName: c.name,
      itemStyle: { color: c.color },
      children: c.children.map((ch) => ({
        name: ch.name,
        value: ch.value,
        mora: ch.mora,
        clusterName: c.name,
      })),
    }));
}

function buildTerritoryHierarchy(modeData: NlpModeData, isDark: boolean) {
  const geoMap = new Map<
    string,
    { total: number; children: Array<{ name: string; value: number; mora: number; clusterName: string; itemStyle: { color: string } }> }
  >();

  for (const c of modeData.treemap.children) {
    for (const ch of c.children) {
      if (ch.value <= 0) continue;
      let entry = geoMap.get(ch.name);
      if (!entry) {
        entry = { total: 0, children: [] };
        geoMap.set(ch.name, entry);
      }
      entry.total += ch.value;
      entry.children.push({
        name: c.name,
        value: ch.value,
        mora: ch.mora,
        clusterName: c.name,
        itemStyle: { color: c.color },
      });
    }
  }

  const parentBg = isDark ? '#334155' : '#475569';
  return Array.from(geoMap.entries())
    .sort((a, b) => b[1].total - a[1].total)
    .slice(0, 10)
    .map(([geoName, info]) => ({
      name: geoName,
      value: info.total,
      mora: info.children[0]?.mora ?? 0,
      clusterName: info.children.sort((a, b) => b.value - a.value)[0]?.clusterName ?? '',
      itemStyle: { color: parentBg },
      children: info.children,
    }));
}

export function buildNlpTreemapOption(
  modeData: NlpModeData,
  title: string,
  groupMode: NlpGroupMode,
  geoLabel: string,
  isDark: boolean,
): echarts.EChartsOption {
  const tokens = getEChartsThemeTokens(isDark);
  const borderBg = isDark ? '#0f172a' : '#f8fafc';
  const isClusterFirst = groupMode === 'cluster';
  const data = isClusterFirst
    ? buildClusterHierarchy(modeData)
    : buildTerritoryHierarchy(modeData, isDark);

  return {
    backgroundColor: 'transparent',
    title: {
      text: title,
      left: 8,
      top: 6,
      textStyle: { fontSize: 11.5, fontWeight: 700, color: tokens.textColor },
    },
    tooltip: {
      backgroundColor: tokens.tooltipBg,
      borderColor: tokens.tooltipBorder,
      textStyle: { color: tokens.textColor, fontSize: 11 },
      formatter: (p: any) => {
        const d = p.data || {};
        if (!d.value) return '';
        const pct = modeData.total_avisos > 0 ? ((d.value / modeData.total_avisos) * 100).toFixed(1) : '0';
        const context = isClusterFirst
          ? d.clusterName && d.clusterName !== d.name
            ? `Clúster: ${d.clusterName}`
            : 'Clúster NLP (Clic para detalle)'
          : d.children
            ? `${geoLabel} · ${d.children.length} causas`
            : `Causa en ${p.treePathInfo?.[1]?.name ?? geoLabel}`;
        const moraHtml = d.children && !isClusterFirst ? '' : `<div>Mediana: <b>${d.mora} días</b></div>`;
        return `<div style="font-weight:700;">${d.name}</div><div style="font-size:10px;color:${tokens.textSecondary};">${context}</div><div>Avisos: <b>${Number(d.value).toLocaleString()}</b> (${pct}%)</div>${moraHtml}`;
      },
    },
    series: [
      {
        type: 'treemap',
        top: 30,
        left: 6,
        right: 6,
        bottom: 6,
        roam: false,
        nodeClick: false,
        breadcrumb: { show: false },
        data: data as any,
        levels: [
          { itemStyle: { borderColor: borderBg, borderWidth: 2, gapWidth: 2 } },
          {
            itemStyle: { borderColor: borderBg, borderWidth: 2, gapWidth: 2 },
            upperLabel: {
              show: true,
              height: 20,
              color: '#ffffff',
              fontSize: 10,
              fontWeight: 700,
              padding: [1, 5],
              formatter: (p: any) =>
                isClusterFirst
                  ? `${p.name} · ${p.value} (${p.data?.mora ?? 0}d)`
                  : `${p.name} · ${p.value} avisos`,
            },
          },
          {
            colorSaturation: isClusterFirst ? [0.42, 0.78] : undefined,
            itemStyle: { borderColor: 'rgba(255,255,255,0.28)', borderWidth: 1, gapWidth: 1 },
            label: {
              show: true,
              fontSize: 9.5,
              fontWeight: 600,
              color: '#ffffff',
              overflow: 'truncate',
              formatter: (p: any) => `${p.name}\n${p.value}`,
            },
          },
        ],
      },
    ],
  };
}

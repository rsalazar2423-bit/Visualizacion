/**
 * Responsabilidad Única (SRP):
 * Cálculos analíticos de la Vista 02 (Diagnóstico Territorial, Mapa Histórico 2008-2023,
 * Trazado de Líneas de Transmisión, Ranking de Sectores y Cuantiles por Tipología).
 */

import type {
  TerritorialDataResponse,
  TreemapNode,
  SunburstNode,
  TicketItem,
  MapAvisoPoint,
  MapLineTrace,
  SectorDelayItem,
  TypologyDurationItem,
} from '../../types/models';
import {
  TIPO_COLORS,
  PRIO_COLORS,
  DEPTO_PALETTE,
  CORPORATE_PALETTE,
} from '../../constants/themeTokens';
import { getDataset, type EquipoRecord } from './datasetRepository';
import { calcQuantile, calcMedian, extractYear, filterAvisos } from './statsHelpers';

const PRIO_CLARIFIED_LABELS: Record<string, string> = {
  Año: 'Plazo 1 Año',
  'Dos años': 'Plazo 2 Años',
  'Tres años': 'Plazo 3 Años',
  'Seis años': 'Plazo 6 Años',
  Semestre: 'Plazo Semestre',
  Trimestre: 'Plazo Trimestre',
  Mes: 'Plazo Mes',
  Semana: 'Plazo Semana',
  'No asignada': 'Sin Plazo',
};

export async function computeTerritorialData(params: {
  cte?: string | null;
  depto?: string | null;
  municipio?: string | null;
}): Promise<TerritorialDataResponse> {
  const { equipos, avisos } = await getDataset();

  const fAvisos = filterAvisos(avisos, {
    cte: params.cte,
    depto: params.depto,
    municipio: params.municipio,
  });

  let fEquipos = equipos;
  if (params.cte && params.cte !== 'Todos') {
    fEquipos = fEquipos.filter((e) => e.CTE === params.cte);
  }
  if (params.depto && params.depto !== 'Todos') {
    fEquipos = fEquipos.filter((e) => e.Departamento === params.depto);
  }
  if (params.municipio && params.municipio !== 'Todos') {
    fEquipos = fEquipos.filter((e) => e.Municipio === params.municipio);
  }

  // 1. Treemap nodes con escala secuencial ejecutiva (DEPTO_PALETTE)
  let treemapNodes: TreemapNode[] = [];
  let rootTitle = 'Toda la Red';

  if (params.municipio && params.municipio !== 'Todos') {
    treemapNodes = [
      {
        name: params.municipio,
        value: fAvisos.length,
        itemStyle: { color: DEPTO_PALETTE[0] },
      },
    ];
    rootTitle = params.municipio;
  } else if (params.depto && params.depto !== 'Todos') {
    const counts: Record<string, { val: number; cumple: number; vencidos: number }> = {};
    for (const a of fAvisos) {
      const m = a.Municipio || 'No Identificado';
      if (!counts[m]) counts[m] = { val: 0, cumple: 0, vencidos: 0 };
      counts[m].val += 1;
      if (a.Cumplimiento_Estado === 'Cumple Plazo') counts[m].cumple += 1;
      if (a['Estado aviso'] === 'Abierto' && a.Cumplimiento_Estado === 'Excede Plazo') counts[m].vencidos += 1;
    }
    treemapNodes = Object.entries(counts)
      .sort((a, b) => b[1].val - a[1].val)
      .map(([name, stats], idx) => ({
        name,
        value: stats.val,
        cumple_pct: stats.val > 0 ? Number(((stats.cumple / stats.val) * 100).toFixed(1)) : 0,
        vencidos: stats.vencidos,
        itemStyle: { color: DEPTO_PALETTE[idx % DEPTO_PALETTE.length] },
      }));
    rootTitle = params.depto;
  } else {
    const counts: Record<string, { val: number; cumple: number; vencidos: number }> = {};
    for (const a of fAvisos) {
      const d = a.Departamento || 'No Identificado';
      if (!counts[d]) counts[d] = { val: 0, cumple: 0, vencidos: 0 };
      counts[d].val += 1;
      if (a.Cumplimiento_Estado === 'Cumple Plazo') counts[d].cumple += 1;
      if (a['Estado aviso'] === 'Abierto' && a.Cumplimiento_Estado === 'Excede Plazo') counts[d].vencidos += 1;
    }
    treemapNodes = Object.entries(counts)
      .sort((a, b) => b[1].val - a[1].val)
      .map(([name, stats], idx) => ({
        name,
        value: stats.val,
        cumple_pct: stats.val > 0 ? Number(((stats.cumple / stats.val) * 100).toFixed(1)) : 0,
        vencidos: stats.vencidos,
        itemStyle: { color: DEPTO_PALETTE[idx % DEPTO_PALETTE.length] },
      }));
    rootTitle = params.cte && params.cte !== 'Todos' ? `Zona ${params.cte}` : 'Red Nacional';
  }

  // 2. Sunburst SLA
  const sunburstSlaMap: Record<string, { cumple: number; excede: number }> = {};
  for (const a of fAvisos) {
    const tipo = a['Tipo de aviso'] || 'Otros';
    if (!sunburstSlaMap[tipo]) sunburstSlaMap[tipo] = { cumple: 0, excede: 0 };
    if (a.Cumplimiento_Estado === 'Cumple Plazo') {
      sunburstSlaMap[tipo].cumple += 1;
    } else {
      sunburstSlaMap[tipo].excede += 1;
    }
  }

  const sunburstSla: SunburstNode[] = Object.entries(sunburstSlaMap)
    .map(([name, { cumple, excede }]) => {
      const total = cumple + excede;
      const cPct = total > 0 ? Number(((cumple / total) * 100).toFixed(1)) : 0;
      const ePct = total > 0 ? Number(((excede / total) * 100).toFixed(1)) : 0;
      const children: SunburstNode[] = [];
      if (cumple > 0) {
        children.push({
          name: `Cumple (${cPct}%)`,
          value: cumple,
          itemStyle: { color: CORPORATE_PALETTE.brand },
        });
      }
      if (excede > 0) {
        children.push({
          name: `Excede (${ePct}%)`,
          value: excede,
          itemStyle: { color: CORPORATE_PALETTE.danger },
        });
      }
      return {
        name,
        itemStyle: { color: TIPO_COLORS[name] || CORPORATE_PALETTE.slate },
        children,
      };
    })
    .sort((a, b) => {
      const sumA = (a.children || []).reduce((s, c) => s + (c.value || 0), 0);
      const sumB = (b.children || []).reduce((s, c) => s + (c.value || 0), 0);
      return sumB - sumA;
    });

  // 3. Sunburst Plazos
  const sunburstPlazosMap: Record<string, Record<string, number>> = {};
  for (const a of fAvisos) {
    const tipo = a['Tipo de aviso'] || 'Otros';
    const prio = a.Prioridad || 'No asignada';
    if (!sunburstPlazosMap[tipo]) sunburstPlazosMap[tipo] = {};
    sunburstPlazosMap[tipo][prio] = (sunburstPlazosMap[tipo][prio] || 0) + 1;
  }

  const sunburstPlazos: SunburstNode[] = Object.entries(sunburstPlazosMap)
    .map(([tipo, prios]) => {
      const children: SunburstNode[] = Object.entries(prios)
        .sort((a, b) => b[1] - a[1])
        .map(([prio, cnt]) => ({
          name: PRIO_CLARIFIED_LABELS[prio] || prio,
          value: cnt,
          itemStyle: { color: PRIO_COLORS[prio] || CORPORATE_PALETTE.slate },
        }));
      return {
        name: tipo,
        itemStyle: { color: TIPO_COLORS[tipo] || CORPORATE_PALETTE.slate },
        children,
      };
    })
    .sort((a, b) => {
      const sumA = (a.children || []).reduce((s, c) => s + (c.value || 0), 0);
      const sumB = (b.children || []).reduce((s, c) => s + (c.value || 0), 0);
      return sumB - sumA;
    });

  // 4. Puntos Geográficos para el Mapa Histórico
  const eqMap = new Map<number, EquipoRecord>();
  for (const e of equipos) {
    eqMap.set(e.Equipo, e);
  }

  const yearsSet = new Set<number>();
  const mapPoints: MapAvisoPoint[] = [];

  for (const a of fAvisos) {
    const eq = eqMap.get(a.Equipo);
    const lat = a.Latitud ?? eq?.Latitud ?? null;
    const lon = a.Longitud ?? eq?.Longitud ?? null;
    if (lat == null || lon == null) continue;

    const yr = extractYear(a['Fecha de aviso'], a.Año);
    const yrClose = extractYear(a['Fecha de cierre'], a['Año cierre']);
    if (yr >= 2008) yearsSet.add(yr);

    mapPoints.push({
      aviso: String(a.Aviso),
      equipo: a.Equipo,
      lat: Number(lat),
      lon: Number(lon),
      depto: a.Departamento || 'No Identificado',
      mpio: a.Municipio || 'No Identificado',
      sector: a.Sector || a.Municipio || 'General',
      linea: a.Linea || eq?.Linea || 'Sin Línea',
      tipo: a['Tipo de aviso'] || 'Otros',
      prioridad: a.Prioridad || 'Media',
      estado: a['Estado aviso'] || 'Cerrado',
      cumplimiento: a.Cumplimiento_Estado || 'Excede Plazo',
      dias_abierto: Math.round(a['Días abierto'] || 0),
      year: yr || 2018,
      year_cierre: yrClose || 0,
    });
  }

  // Trazado de líneas de transmisión
  const linesGroup: Record<string, { cte: string; pts: [number, number][] }> = {};
  for (const e of fEquipos) {
    if (e.Latitud == null || e.Longitud == null || !e.Linea || e.Linea === 'Sin Línea') continue;
    if (!linesGroup[e.Linea]) {
      linesGroup[e.Linea] = { cte: e.CTE, pts: [] };
    }
    linesGroup[e.Linea].pts.push([Number(e.Longitud), Number(e.Latitud)]);
  }

  const mapLines: MapLineTrace[] = Object.entries(linesGroup)
    .filter(([, v]) => v.pts.length >= 2)
    .map(([linea, v]) => {
      const sortedPts = [...v.pts].sort((a, b) => a[1] - b[1] || a[0] - b[0]);
      const step = Math.max(1, Math.floor(sortedPts.length / 25));
      const sampled = sortedPts.filter((_, idx) => idx % step === 0 || idx === sortedPts.length - 1);
      return {
        linea,
        cte: v.cte,
        coords: sampled,
      };
    });

  // 5. Ranking de Municipios / Sectores con Mayores Retrasos
  const groupKey = params.depto && params.depto !== 'Todos' ? 'Sector' : 'Municipio';
  const sectorMap: Record<
    string,
    { depto: string; total: number; abiertos: number; vencidos: number; excede: number; cumple: number; dias: number[] }
  > = {};

  for (const a of fAvisos) {
    const key =
      groupKey === 'Sector'
        ? `${a.Municipio} · ${a.Sector || 'General'}`
        : a.Municipio || 'No Identificado';
    if (key.includes('No Identificado')) continue;
    if (!sectorMap[key]) {
      sectorMap[key] = {
        depto: a.Departamento || '',
        total: 0,
        abiertos: 0,
        vencidos: 0,
        excede: 0,
        cumple: 0,
        dias: [],
      };
    }
    const st = sectorMap[key];
    st.total += 1;
    if (a['Estado aviso'] === 'Abierto') {
      st.abiertos += 1;
      if (a.Cumplimiento_Estado === 'Excede Plazo') st.vencidos += 1;
    }
    if (a.Cumplimiento_Estado === 'Excede Plazo') st.excede += 1;
    else st.cumple += 1;
    st.dias.push(a['Días abierto'] || 0);
  }

  const sectorRanking: SectorDelayItem[] = Object.entries(sectorMap)
    .map(([name, st]) => ({
      name,
      depto: st.depto,
      total: st.total,
      abiertos: st.abiertos,
      abiertos_vencidos: st.vencidos,
      excede_total: st.excede,
      cumple_pct: st.total > 0 ? Number(((st.cumple / st.total) * 100).toFixed(1)) : 0,
      mediana_dias: calcMedian(st.dias),
    }))
    .sort((a, b) => b.abiertos_vencidos - a.abiertos_vencidos || b.excede_total - a.excede_total)
    .slice(0, 12);

  // 6. Distribución de Tiempos por Tipo de Aviso (Cuantiles P25, Mediana, P75 y Promedio)
  const tipoStatsMap: Record<
    string,
    { total: number; cerrados: number; vencidos: number; cumple: number; dias: number[] }
  > = {};
  for (const a of fAvisos) {
    const t = a['Tipo de aviso'] || 'Otros';
    if (!tipoStatsMap[t]) {
      tipoStatsMap[t] = { total: 0, cerrados: 0, vencidos: 0, cumple: 0, dias: [] };
    }
    const ts = tipoStatsMap[t];
    ts.total += 1;
    if ((a['Estado aviso'] || 'Cerrado') === 'Cerrado') ts.cerrados += 1;
    if (a['Estado aviso'] === 'Abierto' && a.Cumplimiento_Estado === 'Excede Plazo') ts.vencidos += 1;
    if (a.Cumplimiento_Estado === 'Cumple Plazo') ts.cumple += 1;
    ts.dias.push(a['Días abierto'] || 0);
  }

  const typologyDurations: TypologyDurationItem[] = Object.entries(tipoStatsMap)
    .map(([tipo, ts]) => {
      const sorted = [...ts.dias].sort((a, b) => a - b);
      const sum = sorted.reduce((acc, v) => acc + v, 0);
      return {
        tipo,
        color: TIPO_COLORS[tipo] || CORPORATE_PALETTE.slate,
        total: ts.total,
        cerrados: ts.cerrados,
        abiertos_vencidos: ts.vencidos,
        cumple_pct: ts.total > 0 ? Number(((ts.cumple / ts.total) * 100).toFixed(1)) : 0,
        p25_dias: calcQuantile(sorted, 0.25),
        mediana_dias: calcQuantile(sorted, 0.5),
        p75_dias: calcQuantile(sorted, 0.75),
        promedio_dias: sorted.length > 0 ? Number((sum / sorted.length).toFixed(1)) : 0,
      };
    })
    .sort((a, b) => b.mediana_dias - a.mediana_dias);

  // 7. Tickets table
  const tickets: TicketItem[] = fAvisos.slice(0, 120).map((a) => ({
    numero_aviso: String(a.Aviso || 'N/D'),
    fecha_aviso: String(a['Fecha de aviso'] || 'N/D'),
    fecha_cierre: a['Fecha de cierre'] || 'Pendiente',
    estado_aviso: a['Estado aviso'] || 'Cerrado',
    sector: a.Sector || 'General',
    equipo: String(a.Equipo || 'N/D'),
    departamento: a.Departamento || 'No Identificado',
    municipio: a.Municipio || 'No Identificado',
    tipo_aviso: a['Tipo de aviso'] || 'Otros',
    prioridad: a.Prioridad || 'Media',
    cumplimiento: a.Cumplimiento_Estado || 'Excede Plazo',
    dias_abierto: Math.round(a['Días abierto'] || 0),
  }));

  // 8. KPIs Territoriales
  const vencidosTotal = fAvisos.filter(
    (a) => a['Estado aviso'] === 'Abierto' && a.Cumplimiento_Estado === 'Excede Plazo'
  ).length;
  const cumpleTotal = fAvisos.filter((a) => a.Cumplimiento_Estado === 'Cumple Plazo').length;
  const cumplePctTerr = fAvisos.length > 0 ? Number(((cumpleTotal / fAvisos.length) * 100).toFixed(1)) : 0;

  let territorialKpis;
  if (params.municipio && params.municipio !== 'Todos') {
    territorialKpis = {
      ctes: fAvisos.length > 0 ? fAvisos[0].CTE : null,
      deptos: fAvisos.length > 0 ? fAvisos[0].Departamento : null,
      mpios: fAvisos.length,
      equipos: fEquipos.length,
      abiertos_vencidos: vencidosTotal,
      cumple_pct: cumplePctTerr,
    };
  } else {
    const ctesSet = new Set(fEquipos.map((e) => e.CTE).filter((c) => c && c !== 'Sin Asignar'));
    const deptosSet = new Set(fEquipos.map((e) => e.Departamento).filter((d) => d && d !== 'No Identificado'));
    const mpiosSet = new Set(fEquipos.map((e) => e.Municipio).filter((m) => m && m !== 'No Identificado'));
    territorialKpis = {
      ctes: ctesSet.size,
      deptos: deptosSet.size,
      mpios: mpiosSet.size,
      equipos: fEquipos.length,
      abiertos_vencidos: vencidosTotal,
      cumple_pct: cumplePctTerr,
    };
  }

  return {
    kpis: territorialKpis,
    treemap: {
      name: rootTitle,
      value: fAvisos.length,
      children: treemapNodes,
    },
    sunburst: sunburstSla,
    sunburst_sla: sunburstSla,
    sunburst_plazos: sunburstPlazos,
    tickets,
    total_tickets_matching: fAvisos.length,
    map_points: mapPoints,
    map_lines: mapLines,
    years_catalog: Array.from(yearsSet).sort((a, b) => a - b),
    sector_ranking: sectorRanking,
    typology_durations: typologyDurations,
  };
}


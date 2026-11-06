/**
 * Responsabilidad Única (SRP):
 * Cálculos analíticos de la Vista 03 (Capacidad Operativa, Densidad por 100 Torres y Matriz de Dispersión).
 */

import type { CapacityDataResponse, CapacityRegionItem } from '../../types/models';
import { getDataset } from './datasetRepository';
import { calcMedian, filterAvisos } from './statsHelpers';

export async function computeCapacityData(params: {
  cte?: string | null;
  depto?: string | null;
}): Promise<CapacityDataResponse> {
  const { equipos, avisos } = await getDataset();

  const fAvisos = filterAvisos(avisos, { cte: params.cte, depto: params.depto });
  let fEquipos = equipos;
  if (params.cte && params.cte !== 'Todos') {
    fEquipos = fEquipos.filter((e) => e.CTE === params.cte);
  }
  if (params.depto && params.depto !== 'Todos') {
    fEquipos = fEquipos.filter((e) => e.Departamento === params.depto);
  }

  const abiertos = fAvisos.filter((a) => a['Estado aviso'] === 'Abierto');
  const abiertosVencidos = abiertos.filter((a) => a.Cumplimiento_Estado === 'Excede Plazo');
  const cerrados = fAvisos.filter((a) => (a['Estado aviso'] || 'Cerrado') === 'Cerrado');
  const cerradosCumple = cerrados.filter((a) => a.Cumplimiento_Estado === 'Cumple Plazo');

  const groupByMunicipio = Boolean(params.depto && params.depto !== 'Todos');

  const torresMap: Record<string, { cte: string; torres: number }> = {};
  for (const e of fEquipos) {
    const key = groupByMunicipio ? e.Municipio : e.Departamento;
    if (!key || key === 'No Identificado') continue;
    if (!torresMap[key]) torresMap[key] = { cte: e.CTE, torres: 0 };
    torresMap[key].torres += 1;
  }

  const avisosMap: Record<
    string,
    { cte: string; total: number; abiertos: number; vencidos: number; cerrados: number; cumple: number; dias: number[] }
  > = {};
  for (const a of fAvisos) {
    const key = groupByMunicipio ? a.Municipio : a.Departamento;
    if (!key || key === 'No Identificado') continue;
    if (!avisosMap[key]) {
      avisosMap[key] = {
        cte: a.CTE,
        total: 0,
        abiertos: 0,
        vencidos: 0,
        cerrados: 0,
        cumple: 0,
        dias: [],
      };
    }
    const st = avisosMap[key];
    st.total += 1;
    if (a['Estado aviso'] === 'Abierto') {
      st.abiertos += 1;
      if (a.Cumplimiento_Estado === 'Excede Plazo') st.vencidos += 1;
    } else {
      st.cerrados += 1;
    }
    if (a.Cumplimiento_Estado === 'Cumple Plazo') st.cumple += 1;
    st.dias.push(a['Días abierto'] || 0);
  }

  const allKeys = new Set([...Object.keys(torresMap), ...Object.keys(avisosMap)]);
  const regions: CapacityRegionItem[] = Array.from(allKeys)
    .map((region) => {
      const tInfo = torresMap[region] || { cte: avisosMap[region]?.cte || 'Suroccidente', torres: 0 };
      const aInfo = avisosMap[region] || {
        cte: tInfo.cte,
        total: 0,
        abiertos: 0,
        vencidos: 0,
        cerrados: 0,
        cumple: 0,
        dias: [],
      };
      const carga100 = tInfo.torres > 0 ? Number(((aInfo.total / tInfo.torres) * 100).toFixed(1)) : 0;
      const cumplePct = aInfo.total > 0 ? Number(((aInfo.cumple / aInfo.total) * 100).toFixed(1)) : 100;
      const indicePresion = Number((aInfo.vencidos * 1.5 + (aInfo.abiertos - aInfo.vencidos) * 0.7).toFixed(1));
      return {
        region,
        cte: tInfo.cte,
        torres: tInfo.torres,
        total_avisos: aInfo.total,
        abiertos: aInfo.abiertos,
        abiertos_vencidos: aInfo.vencidos,
        cerrados: aInfo.cerrados,
        cumple_pct: cumplePct,
        mediana_dias: calcMedian(aInfo.dias),
        carga_por_100_torres: carga100,
        indice_presion: indicePresion,
      };
    })
    .filter((r) => r.total_avisos > 0 || r.torres > 0)
    .sort((a, b) => b.abiertos_vencidos - a.abiertos_vencidos || b.total_avisos - a.total_avisos);

  // Scatter por municipio (con al menos 5 avisos)
  const mpioTorres: Record<string, { cte: string; torres: number }> = {};
  for (const e of fEquipos) {
    if (!e.Municipio || e.Municipio === 'No Identificado') continue;
    if (!mpioTorres[e.Municipio]) mpioTorres[e.Municipio] = { cte: e.CTE, torres: 0 };
    mpioTorres[e.Municipio].torres += 1;
  }

  const mpioAvisos: Record<
    string,
    { cte: string; total: number; abiertos: number; vencidos: number; cerrados: number; cumple: number; dias: number[] }
  > = {};
  for (const a of fAvisos) {
    const m = a.Municipio;
    if (!m || m === 'No Identificado') continue;
    if (!mpioAvisos[m]) {
      mpioAvisos[m] = { cte: a.CTE, total: 0, abiertos: 0, vencidos: 0, cerrados: 0, cumple: 0, dias: [] };
    }
    const st = mpioAvisos[m];
    st.total += 1;
    if (a['Estado aviso'] === 'Abierto') {
      st.abiertos += 1;
      if (a.Cumplimiento_Estado === 'Excede Plazo') st.vencidos += 1;
    } else {
      st.cerrados += 1;
    }
    if (a.Cumplimiento_Estado === 'Cumple Plazo') st.cumple += 1;
    st.dias.push(a['Días abierto'] || 0);
  }

  const municipiosScatter: CapacityRegionItem[] = Object.entries(mpioAvisos)
    .filter(([, aInfo]) => aInfo.total >= 5)
    .map(([mpio, aInfo]) => {
      const torres = mpioTorres[mpio]?.torres || 1;
      return {
        region: mpio,
        cte: aInfo.cte,
        torres,
        total_avisos: aInfo.total,
        abiertos: aInfo.abiertos,
        abiertos_vencidos: aInfo.vencidos,
        cerrados: aInfo.cerrados,
        cumple_pct: Number(((aInfo.cumple / aInfo.total) * 100).toFixed(1)),
        mediana_dias: calcMedian(aInfo.dias),
        carga_por_100_torres: Number(((aInfo.total / torres) * 100).toFixed(1)),
        indice_presion: Number((aInfo.vencidos * 1.5 + (aInfo.abiertos - aInfo.vencidos) * 0.7).toFixed(1)),
      };
    })
    .sort((a, b) => b.total_avisos - a.total_avisos)
    .slice(0, 30);

  return {
    kpis: {
      total_torres: fEquipos.length,
      avisos_abiertos: abiertos.length,
      abiertos_vencidos: abiertosVencidos.length,
      carga_por_100_torres:
        fEquipos.length > 0 ? Number(((fAvisos.length / fEquipos.length) * 100).toFixed(1)) : 0,
      cumplimiento_oportuno_pct:
        cerrados.length > 0 ? Number(((cerradosCumple.length / cerrados.length) * 100).toFixed(1)) : 0,
      mediana_dias_cerrados: calcMedian(cerrados.map((a) => a['Días abierto'] || 0)),
    },
    regions,
    municipios_scatter: municipiosScatter,
  };
}


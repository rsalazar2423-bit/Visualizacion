/**
 * Responsabilidad Única (SRP):
 * Cálculo de inteligencia accionable sobre variables reales del dataset:
 * - Envejecimiento (Aging) de avisos abiertos vencidos
 * - Concentración Pareto (80/20) por línea de transmisión
 * - Reincidencia por torre / equipo
 * - Cola priorizada de atención inmediata por exceso de días sobre SLA
 */

import type {
  ActionableInsightsResponse,
  AgingBucketItem,
  CoordinatorWorkspaceResponse,
  CorridorBatchItem,
  CriticalNoticeItem,
  CteBalanceItem,
  ExecutionBucket,
  ParetoLineaItem,
  PreventiveNoticeItem,
  RecurrentTowerItem,
} from '../../types/models';
import { getDataset } from './datasetRepository';
import { filterAvisos } from './statsHelpers';

function haversineKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export async function computeActionableInsights(params?: {
  cte?: string | null;
  depto?: string | null;
  tipo?: string | null;
}): Promise<ActionableInsightsResponse> {
  const { avisos: rawAvisos } = await getDataset();
  const avisos = filterAvisos(rawAvisos, params || {});

  // 1. Mapa de reincidencia por torre / equipo sobre todo el histórico
  const towerStats = new Map<
    number,
    { linea: string; municipio: string; depto: string; total: number; vencidos: number }
  >();
  const lineStats = new Map<string, { cte: string; total: number; vencidos: number }>();

  const openOverdue: typeof avisos = [];

  for (const a of avisos) {
    const eq = a.Equipo;
    const isVencido = a['Estado aviso'] === 'Abierto' && a.Cumplimiento_Estado === 'Excede Plazo';
    if (isVencido) openOverdue.push(a);

    if (eq) {
      const prev = towerStats.get(eq) || {
        linea: a.Linea || 'Sin Línea',
        municipio: a.Municipio || '-',
        depto: a.Departamento || '-',
        total: 0,
        vencidos: 0,
      };
      prev.total += 1;
      if (isVencido) prev.vencidos += 1;
      towerStats.set(eq, prev);
    }

    const linea = a.Linea && a.Linea !== 'No Identificado' ? a.Linea : 'Sin Línea Asignada';
    const lPrev = lineStats.get(linea) || { cte: a.CTE || '-', total: 0, vencidos: 0 };
    lPrev.total += 1;
    if (isVencido) lPrev.vencidos += 1;
    lineStats.set(linea, lPrev);
  }

  // 2. Aging de abiertos vencidos por tramos de días abierto
  const totalVencidos = openOverdue.length;
  let b90 = 0;
  let b365 = 0;
  let b1095 = 0;
  let bOlder = 0;

  for (const a of openOverdue) {
    const d = Math.max(0, Number(a['Días abierto'] || 0));
    if (d < 90) b90 += 1;
    else if (d <= 365) b365 += 1;
    else if (d <= 1095) b1095 += 1;
    else bOlder += 1;
  }

  const denom = totalVencidos || 1;
  const aging_buckets: AgingBucketItem[] = [
    { label: '< 90 días', count: b90, pct: Number(((b90 / denom) * 100).toFixed(1)), cls: 'seg-info' },
    { label: '90 – 365 días', count: b365, pct: Number(((b365 / denom) * 100).toFixed(1)), cls: 'seg-warning' },
    { label: '1 – 3 años', count: b1095, pct: Number(((b1095 / denom) * 100).toFixed(1)), cls: 'seg-orange' },
    { label: '> 3 años', count: bOlder, pct: Number(((bOlder / denom) * 100).toFixed(1)), cls: 'seg-danger' },
  ];

  // 3. Pareto 80/20 de líneas por avisos abiertos vencidos
  const linesWithOverdue = Array.from(lineStats.entries())
    .filter(([, s]) => s.vencidos > 0)
    .sort((a, b) => b[1].vencidos - a[1].vencidos || b[1].total - a[1].total);

  let runningVencidos = 0;
  let linesFor80 = 0;
  let reached80 = false;

  const pareto_lineas: ParetoLineaItem[] = linesWithOverdue.map(([linea, s]) => {
    runningVencidos += s.vencidos;
    const cumPct = Number(((runningVencidos / denom) * 100).toFixed(1));
    if (!reached80) {
      linesFor80 += 1;
      if (cumPct >= 80) reached80 = true;
    }
    return {
      linea,
      cte: s.cte,
      vencidos: s.vencidos,
      total: s.total,
      cum_pct: cumPct,
    };
  });

  // 4. Torres reincidentes (>= 2 avisos históricos)
  const recurrentList: RecurrentTowerItem[] = [];
  let recurrentNoticesCount = 0;
  for (const [equipo, s] of towerStats.entries()) {
    if (s.total >= 2) {
      recurrentNoticesCount += s.total;
      recurrentList.push({
        equipo,
        linea: s.linea,
        municipio: s.municipio,
        depto: s.depto,
        total: s.total,
        abiertos_vencidos: s.vencidos,
      });
    }
  }
  recurrentList.sort((a, b) => b.abiertos_vencidos - a.abiertos_vencidos || b.total - a.total);

  // 5. Top 10 avisos críticos de atención inmediata (ordenados por exceso sobre SLA)
  const criticalScored: CriticalNoticeItem[] = openOverdue.map((a) => {
    const diasAbierto = Math.round(Number(a['Días abierto'] || 0));
    const prioDias = Math.round(Number(a['Prioridad días'] || 0));
    const exceso = Math.max(0, diasAbierto - prioDias);
    const reinc = towerStats.get(a.Equipo)?.total ?? 1;
    return {
      aviso: String(a.Aviso),
      equipo: a.Equipo,
      linea: a.Linea || 'Sin Línea',
      municipio: a.Municipio || '-',
      depto: a.Departamento || '-',
      tipo: a['Tipo de aviso'] || '-',
      prioridad: a.Prioridad || '-',
      dias_abierto: diasAbierto,
      prioridad_dias: prioDias,
      exceso_dias: exceso,
      reincidencias_torre: reinc,
    };
  });

  criticalScored.sort(
    (a, b) => b.exceso_dias - a.exceso_dias || b.reincidencias_torre - a.reincidencias_torre
  );

  return {
    total_vencidos: totalVencidos,
    aging_buckets,
    pareto_lineas: pareto_lineas.slice(0, 8),
    lines_for_80_pct: linesFor80,
    total_lines_with_overdue: linesWithOverdue.length,
    recurrent_towers_count: recurrentList.length,
    recurrent_notices_count: recurrentNoticesCount,
    top_recurrent_towers: recurrentList.slice(0, 5),
    top_critical_notices: criticalScored.slice(0, 10),
  };
}

/**
 * Calcula los 5 bloques operativos para el Centro del Coordinador:
 * 1) Radar preventivo (>=70% SLA consumido aún en plazo)
 * 2) Ejecución física en campo vs. bloqueo predial/legal
 * 3) Lotes de despacho por corredor (Línea + Tipo) con radio geográfico en km
 * 4) Balance de absorción (Ingresos vs Cierres) por CTE o Departamento
 * 5) Depuración de mora crónica (> 3 años)
 */
export async function computeCoordinatorWorkspace(params: {
  cte?: string | null;
  depto?: string | null;
}): Promise<CoordinatorWorkspaceResponse> {
  const { avisos } = await getDataset();
  const scoped = filterAvisos(avisos, { cte: params.cte, depto: params.depto });

  const abiertos = scoped.filter((a) => a['Estado aviso'] === 'Abierto');
  const vencidos = abiertos.filter((a) => a.Cumplimiento_Estado === 'Excede Plazo');
  const enPlazo = abiertos.filter((a) => a.Cumplimiento_Estado === 'Cumple Plazo');

  // 1. Radar preventivo: abiertos en plazo con >= 70% de Prioridad días consumida
  const preventiveAll: PreventiveNoticeItem[] = [];
  for (const a of enPlazo) {
    const prioDias = Number(a['Prioridad días'] || 0);
    const diasAbierto = Number(a['Días abierto'] || 0);
    if (prioDias <= 0) continue;
    const pct = Number(((diasAbierto / prioDias) * 100).toFixed(1));
    if (pct >= 70) {
      preventiveAll.push({
        aviso: String(a.Aviso),
        equipo: a.Equipo,
        linea: a.Linea || 'Sin Línea',
        municipio: a.Municipio || '-',
        tipo: a['Tipo de aviso'] || '-',
        prioridad: a.Prioridad || '-',
        dias_abierto: Math.round(diasAbierto),
        prioridad_dias: Math.round(prioDias),
        dias_restantes: Math.max(0, Math.round(prioDias - diasAbierto)),
        pct_consumido: pct,
      });
    }
  }
  preventiveAll.sort((a, b) => b.pct_consumido - a.pct_consumido || a.dias_restantes - b.dias_restantes);

  // 2. Separación Ejecutable en Campo (Vegetación, Obras) vs Predial/Legal (Permiso Ingreso, Construcciones, Invasión)
  const CAMPO_TIPOS = new Set(['Vegetación', 'Obras']);
  let campoAb = 0;
  let campoVenc = 0;
  let predialAb = 0;
  let predialVenc = 0;
  for (const a of abiertos) {
    const isVenc = a.Cumplimiento_Estado === 'Excede Plazo';
    if (CAMPO_TIPOS.has(a['Tipo de aviso'])) {
      campoAb += 1;
      if (isVenc) campoVenc += 1;
    } else {
      predialAb += 1;
      if (isVenc) predialVenc += 1;
    }
  }
  const abDenom = abiertos.length || 1;
  const execution_split: ExecutionBucket[] = [
    {
      category: 'campo',
      label: 'Ejecución en Campo (Vegetación / Obras)',
      abiertos: campoAb,
      vencidos: campoVenc,
      pct: Number(((campoAb / abDenom) * 100).toFixed(1)),
    },
    {
      category: 'predial',
      label: 'Gestión Predial / Legal (Permisos / Construcciones / Invasión)',
      abiertos: predialAb,
      vencidos: predialVenc,
      pct: Number(((predialAb / abDenom) * 100).toFixed(1)),
    },
  ];

  // 3. Lotes de despacho por corredor (Línea + Tipo de aviso) con radio geográfico real
  const batchMap = new Map<
    string,
    {
      linea: string;
      tipo: string;
      cte: string;
      abiertos: number;
      vencidos: number;
      mpios: Record<string, number>;
      coords: Array<[number, number]>;
    }
  >();

  for (const a of abiertos) {
    const linea = a.Linea && a.Linea !== 'No Identificado' ? a.Linea : 'Sin Línea';
    const tipo = a['Tipo de aviso'] || 'Otros';
    const key = `${linea}__${tipo}`;
    const entry = batchMap.get(key) || {
      linea,
      tipo,
      cte: a.CTE || '-',
      abiertos: 0,
      vencidos: 0,
      mpios: {},
      coords: [],
    };
    entry.abiertos += 1;
    if (a.Cumplimiento_Estado === 'Excede Plazo') entry.vencidos += 1;
    const mpio = a.Municipio || '-';
    entry.mpios[mpio] = (entry.mpios[mpio] || 0) + 1;
    if (typeof a.Latitud === 'number' && typeof a.Longitud === 'number') {
      entry.coords.push([a.Latitud, a.Longitud]);
    }
    batchMap.set(key, entry);
  }

  const corridor_batches: CorridorBatchItem[] = Array.from(batchMap.entries())
    .map(([id, b]) => {
      const topMpio = Object.entries(b.mpios).sort((x, y) => y[1] - x[1])[0]?.[0] || '-';
      let centerLat: number | null = null;
      let centerLon: number | null = null;
      let maxDist = 0;
      if (b.coords.length > 0) {
        centerLat = b.coords.reduce((s, c) => s + c[0], 0) / b.coords.length;
        centerLon = b.coords.reduce((s, c) => s + c[1], 0) / b.coords.length;
        for (const [la, lo] of b.coords) {
          const d = haversineKm(centerLat, centerLon, la, lo);
          if (d > maxDist) maxDist = d;
        }
      }
      return {
        id,
        linea: b.linea,
        tipo: b.tipo,
        cte: b.cte,
        municipio_principal: topMpio,
        abiertos: b.abiertos,
        vencidos: b.vencidos,
        radio_km: Number(maxDist.toFixed(1)),
        center_lat: centerLat,
        center_lon: centerLon,
      };
    })
    .filter((b) => b.abiertos >= 2)
    .sort((a, b) => b.vencidos - a.vencidos || b.abiertos - a.abiertos)
    .slice(0, 12);

  // 4. Balance Ingresos vs Cierres por CTE (o por Departamento si ya hay CTE filtrada)
  const useDepto = Boolean(params.cte && params.cte !== 'Todos');
  const balMap = new Map<string, { ing: number; cer: number; ab: number; venc: number }>();
  for (const a of scoped) {
    const region = useDepto ? a.Departamento || 'No Identificado' : a.CTE || 'Sin Asignar';
    const cur = balMap.get(region) || { ing: 0, cer: 0, ab: 0, venc: 0 };
    cur.ing += 1;
    if (a['Estado aviso'] === 'Abierto') {
      cur.ab += 1;
      if (a.Cumplimiento_Estado === 'Excede Plazo') cur.venc += 1;
    } else {
      cur.cer += 1;
    }
    balMap.set(region, cur);
  }
  const cte_balance: CteBalanceItem[] = Array.from(balMap.entries())
    .map(([region, s]) => ({
      region,
      ingresados: s.ing,
      cerrados: s.cer,
      abiertos: s.ab,
      vencidos: s.venc,
      tasa_cierre_pct: s.ing > 0 ? Number(((s.cer / s.ing) * 100).toFixed(1)) : 0,
    }))
    .sort((a, b) => b.vencidos - a.vencidos || b.abiertos - a.abiertos);

  // 5. Depuración de Mora Crónica (> 3 años = > 1095 días abierto)
  const chronicRaw = vencidos.filter((a) => Number(a['Días abierto'] || 0) > 1095);
  const chronic_notices: CriticalNoticeItem[] = chronicRaw
    .map((a) => {
      const dias = Math.round(Number(a['Días abierto'] || 0));
      const prio = Math.round(Number(a['Prioridad días'] || 0));
      return {
        aviso: String(a.Aviso),
        equipo: a.Equipo,
        linea: a.Linea || 'Sin Línea',
        municipio: a.Municipio || '-',
        depto: a.Departamento || '-',
        tipo: a['Tipo de aviso'] || '-',
        prioridad: a.Prioridad || '-',
        dias_abierto: dias,
        prioridad_dias: prio,
        exceso_dias: Math.max(0, dias - prio),
        reincidencias_torre: 1,
      };
    })
    .sort((a, b) => b.dias_abierto - a.dias_abierto);

  return {
    total_abiertos: abiertos.length,
    total_vencidos: vencidos.length,
    preventive_count: preventiveAll.length,
    preventive_notices: preventiveAll.slice(0, 12),
    execution_split,
    corridor_batches,
    cte_balance,
    chronic_count: chronicRaw.length,
    chronic_pct_of_overdue:
      vencidos.length > 0 ? Number(((chronicRaw.length / vencidos.length) * 100).toFixed(1)) : 0,
    chronic_notices: chronic_notices.slice(0, 15),
  };
}


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
  CriticalNoticeItem,
  ParetoLineaItem,
  RecurrentTowerItem,
} from '../../types/models';
import { getDataset } from './datasetRepository';

export async function computeActionableInsights(): Promise<ActionableInsightsResponse> {
  const { avisos } = await getDataset();

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

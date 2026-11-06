/**
 * Responsabilidad Única (SRP):
 * Funciones puras de cálculo estadístico (cuantiles, mediana), extracción de fechas y filtrado transversal de avisos.
 */

import type { DonutItem, TimeSeriesPoint } from '../../types/models';
import { TIPO_COLORS, CORPORATE_PALETTE } from '../../constants/themeTokens';
import type { AvisoRecord } from './datasetRepository';

export function calcQuantile(sorted: number[], q: number): number {
  if (sorted.length === 0) return 0;
  const pos = (sorted.length - 1) * q;
  const base = Math.floor(pos);
  const rest = pos - base;
  if (sorted[base + 1] !== undefined) {
    return Number((sorted[base] + rest * (sorted[base + 1] - sorted[base])).toFixed(1));
  }
  return Number(sorted[base].toFixed(1));
}

export function calcMedian(values: number[]): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  return calcQuantile(sorted, 0.5);
}

export function extractYear(dateStr?: string, fallbackYear?: number): number {
  if (fallbackYear && fallbackYear >= 2000 && fallbackYear <= 2030) return fallbackYear;
  if (dateStr && dateStr.length >= 4) {
    const y = Number(dateStr.slice(0, 4));
    if (!Number.isNaN(y) && y >= 2000 && y <= 2030) return y;
  }
  return 0;
}

export function filterAvisos(
  data: AvisoRecord[],
  filters: {
    cte?: string | null;
    tipo?: string | string[] | null;
    depto?: string | null;
    municipio?: string | null;
    prioridad?: string | null;
  }
): AvisoRecord[] {
  let res = data;

  if (filters.cte && filters.cte !== 'Todos') {
    res = res.filter((a) => a.CTE === filters.cte);
  }

  if (filters.tipo && filters.tipo !== 'Todos') {
    const tipos = Array.isArray(filters.tipo)
      ? filters.tipo.map((t) => t.trim()).filter((t) => t && t !== 'Todos')
      : filters.tipo.split(',').map((t) => t.trim()).filter((t) => t && t !== 'Todos');
    if (tipos.length > 0) {
      const tipoSet = new Set(tipos);
      res = res.filter((a) => tipoSet.has(a['Tipo de aviso']));
    }
  }

  if (filters.depto && filters.depto !== 'Todos') {
    res = res.filter((a) => a.Departamento === filters.depto);
  }

  if (filters.municipio && filters.municipio !== 'Todos') {
    res = res.filter((a) => a.Municipio === filters.municipio);
  }

  if (filters.prioridad && filters.prioridad !== 'Todos') {
    res = res.filter((a) => a.Prioridad === filters.prioridad);
  }

  return res;
}

export function buildDonutDistribution(data: AvisoRecord[]): DonutItem[] {
  const counts: Record<string, number> = {};
  for (const row of data) {
    const t = row['Tipo de aviso'] || 'Otros';
    counts[t] = (counts[t] || 0) + 1;
  }
  const total = data.length;
  return Object.entries(counts)
    .sort((a, b) => b[1] - a[1])
    .map(([name, val]) => ({
      name,
      value: val,
      pct: total > 0 ? Number(((val / total) * 100).toFixed(1)) : 0,
      color: TIPO_COLORS[name] || CORPORATE_PALETTE.slate,
    }));
}

export function buildTimeSeries(data: AvisoRecord[]): TimeSeriesPoint[] {
  const yearsSet = new Set<number>();
  for (const a of data) {
    const yIn = extractYear(a['Fecha de aviso'], a.Año);
    const yOut = extractYear(a['Fecha de cierre'], a['Año cierre']);
    if (yIn >= 2008) yearsSet.add(yIn);
    if (yOut >= 2008) yearsSet.add(yOut);
  }

  const years = Array.from(yearsSet).sort((a, b) => a - b);
  return years.map((yr) => {
    const ingresadosRows = data.filter((a) => extractYear(a['Fecha de aviso'], a.Año) === yr);
    const cerradosRows = data.filter(
      (a) => (a['Estado aviso'] || 'Cerrado') === 'Cerrado' && extractYear(a['Fecha de cierre'], a['Año cierre']) === yr
    );
    const vencidosRows = ingresadosRows.filter(
      (a) => (a['Estado aviso'] || 'Cerrado') === 'Abierto' && a.Cumplimiento_Estado === 'Excede Plazo'
    );

    const cerradosEnPlazo = cerradosRows.filter((a) => a.Cumplimiento_Estado === 'Cumple Plazo').length;
    const baseEval = cerradosRows.length > 0 ? cerradosRows : ingresadosRows;
    const cumpleEval = baseEval.filter((a) => a.Cumplimiento_Estado === 'Cumple Plazo').length;

    const cumplePct =
      cerradosRows.length > 0
        ? Number(((cerradosEnPlazo / cerradosRows.length) * 100).toFixed(1))
        : baseEval.length > 0
          ? Number(((cumpleEval / baseEval.length) * 100).toFixed(1))
          : 0;

    const diasList = baseEval.map((a) => a['Días abierto'] || 0).filter((d) => d >= 0);

    return {
      periodo: String(yr),
      year: yr,
      ingresados: ingresadosRows.length,
      cerrados: cerradosRows.length,
      abiertos_vencidos: vencidosRows.length,
      cumple_oportuno_pct: cumplePct,
      mediana_dias: calcMedian(diasList),
    };
  });
}


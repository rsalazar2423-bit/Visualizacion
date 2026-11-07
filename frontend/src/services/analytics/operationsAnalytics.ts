/**
 * Responsabilidad Única (SRP):
 * Cálculos analíticos de Portada, Opciones de Filtro y Vista 01 (Seguimiento y Cumplimiento Operativo).
 */

import type {
  PortadaKpis,
  FilterOptionsResponse,
  OperationsDataResponse,
  StackedBarItem,
  TypologyPerformanceItem,
} from '../../types/models';
import { PRIO_ORDER, TIPO_COLORS } from '../../constants/themeTokens';
import { getDataset } from './datasetRepository';
import { calcMedian, filterAvisos, buildDonutDistribution, buildTimeSeries } from './statsHelpers';

export async function computePortadaKpis(): Promise<PortadaKpis> {
  const { equipos, avisos } = await getDataset();
  const cumpleCount = avisos.filter((a) => a.Cumplimiento_Estado === 'Cumple Plazo').length;
  const vegCount = avisos.filter((a) => (a['Tipo de aviso'] || '').toLowerCase() === 'vegetación').length;

  const cerrados = avisos.filter((a) => (a['Estado aviso'] || 'Cerrado') === 'Cerrado');
  const abiertos = avisos.filter((a) => a['Estado aviso'] === 'Abierto');
  const abiertosVencidos = abiertos.filter((a) => a.Cumplimiento_Estado === 'Excede Plazo');
  const cerradosCumple = cerrados.filter((a) => a.Cumplimiento_Estado === 'Cumple Plazo');

  const uniqueDeptos = new Set(equipos.map((e) => e.Departamento).filter((d) => d && d !== 'No Identificado'));
  const uniqueMpios = new Set(equipos.map((e) => e.Municipio).filter((m) => m && m !== 'No Identificado'));

  const medianaCerrados = calcMedian(cerrados.map((a) => a['Días abierto'] || 0));

  return {
    total_equipos: equipos.length,
    total_avisos: avisos.length,
    pct_cumplimiento: avisos.length > 0 ? Number(((cumpleCount / avisos.length) * 100).toFixed(1)) : 0,
    pct_vegetacion: avisos.length > 0 ? Number(((vegCount / avisos.length) * 100).toFixed(1)) : 0,
    total_deptos: uniqueDeptos.size,
    total_municipios: uniqueMpios.size,
    cumplimiento_oportuno_pct:
      cerrados.length > 0 ? Number(((cerradosCumple.length / cerrados.length) * 100).toFixed(1)) : 0,
    avisos_abiertos: abiertos.length,
    abiertos_vencidos: abiertosVencidos.length,
    tiempo_tipico_mediana: medianaCerrados,
  };
}

export async function computeFilterOptions(
  cte?: string | null,
  depto?: string | null
): Promise<FilterOptionsResponse> {
  const { avisos } = await getDataset();

  const ctesSet = new Set<string>();
  const deptosSet = new Set<string>();
  const tiposSet = new Set<string>();

  for (const a of avisos) {
    if (a.CTE && a.CTE !== 'Sin Asignar') ctesSet.add(a.CTE);
    if (a['Tipo de aviso']) tiposSet.add(a['Tipo de aviso']);
  }

  const deptosFiltered = avisos.filter((a) => !cte || cte === 'Todos' || a.CTE === cte);
  for (const a of deptosFiltered) {
    if (a.Departamento && a.Departamento !== 'No Identificado') deptosSet.add(a.Departamento);
  }

  const mpiosFiltered = deptosFiltered.filter(
    (a) => !depto || depto === 'Todos' || a.Departamento === depto
  );
  const validMpios = mpiosFiltered.filter((a) => a.Municipio && a.Municipio !== 'No Identificado');

  const mpioCounts: Record<string, number> = {};
  for (const a of validMpios) {
    mpioCounts[a.Municipio] = (mpioCounts[a.Municipio] || 0) + 1;
  }

  const sortedMpios = Object.entries(mpioCounts).sort((a, b) => b[1] - a[1]);
  const municipiosOptions = [
    { label: `Todas las Ciudades / Municipios (${validMpios.length.toLocaleString()} avisos)`, value: 'Todos' },
    ...sortedMpios.map(([name, count]) => ({
      label: `${name} (${count.toLocaleString()} avisos)`,
      value: name,
    })),
  ];

  return {
    ctes: ['Todos', ...Array.from(ctesSet).sort()],
    departamentos: ['Todos', ...Array.from(deptosSet).sort()],
    municipios: municipiosOptions,
    tipos: ['Todos', ...Array.from(tiposSet).sort()],
  };
}

export async function computeOperationsData(params: {
  cte?: string | null;
  depto?: string | null;
  tipo?: string | null;
  municipio?: string | null;
  prioridad?: string | null;
}): Promise<OperationsDataResponse> {
  const { avisos } = await getDataset();

  const regionalBase = filterAvisos(avisos, {
    cte: params.cte,
    depto: params.depto,
    municipio: params.municipio,
  });
  const tiposCatalogo = buildDonutDistribution(regionalBase);

  const filteredBase = filterAvisos(regionalBase, { tipo: params.tipo });

  const donutDf =
    params.prioridad && params.prioridad !== 'Todos'
      ? filteredBase.filter((a) => a.Prioridad === params.prioridad)
      : filteredBase;

  const total = donutDf.length;
  const cumpleCount = donutDf.filter((a) => a.Cumplimiento_Estado === 'Cumple Plazo').length;
  const totalDias = donutDf.reduce((sum, a) => sum + (a['Días abierto'] || 0), 0);
  const diasProm = total > 0 ? Number((totalDias / total).toFixed(1)) : null;

  const cerrados = donutDf.filter((a) => (a['Estado aviso'] || 'Cerrado') === 'Cerrado');
  const abiertos = donutDf.filter((a) => a['Estado aviso'] === 'Abierto');
  const abiertosVencidos = abiertos.filter((a) => a.Cumplimiento_Estado === 'Excede Plazo');
  const cerradosCumple = cerrados.filter((a) => a.Cumplimiento_Estado === 'Cumple Plazo');

  const sourceMediana = cerrados.length > 0 ? cerrados : donutDf;
  const medianaCerrados =
    sourceMediana.length > 0 ? calcMedian(sourceMediana.map((a) => a['Días abierto'] || 0)) : null;

  const kpis = {
    total,
    cumple_pct: total > 0 ? Number(((cumpleCount / total) * 100).toFixed(1)) : 0,
    excede: total - cumpleCount,
    dias_prom: diasProm,
    cumplimiento_oportuno_pct:
      cerrados.length > 0
        ? Number(((cerradosCumple.length / cerrados.length) * 100).toFixed(1))
        : total > 0
          ? Number(((cumpleCount / total) * 100).toFixed(1))
          : 0,
    avisos_abiertos: abiertos.length,
    abiertos_vencidos: abiertosVencidos.length,
    tiempo_tipico_mediana: medianaCerrados,
    avisos_cerrados: cerrados.length,
  };

  const matrix: Record<string, { cumple: number; excede: number }> = {};
  for (const a of filteredBase) {
    const prio = a.Prioridad || 'No asignada';
    if (!matrix[prio]) matrix[prio] = { cumple: 0, excede: 0 };
    if (a.Cumplimiento_Estado === 'Cumple Plazo') {
      matrix[prio].cumple += 1;
    } else {
      matrix[prio].excede += 1;
    }
  }

  const stackedBar: StackedBarItem[] = [];
  for (const prio of PRIO_ORDER) {
    if (!matrix[prio]) continue;
    const { cumple, excede } = matrix[prio];
    const prioTotal = cumple + excede;
    if (prioTotal === 0) continue;
    const cPct = Number(((cumple / prioTotal) * 100).toFixed(1));
    stackedBar.push({
      prioridad: prio,
      total: prioTotal,
      cumple_count: cumple,
      cumple_pct: cPct,
      excede_count: excede,
      excede_pct: Number((100 - cPct).toFixed(1)),
      selected: prio === params.prioridad,
    });
  }

  // Metadatos semánticos de cada causa de mantenimiento en líneas de transmisión
  const tipologiasSignificado: Record<string, string> = {
    Vegetación: 'Poda y roce en zona de servidumbre (Riesgo de arco eléctrico RETIE)',
    Construcciones: 'Obras o edificaciones que invaden distancias de seguridad a líneas vivas',
    Obras: 'Mantenimiento civil, accesos a torres, taludes y drenajes de cimentación',
    'Permiso Ingreso': 'Negociación de servidumbre de paso con propietarios de predios',
    'Invasión/Explanación': 'Movimientos de tierra no autorizados que amenazan la estabilidad de las torres',
  };

  const tipoGroups: Record<string, typeof donutDf> = {};
  for (const a of donutDf) {
    const t = a['Tipo de aviso'] || 'Otros';
    if (!tipoGroups[t]) tipoGroups[t] = [];
    tipoGroups[t].push(a);
  }

  const typologyPerformance: TypologyPerformanceItem[] = Object.entries(tipoGroups)
    .sort((a, b) => b[1].length - a[1].length)
    .map(([tipo, list]) => {
      const tipoTotal = list.length;
      const cCount = list.filter((a) => a.Cumplimiento_Estado === 'Cumple Plazo').length;
      const eCount = tipoTotal - cCount;
      const cPct = tipoTotal > 0 ? Number(((cCount / tipoTotal) * 100).toFixed(1)) : 0;
      const cerradosTipo = list.filter((a) => (a['Estado aviso'] || 'Cerrado') === 'Cerrado');
      const srcDias = cerradosTipo.length > 0 ? cerradosTipo : list;
      const medDias = srcDias.length > 0 ? calcMedian(srcDias.map((a) => a['Días abierto'] || 0)) : 0;
      const abVencidos = list.filter(
        (a) => a['Estado aviso'] === 'Abierto' && a.Cumplimiento_Estado === 'Excede Plazo'
      ).length;

      return {
        tipo,
        total: tipoTotal,
        pct_total: total > 0 ? Number(((tipoTotal / total) * 100).toFixed(1)) : 0,
        cumple_count: cCount,
        cumple_pct: cPct,
        excede_count: eCount,
        excede_pct: Number((100 - cPct).toFixed(1)),
        mediana_dias: medDias,
        abiertos_vencidos: abVencidos,
        color: TIPO_COLORS[tipo] || '#64748B',
        significado: tipologiasSignificado[tipo] || 'Mantenimiento operativo no clasificado',
      };
    });

  return {
    kpis,
    donut: buildDonutDistribution(donutDf),
    tipos_catalogo: tiposCatalogo,
    stacked_bar: stackedBar,
    time_series: buildTimeSeries(donutDf),
    typology_performance: typologyPerformance,
  };
}


/**
 * Motor Analítico en Cliente (GitOps / Serverless)
 * Ejecuta agregaciones, filtros y transformaciones vectorizadas directamente en el navegador.
 * Cero latencia, cero cold-start, 100% disponibilidad estática en Vercel.
 */

import type {
  PortadaKpis,
  FilterOptionsResponse,
  OperationsDataResponse,
  TerritorialDataResponse,
  StackedBarItem,
  DonutItem,
  TreemapNode,
  SunburstNode,
  TicketItem,
} from '../types/models';

interface EquipoRecord {
  Equipo: number;
  CTE: string;
  Departamento: string;
  Municipio: string;
}

interface AvisoRecord {
  Aviso: string;
  Equipo: number;
  'Tipo de aviso': string;
  'Fecha de aviso': string;
  Prioridad: string;
  'Días abierto': number;
  'Cumple prioridad días': number;
  Cumplimiento_Estado: string;
  CTE: string;
  Departamento: string;
  Municipio: string;
}

interface DatasetPayload {
  equipos: EquipoRecord[];
  avisos: AvisoRecord[];
}

const TIPO_COLORS: Record<string, string> = {
  Vegetación: '#0D9763',
  Construcciones: '#0284C7',
  Obras: '#F59E0B',
  'Permiso Ingreso': '#8B5CF6',
  'Invasión / Explanación': '#F43F5E',
  Otros: '#64748B',
};

const PRIO_ORDER: string[] = [
  'Semana',
  'Mes',
  'Trimestre',
  'Semestre',
  'Año',
  'Dos años',
  'Tres años',
  'Seis años',
  'No asignada',
];

const PRIO_COLORS: Record<string, string> = {
  Semana: '#10B981',
  Mes: '#0D9763',
  Trimestre: '#0284C7',
  Semestre: '#38BDF8',
  Año: '#F59E0B',
  'Dos años': '#D97706',
  'Tres años': '#EA580C',
  'Seis años': '#E11D48',
  'No asignada': '#64748B',
};

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

const PALETTE_DEPTOS: string[] = [
  '#2D6A4F',
  '#3A86FF',
  '#0B6E59',
  '#E9C46A',
  '#9D4EDD',
  '#E76F51',
  '#4EA8DE',
  '#F4A261',
  '#74C69D',
  '#06D6A0',
  '#118AB2',
  '#FFB703',
];

let cachedDataset: DatasetPayload | null = null;
let loadPromise: Promise<DatasetPayload> | null = null;

async function getDataset(): Promise<DatasetPayload> {
  if (cachedDataset) return cachedDataset;
  if (loadPromise) return loadPromise;

  loadPromise = (async () => {
    // 1. Intentar cargar desde el static asset local de Vercel/Vite
    // 2. Si falla, cargar desde GitHub raw
    const urls = [
      '/data/ecogrid_data.json',
      'https://raw.githubusercontent.com/rsalazar2423-bit/Visualizacion/main/frontend/public/data/ecogrid_data.json',
    ];

    for (const url of urls) {
      try {
        const res = await fetch(url);
        if (res.ok) {
          cachedDataset = await res.json();
          return cachedDataset!;
        }
      } catch (err) {
        console.warn(`Error cargando dataset desde ${url}, intentando fallback...`, err);
      }
    }
    throw new Error('No se pudo cargar el dataset analítico de EcoGrid.');
  })();

  return loadPromise;
}

function filterAvisos(
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

function buildDonutDistribution(data: AvisoRecord[]): DonutItem[] {
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
      color: TIPO_COLORS[name] || '#64748B',
    }));
}

export const clientDataService = {
  async getPortadaKpis(): Promise<PortadaKpis> {
    const { equipos, avisos } = await getDataset();
    const cumpleCount = avisos.filter((a) => a.Cumplimiento_Estado === 'Cumple Plazo').length;
    const vegCount = avisos.filter((a) => (a['Tipo de aviso'] || '').toLowerCase() === 'vegetación').length;

    const uniqueDeptos = new Set(equipos.map((e) => e.Departamento).filter((d) => d && d !== 'No Identificado'));
    const uniqueMpios = new Set(equipos.map((e) => e.Municipio).filter((m) => m && m !== 'No Identificado'));

    return {
      total_equipos: equipos.length,
      total_avisos: avisos.length,
      pct_cumplimiento: avisos.length > 0 ? Number(((cumpleCount / avisos.length) * 100).toFixed(1)) : 0,
      pct_vegetacion: avisos.length > 0 ? Number(((vegCount / avisos.length) * 100).toFixed(1)) : 0,
      total_deptos: uniqueDeptos.size,
      total_municipios: uniqueMpios.size,
    };
  },

  async getFilterOptions(cte?: string | null, depto?: string | null): Promise<FilterOptionsResponse> {
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
  },

  async getOperationsData(params: {
    cte?: string | null;
    depto?: string | null;
    tipo?: string | null;
    municipio?: string | null;
    prioridad?: string | null;
  }): Promise<OperationsDataResponse> {
    const { avisos } = await getDataset();

    // 1. Base regional
    const regionalBase = filterAvisos(avisos, {
      cte: params.cte,
      depto: params.depto,
      municipio: params.municipio,
    });
    const tiposCatalogo = buildDonutDistribution(regionalBase);

    // 2. Base filtrada por tipo
    const filteredBase = filterAvisos(regionalBase, { tipo: params.tipo });

    // 3. Base para donut (con prioridad si aplica)
    const donutDf =
      params.prioridad && params.prioridad !== 'Todos'
        ? filteredBase.filter((a) => a.Prioridad === params.prioridad)
        : filteredBase;

    // 4. KPIs
    const total = donutDf.length;
    const cumpleCount = donutDf.filter((a) => a.Cumplimiento_Estado === 'Cumple Plazo').length;
    const totalDias = donutDf.reduce((sum, a) => sum + (a['Días abierto'] || 0), 0);
    const diasProm = total > 0 ? Number((totalDias / total).toFixed(1)) : null;

    const kpis = {
      total,
      cumple_pct: total > 0 ? Number(((cumpleCount / total) * 100).toFixed(1)) : 0,
      excede: total - cumpleCount,
      dias_prom: diasProm,
    };

    // 5. Stacked bar matrix
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

    return {
      kpis,
      donut: buildDonutDistribution(donutDf),
      tipos_catalogo: tiposCatalogo,
      stacked_bar: stackedBar,
    };
  },

  async getTerritorialData(params: {
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

    // 1. Treemap nodes
    let treemapNodes: TreemapNode[] = [];
    let rootTitle = 'Toda Colombia';

    if (params.municipio && params.municipio !== 'Todos') {
      treemapNodes = [
        {
          name: params.municipio,
          value: fAvisos.length,
          itemStyle: { color: PALETTE_DEPTOS[0] },
        },
      ];
      rootTitle = params.municipio;
    } else if (params.depto && params.depto !== 'Todos') {
      const counts: Record<string, number> = {};
      for (const a of fAvisos) {
        counts[a.Municipio] = (counts[a.Municipio] || 0) + 1;
      }
      treemapNodes = Object.entries(counts)
        .sort((a, b) => b[1] - a[1])
        .map(([name, val], idx) => ({
          name,
          value: val,
          itemStyle: { color: PALETTE_DEPTOS[idx % PALETTE_DEPTOS.length] },
        }));
      rootTitle = params.depto;
    } else {
      const counts: Record<string, number> = {};
      for (const a of fAvisos) {
        counts[a.Departamento] = (counts[a.Departamento] || 0) + 1;
      }
      treemapNodes = Object.entries(counts)
        .sort((a, b) => b[1] - a[1])
        .map(([name, val], idx) => ({
          name,
          value: val,
          itemStyle: { color: PALETTE_DEPTOS[idx % PALETTE_DEPTOS.length] },
        }));
      rootTitle = params.cte && params.cte !== 'Todos' ? `CTE ${params.cte}` : 'Toda Colombia';
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
          children.push({ name: `Cumple (${cPct}%)`, value: cumple, itemStyle: { color: '#10B981' } });
        }
        if (excede > 0) {
          children.push({ name: `Excede (${ePct}%)`, value: excede, itemStyle: { color: '#F43F5E' } });
        }
        return {
          name,
          itemStyle: { color: TIPO_COLORS[name] || '#64748B' },
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
            itemStyle: { color: PRIO_COLORS[prio] || '#94A3B8' },
          }));
        return {
          name: tipo,
          itemStyle: { color: TIPO_COLORS[tipo] || '#64748B' },
          children,
        };
      })
      .sort((a, b) => {
        const sumA = (a.children || []).reduce((s, c) => s + (c.value || 0), 0);
        const sumB = (b.children || []).reduce((s, c) => s + (c.value || 0), 0);
        return sumB - sumA;
      });

    // 4. Tickets table
    const tickets: TicketItem[] = fAvisos.slice(0, 100).map((a) => ({
      numero_aviso: String(a.Aviso || 'N/D'),
      fecha_aviso: String(a['Fecha de aviso'] || 'N/D'),
      equipo: String(a.Equipo || 'N/D'),
      departamento: a.Departamento || 'No Identificado',
      municipio: a.Municipio || 'No Identificado',
      tipo_aviso: a['Tipo de aviso'] || 'Otros',
      prioridad: a.Prioridad || 'Media',
      cumplimiento: a.Cumplimiento_Estado || 'Excede Plazo',
      dias_abierto: Math.round(a['Días abierto'] || 0),
    }));

    // 5. KPIs
    let territorialKpis;
    if (params.municipio && params.municipio !== 'Todos') {
      territorialKpis = {
        ctes: fAvisos.length > 0 ? fAvisos[0].CTE : null,
        deptos: fAvisos.length > 0 ? fAvisos[0].Departamento : null,
        mpios: fAvisos.length,
        equipos: fEquipos.length,
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
    };
  },
};

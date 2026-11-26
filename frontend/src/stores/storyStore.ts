import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import router from '../router';
import { useOperationsStore } from './operationsStore';
import { useTerritoryStore } from './territoryStore';

export interface NlpTourPreset {
  chartMode?: 'causal' | 'linea' | 'torre';
  estado?: 'abiertos' | 'cerrados' | 'ambos';
  urgencia?: 'todos' | 'vencido' | 'proximo' | 'en_plazo';
}

export interface StoryStep {
  id: string;
  act: string;
  title: string;
  narrative: string;
  actionHint: string;
  route: string;
  selector: string;
  nlpPreset?: NlpTourPreset;
  apply?: () => Promise<void> | void;
}

export const STORY_STEPS: StoryStep[] = [
  {
    id: 'titular',
    act: 'Paso 1 · Conclusión Ejecutiva',
    title: 'El grueso del problema en 15 segundos',
    narrative:
      'De 3.118 avisos (45.9% SLA), el atraso no es falta uniforme de cuadrillas: está concentrado en bloqueos Jurídicos/Prediales, 5 líneas (41.3% de la mora) y 344 abiertos vencidos.',
    actionHint: 'Cundinamarca, Boyacá y Valle concentran el pasivo en Construcciones (64%).',
    route: '/',
    selector: '.kpi-section',
  },
  {
    id: 'nlp-pareto',
    act: 'Paso 2 · El Corazón del Hallazgo (NLP)',
    title: '5 líneas concentran el 41.3% de los vencidos',
    narrative:
      'El motor NLP (91.3% cobertura) revela qué corredores críticos (CHIVSOCH2301, CHIVTORC2301) y qué 209 torres reincidentes explican la mora acumulada.',
    actionHint: 'Alterna entre "Por Causal", "Por Línea" y "Por Torre" para aislar el foco.',
    route: '/territorio?tab=nlp',
    selector: '.chart-panel',
    nlpPreset: { chartMode: 'linea', estado: 'abiertos', urgencia: 'vencido' },
    apply: async () => {
      const ter = useTerritoryStore();
      await ter.resetAllFilters();
    },
  },
  {
    id: 'nlp-causal',
    act: 'Paso 3 · Triaje por Causal (Boyacá)',
    title: 'Separar lo operable de bloqueos legales/CAR',
    narrative:
      'Al aislar Boyacá + Abiertos Vencidos, ves qué avisos son despacho de campo vs. los frenados por Trámite Ambiental (CAR/Corpochivor) o Jurídico, con Vereda y etapa SAP.',
    actionHint: 'Haz clic en una "Palabra clave" (ej. SNG o IVBL) o exporta el CSV filtrado.',
    route: '/territorio?tab=nlp',
    selector: '.action-tray',
    nlpPreset: { chartMode: 'causal', estado: 'abiertos', urgencia: 'vencido' },
    apply: async () => {
      const ter = useTerritoryStore();
      await ter.setDepto('Boyacá');
    },
  },
  {
    id: 'sankey',
    act: 'Paso 4 · Evidencia de Flujo (Sankey)',
    title: 'Cómo se desvía cada tipo hacia su resultado',
    narrative:
      'El Sankey cruza Tipo de Aviso → Causal Real (NLP) → Resultado, y a la derecha ves la tasa exacta: Obras (70.8% venc., 550d) y Construcciones (671d).',
    actionHint: 'Haz clic en "Tipo: ..." para filtrar o pulsa "Ampliar" para ver el 4.º nivel (Etapa SAP).',
    route: '/operaciones?tab=sla',
    selector: '.stage-pane.dual-charts',
    apply: async () => {
      const ter = useTerritoryStore();
      if (ter.selectedDepto) await ter.resetAllFilters();
    },
  },
  {
    id: 'sla',
    act: 'Paso 5 · Evidencia de Plazos',
    title: 'Por qué fallan las prioridades cortas',
    narrative:
      'Aislamos la prioridad "Mes" (95.3% vencidos): la mediana real de cierre es 383 días, haciendo inviable cumplir plazos de 30 días sin cambiar la ruta de gestión.',
    actionHint: 'Observa la barra roja de "Mes" resaltada; haz clic en otra barra para comparar.',
    route: '/operaciones',
    selector: '.stage-pane.dual-charts > :nth-child(2)',
    apply: async () => {
      const ops = useOperationsStore();
      await ops.fetchData();
      if (ops.selectedPrioridad !== 'Mes') ops.setPrioridad('Mes');
    },
  },
  {
    id: 'mapa',
    act: 'Paso 6 · Georreferenciación',
    title: 'Corredores eléctricos 2008–2023 en el mapa',
    narrative:
      'El mapa cruza las 44 líneas de transmisión y 5.409 torres con el estado SLA de cada aviso para confirmar agrupaciones territoriales.',
    actionHint: 'Filtra por "Abiertos Vencidos" o reproduce la línea de tiempo inferior.',
    route: '/territorio?tab=map',
    selector: '.map-body-grid',
    apply: async () => {
      const ops = useOperationsStore();
      if (ops.selectedPrioridad) ops.setPrioridad(ops.selectedPrioridad);
    },
  },
  {
    id: 'accion',
    act: 'Paso 7 · Ejecución Semanal',
    title: 'Lotes de despacho y Radar Preventivo',
    narrative:
      'En "Centro del Coordinador" armas Lotes de Despacho por corredor (en km) y activas el Radar Preventivo (152 avisos próximos a vencer con ≥70% SLA consumido).',
    actionHint: 'Haz clic en un lote para ver sus avisos o pasa a "2. Simulador de Cuadrillas".',
    route: '/capacidad',
    selector: '.coord-main-grid',
  },
];

export const useStoryStore = defineStore('story', () => {
  const isActive = ref(false);
  const currentIndex = ref(0);

  const currentStep = computed(() => STORY_STEPS[currentIndex.value] ?? STORY_STEPS[0]);
  const totalSteps = STORY_STEPS.length;

  async function goTo(idx: number) {
    const clamped = Math.max(0, Math.min(idx, totalSteps - 1));
    currentIndex.value = clamped;
    const step = STORY_STEPS[clamped];
    if (!step) return;
    await router.push(step.route);
    if (step.apply) await step.apply();
  }

  async function start() {
    isActive.value = true;
    await goTo(0);
  }

  async function next() {
    if (currentIndex.value < totalSteps - 1) await goTo(currentIndex.value + 1);
    else await close();
  }

  async function prev() {
    if (currentIndex.value > 0) await goTo(currentIndex.value - 1);
  }

  async function close() {
    isActive.value = false;
    const ops = useOperationsStore();
    if (ops.selectedPrioridad) ops.setPrioridad(ops.selectedPrioridad);
    const ter = useTerritoryStore();
    if (ter.selectedDepto) await ter.resetAllFilters();
  }

  return { isActive, currentIndex, currentStep, totalSteps, start, next, prev, goTo, close };
});

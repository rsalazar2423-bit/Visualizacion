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
    id: 'panorama',
    act: 'Paso 1 · Panorama Ejecutivo',
    title: 'Aquí ves el tamaño real del pasivo',
    narrative:
      'Mira las 4 tarjetas: 45.9% de cumplimiento histórico y 344 abiertos vencidos. Debajo, la matriz muestra que Boyacá (81 en 2022) y Cundinamarca concentran la carga.',
    actionHint: 'Haz clic en una celda oscura de Boyacá o Cundinamarca para aislar esa tipología.',
    route: '/',
    selector: '.kpi-section',
  },
  {
    id: 'sla',
    act: 'Paso 2 · Aislamiento de Prioridad Crítica',
    title: 'Mira por qué fallan los plazos cortos',
    narrative:
      'Aislamos la prioridad "Mes" (95.3% vencidos). La mediana real de cierre es 383 días: es imposible cumplir plazos de 30 días sin cambiar la ruta de tratamiento.',
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
    id: 'sankey',
    act: 'Paso 3 · Flujo Técnico y Efectividad',
    title: 'Cómo se reparte cada tipo hacia su resultado',
    narrative:
      'El Sankey cruza Tipo de Aviso → Causal Real (NLP) → Resultado, y a la derecha ves el % exacto de mora: Obras (70.8% venc., 550d) y Construcciones (671d).',
    actionHint: 'Haz clic en "Tipo: ..." para filtrar o pulsa "Ampliar" para desbloquear el 4.º nivel (Etapa SAP).',
    route: '/operaciones?tab=sla',
    selector: '.stage-pane.dual-charts',
    apply: async () => {
      const ops = useOperationsStore();
      if (ops.selectedPrioridad) ops.setPrioridad(ops.selectedPrioridad);
    },
  },
  {
    id: 'nlp-causal',
    act: 'Paso 4 · NLP: Causales y Bloqueos',
    title: 'Aísla Boyacá + Abiertos Vencidos en NLP',
    narrative:
      'El motor NLP separa lo operable en campo de los bloqueos por Trámite Ambiental (CAR/Corpochivor) o Jurídico, mostrando la Vereda y etapa SAP exacta.',
    actionHint: 'Haz clic en una "Palabra clave" (ej. SNG o IVBL) o exporta el CSV filtrado.',
    route: '/territorio?tab=nlp',
    selector: '.action-tray',
    nlpPreset: { chartMode: 'causal', estado: 'abiertos', urgencia: 'vencido' },
    apply: async () => {
      const ops = useOperationsStore();
      if (ops.selectedPrioridad) ops.setPrioridad(ops.selectedPrioridad);
      const ter = useTerritoryStore();
      await ter.setDepto('Boyacá');
    },
  },
  {
    id: 'nlp-pareto',
    act: 'Paso 5 · NLP: Pareto por Línea y Torre',
    title: '5 líneas concentran el 41.3% de la mora',
    narrative:
      'Al cambiar a "Por Línea" ves los corredores eléctricos críticos (CHIVSOCH2301, CHIVTORC2301, ALFESBER2301). Y en "Por Torre" detectas 209 torres reincidentes.',
    actionHint: 'Haz clic en "Por Torre" arriba del gráfico para ver torres con múltiples retrasos.',
    route: '/territorio?tab=nlp',
    selector: '.chart-panel',
    nlpPreset: { chartMode: 'linea', estado: 'abiertos', urgencia: 'vencido' },
    apply: async () => {
      const ter = useTerritoryStore();
      await ter.resetAllFilters();
    },
  },
  {
    id: 'mapa',
    act: 'Paso 6 · Georreferenciación',
    title: 'Ubica los corredores críticos en el mapa',
    narrative:
      'El mapa cruza las 44 líneas de transmisión y 5.409 torres con el estado SLA de cada aviso para visualizar agrupaciones territoriales reales.',
    actionHint: 'Usa "Abiertos Vencidos" arriba o reproduce la línea de tiempo inferior.',
    route: '/territorio?tab=map',
    selector: '.map-body-grid',
  },
  {
    id: 'accion',
    act: 'Paso 7 · Ejecución Semanal',
    title: 'Arma lotes de despacho y frena vencimientos',
    narrative:
      'En "Centro del Coordinador", a la izquierda tienes Lotes de Despacho por corredor (en km) y a la derecha el Radar Preventivo (≥70% SLA consumido).',
    actionHint: 'Haz clic en un lote para ver sus avisos exactos o pasa a "2. Simulador de Cuadrillas".',
    route: '/capacidad',
    selector: '.coord-main-grid',
    apply: async () => {
      const ter = useTerritoryStore();
      await ter.resetAllFilters();
    },
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

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
    title: 'El atraso no es falta de cuadrillas: es concentración crítica',
    narrative:
      'Solo 45.9% cumple el SLA (3.118 avisos), pero la mora no es pareja: 5 líneas explican el 41.3% de los vencidos y los bloqueos Jurídicos/Prediales frenan los 344 abiertos.',
    actionHint: 'Cundinamarca, Boyacá y Valle concentran el pasivo en Construcciones (64%).',
    route: '/',
    selector: '.kpi-section',
  },
  {
    id: 'nlp-pareto',
    act: 'Paso 2 · El Corazón del Hallazgo',
    title: '5 corredores y 209 torres concentran la mora',
    narrative:
      'CHIVSOCH2301 y CHIVTORC2301 lideran el Pareto (91.3% cobertura NLP). Atacar estas 5 líneas desactiva casi la mitad de los avisos abiertos vencidos.',
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
    act: 'Paso 3 · Triaje Operativo (Boyacá)',
    title: 'Qué sale a campo hoy vs. qué frena lo legal',
    narrative:
      'En Boyacá, filtrar Abiertos Vencidos separa el mantenimiento ejecutable de los avisos trabados por Trámite Ambiental (CAR/Corpochivor) o Jurídico, con Vereda y etapa SAP.',
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
    act: 'Paso 4 · Ruta de la Falla (Sankey)',
    title: 'Obras y Construcciones rompen el plazo desde el origen',
    narrative:
      'El flujo Tipo → Causal NLP → Resultado muestra por qué caen los cierres: Obras vence en 70.8% (550d) y Construcciones tarda 671 días de mediana.',
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
    act: 'Paso 5 · Plazos Inviables',
    title: 'Prioridad "Mes": 95.3% vencidos porque el ciclo real es 383d',
    narrative:
      'Exigir cierres a 30 días cuando la mediana operativa supera el año garantiza el incumplimiento; el problema es de diseño de SLA y ruta de gestión.',
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
    act: 'Paso 6 · Huella Territorial',
    title: 'Dónde se agrupan los vencidos en 44 líneas',
    narrative:
      'Las 5.409 torres en el mapa confirman que los avisos vencidos forman clústeres geográficos claros, no incidentes aislados.',
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
    act: 'Paso 7 · Plan de Choque',
    title: 'Lotes por corredor y 152 avisos en Radar Preventivo',
    narrative:
      'Convierte el diagnóstico en despacho semanal: agrupa cuadrillas por km de corredor y atiende los 152 avisos con ≥70% del SLA consumido antes de que venzan.',
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

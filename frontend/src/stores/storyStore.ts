import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import router from '../router';

export interface StoryStep {
  id: string;
  act: string;
  title: string;
  narrative: string;
  takeaway: string;
  route: string;
}

export const STORY_STEPS: StoryStep[] = [
  {
    id: 'panorama',
    act: 'Acto 1 · Diagnóstico Nacional',
    title: 'La magnitud del pasivo y dónde se concentra',
    narrative:
      'De 3.118 avisos históricos sobre 5.409 torres, el cumplimiento SLA es 45.9% (1.091 a tiempo vs. 1.284 vencidos). Hoy hay 743 avisos abiertos y 344 ya superaron su plazo.',
    takeaway: 'Cundinamarca, Boyacá y Valle del Cauca concentran el mayor backlog, liderado por Construcciones (64%).',
    route: '/',
  },
  {
    id: 'sla',
    act: 'Acto 2 · Causa del Vencimiento',
    title: 'Por qué fallan las prioridades cortas',
    narrative:
      'La mediana real de cierre es 383 días. Por eso los avisos con plazos cortos presentan vencimientos críticos: Semana (100%), Mes (95.3%) y Trimestre (80.6%).',
    takeaway: 'Los picos de ingreso ocurren en mayo y septiembre, marcando cuándo reforzar capacidad preventiva.',
    route: '/operaciones',
  },
  {
    id: 'nlp',
    act: 'Acto 3 · Triaje Operativo (NLP)',
    title: 'Separar lo operable de los bloqueos legales',
    narrative:
      'El motor NLP clasifica el 91.3% de las descripciones: Jurídico/Servidumbre (1.989 avisos) y Gestión Predial (461) requieren gestión legal o predial previa, no cuadrilla forestal.',
    takeaway: 'Usa los selectores Por Causal, Por Línea (5 líneas = 41.3% de la mora) y Por Torre (209 reincidentes).',
    route: '/territorio?tab=nlp',
  },
  {
    id: 'mapa',
    act: 'Acto 4 · Georreferenciación',
    title: 'Corredores eléctricos y evolución 2008–2023',
    narrative:
      'El mapa cruza las 44 líneas de transmisión y 5.409 torres con el estado SLA de cada aviso para visualizar agrupaciones territoriales reales.',
    takeaway: 'Puedes reproducir la línea de tiempo inferior o filtrar por Abiertos Vencidos para ubicar focos críticos.',
    route: '/territorio?tab=map',
  },
  {
    id: 'accion',
    act: 'Acto 5 · Decisión y Capacidad',
    title: 'De la analítica a la ejecución semanal',
    narrative:
      'El Centro del Coordinador agrupa avisos en Lotes de Despacho por corredor (con dispersión en km) y activa el Radar Preventivo (152 avisos próximos a vencer).',
    takeaway: 'Pasa a la pestaña Simulador de Cuadrillas para dimensionar cuántas cuadrillas necesitas para cerrar la brecha.',
    route: '/capacidad',
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
    if (step) {
      await router.push(step.route);
    }
  }

  async function start() {
    isActive.value = true;
    await goTo(0);
  }

  async function next() {
    if (currentIndex.value < totalSteps - 1) {
      await goTo(currentIndex.value + 1);
    } else {
      close();
    }
  }

  async function prev() {
    if (currentIndex.value > 0) {
      await goTo(currentIndex.value - 1);
    }
  }

  function close() {
    isActive.value = false;
  }

  return { isActive, currentIndex, currentStep, totalSteps, start, next, prev, goTo, close };
});

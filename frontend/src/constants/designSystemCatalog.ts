/**
 * designSystemCatalog.ts — Catálogo Oficial y Normativo de Colores Permitidos.
 *
 * REGLA ESTRICTA DE GOBERNANZA:
 * La paleta completa del sistema se compone ÚNICAMENTE de:
 * 1. La Rampa Institucional (6 peldaños): Teal -> Azul Acero -> Pizarra
 * 2. Un color Rojo (#DC2626 / #EF4444): Alerta Crítica / Vencidos
 * 3. Un color Naranja (#EA580C / #F97316): Advertencia / Retrasos
 *
 * TODOS LOS DEMÁS COLORES ESTÁN TERMINANTEMENTE PROHIBIDOS.
 */

export interface SurfaceToken {
  name: string;
  token: string;
  light: string;
  dark: string;
  role: string;
}

export interface SemanticToken {
  label: string;
  token: string;
  light: string;
  dark: string;
  allowed: string;
  forbidden: string;
}

export interface DeprecatedColor {
  hex: string;
  name: string;
  reason: string;
}

export const SURFACE_TOKENS: SurfaceToken[] = [
  {
    name: 'Fondo Principal App',
    token: '--bg-app',
    light: '#F8FAFC',
    dark: '#0B0F19',
    role: 'Lienzo general (60% del área visual). Neutro pizarra sin tinte verde para no distorsionar los gráficos.',
  },
  {
    name: 'Superficie de Tarjeta',
    token: '--bg-card',
    light: '#FFFFFF',
    dark: '#111827',
    role: 'Contenedor de KPIs, gráficos ECharts y tablas de auditoría.',
  },
  {
    name: 'Superficie Secundaria',
    token: '--bg-subtle',
    light: '#F1F5F9',
    dark: '#1E293B',
    role: 'Fondos de controles, cabeceras de tabla, bloques de reseña y píldoras inactivas.',
  },
  {
    name: 'Borde Estructural',
    token: '--border-subtle',
    light: '#E2E8F0',
    dark: '#1F2937',
    role: 'Delimitación sutil de contenedores y grillas sin competir con las líneas de datos.',
  },
  {
    name: 'Texto Primario',
    token: '--text-primary',
    light: '#0F172A',
    dark: '#F8FAFC',
    role: 'Títulos, cifras principales de KPIs y valores críticos (Contraste WCAG AAA > 15:1).',
  },
  {
    name: 'Texto Secundario',
    token: '--text-secondary',
    light: '#475569',
    dark: '#94A3B8',
    role: 'Subtítulos, etiquetas de ejes ECharts, leyendas y descripciones metodológicas.',
  },
  {
    name: 'Marca Institucional EcoGrid',
    token: '--color-brand',
    light: '#0D9488',
    dark: '#14B8A6',
    role: 'Acento corporativo principal en navegación, botones primarios e indicadores de foco.',
  },
  {
    name: 'Acento Interactivo / Selección',
    token: '--color-accent',
    light: '#1D4ED8',
    dark: '#60A5FA',
    role: 'Resaltado de filtros activos, migas de pan clicables y bordes de foco en gráficos.',
  },
];

export const SEMANTIC_TOKENS: SemanticToken[] = [
  {
    label: 'Rojo de Alerta Crítica (Vencido / Superado)',
    token: '--sla-danger',
    light: '#DC2626',
    dark: '#EF4444',
    allowed: 'ÚNICO COLOR DE ALERTA MÁXIMA: 344 avisos abiertos vencidos, incumplimiento grave de SLA y puntos críticos en el mapa.',
    forbidden: 'Prohibido usarlo para elementos que no impliquen riesgo operativo inmediato.',
  },
  {
    label: 'Naranja de Advertencia (Retraso / Precaución)',
    token: '--sla-warning',
    light: '#EA580C',
    dark: '#F97316',
    allowed: 'ÚNICO COLOR DE PRECAUCIÓN: Avisos cerrados con retraso, tiempos en observación y alertas intermedias.',
    forbidden: 'Prohibido usarlo con fines estéticos o como fondo decorativo.',
  },
  {
    label: 'Cumple Plazo / En Norma (Rampa Base - Peldaño 1)',
    token: '--sla-success',
    light: '#0D9488',
    dark: '#14B8A6',
    allowed: 'Avisos atendidos dentro del plazo de prioridad y barras de cumplimiento SLA (utiliza el Teal de la rampa base).',
    forbidden: 'Prohibido crear tonos verdes adicionales o ajenos a la rampa base.',
  },
  {
    label: 'Volumen Activo / Abiertos (Rampa Base - Peldaño 4)',
    token: '--sla-info',
    light: '#1D4ED8',
    dark: '#60A5FA',
    allowed: 'Total de avisos en gestión activa (utiliza el Azul Cobalto de la rampa base).',
    forbidden: 'Prohibido inventar azules diferentes a los 6 peldaños de la rampa.',
  },
];

export const DEPRECATED_COLORS: DeprecatedColor[] = [
  { hex: '#6D28D9', name: 'Violeta / Amatista', reason: 'PROHIBIDO: Se eliminó para no saturar la vista. Las tipologías usan la rampa base.' },
  { hex: '#C2410C', name: 'Terracota / Óxido', reason: 'PROHIBIDO: Generaba confusión con el Naranja de advertencia (#EA580C).' },
  { hex: '#3F6212', name: 'Verde Oliva Silvicultural', reason: 'PROHIBIDO: Generaba confusión con el Teal de la rampa base.' },
  { hex: '#84CC16', name: 'Verde Lima Neón', reason: 'PROHIBIDO: Fatiga visual y contraste nulo.' },
  { hex: '#9D4EDD', name: 'Púrpura Neón', reason: 'PROHIBIDO: Color arbitrario ajeno a la identidad corporativa.' },
  { hex: '#FFB703', name: 'Amarillo Saturado', reason: 'PROHIBIDO: Ilegible y competía con la señalética de alerta.' },
];

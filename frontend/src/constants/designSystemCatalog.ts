/**
 * Responsabilidad Única (SRP):
 * Datos normativos estáticos del Sistema de Diseño (tokens de superficie, semántica SLA,
 * categorías de aviso y colores deprecados).
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

export interface CategoricalToken {
  category: string;
  token: string;
  light: string;
  dark: string;
  rationale: string;
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
    label: 'Cumple Plazo / Oportuno',
    token: '--sla-success',
    light: '#059669',
    dark: '#10B981',
    allowed: 'Exclusivo para avisos cerrados dentro de plazo, barras de cumplimiento SLA y nodos a tiempo.',
    forbidden: 'Prohibido usarlo para la categoría "Vegetación" o para colorear departamentos.',
  },
  {
    label: 'En Seguimiento / Precaución',
    token: '--sla-warning',
    light: '#D97706',
    dark: '#F59E0B',
    allowed: 'Tiempo típico de atención (mediana), avisos cerrados fuera de plazo o alertas moderadas.',
    forbidden: 'Prohibido usarlo para la categoría "Obras" o como color decorativo de bordes.',
  },
  {
    label: 'Excede Plazo / Abierto Vencido',
    token: '--sla-danger',
    light: '#DC2626',
    dark: '#EF4444',
    allowed: 'Exclusivo para incumplimiento de SLA, backlog de abiertos vencidos y alertas críticas en el mapa.',
    forbidden: 'Prohibido usarlo para la categoría "Invasión / Explanación" o municipios sin atraso.',
  },
  {
    label: 'Volumen Activo / Abiertos',
    token: '--sla-info',
    light: '#1D4ED8',
    dark: '#60A5FA',
    allowed: 'Conteo de avisos abiertos en gestión, curva de avisos ingresados y filtros activos.',
    forbidden: 'Evitar mezclar con alertas de incumplimiento.',
  },
];

export const CATEGORICAL_TOKENS: CategoricalToken[] = [
  {
    category: 'Vegetación',
    token: '--cat-1',
    light: '#3F6212',
    dark: '#A3E635',
    rationale: 'Verde Oliva silvicultural profundo; se diferencia radicalmente del Esmeralda SLA (#059669) y del Teal (#0D9488) de marca.',
  },
  {
    category: 'Construcciones',
    token: '--cat-2',
    light: '#1D4ED8',
    dark: '#60A5FA',
    rationale: 'Azul cobalto representativo de ingeniería civil, cimentaciones y torres de transmisión.',
  },
  {
    category: 'Obras',
    token: '--cat-3',
    light: '#475569',
    dark: '#94A3B8',
    rationale: 'Grafito / Acero industrial sobrio; rompe la sopa de azules y aporta contraste neutral distintivo.',
  },
  {
    category: 'Permiso Ingreso',
    token: '--cat-4',
    light: '#6D28D9',
    dark: '#A78BFA',
    rationale: 'Amatista institucional sobrio para trámites prediales y servidumbres (sin saturación neón).',
  },
  {
    category: 'Invasión / Explanación',
    token: '--cat-5',
    light: '#C2410C',
    dark: '#FB923C',
    rationale: 'Terracota arcilloso / óxido de suelo; representa alteración física del terreno sin confundirse con el Ámbar (#D97706) de alerta SLA.',
  },
  {
    category: 'Otros',
    token: '--cat-6',
    light: '#94A3B8',
    dark: '#64748B',
    rationale: 'Pizarra neutro suave para categorías residuales o no clasificadas.',
  },
];

export const DEPRECATED_COLORS: DeprecatedColor[] = [
  { hex: '#84CC16', name: 'Verde Lima Neón', reason: 'Generaba fatiga visual y bajo contraste sobre fondo claro.' },
  { hex: '#9D4EDD', name: 'Púrpura Chillón', reason: 'Color arbitrario en el Treemap de departamentos sin significado de datos.' },
  { hex: '#FFB703', name: 'Amarillo Oro Saturado', reason: 'Ilegible con texto blanco encima y competía con las alertas.' },
  { hex: '#06D6A0', name: 'Turquesa Fluorescente', reason: 'Rompía la sobriedad ejecutiva y duplicaba tonos verdes.' },
  { hex: '#E76F51', name: 'Coral Decorativo en Deptos', reason: 'Hacía parecer que ciertos departamentos estaban en alerta crítica sin estarlo.' },
  { hex: '#E9C46A', name: 'Arena Pastel', reason: 'Contraste insuficiente (WCAG fallo < 2.2:1) con etiquetas blancas en Treemap.' },
];


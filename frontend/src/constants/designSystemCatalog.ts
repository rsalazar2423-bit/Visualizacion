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
    light: '#0D9488',
    dark: '#14B8A6',
    allowed: 'Avisos cerrados en plazo, barras de cumplimiento SLA y nodos en estado regular.',
    forbidden: 'Prohibido usar colores ajenos a la identidad corporativa para denotar cumplimiento.',
  },
  {
    label: 'En Seguimiento / Precaución (Naranja Operativo)',
    token: '--sla-warning',
    light: '#EA580C',
    dark: '#F97316',
    allowed: 'Avisos cerrados con retraso, avisos próximos a vencer y alertas operativas intermedias.',
    forbidden: 'Prohibido usarlo como color decorativo.',
  },
  {
    label: 'Excede Plazo / Abierto Vencido (Rojo de Alerta)',
    token: '--sla-danger',
    light: '#DC2626',
    dark: '#EF4444',
    allowed: 'Exclusivo para la alarma operativa máxima: 344 avisos abiertos vencidos y puntos críticos en el mapa.',
    forbidden: 'Prohibido usarlo para elementos conformes o neutros.',
  },
  {
    label: 'Volumen Activo / Abiertos',
    token: '--sla-info',
    light: '#1D4ED8',
    dark: '#60A5FA',
    allowed: 'Conteo de avisos en gestión, curva de avisos ingresados y filtros activos.',
    forbidden: 'Evitar mezclar con alertas de incumplimiento.',
  },
];

export const CATEGORICAL_TOKENS: CategoricalToken[] = [
  {
    category: 'Vegetación',
    token: '--cat-1',
    light: '#0D9488',
    dark: '#14B8A6',
    rationale: 'Teal Institucional (55% de los avisos). Al pertenecer a la marca, no introduce ruido visual nuevo.',
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
    light: '#0284C7',
    dark: '#38BDF8',
    rationale: 'Azul cielo / acero técnico; complementa la rampa fría institucional con distinción nítida.',
  },
  {
    category: 'Permiso Ingreso',
    token: '--cat-4',
    light: '#475569',
    dark: '#94A3B8',
    rationale: 'Pizarra oscuro sobrio para trámites prediales y servidumbres (sin saturación ni colores exóticos).',
  },
  {
    category: 'Invasión / Explanación',
    token: '--cat-5',
    light: '#64748B',
    dark: '#64748B',
    rationale: 'Pizarra medio neutro; sitúa la alteración física del terreno sin competir con el Rojo ni con el Naranja de alerta.',
  },
  {
    category: 'Otros',
    token: '--cat-6',
    light: '#94A3B8',
    dark: '#475569',
    rationale: 'Pizarra claro recesivo para categorías residuales o no clasificadas.',
  },
];

export const DEPRECATED_COLORS: DeprecatedColor[] = [
  { hex: '#6D28D9', name: 'Violeta Amatista', reason: 'Eliminado por sobrecarga sensorial; se reemplazó por Pizarra institucional en la rampa.' },
  { hex: '#C2410C', name: 'Terracota / Naranja Arcilloso', reason: 'Eliminado para reservar el Naranja (#EA580C) exclusivamente a la señalética de advertencia SLA.' },
  { hex: '#3F6212', name: 'Verde Oliva Silvicultural', reason: 'Eliminado para que el único verde/teal sea la marca y el cumplimiento institucional.' },
  { hex: '#84CC16', name: 'Verde Lima Neón', reason: 'Generaba fatiga visual y bajo contraste sobre fondo claro.' },
  { hex: '#9D4EDD', name: 'Púrpura Chillón', reason: 'Color arbitrario en el Treemap de departamentos sin significado de datos.' },
  { hex: '#FFB703', name: 'Amarillo Oro Saturado', reason: 'Ilegible con texto blanco encima y competía con las alertas.' },
];


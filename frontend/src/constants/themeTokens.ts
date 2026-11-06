/**
 * themeTokens.ts — Fuente Única de la Verdad (DRY) para el Sistema de Diseño de Visualización.
 *
 * Se eliminaron todos los colores de "arcoíris" (violetas chillones, amarillos neón,
 * verdes lima, fucsias y 12 tonos inconexos de departamentos).
 *
 * Estructura cromática limpia en 3 familias:
 * 1. Semántica (SLA): Éxito (#059669 / #10B981), Advertencia (#D97706 / #F59E0B), Alerta (#DC2626 / #F43F5E).
 * 2. Categórica sobria (Tipos de Aviso): Gama fría ejecutiva (Teal, Cobalto, Acero, Índigo) + Ocre Tierra y Pizarra.
 * 3. Secuencial monocromática (Territorios y Plazos): Rampa de densidad Azul-Teal-Pizarra (cero carnaval).
 */

export const CORPORATE_PALETTE = {
  brand: '#0D9488',
  accent: '#1D4ED8',
  emerald: '#059669',
  amber: '#D97706',
  danger: '#DC2626',
  slate: '#64748B',
};

/**
 * 1. Colores Semánticos Estrictos para SLA y Estado de Avisos
 */
export function getSlaColors(isDark: boolean) {
  return {
    cumple: isDark ? '#10B981' : '#059669',
    cumpleSoft: isDark ? 'rgba(16, 185, 129, 0.18)' : 'rgba(5, 150, 105, 0.12)',
    excede: isDark ? '#EF4444' : '#DC2626',
    excedeSoft: isDark ? 'rgba(239, 68, 68, 0.18)' : 'rgba(220, 38, 38, 0.12)',
    warning: isDark ? '#F59E0B' : '#D97706',
    warningSoft: isDark ? 'rgba(245, 158, 11, 0.18)' : 'rgba(217, 119, 6, 0.12)',
    abierto: isDark ? '#60A5FA' : '#1D4ED8',
    abiertoSoft: isDark ? 'rgba(96, 165, 250, 0.18)' : 'rgba(29, 78, 216, 0.12)',
    cerrado: isDark ? '#2DD4BF' : '#0D9488',
    neutral: isDark ? '#94A3B8' : '#64748B',
  };
}

/**
 * 2. Paleta Categórica Sobria para Tipos de Aviso (Sin colisión con verde/rojo de SLA)
 * Familias cromáticas con distancia perceptual Delta-E > 25 (CIELAB)
 */
export const TIPO_COLORS: Record<string, string> = {
  'Vegetación': '#3F6212',             // Verde Oliva silvicultural (No compite con Esmeralda SLA)
  'Construcciones': '#1D4ED8',         // Azul Cobalto (Ingeniería y Estructuras)
  'Obras': '#475569',                  // Grafito / Acero Industrial (Rompe la sopa de azules)
  'Permiso Ingreso': '#6D28D9',        // Amatista Técnico / Predial
  'Invasión / Explanación': '#C2410C', // Terracota Arcilloso / Suelo (No compite con Ámbar SLA)
  'Otros': '#94A3B8',                  // Pizarra Neutro
};

export function getTipoColor(tipo: string, isDark = false): string {
  if (isDark) {
    const darkMap: Record<string, string> = {
      'Vegetación': '#A3E635',
      'Construcciones': '#60A5FA',
      'Obras': '#94A3B8',
      'Permiso Ingreso': '#A78BFA',
      'Invasión / Explanación': '#FB923C',
      'Otros': '#64748B',
    };
    return darkMap[tipo] || '#94A3B8';
  }
  return TIPO_COLORS[tipo] || '#94A3B8';
}

/**
 * 3. Rampa Secuencial por Horizonte de Plazo (Sin colores de carnaval)
 */
export const PRIO_ORDER: string[] = [
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

export const PRIO_COLORS: Record<string, string> = {
  'Semana': '#1E3A8A',      // Corto plazo - Urgencia máxima (Navy 900)
  'Mes': '#1D4ED8',         // Corto plazo (Blue 700)
  'Trimestre': '#2563EB',   // Corto-mediano plazo (Blue 600)
  'Semestre': '#0284C7',    // Mediano plazo (Sky 600)
  'Año': '#0D9488',         // Mediano plazo (Teal 600)
  'Dos años': '#0F766E',    // Largo plazo (Teal 700)
  'Tres años': '#475569',   // Largo plazo (Slate 600)
  'Seis años': '#64748B',   // Horizonte extendido (Slate 500)
  'No asignada': '#94A3B8', // Sin plazo (Slate 400)
};

/**
 * 4. Escala Secuencial Monocromática para Territorios (6 Peldaños de Densidad Perceptual)
 * Binea los territorios en 6 niveles reconocibles sin saturar la memoria de trabajo.
 */
export const DEPTO_PALETTE = [
  '#115E59', // Nivel 1 - Concentración Extrema (Teal 800)
  '#0F766E', // Nivel 2 - Muy Alta (Teal 700)
  '#0284C7', // Nivel 3 - Alta (Sky 600)
  '#2563EB', // Nivel 4 - Media (Blue 600)
  '#475569', // Nivel 5 - Moderada (Slate 600)
  '#94A3B8', // Nivel 6 - Base / Mínima (Slate 400)
];

export function getSequentialTerritoryPalette(isDark: boolean): string[] {
  return isDark
    ? [
        '#2DD4BF', // Nivel 1 - Extrema
        '#14B8A6', // Nivel 2 - Muy Alta
        '#38BDF8', // Nivel 3 - Alta
        '#60A5FA', // Nivel 4 - Media
        '#94A3B8', // Nivel 5 - Moderada
        '#475569', // Nivel 6 - Mínima
      ]
    : DEPTO_PALETTE;
}

export function getEChartsThemeTokens(isDark: boolean) {
  const sla = getSlaColors(isDark);
  return {
    textColor: isDark ? '#F8FAFC' : '#0F172A',
    textSecondary: isDark ? '#94A3B8' : '#475569',
    textMuted: isDark ? '#64748B' : '#64748B',
    gridColor: isDark ? 'rgba(148, 163, 184, 0.1)' : 'rgba(15, 23, 42, 0.06)',
    cardBg: isDark ? '#111827' : '#FFFFFF',
    subtleBg: isDark ? '#1E293B' : '#F1F5F9',
    borderColor: isDark ? '#1F2937' : '#E2E8F0',
    tooltipBg: isDark ? 'rgba(15, 23, 42, 0.96)' : 'rgba(255, 255, 255, 0.98)',
    tooltipBorder: isDark ? '#334155' : '#CBD5E1',
    accentSelect: isDark ? '#38BDF8' : '#1D4ED8',
    brandColor: isDark ? '#2DD4BF' : '#0D9488',
    fontFamily: "'Inter', system-ui, -apple-system, sans-serif",
    sla,
  };
}

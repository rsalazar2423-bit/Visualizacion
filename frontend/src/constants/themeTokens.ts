/**
 * themeTokens.ts — Fuente Única de la Verdad (DRY) para el Sistema de Diseño de Visualización.
 *
 * Sistema Cromático Restringido y Ejecutivo (Edward Tufte & Stephen Few):
 * 1. Rampa Institucional (Analítica): Slate / Azul Acero Mate / Teal Sobrio.
 * 2. Señalética Operativa Exclusiva (Sin estridencias):
 *    - ROJO BURDEOS / LADRILLO (#BE123C / #F43F5E): Alerta Máxima (Abiertos Vencidos).
 *    - NARANJA COBRE / ÁMBAR (#D97706 / #FB923C): Advertencia (Cerrados con Retraso).
 * 3. Volúmenes de Fondo: Tonos recesivos azul petróleo y pizarra para evitar el "efecto circo".
 */

export const CORPORATE_PALETTE = {
  brand: '#0F766E',   // Teal Petróleo Ejecutivo (no chillón)
  accent: '#2563EB',  // Azul Real Sobrio
  orange: '#D97706',  // Ámbar / Cobre Mate
  danger: '#BE123C',  // Carmín / Ladrillo Profesional
  slate: '#475569',   // Pizarra Profundo
};

/**
 * 1. Colores Semánticos Estrictos para SLA y Estado de Avisos
 * Rige el Semáforo de Operación con saturación controlada:
 * - Cumple / Oportuno: Teal Profundo (#0F766E / #2DD4BF)
 * - Precaución / Retraso: Ámbar Mate (#D97706 / #FBBF24)
 * - Alerta Máxima / Vencido: Carmín (#BE123C / #F43F5E)
 */
export function getSlaColors(isDark: boolean) {
  return {
    cumple: isDark ? '#2DD4BF' : '#0F766E',
    cumpleSoft: isDark ? 'rgba(45, 212, 191, 0.15)' : 'rgba(15, 118, 110, 0.10)',
    warning: isDark ? '#FBBF24' : '#D97706', // Ámbar refinado en vez de naranja fósforo
    warningSoft: isDark ? 'rgba(251, 191, 36, 0.15)' : 'rgba(217, 119, 6, 0.10)',
    excede: isDark ? '#F43F5E' : '#BE123C', // Carmín sobrio en vez de rojo semáforo
    excedeSoft: isDark ? 'rgba(244, 63, 94, 0.15)' : 'rgba(190, 18, 60, 0.10)',
    abierto: isDark ? '#38BDF8' : '#334155', // Azul Pizarra en claro, Azul Claro en oscuro
    abiertoSoft: isDark ? 'rgba(56, 189, 248, 0.12)' : 'rgba(51, 65, 85, 0.08)',
    cerrado: isDark ? '#94A3B8' : '#0284C7', // Azul Acero Técnico
    neutral: isDark ? '#64748B' : '#64748B',
  };
}

/**
 * 2. Paleta Categórica para Tipos de Aviso (100% Rampa Institucional Teal-Azul-Pizarra)
 * Cero colores de arcoíris: todas las categorías habitan la escala sobria.
 */
export const TIPO_COLORS: Record<string, string> = {
  'Vegetación': '#0D9488',             // Teal Corporativo (55% de los avisos)
  'Construcciones': '#1D4ED8',         // Azul Cobalto (Ingeniería y Estructuras)
  'Obras': '#0284C7',                  // Azul Cielo / Acero Técnico
  'Permiso Ingreso': '#475569',        // Pizarra Oscuro (Predial / Administrativo)
  'Invasión / Explanación': '#64748B', // Pizarra Medio (Servidumbres / Terrenos)
  'Otros': '#94A3B8',                  // Pizarra Claro (Recesivo)
};

export function getTipoColor(tipo: string, isDark = false): string {
  if (isDark) {
    const darkMap: Record<string, string> = {
      'Vegetación': '#14B8A6',
      'Construcciones': '#60A5FA',
      'Obras': '#38BDF8',
      'Permiso Ingreso': '#94A3B8',
      'Invasión / Explanación': '#64748B',
      'Otros': '#475569',
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
 * Progresión continua Teal -> Azul Acero -> Pizarra (Norma 03)
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
        '#2DD4BF', // Nivel 1 - Extrema (Teal 400)
        '#14B8A6', // Nivel 2 - Muy Alta (Teal 500)
        '#38BDF8', // Nivel 3 - Alta (Sky 400)
        '#60A5FA', // Nivel 4 - Media (Blue 400)
        '#94A3B8', // Nivel 5 - Moderada (Slate 400)
        '#475569', // Nivel 6 - Mínima (Slate 600)
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

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
    excede: isDark ? '#F43F5E' : '#DC2626',
    excedeSoft: isDark ? 'rgba(244, 63, 94, 0.18)' : 'rgba(220, 38, 38, 0.12)',
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
 */
export const TIPO_COLORS: Record<string, string> = {
  'Vegetación': '#0F766E',             // Teal profundo (Silvicultura)
  'Construcciones': '#1D4ED8',         // Azul Cobalto (Estructuras)
  'Obras': '#0284C7',                  // Azul Acero (Obra civil)
  'Permiso Ingreso': '#4338CA',        // Índigo Técnico (Gestión predial)
  'Invasión / Explanación': '#B45309', // Ocre Tierra (Terreno / Servidumbre)
  'Otros': '#64748B',                  // Pizarra Neutro
};

export function getTipoColor(tipo: string, isDark = false): string {
  if (isDark) {
    const darkMap: Record<string, string> = {
      'Vegetación': '#2DD4BF',
      'Construcciones': '#60A5FA',
      'Obras': '#38BDF8',
      'Permiso Ingreso': '#818CF8',
      'Invasión / Explanación': '#FB923C',
      'Otros': '#94A3B8',
    };
    return darkMap[tipo] || '#94A3B8';
  }
  return TIPO_COLORS[tipo] || '#64748B';
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
 * 4. Escala Secuencial Monocromática para Territorios (De mayor a menor volumen)
 * Reemplaza los 12 colores aleatorios por una progresión limpia de Azul Petróleo a Pizarra.
 */
export const DEPTO_PALETTE = [
  '#115E59', // 1. Teal 800 (Mayor concentración)
  '#0F766E', // 2. Teal 700
  '#0D9488', // 3. Teal 600
  '#0891B2', // 4. Cyan 600
  '#0284C7', // 5. Sky 600
  '#1D4ED8', // 6. Blue 700
  '#2563EB', // 7. Blue 600
  '#3B82F6', // 8. Blue 500
  '#475569', // 9. Slate 600
  '#64748B', // 10. Slate 500
  '#94A3B8', // 11. Slate 400
  '#CBD5E1', // 12. Slate 300 (Menor concentración)
];

export function getSequentialTerritoryPalette(isDark: boolean): string[] {
  return isDark
    ? [
        '#2DD4BF',
        '#14B8A6',
        '#0D9488',
        '#38BDF8',
        '#0284C7',
        '#60A5FA',
        '#3B82F6',
        '#2563EB',
        '#94A3B8',
        '#64748B',
        '#475569',
        '#334155',
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

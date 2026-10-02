export const CORPORATE_PALETTE = {
  forest: '#05261F',
  emerald: '#0D9763',
  mint: '#10B981',
  electric: '#84CC16',
  amber: '#D97706',
  amberLight: '#F59E0B',
  terracotta: '#E11D48',
  cyan: '#0284C7',
  violet: '#8B5CF6',
  slate: '#64748B',
};

export const DEPTO_PALETTE = [
  '#2D6A4F', // Esmeralda corporativo
  '#3A86FF', // Azul eléctrico
  '#0B6E59', // Esmeralda profundo
  '#E9C46A', // Ocre solar
  '#9D4EDD', // Púrpura / Amatista
  '#E76F51', // Terracota
  '#4EA8DE', // Cyan suave
  '#F4A261', // Ámbar cálido
  '#74C69D', // Salvia
  '#06D6A0', // Turquesa
  '#118AB2', // Azul petróleo
  '#FFB703', // Amarillo oro
];

export const TIPO_COLORS: Record<string, string> = {
  'Vegetación': '#0D9763',
  'Construcciones': '#0284C7',
  'Obras': '#F59E0B',
  'Permiso Ingreso': '#8B5CF6',
  'Invasión / Explanación': '#F43F5E',
  'Otros': '#64748B',
};

export function getEChartsThemeTokens(isDark: boolean) {
  return {
    textColor: isDark ? '#F1F5F9' : '#05261F',
    textSecondary: isDark ? '#94A3B8' : '#64748B',
    gridColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.06)',
    cardBg: isDark ? '#131D28' : '#FFFFFF',
    tooltipBg: isDark ? 'rgba(15, 23, 34, 0.95)' : 'rgba(255, 255, 255, 0.95)',
    tooltipBorder: isDark ? '#1E2E40' : '#E2E8F0',
    fontFamily: "'Inter', system-ui, -apple-system, sans-serif",
  };
}

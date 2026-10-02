/**
 * chartFormatters.ts — Formateadores puros y desacoplados para tooltips de ECharts.
 * 
 * Responsabilidad Única (SRP + DRY):
 * - Aislar la interpolación y el renderizado HTML de los tooltips fuera de los componentes Vue.
 * - Asegurar consistencia tipográfica, cromática y de contraste en temas claro/oscuro.
 */

import type { StackedBarItem } from '../types/models';

export interface ThemeTokens {
  textColor: string;
  textSecondary: string;
  tooltipBg: string;
  tooltipBorder: string;
  fontFamily: string;
}

/**
 * Formateador para el gráfico Donut de Tipologías de Aviso.
 */
export function formatDonutTooltip(params: any, total: number, tokens: ThemeTokens): string {
  const p = params.data;
  if (!p) return '';
  const pct = total > 0 ? ((p.value / total) * 100).toFixed(1) : '0';

  return `
    <div style="font-weight: 700; margin-bottom: 4px; color: ${tokens.textColor};">${p.name}</div>
    <div style="color: ${tokens.textColor};">Avisos: <b>${Number(p.value).toLocaleString()}</b></div>
    <div style="color: ${tokens.textColor};">Participación: <b style="color: #10B981;">${pct}%</b></div>
    <div style="font-size: 10px; color: ${tokens.textSecondary}; margin-top: 4px;">(Clic para filtrar barras)</div>
  `;
}

/**
 * Formateador para las barras apiladas 100% de Cumplimiento SLA.
 */
export function formatStackedBarTooltip(
  params: any,
  items: StackedBarItem[],
  selectedPrio: string | null | undefined,
  tokens: ThemeTokens
): string {
  if (!params || !params[0]) return '';
  const itemIndex = params[0].dataIndex;
  const item = items[itemIndex];
  if (!item) return '';

  const isCurrentActive = selectedPrio === item.prioridad;
  const activeBadge = isCurrentActive
    ? `<span style="background: #F59E0B; color: #000; font-size: 10px; font-weight: 800; padding: 2px 6px; border-radius: 4px; margin-left: 6px;">FILTRANDO TORTA</span>`
    : `<span style="font-size: 11px; color: ${tokens.textSecondary}; margin-left: 6px;">(Clic para filtrar)</span>`;

  return `
    <div style="font-weight: 700; margin-bottom: 4px; display: flex; align-items: center; color: ${tokens.textColor};">
      Plazo SLA: ${item.prioridad} ${activeBadge}
    </div>
    <div style="font-size: 11px; color: ${tokens.textSecondary}; margin-bottom: 6px;">Total: ${item.total.toLocaleString()} avisos</div>
    <div style="color: #10B981; margin-bottom: 2px;">● Cumple Plazo: <b>${item.cumple_pct}%</b> (${item.cumple_count.toLocaleString()})</div>
    <div style="color: #E11D48;">● Excede Plazo: <b>${item.excede_pct}%</b> (${item.excede_count.toLocaleString()})</div>
  `;
}

/**
 * Formateador para la jerarquía territorial del Treemap.
 */
export function formatTreemapTooltip(
  info: any,
  totalValue: number,
  isNationalView: boolean,
  isDeptoView: boolean,
  selectedDepto: string | null | undefined,
  tokens: ThemeTokens
): string {
  const val = info.value || 0;
  const name = info.name || '';
  const pct = totalValue > 0 ? ((val / totalValue) * 100).toFixed(1) : '0';

  if (isNationalView) {
    const mCount = info.data?.mpios_count;
    const mpiosStr = mCount
      ? `<div style="font-size: 11px; color: ${tokens.textSecondary}; margin-bottom: 4px;">Cobertura: <b>${mCount} municipios</b></div>`
      : '';
    return `
      <div style="font-weight: 800; font-size: 14px; margin-bottom: 4px; color: ${tokens.textColor};">${name}</div>
      ${mpiosStr}
      <div style="margin-bottom: 2px; color: ${tokens.textColor};">Total Avisos: <b style="color: #10B981;">${Number(val).toLocaleString()}</b> (${pct}% del total)</div>
      <div style="font-size: 11px; color: #38BDF8; margin-top: 6px; font-weight: 600;">(Clic para desglosar sus municipios)</div>
    `;
  }

  if (isDeptoView) {
    return `
      <div style="font-weight: 800; font-size: 14px; margin-bottom: 4px; color: ${tokens.textColor};">${name}</div>
      <div style="font-size: 11px; color: ${tokens.textSecondary}; margin-bottom: 4px;">Departamento: ${selectedDepto || 'Sin Asignar'}</div>
      <div style="margin-bottom: 2px; color: ${tokens.textColor};">Avisos Registrados: <b style="color: #10B981;">${Number(val).toLocaleString()}</b> (${pct}% del depto)</div>
      <div style="font-size: 11px; color: #38BDF8; margin-top: 6px; font-weight: 600;">(Clic para auditar tickets de esta ciudad)</div>
    `;
  }

  return `
    <div style="font-weight: 800; margin-bottom: 4px; color: ${tokens.textColor};">${name}</div>
    <div style="color: ${tokens.textColor};">Total Avisos: <b style="color: #10B981;">${Number(val).toLocaleString()}</b></div>
  `;
}

/**
 * Formateador para los anillos concéntricos del Sunburst.
 */
export function formatSunburstTooltip(info: any, totalAvisos: number, tokens: ThemeTokens): string {
  const val = info.value;
  const name = info.name || '';
  const treePathInfo = info.treePathInfo || [];
  const path = treePathInfo.map((p: any) => p.name).filter(Boolean).join(' ➔ ');
  const pct = totalAvisos > 0 && val ? ((Number(val) / totalAvisos) * 100).toFixed(1) : '0';

  return `
    <div style="font-weight: 700; margin-bottom: 4px; color: ${tokens.textColor};">${name}</div>
    <div style="font-size: 11px; color: ${tokens.textSecondary}; margin-bottom: 6px;">${path || 'Consolidado'}</div>
    <div style="display: flex; justify-content: space-between; gap: 14px; color: ${tokens.textColor};">
      <span>Total Avisos:</span>
      <b style="color: #10B981;">${val ? Number(val).toLocaleString() : '0'} (${pct}%)</b>
    </div>
    <div style="font-size: 10px; color: #38BDF8; margin-top: 6px;">(Clic para ampliar o profundizar)</div>
  `;
}

/**
 * stackedBarBuilder.ts — Constructor puro de ECharts para Cumplimiento SLA por Prioridad (100%).
 * Separa la lógica de visualización del componente Vue y muestra el conteo N en el eje derecho.
 */
import type * as echarts from 'echarts';
import { getEChartsThemeTokens } from '../../constants/themeTokens';
import { formatStackedBarTooltip } from '../../utils/chartFormatters';
import type { StackedBarItem } from '../../types/models';

export function buildStackedBarOption(
  items: StackedBarItem[],
  selectedPrio: string | null,
  isDark: boolean,
): echarts.EChartsOption {
  const tokens = getEChartsThemeTokens(isDark);
  const priorities = items.map((i) => i.prioridad);
  const countsLabels = items.map((i) => `${i.total.toLocaleString('es-CO')} av.`);

  const cumpleSeriesData = items.map((i) => {
    const isSelected = selectedPrio === i.prioridad;
    const isAnySelected = Boolean(selectedPrio);
    return {
      name: i.prioridad,
      value: i.cumple_pct,
      itemStyle: {
        color: isDark ? '#334155' : '#E2E8F0',
        opacity: !isAnySelected || isSelected ? 0.94 : 0.35,
        borderColor: isSelected ? tokens.accentSelect : tokens.cardBg,
        borderWidth: isSelected ? 2 : 1,
      },
    };
  });

  const excedeSeriesData = items.map((i) => {
    const isSelected = selectedPrio === i.prioridad;
    const isAnySelected = Boolean(selectedPrio);
    return {
      name: i.prioridad,
      value: i.excede_pct,
      itemStyle: {
        color: tokens.sla.excede,
        opacity: !isAnySelected || isSelected ? 0.92 : 0.35,
        borderColor: isSelected ? tokens.accentSelect : tokens.cardBg,
        borderWidth: isSelected ? 2 : 1,
      },
    };
  });

  return {
    backgroundColor: 'transparent',
    tooltip: {
      trigger: 'axis',
      confine: true,
      axisPointer: {
        type: 'shadow',
        shadowStyle: { color: isDark ? 'rgba(148, 163, 184, 0.08)' : 'rgba(15, 23, 42, 0.04)' },
      },
      backgroundColor: tokens.tooltipBg,
      borderColor: tokens.tooltipBorder,
      textStyle: { color: tokens.textColor, fontFamily: tokens.fontFamily },
      formatter: (params: any) => formatStackedBarTooltip(params, items, selectedPrio, tokens),
    },
    color: [isDark ? '#334155' : '#E2E8F0', tokens.sla.excede],
    legend: {
      data: ['Cumple Plazo', 'Excede Plazo'],
      top: 0,
      textStyle: { color: tokens.textColor, fontFamily: tokens.fontFamily, fontWeight: 600 },
    },
    grid: {
      left: '2%',
      right: '3%',
      bottom: '12px',
      top: '38px',
      containLabel: true,
    },
    xAxis: {
      type: 'value',
      max: 100,
      axisLabel: { formatter: '{value}%', color: tokens.textSecondary, fontFamily: tokens.fontFamily },
      splitLine: { lineStyle: { color: tokens.gridColor } },
    },
    yAxis: [
      {
        type: 'category',
        data: priorities,
        inverse: true,
        triggerEvent: true,
        axisLabel: {
          color: (val?: string | number) => (String(val) === selectedPrio ? tokens.accentSelect : tokens.textColor),
          fontFamily: tokens.fontFamily,
          fontWeight: 600,
          formatter: (val: string) => (val === selectedPrio ? `▸ ${val}` : val),
        },
        axisLine: { lineStyle: { color: tokens.gridColor } },
      },
      {
        type: 'category',
        data: countsLabels,
        inverse: true,
        axisLine: { show: false },
        axisTick: { show: false },
        axisLabel: {
          color: tokens.textSecondary,
          fontFamily: tokens.fontFamily,
          fontSize: 11,
          fontWeight: 600,
        },
      },
    ],
    series: [
      {
        name: 'Cumple Plazo',
        type: 'bar',
        stack: 'total',
        barWidth: 24,
        label: {
          show: true,
          position: 'inside',
          formatter: (p: any) => {
            const val = Number(p.value);
            return val < 7 ? '' : Number.isInteger(val) ? `${val}%` : `${val.toFixed(1)}%`;
          },
          color: isDark ? '#CBD5E1' : '#334155',
          fontSize: 11,
          fontWeight: 700,
          fontFamily: tokens.fontFamily,
        },
        itemStyle: {
          borderRadius: [4, 0, 0, 4],
          shadowBlur: 5,
          shadowOffsetY: 2,
          shadowColor: isDark ? 'rgba(0, 0, 0, 0.25)' : 'rgba(15, 23, 42, 0.08)',
        },
        data: cumpleSeriesData,
      },
      {
        name: 'Excede Plazo',
        type: 'bar',
        stack: 'total',
        barWidth: 24,
        label: {
          show: true,
          position: 'inside',
          formatter: (p: any) => {
            const val = Number(p.value);
            return val < 7 ? '' : Number.isInteger(val) ? `${val}%` : `${val.toFixed(1)}%`;
          },
          color: '#FFFFFF',
          fontSize: 11,
          fontWeight: 700,
          fontFamily: tokens.fontFamily,
        },
        itemStyle: {
          borderRadius: [0, 4, 4, 0],
          shadowBlur: 5,
          shadowOffsetY: 2,
          shadowColor: isDark ? 'rgba(0, 0, 0, 0.25)' : 'rgba(15, 23, 42, 0.08)',
        },
        data: excedeSeriesData,
      },
    ],
  };
}

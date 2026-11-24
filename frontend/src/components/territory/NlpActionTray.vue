<script setup lang="ts">
import { MapPin, Compass, History } from 'lucide-vue-next';
import type { NlpRouteSummary } from '../../types/nlpGraph';

defineProps<{
  route: NlpRouteSummary | null;
  geoLevelLabel: string;
}>();

const emit = defineEmits<{
  (e: 'drillGeo', name: string): void;
}>();

function formatRemaining(days: number): string {
  if (days < 0) return `${Math.abs(days).toLocaleString()} d vencido`;
  if (days === 0) return 'Vence hoy';
  return `${days.toLocaleString()} d restantes`;
}
</script>

<template>
  <section class="action-tray card">
    <template v-if="route">
      <!-- Encabezado con Guía de Tratamiento + Benchmark Histórico -->
      <header class="tray-header">
        <div class="tray-title-row">
          <h3 class="tray-title">{{ route.name }}</h3>
          <span class="hist-badge" title="Referencia de avisos cerrados históricos en esta ruta">
            <History :size="12" />
            Éxito hist.: <b>{{ route.tasa_exito_pct }}%</b> · ~{{ route.mediana_cierre_dias }} d
          </span>
        </div>
        <div class="action-guide">
          <Compass :size="14" class="guide-icon" />
          <span><b>Cómo tratar:</b> {{ route.action }}</span>
        </div>
      </header>

      <!-- Concentración Territorial Rápida (clic para filtrar) -->
      <div v-if="route.top_territories.length > 0" class="geo-strip">
        <span class="geo-strip-lbl"><MapPin :size="11" /> Focos por {{ geoLevelLabel }}:</span>
        <button
          v-for="g in route.top_territories"
          :key="g.name"
          class="geo-chip"
          :title="`Filtrar ${g.name} (${g.vencidos} vencidos)`"
          @click="emit('drillGeo', g.name)"
        >
          <span>{{ g.name }}</span>
          <b>{{ g.total }}</b>
          <span v-if="g.vencidos > 0" class="geo-overdue">({{ g.vencidos }} venc.)</span>
        </button>
      </div>

      <!-- Tabla Accionable de Avisos Priorizados por Urgencia -->
      <div class="tickets-scroll">
        <table v-if="route.tickets.length > 0" class="triage-table">
          <thead>
            <tr>
              <th>Aviso</th>
              <th>Ubicación / Activo</th>
              <th>Descripción Operativa</th>
              <th class="col-sla">Estado Plazo</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="t in route.tickets.slice(0, 80)" :key="t.aviso">
              <td class="mono-id">{{ t.aviso }}</td>
              <td>
                <div class="loc-primary">{{ t.mpio }} <span class="loc-sub">({{ t.depto }})</span></div>
                <div class="loc-asset">{{ t.linea }} · T-{{ t.torre }}</div>
              </td>
              <td class="desc-cell">{{ t.desc }}</td>
              <td class="col-sla">
                <span class="sla-pill" :class="`sla-${t.urgencia}`">
                  {{ formatRemaining(t.dias_restantes) }}
                </span>
                <div class="prio-sub">SLA: {{ t.prioridad }}</div>
              </td>
            </tr>
          </tbody>
        </table>
        <div v-else class="empty-tray">
          No hay avisos abiertos en esta ruta con los filtros seleccionados.
        </div>
      </div>
    </template>
  </section>
</template>

<style scoped>
.action-tray {
  display: flex; flex-direction: column; gap: 8px; padding: 12px 14px;
  min-height: 0; height: 100%; overflow: hidden;
  background: var(--bg-card); border: 1px solid var(--border-subtle); border-radius: var(--radius-md);
}
.tray-header { display: flex; flex-direction: column; gap: 6px; flex-shrink: 0; }
.tray-title-row { display: flex; justify-content: space-between; align-items: center; gap: 8px; flex-wrap: wrap; }
.tray-title { margin: 0; font-size: 0.9rem; font-weight: 800; color: var(--text-primary); }
.hist-badge {
  display: inline-flex; align-items: center; gap: 4px; font-size: 0.71rem;
  color: var(--text-secondary); background: var(--bg-subtle);
  border: 1px solid var(--border-subtle); padding: 2px 8px; border-radius: 999px;
}
.action-guide {
  display: flex; align-items: center; gap: 6px; font-size: 0.76rem; color: var(--text-primary);
  background: var(--color-brand-soft, rgba(15, 118, 110, 0.08));
  border-left: 3px solid var(--color-brand, #0f766e); padding: 6px 10px; border-radius: 4px;
}
.guide-icon { color: var(--color-brand, #0f766e); flex-shrink: 0; }
.geo-strip { display: flex; align-items: center; gap: 5px; flex-wrap: wrap; flex-shrink: 0; }
.geo-strip-lbl { display: inline-flex; align-items: center; gap: 3px; font-size: 0.7rem; font-weight: 700; color: var(--text-secondary); }
.geo-chip {
  display: inline-flex; align-items: center; gap: 4px; font-size: 0.7rem;
  background: var(--bg-subtle); color: var(--text-primary);
  border: 1px solid var(--border-subtle); border-radius: 999px; padding: 2px 8px; cursor: pointer;
}
.geo-chip:hover { border-color: var(--color-brand); color: var(--color-brand); }
.geo-overdue { color: var(--sla-danger, #be123c); font-weight: 700; font-size: 0.66rem; }
.tickets-scroll { flex: 1; min-height: 0; overflow-y: auto; border: 1px solid var(--border-subtle); border-radius: var(--radius-sm); }
.triage-table { width: 100%; border-collapse: collapse; font-size: 0.74rem; }
.triage-table th {
  position: sticky; top: 0; background: var(--bg-subtle); color: var(--text-secondary);
  text-align: left; font-size: 0.68rem; text-transform: uppercase; padding: 6px 8px; border-bottom: 1px solid var(--border-subtle);
}
.triage-table td { padding: 6px 8px; border-bottom: 1px solid var(--border-subtle); vertical-align: top; }
.mono-id { font-family: ui-monospace, monospace; font-weight: 700; color: var(--text-primary); white-space: nowrap; }
.loc-primary { font-weight: 700; color: var(--text-primary); }
.loc-sub, .loc-asset, .prio-sub { font-size: 0.67rem; color: var(--text-secondary); }
.desc-cell { color: var(--text-primary); line-height: 1.3; }
.col-sla { text-align: right; white-space: nowrap; }
.sla-pill { display: inline-block; padding: 2px 7px; border-radius: 999px; font-size: 0.68rem; font-weight: 700; }
.sla-vencido { background: rgba(190, 18, 60, 0.12); color: #be123c; }
.sla-proximo { background: rgba(217, 119, 6, 0.14); color: #b45309; }
.sla-en_plazo { background: rgba(15, 118, 110, 0.12); color: #0f766e; }
.empty-tray { padding: 24px; text-align: center; font-size: 0.78rem; color: var(--text-secondary); }
</style>

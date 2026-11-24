<script setup lang="ts">
import { computed } from 'vue';
import { MapPin, Compass, AlertTriangle, Tag } from 'lucide-vue-next';
import type { NlpRouteSummary, NlpTicket } from '../../types/nlpGraph';

const props = defineProps<{
  route: NlpRouteSummary | null;
  geoLevelLabel: string;
  selectedTag: string | null;
}>();

const emit = defineEmits<{
  (e: 'drillGeo', name: string): void;
  (e: 'toggleTag', tag: string): void;
}>();

const filteredTickets = computed(() => {
  if (!props.route) return [];
  if (!props.selectedTag) return props.route.tickets;
  return props.route.tickets.filter((t) => t.tags.includes(props.selectedTag!));
});

function formatSlaLabel(t: NlpTicket): string {
  if (t.estado === 'cerrado') {
    return t.urgencia === 'vencido'
      ? `Cerrado +${Math.abs(t.dias_restantes).toLocaleString()}d tarde`
      : `Cerrado a tiempo (${t.dias_abierto.toLocaleString()}d)`;
  }
  if (t.dias_restantes < 0) return `Abierto · ${Math.abs(t.dias_restantes).toLocaleString()}d vencido`;
  if (t.dias_restantes === 0) return 'Abierto · Vence hoy';
  return `Abierto · ${t.dias_restantes.toLocaleString()}d rest.`;
}

function isRiskTag(tg: string): boolean {
  return tg.startsWith('IVBL') || tg.startsWith('SNG') || tg.startsWith('Bajo') || tg.startsWith('Reincidente');
}
</script>

<template>
  <section class="action-tray card">
    <template v-if="route">
      <header class="tray-header">
        <div class="tray-title-row">
          <h3 class="tray-title">{{ route.name }}</h3>
          <span class="overdue-rate-badge">
            <AlertTriangle :size="12" />
            Vencimiento: <b>{{ route.vencimiento_pct }}%</b> ({{ route.vencidos_total.toLocaleString() }} venc.) · ~{{ route.mediana_dias }}d
          </span>
        </div>
        <div class="action-guide">
          <Compass :size="14" class="guide-icon" />
          <span><b>Cómo tratar:</b> {{ route.action }}</span>
        </div>
      </header>

      <!-- Banderas / Palabras Críticas NLP extraídas de la Descripción -->
      <div v-if="route.critical_tags.length > 0" class="geo-strip">
        <span class="geo-strip-lbl"><Tag :size="11" /> Palabras críticas:</span>
        <button
          v-for="ct in route.critical_tags"
          :key="ct.tag"
          class="geo-chip"
          :class="{ 'tag-active': selectedTag === ct.tag }"
          :title="`${ct.vencimiento_pct}% de vencimiento en avisos con '${ct.tag}'`"
          @click="emit('toggleTag', ct.tag)"
        >
          <span>{{ ct.tag }}</span>
          <b>{{ ct.total }}</b>
          <span class="geo-overdue">{{ ct.vencimiento_pct }}% venc.</span>
        </button>
      </div>

      <div v-if="route.top_territories.length > 0" class="geo-strip">
        <span class="geo-strip-lbl"><MapPin :size="11" /> Focos {{ geoLevelLabel }}:</span>
        <button
          v-for="g in route.top_territories"
          :key="g.name"
          class="geo-chip"
          @click="emit('drillGeo', g.name)"
        >
          <span>{{ g.name }}</span>
          <b>{{ g.total }}</b>
          <span v-if="g.vencidos > 0" class="geo-overdue">({{ g.vencidos }} venc.)</span>
        </button>
      </div>

      <div class="tickets-scroll">
        <table v-if="filteredTickets.length > 0" class="triage-table">
          <thead>
            <tr>
              <th>Aviso</th>
              <th>Ubicación / Activo</th>
              <th>Descripción y Banderas NLP</th>
              <th class="col-sla">Estado y Plazo</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="t in filteredTickets.slice(0, 80)" :key="t.aviso">
              <td class="mono-id">{{ t.aviso }}</td>
              <td>
                <div class="loc-primary">{{ t.mpio }} <span class="loc-sub">({{ t.depto }})</span></div>
                <div class="loc-asset">{{ t.linea }} · T-{{ t.torre }}</div>
              </td>
              <td>
                <div class="desc-cell">{{ t.desc }}</div>
                <div v-if="t.tags.length" class="row-tags">
                  <span v-for="tg in t.tags" :key="tg" class="mini-tag" :class="{ 'risk-tag': isRiskTag(tg) }">{{ tg }}</span>
                </div>
              </td>
              <td class="col-sla">
                <span class="sla-pill" :class="`sla-${t.urgencia}`">{{ formatSlaLabel(t) }}</span>
                <div class="prio-sub">Prioridad: {{ t.prioridad }}</div>
              </td>
            </tr>
          </tbody>
        </table>
        <div v-else class="empty-tray">No hay avisos en esta causal con los filtros seleccionados.</div>
      </div>
    </template>
  </section>
</template>

<style scoped>
.action-tray {
  display: flex; flex-direction: column; gap: 6px; padding: 11px 13px;
  min-height: 0; height: 100%; overflow: hidden;
  background: var(--bg-card); border: 1px solid var(--border-subtle); border-radius: var(--radius-md);
}
.tray-header { display: flex; flex-direction: column; gap: 5px; flex-shrink: 0; }
.tray-title-row { display: flex; justify-content: space-between; align-items: center; gap: 8px; flex-wrap: wrap; }
.tray-title { margin: 0; font-size: 0.88rem; font-weight: 800; color: var(--text-primary); }
.overdue-rate-badge {
  display: inline-flex; align-items: center; gap: 4px; font-size: 0.7rem;
  color: #be123c; background: rgba(190, 18, 60, 0.09); border: 1px solid rgba(190, 18, 60, 0.25); padding: 2px 8px; border-radius: 999px;
}
.action-guide {
  display: flex; align-items: center; gap: 6px; font-size: 0.74rem; color: var(--text-primary);
  background: var(--color-brand-soft, rgba(15, 118, 110, 0.08)); border-left: 3px solid var(--color-brand, #0f766e); padding: 5px 9px; border-radius: 4px;
}
.guide-icon { color: var(--color-brand, #0f766e); flex-shrink: 0; }
.geo-strip { display: flex; align-items: center; gap: 4px; flex-wrap: wrap; flex-shrink: 0; }
.geo-strip-lbl { display: inline-flex; align-items: center; gap: 3px; font-size: 0.68rem; font-weight: 700; color: var(--text-secondary); }
.geo-chip {
  display: inline-flex; align-items: center; gap: 4px; font-size: 0.68rem;
  background: var(--bg-subtle); color: var(--text-primary); border: 1px solid var(--border-subtle); border-radius: 999px; padding: 2px 7px; cursor: pointer;
}
.geo-chip:hover, .geo-chip.tag-active { border-color: var(--color-brand); background: var(--color-brand-soft, rgba(15, 118, 110, 0.12)); font-weight: 700; }
.geo-overdue { color: #be123c; font-weight: 700; font-size: 0.65rem; }
.tickets-scroll { flex: 1; min-height: 0; overflow-y: auto; border: 1px solid var(--border-subtle); border-radius: var(--radius-sm); }
.triage-table { width: 100%; border-collapse: collapse; font-size: 0.73rem; }
.triage-table th {
  position: sticky; top: 0; background: var(--bg-subtle); color: var(--text-secondary);
  text-align: left; font-size: 0.67rem; text-transform: uppercase; padding: 5px 8px; border-bottom: 1px solid var(--border-subtle);
}
.triage-table td { padding: 5px 8px; border-bottom: 1px solid var(--border-subtle); vertical-align: top; }
.mono-id { font-family: ui-monospace, monospace; font-weight: 700; color: var(--text-primary); white-space: nowrap; }
.loc-primary { font-weight: 700; color: var(--text-primary); }
.loc-sub, .loc-asset, .prio-sub { font-size: 0.66rem; color: var(--text-secondary); }
.desc-cell { color: var(--text-primary); line-height: 1.25; }
.row-tags { display: flex; flex-wrap: wrap; gap: 3px; margin-top: 3px; }
.mini-tag { font-size: 0.62rem; padding: 1px 5px; border-radius: 3px; background: var(--bg-subtle); border: 1px solid var(--border-subtle); color: var(--text-secondary); }
.mini-tag.risk-tag { background: rgba(190, 18, 60, 0.09); border-color: rgba(190, 18, 60, 0.28); color: #be123c; font-weight: 700; }
.col-sla { text-align: right; white-space: nowrap; }
.sla-pill { display: inline-block; padding: 2px 7px; border-radius: 999px; font-size: 0.67rem; font-weight: 700; }
.sla-vencido { background: rgba(190, 18, 60, 0.12); color: #be123c; }
.sla-proximo { background: rgba(217, 119, 6, 0.14); color: #b45309; }
.sla-en_plazo { background: rgba(15, 118, 110, 0.12); color: #0f766e; }
.empty-tray { padding: 24px; text-align: center; font-size: 0.78rem; color: var(--text-secondary); }
</style>

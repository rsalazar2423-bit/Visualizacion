<script setup lang="ts">
import { computed } from 'vue';
import { Compass, Tag } from 'lucide-vue-next';
import { useThemeStore } from '../../stores/themeStore';
import { getTipoColor } from '../../constants/themeTokens';
import type { NlpRouteSummary, NlpTicket } from '../../types/nlpGraph';

const props = defineProps<{
  route: NlpRouteSummary | null;
  selectedTag: string | null;
}>();

const emit = defineEmits<{
  (e: 'toggleTag', tag: string): void;
}>();

const themeStore = useThemeStore();

const filteredTickets = computed(() => {
  if (!props.route) return [];
  if (!props.selectedTag) return props.route.tickets;
  return props.route.tickets.filter((t) => t.tags.includes(props.selectedTag!));
});

function formatTorre(torre: string): string {
  const clean = torre.trim();
  if (!clean || clean === '-') return '-';
  return /^t[-_\s]?\d/i.test(clean) ? clean : `T-${clean}`;
}

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

function getSlaBadgeClass(t: NlpTicket): string {
  if (t.estado === 'abierto' && t.urgencia === 'vencido') return 'sla-danger';
  if (t.urgencia === 'vencido' || t.urgencia === 'proximo') return 'sla-warn';
  return 'sla-ok';
}
</script>

<template>
  <section class="action-tray card">
    <template v-if="route">
      <header class="tray-header">
        <div class="tray-title-row">
          <h3 class="tray-title">{{ route.name }}</h3>
          <span class="meta-summary">
            <b>{{ route.vencimiento_pct }}%</b> con vencimiento ({{ route.vencidos_total.toLocaleString() }} de {{ route.total.toLocaleString() }}) · Mediana {{ route.mediana_dias }}d
          </span>
        </div>
        <div class="action-guide">
          <Compass :size="14" class="guide-icon" />
          <span><b>Acción sugerida:</b> {{ route.action }}</span>
        </div>
      </header>

      <!-- Única tira limpia de Palabras Críticas NLP (tono sobrio pizarra, sin saturación roja) -->
      <div v-if="route.critical_tags.length > 0" class="tag-strip">
        <span class="strip-lbl"><Tag :size="11" /> Filtrar palabra clave:</span>
        <button
          v-for="ct in route.critical_tags"
          :key="ct.tag"
          class="tag-chip"
          :class="{ active: selectedTag === ct.tag }"
          :title="`${ct.vencimiento_pct}% de vencimiento en avisos con '${ct.tag}'`"
          @click="emit('toggleTag', ct.tag)"
        >
          <span>{{ ct.tag }}</span>
          <span class="tag-count">{{ ct.total }}</span>
        </button>
      </div>

      <div class="tickets-scroll">
        <table v-if="filteredTickets.length > 0" class="triage-table">
          <thead>
            <tr>
              <th>Aviso</th>
              <th>Ubicación / Activo</th>
              <th>Descripción</th>
              <th class="col-sla">Estado Plazo</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="t in filteredTickets.slice(0, 80)" :key="t.aviso">
              <td>
                <div class="mono-id">{{ t.aviso }}</div>
                <span class="tipo-pill" :style="{ borderLeftColor: getTipoColor(t.tipo, themeStore.isDark) }">{{ t.tipo }}</span>
              </td>
              <td>
                <div class="loc-primary">{{ t.mpio }} <span class="loc-sub">({{ t.depto }})</span></div>
                <div class="loc-asset">{{ t.linea }} · {{ formatTorre(t.torre) }}</div>
              </td>
              <td>
                <div class="desc-cell">{{ t.desc }}</div>
                <div v-if="t.tags.length" class="row-tags">
                  <span v-for="tg in t.tags.slice(0, 2)" :key="tg" class="mini-tag">{{ tg }}</span>
                </div>
              </td>
              <td class="col-sla">
                <span class="sla-pill" :class="getSlaBadgeClass(t)">{{ formatSlaLabel(t) }}</span>
                <div class="prio-sub">SLA: {{ t.prioridad }}</div>
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
  display: flex; flex-direction: column; gap: 8px; padding: 14px 16px;
  min-height: 0; height: 100%; overflow: hidden;
  background: var(--bg-card); border: 1px solid var(--border-subtle); border-radius: var(--radius-md);
}
.tray-header { display: flex; flex-direction: column; gap: 6px; flex-shrink: 0; }
.tray-title-row { display: flex; justify-content: space-between; align-items: baseline; gap: 8px; flex-wrap: wrap; }
.tray-title { margin: 0; font-size: 0.92rem; font-weight: 800; color: var(--text-primary); }
.meta-summary { font-size: 0.74rem; color: var(--text-secondary); }
.meta-summary b { color: var(--text-primary); }
.action-guide {
  display: flex; align-items: center; gap: 7px; font-size: 0.76rem; color: var(--text-primary);
  background: var(--bg-subtle); border-left: 3px solid var(--color-brand); padding: 6px 10px; border-radius: 4px;
}
.guide-icon { color: var(--color-brand); flex-shrink: 0; }
.tag-strip { display: flex; align-items: center; gap: 5px; flex-wrap: wrap; flex-shrink: 0; }
.strip-lbl { display: inline-flex; align-items: center; gap: 4px; font-size: 0.7rem; font-weight: 600; color: var(--text-secondary); }
.tag-chip {
  display: inline-flex; align-items: center; gap: 5px; font-size: 0.7rem;
  background: var(--bg-subtle); color: var(--text-secondary); border: 1px solid var(--border-subtle); border-radius: var(--radius-full); padding: 2px 9px; cursor: pointer;
}
.tag-chip:hover { border-color: var(--border-strong); color: var(--text-primary); }
.tag-chip.active { background: var(--color-brand-soft); border-color: var(--color-brand); color: var(--color-brand); font-weight: 700; }
.tag-count { font-weight: 700; color: var(--text-primary); }
.tickets-scroll { flex: 1; min-height: 0; overflow-y: auto; border: 1px solid var(--border-subtle); border-radius: var(--radius-sm); }
.triage-table { width: 100%; border-collapse: collapse; font-size: 0.74rem; }
.triage-table th {
  position: sticky; top: 0; background: var(--bg-table-header); color: var(--text-secondary);
  text-align: left; font-size: 0.67rem; text-transform: uppercase; padding: 7px 10px; border-bottom: 1px solid var(--border-subtle);
}
.triage-table td { padding: 7px 10px; border-bottom: 1px solid var(--border-subtle); vertical-align: top; }
.mono-id { font-family: var(--font-family-mono); font-weight: 700; color: var(--text-primary); white-space: nowrap; }
.tipo-pill { display: inline-block; margin-top: 2px; font-size: 0.63rem; font-weight: 600; padding: 1px 6px; border-radius: 3px; background: var(--bg-subtle); border: 1px solid var(--border-subtle); border-left-width: 3px; color: var(--text-secondary); white-space: nowrap; }
.loc-primary { font-weight: 700; color: var(--text-primary); }
.loc-sub, .loc-asset, .prio-sub { font-size: 0.67rem; color: var(--text-secondary); }
.desc-cell { color: var(--text-primary); line-height: 1.3; }
.row-tags { display: flex; flex-wrap: wrap; gap: 4px; margin-top: 3px; }
.mini-tag { font-size: 0.63rem; padding: 1px 6px; border-radius: 3px; background: var(--bg-subtle); color: var(--text-secondary); }
.col-sla { text-align: right; white-space: nowrap; }
.sla-pill { display: inline-block; padding: 2px 8px; border-radius: var(--radius-full); font-size: 0.68rem; font-weight: 700; border: 1px solid transparent; }
.sla-danger { background: var(--sla-danger-bg); color: var(--sla-danger); border-color: var(--sla-danger-border); }
.sla-warn { background: var(--sla-warning-bg); color: var(--sla-warning); border-color: var(--sla-warning-border); }
.sla-ok { background: var(--sla-success-bg); color: var(--sla-success); border-color: var(--sla-success-border); }
.empty-tray { padding: 28px; text-align: center; font-size: 0.78rem; color: var(--text-secondary); }
</style>

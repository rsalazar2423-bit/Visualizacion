<script setup lang="ts">
import { AlertCircle, CheckCircle2, Quote, MapPin } from 'lucide-vue-next';
import type { NlpClusterSummary } from '../../types/nlpGraph';

defineProps<{
  cluster: NlpClusterSummary | null;
  activeMode: 'abiertos' | 'cerrados';
}>();
</script>

<template>
  <aside class="nlp-detail-panel">
    <div v-if="cluster" class="panel-content">
      <div class="panel-header">
        <span class="cluster-badge" :style="{ borderColor: cluster.color, color: cluster.color }">
          <span class="badge-dot" :style="{ backgroundColor: cluster.color }"></span>
          {{ cluster.name }}
        </span>
        <span class="cluster-pct">{{ cluster.pct }}% del total</span>
      </div>

      <div class="kpi-micro-grid">
        <div class="kpi-mini-box">
          <span class="kpi-mini-lbl">Volumen</span>
          <b class="kpi-mini-val">{{ cluster.count.toLocaleString() }} avisos</b>
        </div>
        <div class="kpi-mini-box">
          <span class="kpi-mini-lbl">Mediana de Mora</span>
          <b class="kpi-mini-val" :class="activeMode === 'abiertos' ? 'danger-val' : 'success-val'">
            {{ cluster.mediana_dias.toLocaleString() }} días
          </b>
        </div>
      </div>

      <p class="cluster-desc">{{ cluster.desc }}</p>

      <div v-if="cluster.deptos?.length" class="deptos-zone">
        <span class="zone-title"><MapPin :size="12" /> Territorios Críticos:</span>
        <div class="depto-chips">
          <span v-for="d in cluster.deptos" :key="d.depto" class="depto-chip">
            {{ d.depto }}: <b>{{ d.count }}</b>
          </span>
        </div>
      </div>

      <div v-if="cluster.quotes?.length" class="quotes-zone">
        <span class="zone-title"><Quote :size="12" /> Citas Textuales de Campo:</span>
        <ul class="quote-list">
          <li v-for="(q, idx) in cluster.quotes" :key="idx" class="quote-item">
            "{{ q }}"
          </li>
        </ul>
      </div>
    </div>

    <div v-else class="empty-selection">
      <AlertCircle v-if="activeMode === 'abiertos'" :size="24" class="text-danger" />
      <CheckCircle2 v-else :size="24" class="text-success" />
      <span class="empty-title">Auditoría Semántica de Causa Raíz</span>
      <p class="empty-desc">
        Haz clic en cualquier nodo central o satélite del grafo para auditar su impacto cuantitativo, territorios críticos y citas textuales de campo.
      </p>
    </div>
  </aside>
</template>

<style scoped>
.nlp-detail-panel {
  width: 280px;
  flex-shrink: 0;
  background: var(--bg-card);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-md);
  padding: 12px;
  display: flex;
  flex-direction: column;
  overflow-y: auto;
}
.panel-content { display: flex; flex-direction: column; gap: 10px; }
.panel-header { display: flex; align-items: center; justify-content: space-between; }
.cluster-badge { display: inline-flex; align-items: center; gap: 6px; font-size: 0.78rem; font-weight: 700; border: 1px solid; border-radius: 999px; padding: 2px 10px; }
.badge-dot { width: 7px; height: 7px; border-radius: 50%; }
.cluster-pct { font-size: 0.75rem; font-weight: 700; color: var(--text-secondary); }
.kpi-micro-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
.kpi-mini-box { background: var(--bg-subtle); border: 1px solid var(--border-subtle); padding: 5px 8px; border-radius: var(--radius-sm); display: flex; flex-direction: column; }
.kpi-mini-lbl { font-size: 0.68rem; color: var(--text-secondary); font-weight: 600; }
.kpi-mini-val { font-size: 0.92rem; color: var(--text-primary); }
.danger-val { color: var(--color-danger, #BE123C); }
.success-val { color: var(--color-brand, #0F766E); }
.cluster-desc { font-size: 0.75rem; line-height: 1.35; color: var(--text-secondary); margin: 0; }
.zone-title { font-size: 0.72rem; font-weight: 700; color: var(--text-secondary); display: flex; align-items: center; gap: 5px; margin-bottom: 4px; }
.depto-chips { display: flex; flex-wrap: wrap; gap: 4px; }
.depto-chip { font-size: 0.68rem; background: var(--bg-subtle); border: 1px solid var(--border-subtle); padding: 2px 6px; border-radius: 4px; color: var(--text-secondary); }
.depto-chip b { color: var(--text-primary); }
.quote-list { list-style: none; padding: 0; margin: 0; display: flex; flex-direction: column; gap: 5px; }
.quote-item { font-size: 0.71rem; font-style: italic; color: var(--text-primary); background: var(--bg-subtle); border-left: 3px solid var(--color-brand); padding: 4px 7px; border-radius: 0 var(--radius-sm) var(--radius-sm) 0; line-height: 1.3; }
.empty-selection { display: flex; flex-direction: column; align-items: center; justify-content: center; text-align: center; height: 100%; padding: 15px 8px; gap: 6px; }
.text-danger { color: var(--color-danger, #BE123C); }
.text-success { color: var(--color-brand, #0F766E); }
.empty-title { font-size: 0.82rem; font-weight: 700; color: var(--text-primary); }
.empty-desc { font-size: 0.74rem; color: var(--text-secondary); line-height: 1.35; margin: 0; }
</style>

<script setup lang="ts">
import { AlertCircle, Quote, TrendingDown, Clock, MapPin } from 'lucide-vue-next';
import type { NlpClusterComparison } from '../../types/nlpGraph';

defineProps<{
  comparison: NlpClusterComparison | null;
}>();
</script>

<template>
  <aside class="vs-detail-drawer">
    <div v-if="comparison" class="vs-detail-grid">
      <!-- Columna 1: Resumen, Brecha y Términos Clave -->
      <div class="vs-col-summary">
        <div class="cluster-tag" :style="{ borderColor: comparison.color, color: comparison.color }">
          <span class="tag-dot" :style="{ backgroundColor: comparison.color }"></span>
          {{ comparison.name }}
        </div>
        <p class="cluster-desc">{{ comparison.desc }}</p>
        <div class="gap-badge">
          <Clock :size="12" />
          <span v-if="comparison.brecha_mora_dias >= 0">
            Brecha: <b>+{{ comparison.brecha_mora_dias.toLocaleString() }} días</b> más en abiertos
          </span>
          <span v-else>
            Mora abiertos: <b>{{ comparison.abiertos_mora.toLocaleString() }} d</b> vs cerrados {{ comparison.cerrados_atencion.toLocaleString() }} d
          </span>
        </div>
        <div v-if="comparison.abiertos_terms?.length" class="terms-row">
          <span class="terms-lbl">Términos NLP:</span>
          <span v-for="t in comparison.abiertos_terms.slice(0, 4)" :key="t.term" class="term-chip">
            {{ t.term }} ({{ t.freq }})
          </span>
        </div>
      </div>

      <!-- Columna 2: Evidencia Abiertos (Deptos + Citas) -->
      <div class="vs-col-quotes red-border">
        <span class="quote-header text-danger">
          <AlertCircle :size="12" /> Abiertos ({{ comparison.abiertos_count }} avisos · ~{{ comparison.abiertos_mora }} d)
        </span>
        <div v-if="comparison.abiertos_deptos?.length" class="depto-pills">
          <MapPin :size="10" class="text-danger" />
          <span v-for="d in comparison.abiertos_deptos.slice(0, 3)" :key="d.depto" class="depto-pill">
            {{ d.depto }}: <b>{{ d.count }}</b> ({{ d.mora }}d)
          </span>
        </div>
        <ul class="quote-list">
          <li v-for="(q, idx) in comparison.abiertos_quotes.slice(0, 3)" :key="idx" class="quote-item">
            <Quote :size="10" /> "{{ q }}"
          </li>
        </ul>
      </div>

      <!-- Columna 3: Evidencia Cerrados (Deptos + Citas) -->
      <div class="vs-col-quotes green-border">
        <span class="quote-header text-success">
          <TrendingDown :size="12" /> Cerrados ({{ comparison.cerrados_count }} avisos · ~{{ comparison.cerrados_atencion }} d)
        </span>
        <div v-if="comparison.cerrados_deptos?.length" class="depto-pills">
          <MapPin :size="10" class="text-success" />
          <span v-for="d in comparison.cerrados_deptos.slice(0, 3)" :key="d.depto" class="depto-pill">
            {{ d.depto }}: <b>{{ d.count }}</b> ({{ d.mora }}d)
          </span>
        </div>
        <ul class="quote-list">
          <li v-for="(q, idx) in comparison.cerrados_quotes.slice(0, 3)" :key="idx" class="quote-item">
            <Quote :size="10" /> "{{ q }}"
          </li>
        </ul>
      </div>
    </div>

    <div v-else class="empty-state">
      <span class="empty-text">Haz clic en un clúster o departamento de cualquier treemap para ver el contraste de citas y métricas.</span>
    </div>
  </aside>
</template>

<style scoped>
.vs-detail-drawer {
  background: var(--bg-card);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-sm);
  padding: 8px 12px;
  flex-shrink: 0;
}
.vs-detail-grid {
  display: grid;
  grid-template-columns: 1.05fr 1.45fr 1.45fr;
  gap: 10px;
  align-items: start;
}
.vs-col-summary { display: flex; flex-direction: column; gap: 5px; }
.cluster-tag {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  font-size: 0.74rem;
  font-weight: 700;
  border: 1px solid;
  border-radius: 999px;
  padding: 1px 8px;
  width: fit-content;
}
.tag-dot { width: 6px; height: 6px; border-radius: 50%; }
.cluster-desc { font-size: 0.69rem; color: var(--text-secondary); line-height: 1.3; margin: 0; }
.gap-badge {
  font-size: 0.68rem;
  color: var(--color-danger, #BE123C);
  background: var(--bg-subtle);
  border: 1px solid var(--border-subtle);
  padding: 2px 6px;
  border-radius: 4px;
  display: flex;
  align-items: center;
  gap: 4px;
  width: fit-content;
}
.terms-row { display: flex; flex-wrap: wrap; align-items: center; gap: 4px; }
.terms-lbl { font-size: 0.64rem; font-weight: 700; color: var(--text-secondary); }
.term-chip {
  font-size: 0.63rem;
  padding: 1px 5px;
  border-radius: 3px;
  background: var(--bg-subtle);
  border: 1px solid var(--border-subtle);
  color: var(--text-primary);
}
.vs-col-quotes {
  display: flex;
  flex-direction: column;
  gap: 4px;
  background: var(--bg-subtle);
  border-radius: var(--radius-sm);
  padding: 6px 8px;
  border-left: 3px solid;
}
.red-border { border-color: var(--color-danger, #BE123C); }
.green-border { border-color: var(--color-brand, #0F766E); }
.quote-header { font-size: 0.69rem; font-weight: 700; display: flex; align-items: center; gap: 4px; }
.text-danger { color: var(--color-danger, #BE123C); }
.text-success { color: var(--color-brand, #0F766E); }
.depto-pills { display: flex; flex-wrap: wrap; align-items: center; gap: 4px; }
.depto-pill {
  font-size: 0.63rem;
  color: var(--text-secondary);
  background: var(--bg-card);
  border: 1px solid var(--border-subtle);
  border-radius: 3px;
  padding: 1px 5px;
}
.quote-list { list-style: none; padding: 0; margin: 0; display: flex; flex-direction: column; gap: 2px; }
.quote-item {
  font-size: 0.67rem;
  font-style: italic;
  color: var(--text-primary);
  line-height: 1.25;
  display: flex;
  align-items: center;
  gap: 4px;
}
.empty-state { text-align: center; padding: 8px; font-size: 0.72rem; color: var(--text-secondary); }
@media (max-width: 1024px) { .vs-detail-grid { grid-template-columns: 1fr; } }
</style>

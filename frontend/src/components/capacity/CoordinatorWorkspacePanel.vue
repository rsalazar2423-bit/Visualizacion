<template>
  <div class="coord-workspace">
    <!-- Loading / Error state -->
    <div v-if="loading && !data" class="coord-state">
      Cargando Centro del Coordinador...
    </div>
    <div v-else-if="error" class="coord-state coord-error">
      {{ error }}
    </div>

    <template v-else-if="data">
      <!-- Fila Superior: 2 Bloques de Balance y Ejecución (altura compacta, sin desbordar) -->
      <section class="coord-top-grid">
        <!-- Bloque 2: Ejecución en Campo vs. Bloqueo Predial/Legal -->
        <article class="coord-card compact-card">
          <header class="card-head">
            <div class="head-title-group">
              <Wrench :size="15" class="icon-brand" />
              <h3>Ejecución en Campo vs. Bloqueo Predial / Legal</h3>
            </div>
            <span class="head-badge">{{ data.total_abiertos.toLocaleString('es-CO') }} abiertos</span>
          </header>

          <div class="split-bar-track" v-if="data.total_abiertos > 0">
            <div
              v-for="bucket in data.execution_split"
              :key="bucket.category"
              class="split-bar-fill"
              :class="bucket.category === 'campo' ? 'fill-campo' : 'fill-predial'"
              :style="{ width: `${bucket.pct}%` }"
              :title="`${bucket.label}: ${bucket.abiertos} (${bucket.pct}%)`"
            ></div>
          </div>

          <div class="split-metrics">
            <div
              v-for="bucket in data.execution_split"
              :key="bucket.category"
              class="split-metric-box"
              :class="bucket.category === 'campo' ? 'box-campo' : 'box-predial'"
            >
              <div class="split-label-row">
                <span class="dot" :class="bucket.category === 'campo' ? 'dot-campo' : 'dot-predial'"></span>
                <span class="split-name">{{ bucket.label }}</span>
                <strong class="split-pct">{{ bucket.pct.toFixed(1) }}%</strong>
              </div>
              <div class="split-counts">
                <span><strong>{{ bucket.abiertos.toLocaleString('es-CO') }}</strong> activos</span>
                <span class="sep">·</span>
                <span class="overdue-txt">{{ bucket.vencidos.toLocaleString('es-CO') }} vencidos</span>
              </div>
            </div>
          </div>
        </article>

        <!-- Bloque 4: Punto de Equilibrio (Ingresos vs Cierres) por CTE -->
        <article class="coord-card compact-card">
          <header class="card-head">
            <div class="head-title-group">
              <Scale :size="15" class="icon-brand" />
              <h3>Equilibrio Operativo por CTE (Ingresos vs. Cierres)</h3>
            </div>
            <span class="head-badge">{{ data.cte_balance.length }} regiones</span>
          </header>

          <div class="mini-table-wrap">
            <table class="mini-table">
              <thead>
                <tr>
                  <th>Región / CTE</th>
                  <th>Trabajo Principal</th>
                  <th class="num">Ingresados</th>
                  <th class="num">Cerrados</th>
                  <th class="num">Tasa Cierre</th>
                  <th class="num">Abiertos</th>
                  <th class="num">Vencidos</th>
                  <th>Carga Equipo</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="row in data.cte_balance" :key="row.region">
                  <td class="region-cell">{{ row.region }}</td>
                  <td>
                    <span class="type-pill">{{ row.trabajo_principal || 'Mixto' }}</span>
                  </td>
                  <td class="num">{{ row.ingresados.toLocaleString('es-CO') }}</td>
                  <td class="num">{{ row.cerrados.toLocaleString('es-CO') }}</td>
                  <td class="num">
                    <span
                      class="rate-pill"
                      :class="row.tasa_cierre_pct >= 90 ? 'rate-ok' : row.tasa_cierre_pct >= 75 ? 'rate-warn' : 'rate-bad'"
                    >
                      {{ row.tasa_cierre_pct.toFixed(1) }}%
                    </span>
                  </td>
                  <td class="num">{{ row.abiertos.toLocaleString('es-CO') }}</td>
                  <td class="num overdue-txt">{{ row.vencidos.toLocaleString('es-CO') }}</td>
                  <td>
                    <div class="workload-cell" :title="`Carga estimada: ${row.carga_pct ?? 0}% respecto a su ritmo anual de cierres`">
                      <div class="workload-track">
                        <div
                          class="workload-fill"
                          :class="(row.carga_pct ?? 0) > 100 ? 'wl-bad' : (row.carga_pct ?? 0) >= 80 ? 'wl-warn' : 'wl-ok'"
                          :style="{ width: `${Math.min(100, row.carga_pct ?? 0)}%` }"
                        ></div>
                      </div>
                      <span
                        class="workload-pct"
                        :class="(row.carga_pct ?? 0) > 100 ? 'wl-txt-bad' : (row.carga_pct ?? 0) >= 80 ? 'wl-txt-warn' : 'wl-txt-ok'"
                      >
                        {{ row.carga_pct ?? 0 }}%
                      </span>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </article>
      </section>

      <!-- Fila Principal: 2 Columnas con scroll interno independiente -->
      <section class="coord-main-grid">
        <!-- Bloque 3: Armado de Rutas / Lotes por Corredor -->
        <article class="coord-card fill-card">
          <header class="card-head">
            <div class="head-title-group">
              <Route :size="15" class="icon-brand" />
              <h3>Lotes de Despacho por Corredor (Línea + Tipo)</h3>
            </div>
            <div class="head-actions">
              <div class="pill-filter">
                <button
                  class="pill-btn"
                  :class="{ active: batchFilter === 'all' }"
                  @click="batchFilter = 'all'"
                >
                  Todos ({{ data.corridor_batches.length }})
                </button>
                <button
                  class="pill-btn"
                  :class="{ active: batchFilter === 'campo' }"
                  @click="batchFilter = 'campo'"
                >
                  Campo
                </button>
                <button
                  class="pill-btn"
                  :class="{ active: batchFilter === 'predial' }"
                  @click="batchFilter = 'predial'"
                >
                  Predial
                </button>
              </div>
            </div>
          </header>

          <p class="card-subnote">
            Agrupa avisos abiertos (≥ 2) en la misma <strong>Línea</strong> y <strong>Tipo de aviso</strong> con dispersión espacial real (km) para optimizar movilización de cuadrillas.
          </p>

          <div class="scroll-list">
            <div v-if="filteredBatches.length === 0" class="empty-msg">
              No hay lotes con 2 o más avisos abiertos bajo el filtro actual.
            </div>
            <div
              v-for="batch in filteredBatches"
              :key="batch.id"
              class="batch-row"
              :class="{ selected: selectedBatch?.id === batch.id }"
              @click="selectedBatch = selectedBatch?.id === batch.id ? null : batch"
            >
              <div class="batch-main">
                <div class="batch-title-row">
                  <span class="batch-linea">{{ batch.linea }}</span>
                  <span class="batch-tipo-tag" :class="isPredial(batch.tipo) ? 'tag-predial' : 'tag-campo'">
                    {{ batch.tipo }}
                  </span>
                </div>
                <div class="batch-meta">
                  <span>{{ batch.cte }}</span>
                  <span class="sep">·</span>
                  <span>Mpio. base: {{ batch.municipio_principal }}</span>
                  <span class="sep">·</span>
                  <span>Dispersión: <strong>{{ batch.radio_km }} km</strong></span>
                </div>
              </div>
              <div class="batch-stats">
                <span class="stat-pill">{{ batch.abiertos }} activos</span>
                <span v-if="batch.vencidos > 0" class="stat-pill stat-danger">{{ batch.vencidos }} vencidos</span>
              </div>
            </div>
          </div>

          <footer v-if="selectedBatch" class="batch-detail-footer">
            <MapPin :size="14" class="icon-brand" />
            <span>
              <strong>{{ selectedBatch.linea }}</strong> ({{ selectedBatch.tipo }}):
              {{ selectedBatch.abiertos }} avisos concentrados en radio de {{ selectedBatch.radio_km }} km alrededor de {{ selectedBatch.municipio_principal }}.
              <template v-if="selectedBatch.center_lat !== null && selectedBatch.center_lon !== null">
                Centroide: {{ selectedBatch.center_lat.toFixed(4) }}, {{ selectedBatch.center_lon.toFixed(4) }}
              </template>
            </span>
          </footer>
        </article>

        <!-- Bloques 1 y 5: Radar Preventivo vs. Depuración de Mora Crónica -->
        <article class="coord-card fill-card">
          <header class="card-head">
            <div class="pill-filter full-tabs">
              <button
                class="pill-btn"
                :class="{ active: rightTab === 'preventive' }"
                @click="rightTab = 'preventive'"
              >
                <ShieldAlert :size="14" />
                <span>Radar Preventivo ({{ data.preventive_count }})</span>
              </button>
              <button
                class="pill-btn"
                :class="{ active: rightTab === 'chronic' }"
                @click="rightTab = 'chronic'"
              >
                <Archive :size="14" />
                <span>Mora Crónica &gt; 3 años ({{ data.chronic_count }})</span>
              </button>
            </div>
          </header>

          <!-- Subvista A: Radar Preventivo -->
          <template v-if="rightTab === 'preventive'">
            <p class="card-subnote">
              Avisos aún <strong>en plazo (Cumple Plazo)</strong> que ya consumieron <strong>≥ 70%</strong> de su SLA. Prioridad máxima para evitar nuevos vencimientos.
            </p>
            <div class="scroll-list">
              <div v-if="data.preventive_notices.length === 0" class="empty-msg">
                No hay avisos en plazo por encima del 70% de consumo de SLA en este filtro.
              </div>
              <div v-for="item in data.preventive_notices" :key="item.aviso" class="notice-row">
                <div class="notice-left">
                  <div class="notice-id-line">
                    <strong>#{{ item.aviso }}</strong>
                    <span class="prio-badge">{{ item.prioridad }}</span>
                    <span class="tipo-txt">{{ item.tipo }}</span>
                  </div>
                  <div class="notice-meta">
                    <span>{{ item.linea }}</span>
                    <span class="sep">·</span>
                    <span>{{ item.municipio }}</span>
                    <span class="sep">·</span>
                    <span>Torre {{ item.equipo }}</span>
                  </div>
                </div>
                <div class="notice-right">
                  <span class="days-left-badge" :class="item.dias_restantes <= 5 ? 'urgent' : 'warning'">
                    Quedan {{ item.dias_restantes }} d
                  </span>
                  <span class="sla-pct">{{ item.pct_consumido }}% SLA ({{ item.dias_abierto }}/{{ item.prioridad_dias }} d)</span>
                </div>
              </div>
            </div>
          </template>

          <!-- Subvista B: Depuración de Mora Crónica (> 3 años) -->
          <template v-else>
            <p class="card-subnote">
              Avisos abiertos con más de <strong>3 años (1.095 días)</strong> en mora ({{ data.chronic_pct_of_overdue.toFixed(1) }}% de los vencidos). Candidatos a auditoría de cierre administrativo o intervención.
            </p>
            <div class="scroll-list">
              <div v-if="data.chronic_notices.length === 0" class="empty-msg">
                No se registran avisos con mora crónica mayor a 3 años en este filtro.
              </div>
              <div v-for="item in data.chronic_notices" :key="item.aviso" class="notice-row">
                <div class="notice-left">
                  <div class="notice-id-line">
                    <strong>#{{ item.aviso }}</strong>
                    <span class="prio-badge">{{ item.prioridad }}</span>
                    <span class="tipo-txt">{{ item.tipo }}</span>
                  </div>
                  <div class="notice-meta">
                    <span>{{ item.linea }}</span>
                    <span class="sep">·</span>
                    <span>{{ item.municipio }} ({{ item.depto }})</span>
                    <span class="sep">·</span>
                    <span>Torre {{ item.equipo }} ({{ item.reincidencias_torre }} avisos)</span>
                  </div>
                </div>
                <div class="notice-right">
                  <span class="days-left-badge critical">
                    +{{ item.exceso_dias.toLocaleString('es-CO') }} d exceso
                  </span>
                  <span class="sla-pct">{{ (item.dias_abierto / 365).toFixed(1) }} años abierto</span>
                </div>
              </div>
            </div>
          </template>
        </article>
      </section>
    </template>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue';
import { Wrench, Scale, Route, MapPin, ShieldAlert, Archive } from 'lucide-vue-next';
import { apiService } from '../../services/api';
import type { CoordinatorWorkspaceResponse, CorridorBatchItem } from '../../types/models';

const props = defineProps<{
  cte?: string | null;
  depto?: string | null;
}>();

const loading = ref(false);
const error = ref<string | null>(null);
const data = ref<CoordinatorWorkspaceResponse | null>(null);
const batchFilter = ref<'all' | 'campo' | 'predial'>('all');
const rightTab = ref<'preventive' | 'chronic'>('preventive');
const selectedBatch = ref<CorridorBatchItem | null>(null);

const PREDIAL_KEYWORDS = ['PERMISO', 'CONSTRUCC', 'INVAS', 'EXPLANAC'];
function isPredial(tipo: string): boolean {
  const upper = tipo.toUpperCase();
  return PREDIAL_KEYWORDS.some((kw) => upper.includes(kw));
}

const filteredBatches = computed(() => {
  if (!data.value) return [];
  if (batchFilter.value === 'all') return data.value.corridor_batches;
  return data.value.corridor_batches.filter((b) =>
    batchFilter.value === 'predial' ? isPredial(b.tipo) : !isPredial(b.tipo)
  );
});

async function loadWorkspace() {
  loading.value = true;
  error.value = null;
  selectedBatch.value = null;
  try {
    data.value = await apiService.getCoordinatorWorkspace({
      cte: props.cte || null,
      depto: props.depto || null,
    });
  } catch (err) {
    error.value = 'No se pudo cargar el Centro del Coordinador.';
    console.error(err);
  } finally {
    loading.value = false;
  }
}

watch(
  () => [props.cte, props.depto],
  () => {
    loadWorkspace();
  }
);

onMounted(() => {
  loadWorkspace();
});
</script>

<style scoped>
.coord-workspace {
  display: flex;
  flex-direction: column;
  gap: 10px;
  height: 100%;
  min-height: 0;
  overflow: hidden;
}

.coord-state {
  display: flex;
  align-items: center;
  justify-content: center;
  flex: 1;
  background: var(--bg-card);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-md);
  color: var(--text-secondary);
  font-size: 0.9rem;
}

.coord-error {
  color: var(--color-danger, #dc2626);
}

.coord-top-grid {
  display: grid;
  grid-template-columns: 1fr 1.25fr;
  gap: 10px;
  flex-shrink: 0;
}

.coord-main-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
  flex: 1;
  min-height: 0;
  overflow: hidden;
}

.coord-card {
  display: flex;
  flex-direction: column;
  gap: 8px;
  background: var(--bg-card);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-md);
  padding: 10px 14px;
  min-height: 0;
}

.compact-card {
  justify-content: space-between;
}

.fill-card {
  height: 100%;
  overflow: hidden;
}

.card-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  flex-shrink: 0;
}

.head-title-group {
  display: flex;
  align-items: center;
  gap: 6px;
}

.head-title-group h3 {
  margin: 0;
  font-size: 0.86rem;
  font-weight: 700;
  color: var(--text-primary);
}

.icon-brand {
  color: var(--color-brand);
  flex-shrink: 0;
}

.head-badge {
  font-size: 0.74rem;
  font-weight: 600;
  padding: 2px 8px;
  border-radius: 999px;
  background: var(--bg-subtle);
  color: var(--text-secondary);
  border: 1px solid var(--border-subtle);
}

.split-bar-track {
  display: flex;
  height: 10px;
  width: 100%;
  border-radius: 999px;
  overflow: hidden;
  background: var(--bg-subtle);
}

.split-bar-fill {
  height: 100%;
  transition: width 0.25s ease;
}

.fill-campo {
  background: #0ea5e9;
}

.fill-predial {
  background: #f59e0b;
}

.split-metrics {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
}

.split-metric-box {
  background: var(--bg-subtle);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-sm);
  padding: 6px 10px;
}

.split-label-row {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 0.76rem;
  color: var(--text-secondary);
}

.split-name {
  flex: 1;
  font-weight: 600;
  color: var(--text-primary);
}

.split-pct {
  color: var(--text-primary);
}

.dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  flex-shrink: 0;
}

.dot-campo {
  background: #0ea5e9;
}

.dot-predial {
  background: #f59e0b;
}

.split-counts {
  margin-top: 2px;
  font-size: 0.75rem;
  color: var(--text-secondary);
}

.sep {
  margin: 0 4px;
  opacity: 0.5;
}

.overdue-txt {
  color: #dc2626;
  font-weight: 600;
}

.mini-table-wrap {
  max-height: 108px;
  overflow-y: auto;
}

.mini-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.75rem;
}

.mini-table th {
  position: sticky;
  top: 0;
  background: var(--bg-card);
  text-align: left;
  color: var(--text-secondary);
  font-weight: 600;
  padding: 3px 6px;
  border-bottom: 1px solid var(--border-subtle);
}

.mini-table td {
  padding: 3px 6px;
  border-bottom: 1px solid var(--border-subtle);
  color: var(--text-primary);
}

.mini-table th.num,
.mini-table td.num {
  text-align: right;
  font-variant-numeric: tabular-nums;
}

.region-cell {
  font-weight: 600;
}

.rate-pill {
  display: inline-block;
  padding: 1px 6px;
  border-radius: 999px;
  font-weight: 700;
  font-size: 0.7rem;
}

.rate-ok {
  background: rgba(16, 185, 129, 0.14);
  color: #059669;
}

.rate-warn {
  background: rgba(245, 158, 11, 0.16);
  color: #d97706;
}

.rate-bad {
  background: rgba(239, 68, 68, 0.14);
  color: #dc2626;
}

.pill-filter {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  background: var(--bg-subtle);
  padding: 2px;
  border-radius: var(--radius-sm);
  border: 1px solid var(--border-subtle);
}

.full-tabs {
  width: 100%;
}

.full-tabs .pill-btn {
  flex: 1;
  justify-content: center;
}

.pill-btn {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  border: none;
  background: transparent;
  color: var(--text-secondary);
  font-size: 0.76rem;
  font-weight: 600;
  padding: 4px 10px;
  border-radius: var(--radius-sm);
  cursor: pointer;
  transition: all 0.15s ease;
}

.pill-btn.active {
  background: var(--bg-card);
  color: var(--color-brand);
  box-shadow: var(--shadow-sm);
}

.card-subnote {
  margin: 0;
  font-size: 0.74rem;
  color: var(--text-secondary);
  line-height: 1.35;
  flex-shrink: 0;
}

.scroll-list {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding-right: 4px;
}

.empty-msg {
  padding: 20px;
  text-align: center;
  color: var(--text-secondary);
  font-size: 0.8rem;
}

.batch-row,
.notice-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  padding: 7px 10px;
  background: var(--bg-subtle);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-sm);
}

.batch-row {
  cursor: pointer;
  transition: border-color 0.15s ease;
}

.batch-row:hover,
.batch-row.selected {
  border-color: var(--color-brand);
}

.batch-main,
.notice-left {
  min-width: 0;
  flex: 1;
}

.batch-title-row,
.notice-id-line {
  display: flex;
  align-items: center;
  gap: 6px;
  flex-wrap: wrap;
}

.batch-linea {
  font-size: 0.8rem;
  font-weight: 700;
  color: var(--text-primary);
}

.batch-tipo-tag {
  font-size: 0.68rem;
  font-weight: 700;
  padding: 1px 6px;
  border-radius: 4px;
}

.tag-campo {
  background: rgba(14, 165, 233, 0.15);
  color: #0284c7;
}

.tag-predial {
  background: rgba(245, 158, 11, 0.15);
  color: #d97706;
}

.batch-meta,
.notice-meta {
  font-size: 0.72rem;
  color: var(--text-secondary);
  margin-top: 2px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.batch-stats,
.notice-right {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 2px;
  flex-shrink: 0;
}

.stat-pill {
  font-size: 0.72rem;
  font-weight: 700;
  padding: 2px 7px;
  border-radius: 999px;
  background: var(--bg-card);
  color: var(--text-primary);
  border: 1px solid var(--border-subtle);
}

.stat-danger {
  background: rgba(239, 68, 68, 0.12);
  color: #dc2626;
  border-color: rgba(239, 68, 68, 0.28);
}

.prio-badge {
  font-size: 0.68rem;
  font-weight: 700;
  padding: 1px 5px;
  border-radius: 4px;
  background: var(--bg-card);
  border: 1px solid var(--border-subtle);
  color: var(--text-secondary);
}

.tipo-txt {
  font-size: 0.73rem;
  color: var(--text-secondary);
  font-weight: 600;
}

.days-left-badge {
  font-size: 0.72rem;
  font-weight: 700;
  padding: 2px 7px;
  border-radius: 999px;
}

.days-left-badge.warning {
  background: rgba(245, 158, 11, 0.16);
  color: #d97706;
}

.days-left-badge.urgent,
.days-left-badge.critical {
  background: rgba(239, 68, 68, 0.15);
  color: #dc2626;
}

.sla-pct {
  font-size: 0.69rem;
  color: var(--text-secondary);
}

.batch-detail-footer {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 10px;
  background: rgba(14, 165, 233, 0.08);
  border: 1px solid rgba(14, 165, 233, 0.25);
  border-radius: var(--radius-sm);
  font-size: 0.74rem;
  color: var(--text-primary);
  flex-shrink: 0;
}

.type-pill {
  display: inline-block;
  padding: 0.15rem 0.45rem;
  border-radius: 999px;
  font-size: 0.72rem;
  font-weight: 600;
  background: var(--bg-soft, #f1f5f9);
  color: var(--text-secondary, #475569);
  border: 1px solid var(--border-subtle, #e2e8f0);
  white-space: nowrap;
}

.workload-cell {
  display: flex;
  align-items: center;
  gap: 0.45rem;
  min-width: 96px;
}

.workload-track {
  flex: 1;
  height: 6px;
  border-radius: 999px;
  background: var(--bg-soft, #e2e8f0);
  overflow: hidden;
}

.workload-fill {
  height: 100%;
  border-radius: 999px;
  transition: width 0.25s ease;
}

.wl-ok { background: #10b981; }
.wl-warn { background: #f59e0b; }
.wl-bad { background: #e11d48; }

.workload-pct {
  font-size: 0.75rem;
  font-weight: 700;
  font-variant-numeric: tabular-nums;
  min-width: 34px;
  text-align: right;
}

.wl-txt-ok { color: #059669; }
.wl-txt-warn { color: #d97706; }
.wl-txt-bad { color: #e11d48; }

@media (max-width: 1024px) {
  .coord-workspace,
  .coord-main-grid {
    height: auto;
    overflow: visible;
  }
  .coord-top-grid,
  .coord-main-grid {
    grid-template-columns: 1fr;
  }
  .scroll-list {
    max-height: 320px;
  }
}
</style>


<script setup lang="ts">
import { ref, computed } from 'vue';
import type { TicketItem } from '../../types/models';
import { PRIO_COLORS } from '../../constants/themeTokens';

const props = defineProps<{
  tickets: TicketItem[];
  totalMatches: number;
}>();

const searchTerm = ref('');
const statusFilter = ref<'todos' | 'vencidos' | 'abiertos'>('todos');
const currentPage = ref(1);
const pageSize = ref(10);

const filteredTickets = computed(() => {
  let list = props.tickets;
  if (statusFilter.value === 'vencidos') {
    list = list.filter((t) => t.estado_aviso === 'Abierto' && t.cumplimiento !== 'Cumple Plazo');
  } else if (statusFilter.value === 'abiertos') {
    list = list.filter((t) => t.estado_aviso === 'Abierto');
  }

  if (!searchTerm.value.trim()) {
    return list;
  }
  const term = searchTerm.value.toLowerCase();
  return list.filter(
    (t) =>
      t.numero_aviso.toLowerCase().includes(term) ||
      t.departamento.toLowerCase().includes(term) ||
      t.municipio.toLowerCase().includes(term) ||
      (t.sector || '').toLowerCase().includes(term) ||
      t.tipo_aviso.toLowerCase().includes(term) ||
      t.equipo.toLowerCase().includes(term)
  );
});

const totalPages = computed(() => Math.ceil(filteredTickets.value.length / pageSize.value) || 1);

const paginatedTickets = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value;
  return filteredTickets.value.slice(start, start + pageSize.value);
});

function setStatusFilter(mode: 'todos' | 'vencidos' | 'abiertos') {
  statusFilter.value = mode;
  currentPage.value = 1;
}

function prevPage() {
  if (currentPage.value > 1) currentPage.value--;
}

function nextPage() {
  if (currentPage.value < totalPages.value) currentPage.value++;
}
</script>

<template>
  <div class="table-card card">
    <div class="table-header">
      <div>
        <h3 class="table-title">Auditoría y Detalle de Avisos Operativos</h3>
        <p class="table-subtitle">
          Mostrando {{ filteredTickets.length }} en vista de {{ totalMatches.toLocaleString() }} avisos coincidentes
        </p>
      </div>
      <div class="table-actions">
        <div class="filter-tabs">
          <button
            class="tab-btn"
            :class="{ active: statusFilter === 'todos' }"
            @click="setStatusFilter('todos')"
          >
            Todos
          </button>
          <button
            class="tab-btn"
            :class="{ active: statusFilter === 'abiertos' }"
            @click="setStatusFilter('abiertos')"
          >
            Abiertos
          </button>
          <button
            class="tab-btn danger"
            :class="{ active: statusFilter === 'vencidos' }"
            @click="setStatusFilter('vencidos')"
          >
            Abiertos Vencidos
          </button>
        </div>

        <input
          v-model="searchTerm"
          type="text"
          class="form-input search-input"
          placeholder="Buscar por municipio, sector, tipo o aviso..."
        />
      </div>
    </div>

    <div class="table-responsive">
      <table class="tickets-table">
        <thead>
          <tr>
            <th>Nº Aviso</th>
            <th>Fecha Ingreso</th>
            <th>Equipo</th>
            <th>Departamento</th>
            <th>Municipio / Sector</th>
            <th>Tipo de Aviso</th>
            <th>Plazo Prioridad</th>
            <th>Estado Operativo</th>
            <th>Cumplimiento SLA</th>
            <th class="text-right">Duración</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="t in paginatedTickets" :key="t.numero_aviso">
            <td class="font-mono font-bold">{{ t.numero_aviso }}</td>
            <td>{{ t.fecha_aviso }}</td>
            <td class="font-mono">{{ t.equipo }}</td>
            <td>{{ t.departamento }}</td>
            <td>
              <b>{{ t.municipio }}</b>
              <small v-if="t.sector && t.sector !== 'General'" class="sector-sub"> · {{ t.sector }}</small>
            </td>
            <td>
              <span class="type-pill">{{ t.tipo_aviso }}</span>
            </td>
            <td>
              <span class="priority-pill">
                <span
                  class="prio-dot"
                  :style="{ backgroundColor: PRIO_COLORS[t.prioridad] || '#64748B' }"
                ></span>
                {{ t.prioridad }}
              </span>
            </td>
            <td>
              <span
                :class="[
                  'state-pill',
                  t.estado_aviso === 'Abierto' ? 'state-open' : 'state-closed',
                ]"
              >
                {{ t.estado_aviso || 'Cerrado' }}
              </span>
            </td>
            <td>
              <span
                :class="[
                  'status-badge',
                  t.cumplimiento === 'Cumple Plazo' ? 'status-cumple' : 'status-excede',
                ]"
              >
                {{ t.cumplimiento === 'Cumple Plazo' ? '✓ A Tiempo' : '⚠ Atrasado' }}
              </span>
            </td>
            <td class="text-right font-mono">{{ t.dias_abierto }} d</td>
          </tr>
          <tr v-if="paginatedTickets.length === 0">
            <td colspan="10" class="empty-state">
              No se encontraron avisos para los criterios seleccionados.
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Pagination -->
    <div class="table-footer">
      <div class="pagination-info">
        Página {{ currentPage }} de {{ totalPages }}
      </div>
      <div class="pagination-controls">
        <button class="btn btn-secondary btn-sm" :disabled="currentPage === 1" @click="prevPage">
          Anterior
        </button>
        <button class="btn btn-secondary btn-sm" :disabled="currentPage >= totalPages" @click="nextPage">
          Siguiente
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.table-card {
  padding: 0;
  overflow: hidden;
}

.table-header {
  padding: 18px 20px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  border-bottom: 1px solid var(--border-subtle);
  flex-wrap: wrap;
  gap: 12px;
}

.table-title {
  font-size: 1.05rem;
  font-weight: 700;
  color: var(--text-primary);
}

.table-subtitle {
  font-size: 0.8rem;
  color: var(--text-muted);
}

.table-actions {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}

.filter-tabs {
  display: inline-flex;
  background: var(--bg-subtle);
  padding: 3px;
  border-radius: var(--radius-md);
  border: 1px solid var(--border-subtle);
  gap: 4px;
}

.tab-btn {
  border: none;
  background: transparent;
  color: var(--text-secondary);
  font-size: 0.76rem;
  font-weight: 600;
  padding: 5px 10px;
  border-radius: var(--radius-sm);
  cursor: pointer;
  transition: all var(--transition-fast);
}

.tab-btn.active {
  background: var(--bg-card);
  color: var(--text-primary);
  box-shadow: var(--shadow-sm);
  font-weight: 700;
}

.tab-btn.danger.active {
  background: var(--sla-danger-bg);
  color: var(--sla-danger);
}

.search-input {
  width: 270px;
}

.table-responsive {
  width: 100%;
  overflow-x: auto;
}

.tickets-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.84rem;
  text-align: left;
}

.tickets-table th {
  background: var(--bg-table-header);
  color: var(--text-secondary);
  font-weight: 700;
  padding: 12px 14px;
  border-bottom: 1px solid var(--border-subtle);
  white-space: nowrap;
  font-size: 0.76rem;
  text-transform: uppercase;
  letter-spacing: 0.3px;
}

.tickets-table td {
  padding: 11px 14px;
  border-bottom: 1px solid var(--border-subtle);
  color: var(--text-primary);
}

.tickets-table tr:hover td {
  background-color: var(--bg-table-hover);
}

.font-mono {
  font-family: var(--font-family-mono);
  font-size: 0.8rem;
}

.sector-sub {
  color: var(--text-muted);
  font-size: 0.75rem;
}

.type-pill {
  display: inline-block;
  padding: 2px 8px;
  border-radius: var(--radius-sm);
  background: var(--bg-subtle);
  border: 1px solid var(--border-subtle);
  font-weight: 600;
  font-size: 0.76rem;
}

.priority-pill {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-weight: 600;
  font-size: 0.78rem;
  color: var(--text-secondary);
}

.prio-dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
}

.state-pill {
  display: inline-flex;
  align-items: center;
  padding: 2px 8px;
  border-radius: var(--radius-sm);
  font-size: 0.74rem;
  font-weight: 700;
}

.state-open {
  background: var(--sla-info-bg);
  color: var(--sla-info);
  border: 1px solid var(--sla-info-border);
}

.state-closed {
  background: var(--bg-subtle);
  color: var(--text-secondary);
}

.status-badge {
  display: inline-flex;
  align-items: center;
  padding: 3px 8px;
  border-radius: var(--radius-full);
  font-size: 0.74rem;
  font-weight: 700;
}

.status-cumple {
  background: var(--sla-success-bg);
  color: var(--sla-success);
  border: 1px solid var(--sla-success-border);
}

.status-excede {
  background: var(--sla-danger-bg);
  color: var(--sla-danger);
  border: 1px solid var(--sla-danger-border);
}

.text-right {
  text-align: right;
}

.empty-state {
  text-align: center;
  padding: 32px !important;
  color: var(--text-muted);
}

.table-footer {
  padding: 12px 20px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  border-top: 1px solid var(--border-subtle);
  background: var(--bg-table-stripe);
}

.pagination-info {
  font-size: 0.82rem;
  color: var(--text-secondary);
}

.pagination-controls {
  display: flex;
  gap: 8px;
}
</style>

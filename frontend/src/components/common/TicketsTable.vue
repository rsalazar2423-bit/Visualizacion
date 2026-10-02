<script setup lang="ts">
import { ref, computed } from 'vue';
import type { TicketItem } from '../../types/models';

const props = defineProps<{
  tickets: TicketItem[];
  totalMatches: number;
}>();

const searchTerm = ref('');
const currentPage = ref(1);
const pageSize = ref(10);

const filteredTickets = computed(() => {
  if (!searchTerm.value.trim()) {
    return props.tickets;
  }
  const term = searchTerm.value.toLowerCase();
  return props.tickets.filter(
    (t) =>
      t.numero_aviso.toLowerCase().includes(term) ||
      t.departamento.toLowerCase().includes(term) ||
      t.municipio.toLowerCase().includes(term) ||
      t.tipo_aviso.toLowerCase().includes(term) ||
      t.equipo.toLowerCase().includes(term)
  );
});

const totalPages = computed(() => Math.ceil(filteredTickets.value.length / pageSize.value) || 1);

const paginatedTickets = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value;
  return filteredTickets.value.slice(start, start + pageSize.value);
});

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
        <h3 class="table-title">Auditoría y Detalle de Tickets</h3>
        <p class="table-subtitle">
          Mostrando {{ filteredTickets.length }} de {{ totalMatches.toLocaleString() }} tickets registrados
        </p>
      </div>
      <div class="table-actions">
        <input
          v-model="searchTerm"
          type="text"
          class="form-input search-input"
          placeholder="🔍 Buscar por ciudad, tipo o equipo..."
        />
      </div>
    </div>

    <div class="table-responsive">
      <table class="tickets-table">
        <thead>
          <tr>
            <th>Nº Aviso</th>
            <th>Fecha</th>
            <th>Equipo</th>
            <th>Departamento</th>
            <th>Municipio</th>
            <th>Tipo de Aviso</th>
            <th>Prioridad</th>
            <th>Estado SLA</th>
            <th>Días Abierto</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="t in paginatedTickets" :key="t.numero_aviso">
            <td class="font-mono font-bold">{{ t.numero_aviso }}</td>
            <td>{{ t.fecha_aviso }}</td>
            <td class="font-mono">{{ t.equipo }}</td>
            <td>{{ t.departamento }}</td>
            <td><b>{{ t.municipio }}</b></td>
            <td>
              <span class="type-pill">{{ t.tipo_aviso }}</span>
            </td>
            <td>
              <span :class="['priority-pill', t.prioridad.toLowerCase().replace(' ', '-')]">
                {{ t.prioridad }}
              </span>
            </td>
            <td>
              <span
                :class="[
                  'status-badge',
                  t.cumplimiento === 'Cumple Plazo' ? 'status-cumple' : 'status-excede',
                ]"
              >
                {{ t.cumplimiento === 'Cumple Plazo' ? '✓ Cumple' : '⚠ Excede' }}
              </span>
            </td>
            <td class="text-right">{{ t.dias_abierto }} d</td>
          </tr>
          <tr v-if="paginatedTickets.length === 0">
            <td colspan="9" class="empty-state">
              No se encontraron tickets para los criterios seleccionados.
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

.search-input {
  width: 280px;
}

.table-responsive {
  width: 100%;
  overflow-x: auto;
}

.tickets-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.85rem;
  text-align: left;
}

.tickets-table th {
  background: var(--bg-table-header);
  color: var(--text-secondary);
  font-weight: 700;
  padding: 12px 16px;
  border-bottom: 1px solid var(--border-subtle);
  white-space: nowrap;
}

.tickets-table td {
  padding: 12px 16px;
  border-bottom: 1px solid var(--border-subtle);
  color: var(--text-primary);
}

.tickets-table tr:hover td {
  background-color: var(--bg-table-hover);
}

.font-mono {
  font-family: var(--font-family-mono);
  font-size: 0.82rem;
}

.type-pill {
  display: inline-block;
  padding: 2px 8px;
  border-radius: var(--radius-sm);
  background: var(--bg-table-stripe);
  font-weight: 600;
  font-size: 0.78rem;
}

.priority-pill {
  font-weight: 700;
  font-size: 0.78rem;
}

.priority-pill.muy-alta { color: #E11D48; }
.priority-pill.alta { color: #EA580C; }
.priority-pill.media { color: #D97706; }
.priority-pill.baja { color: #10B981; }

.status-badge {
  display: inline-flex;
  align-items: center;
  padding: 3px 8px;
  border-radius: var(--radius-full);
  font-size: 0.75rem;
  font-weight: 700;
}

.status-cumple {
  background: rgba(16, 185, 129, 0.15);
  color: #0D9763;
}

.status-excede {
  background: rgba(225, 29, 72, 0.15);
  color: #E11D48;
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

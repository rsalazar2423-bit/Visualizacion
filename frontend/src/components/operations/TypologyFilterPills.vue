<script setup lang="ts">
import { Zap, Lightbulb, Globe, Check, X } from 'lucide-vue-next';
import { useOperationsStore } from '../../stores/operationsStore';

const opsStore = useOperationsStore();
</script>

<template>
  <section class="quick-filter-section card">
    <div class="quick-filter-header">
      <div class="quick-filter-title-group">
        <span class="quick-filter-title">
          <Zap :size="15" /> Selección Rápida por Tipología:
        </span>
        <span
          v-if="opsStore.selectedTipos.length > 0"
          class="badge badge-selection"
        >
          {{ opsStore.selectedTipos.length }} seleccionadas (combinadas)
        </span>
      </div>

      <div class="quick-filter-meta">
        <span class="quick-filter-hint">
          <Lightbulb :size="13" /> Selecciona o combina múltiples tipologías para enfocar los indicadores.
        </span>
        <button
          v-if="opsStore.selectedTipos.length > 0"
          class="btn-clear-selection"
          @click="opsStore.toggleTipo('Todos')"
        >
          Ver Todas <X :size="12" />
        </button>
      </div>
    </div>

    <div class="quick-filter-pills">
      <button
        class="pill-btn pill-all"
        :class="{ active: opsStore.selectedTipos.length === 0 }"
        @click="opsStore.toggleTipo('Todos')"
      >
        <Globe :size="14" />
        <span>Ver Todos los Tipos</span>
      </button>

      <button
        v-for="item in (opsStore.data?.tipos_catalogo || opsStore.data?.donut || [])"
        :key="item.name"
        class="pill-btn"
        :class="{
          active: opsStore.isTipoSelected(item.name),
          dimmed: opsStore.selectedTipos.length > 0 && !opsStore.isTipoSelected(item.name)
        }"
        :style="opsStore.isTipoSelected(item.name) ? { borderColor: item.color, boxShadow: `0 0 10px ${item.color}33` } : {}"
        @click="opsStore.toggleTipo(item.name)"
      >
        <span
          v-if="opsStore.isTipoSelected(item.name)"
          class="pill-check"
          :style="{ backgroundColor: item.color }"
        >
          <Check :size="10" />
        </span>
        <span
          v-else
          class="pill-dot"
          :style="{ backgroundColor: item.color }"
        ></span>
        <b>{{ item.name }}</b>
        <span class="pill-count">({{ item.value.toLocaleString() }})</span>
      </button>
    </div>
  </section>
</template>

<style scoped>
.quick-filter-section {
  padding: 16px 20px;
  display: flex;
  flex-direction: column;
  gap: 12px;
  border-left: 4px solid var(--color-emerald);
}

.quick-filter-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}

.quick-filter-title-group {
  display: flex;
  align-items: center;
  gap: 10px;
}

.quick-filter-title {
  font-size: 0.88rem;
  font-weight: 700;
  color: var(--text-primary);
}

.badge-selection {
  background: rgba(16, 185, 129, 0.2);
  color: var(--color-emerald);
  border: 1px solid var(--color-emerald);
  font-size: 0.75rem;
  font-weight: 700;
  padding: 2px 8px;
  border-radius: 12px;
}

.quick-filter-meta {
  display: flex;
  align-items: center;
  gap: 12px;
}

.quick-filter-hint {
  font-size: 0.78rem;
  color: var(--text-secondary);
}

.btn-clear-selection {
  background: transparent;
  border: 1px solid var(--border-subtle);
  color: var(--text-secondary);
  font-size: 0.75rem;
  padding: 3px 8px;
  border-radius: 6px;
  cursor: pointer;
  transition: all var(--transition-fast);
}

.btn-clear-selection:hover {
  background: rgba(239, 68, 68, 0.15);
  border-color: #EF4444;
  color: #EF4444;
}

.quick-filter-pills {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}

.pill-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  background: var(--bg-card);
  border: 1px solid var(--border-subtle);
  color: var(--text-secondary);
  font-size: 0.82rem;
  font-weight: 600;
  padding: 7px 14px;
  border-radius: 20px;
  cursor: pointer;
  transition: all var(--transition-fast);
  user-select: none;
}

.pill-btn:hover {
  border-color: var(--color-emerald);
  color: var(--text-primary);
  transform: translateY(-1px);
}

.pill-btn.active {
  background: rgba(16, 185, 129, 0.12);
  border-color: var(--color-emerald);
  color: var(--text-primary);
  font-weight: 700;
}

.pill-btn.dimmed {
  opacity: 0.65;
}

.pill-btn.dimmed:hover {
  opacity: 1;
}

.pill-check {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 15px;
  height: 15px;
  border-radius: 50%;
  color: #ffffff;
  font-size: 0.65rem;
  font-weight: 900;
  line-height: 1;
}

.pill-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  display: inline-block;
}

.pill-count {
  font-size: 0.76rem;
  opacity: 0.85;
}
</style>

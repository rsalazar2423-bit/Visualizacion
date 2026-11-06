<script setup lang="ts">
import { ref } from 'vue';
import { Maximize2 } from 'lucide-vue-next';
import ChartModal from './ChartModal.vue';

defineProps<{
  title: string;
  subtitle?: string;
}>();

const isExpanded = ref(false);

function openModal() {
  isExpanded.value = true;
}

function closeModal() {
  isExpanded.value = false;
}
</script>

<template>
  <div class="expandable-chart-card card">
    <div class="expandable-header">
      <div class="title-wrap">
        <h3 class="expandable-title">{{ title }}</h3>
        <p v-if="subtitle" class="expandable-subtitle">{{ subtitle }}</p>
      </div>

      <button
        class="btn-expand-icon"
        title="Ampliar gráfica a pantalla completa"
        aria-label="Ampliar gráfica"
        @click="openModal"
      >
        <Maximize2 :size="13" />
        <span>Ampliar</span>
      </button>
    </div>

    <!-- Contenido normal (pantalla estándar) -->
    <div class="expandable-body">
      <slot />
    </div>

    <!-- Modal a Pantalla Completa (Teleport body) -->
    <ChartModal
      :is-open="isExpanded"
      :title="title"
      :subtitle="subtitle"
      @close="closeModal"
    >
      <div class="modal-slot-content">
        <slot name="expanded">
          <slot />
        </slot>
      </div>
    </ChartModal>
  </div>
</template>

<style scoped>
.expandable-chart-card {
  display: flex;
  flex-direction: column;
  min-height: 0;
  height: 100%;
  overflow: hidden;
}

.expandable-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 8px 14px 6px;
  border-bottom: 1px solid var(--border-subtle);
  flex-shrink: 0;
}

.title-wrap {
  flex: 1;
  min-width: 0;
}

.expandable-title {
  margin: 0;
  font-size: 0.9rem;
  font-weight: 700;
  color: var(--text-primary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.expandable-subtitle {
  margin: 2px 0 0;
  font-size: 0.75rem;
  color: var(--text-secondary);
}

.btn-expand-icon {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 4px 8px;
  background: var(--bg-subtle);
  color: var(--text-secondary);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-sm);
  font-size: 0.75rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.15s ease;
  flex-shrink: 0;
}

.btn-expand-icon:hover {
  background: var(--bg-hover);
  color: var(--color-brand);
  border-color: var(--color-brand);
}

.expandable-body {
  flex: 1;
  min-height: 0;
  padding: 6px 10px;
  display: flex;
  flex-direction: column;
}

.modal-slot-content {
  width: 100%;
  height: 100%;
  min-height: 520px;
  display: flex;
  flex-direction: column;
}
</style>


<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount, nextTick } from 'vue';
import { Maximize2, Minimize2, X } from 'lucide-vue-next';

defineProps<{
  title: string;
  subtitle?: string;
}>();

const isFullscreen = ref(false);

function toggleFullscreen() {
  isFullscreen.value = !isFullscreen.value;
  nextTick(() => {
    window.dispatchEvent(new Event('resize'));
  });
}

function onKeyDown(e: KeyboardEvent) {
  if (e.key === 'Escape' && isFullscreen.value) {
    isFullscreen.value = false;
    nextTick(() => {
      window.dispatchEvent(new Event('resize'));
    });
  }
}

onMounted(() => {
  window.addEventListener('keydown', onKeyDown);
});

onBeforeUnmount(() => {
  window.removeEventListener('keydown', onKeyDown);
});
</script>

<template>
  <div class="expandable-chart-card card" :class="{ 'is-fullscreen': isFullscreen }">
    <div class="expandable-header">
      <div class="title-wrap">
        <h3 class="expandable-title">{{ title }}</h3>
        <p v-if="subtitle" class="expandable-subtitle">{{ subtitle }}</p>
      </div>

      <button
        class="btn-expand-icon"
        :class="{ active: isFullscreen }"
        :title="isFullscreen ? 'Restaurar tamaño normal (Esc)' : 'Ampliar gráfica a pantalla completa'"
        :aria-label="isFullscreen ? 'Cerrar pantalla completa' : 'Ampliar gráfica'"
        @click="toggleFullscreen"
      >
        <component :is="isFullscreen ? Minimize2 : Maximize2" :size="13" />
        <span>{{ isFullscreen ? 'Cerrar Pantalla Completa' : 'Ampliar' }}</span>
        <X v-if="isFullscreen" :size="13" />
      </button>
    </div>

    <!-- Contenido normal que se expande a toda la pantalla sin duplicar DOM ni perder estado de gráficas -->
    <div class="expandable-body">
      <slot />
    </div>
  </div>
</template>

<style scoped>
.expandable-chart-card {
  display: flex;
  flex-direction: column;
  min-height: 0;
  height: 100%;
  overflow: hidden;
  transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
}

.expandable-chart-card.is-fullscreen {
  position: fixed !important;
  inset: 0 !important;
  width: 100vw !important;
  height: 100vh !important;
  max-width: 100vw !important;
  max-height: 100vh !important;
  z-index: 9999 !important;
  border-radius: 0 !important;
  margin: 0 !important;
  padding: 16px 24px 20px !important;
  box-shadow: none !important;
  background: var(--bg-card) !important;
}

.expandable-chart-card.is-fullscreen .expandable-header {
  padding-bottom: 12px;
  border-bottom: 1px solid var(--border-subtle);
}

.expandable-chart-card.is-fullscreen .expandable-title {
  font-size: 1.25rem;
}

.expandable-chart-card.is-fullscreen .expandable-subtitle {
  font-size: 0.85rem;
}

.expandable-chart-card.is-fullscreen .expandable-body {
  height: calc(100vh - 75px) !important;
  flex: 1;
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
  color: #1D4ED8;
  border-color: #1D4ED8;
}

.btn-expand-icon.active {
  background: rgba(29, 78, 216, 0.1);
  color: #1D4ED8;
  border-color: #1D4ED8;
}

[data-theme="dark"] .btn-expand-icon.active {
  background: rgba(56, 189, 248, 0.15);
  color: #38BDF8;
  border-color: #38BDF8;
}

.expandable-body {
  flex: 1;
  min-height: 0;
  padding: 6px 10px;
  display: flex;
  flex-direction: column;
}
</style>

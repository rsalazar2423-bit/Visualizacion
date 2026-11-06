<script setup lang="ts">
import { onMounted, onBeforeUnmount } from 'vue';
import { X, Minimize2 } from 'lucide-vue-next';

const props = defineProps<{
  isOpen: boolean;
  title: string;
  subtitle?: string;
}>();

const emit = defineEmits<{
  (e: 'close'): void;
}>();

function onKeyDown(e: KeyboardEvent) {
  if (e.key === 'Escape' && props.isOpen) {
    emit('close');
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
  <Teleport to="body">
    <Transition name="modal-fade">
      <div v-if="isOpen" class="chart-modal-backdrop" @click.self="emit('close')">
        <div class="chart-modal-dialog card" role="dialog" aria-modal="true">
          <div class="modal-header">
            <div>
              <h3 class="modal-title">{{ title }}</h3>
              <p v-if="subtitle" class="modal-subtitle">{{ subtitle }}</p>
            </div>
            <button
              class="modal-close-btn"
              title="Cerrar ampliación (Esc)"
              aria-label="Cerrar"
              @click="emit('close')"
            >
              <Minimize2 :size="16" />
              <span>Cerrar</span>
              <X :size="16" />
            </button>
          </div>

          <div class="modal-body">
            <slot />
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.chart-modal-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(11, 15, 25, 0.78);
  backdrop-filter: blur(8px);
  z-index: 2000;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
}

.chart-modal-dialog {
  width: 95vw;
  max-width: 1400px;
  height: 90vh;
  max-height: 900px;
  background: var(--bg-card);
  border: 1px solid var(--border-strong);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-lg);
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 24px;
  border-bottom: 1px solid var(--border-subtle);
  background: var(--bg-subtle);
  gap: 16px;
}

.modal-title {
  font-size: 1.25rem;
  font-weight: 800;
  color: var(--text-primary);
  margin: 0;
}

.modal-subtitle {
  font-size: 0.82rem;
  color: var(--text-secondary);
  margin: 2px 0 0;
}

.modal-close-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 7px 14px;
  border-radius: var(--radius-md);
  background: var(--bg-card);
  border: 1px solid var(--border-subtle);
  color: var(--text-primary);
  font-size: 0.82rem;
  font-weight: 600;
  cursor: pointer;
  transition: all var(--transition-fast);
}

.modal-close-btn:hover {
  background: var(--color-brand-soft);
  border-color: var(--color-brand);
  color: var(--color-brand);
}

.modal-body {
  flex: 1;
  padding: 20px;
  overflow: auto;
  display: flex;
  flex-direction: column;
}

.modal-fade-enter-active,
.modal-fade-leave-active {
  transition: opacity 0.2s ease, transform 0.2s ease;
}

.modal-fade-enter-from,
.modal-fade-leave-to {
  opacity: 0;
  transform: scale(0.98);
}
</style>

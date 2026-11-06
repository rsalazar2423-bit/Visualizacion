<script setup lang="ts">
import { ShieldAlert } from 'lucide-vue-next';
import type { DeprecatedColor } from '../../constants/designSystemCatalog';

defineProps<{
  colors: DeprecatedColor[];
}>();
</script>

<template>
  <section class="step-section">
    <div class="step-title-bar">
      <span class="badge badge-step">AUDITORÍA</span>
      <b>Colores Eliminados del Proyecto Anterior (No Permitidos)</b>
    </div>

    <div class="card deprecated-card">
      <div class="dep-header">
        <ShieldAlert :size="18" class="dep-icon" />
        <span>
          Estos colores fueron <b>retirados del código</b> porque saturaban la vista, carecían de significado estadístico o incumplían el contraste mínimo WCAG AA:
        </span>
      </div>

      <div class="dep-grid">
        <div v-for="d in colors" :key="d.hex" class="dep-item">
          <div class="dep-swatch" :style="{ backgroundColor: d.hex }">
            <span class="strike-line"></span>
            <code>{{ d.hex }}</code>
          </div>
          <div class="dep-text">
            <b>{{ d.name }}</b>
            <p>{{ d.reason }}</p>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

<style scoped>
.deprecated-card {
  border-left: 4px solid var(--sla-danger);
}

.dep-header {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 0.88rem;
  color: var(--text-primary);
  margin-bottom: 16px;
}

.dep-icon {
  color: var(--sla-danger);
  flex-shrink: 0;
}

.dep-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
}

.dep-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px;
  border-radius: var(--radius-sm);
  background: var(--bg-subtle);
  border: 1px solid var(--border-subtle);
}

.dep-swatch {
  width: 58px;
  height: 46px;
  border-radius: var(--radius-sm);
  display: flex;
  align-items: center;
  justify-content: center;
  color: #FFFFFF;
  font-size: 0.68rem;
  font-weight: 800;
  position: relative;
  flex-shrink: 0;
  overflow: hidden;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.7);
}

.strike-line {
  position: absolute;
  width: 140%;
  height: 2px;
  background: #DC2626;
  transform: rotate(-35deg);
}

.dep-text b {
  font-size: 0.8rem;
  color: var(--text-primary);
  display: block;
}

.dep-text p {
  font-size: 0.74rem;
  color: var(--text-secondary);
  line-height: 1.35;
}

@media (max-width: 1024px) {
  .dep-grid {
    grid-template-columns: 1fr;
  }
}
</style>


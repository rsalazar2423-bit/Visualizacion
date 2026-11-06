<script setup lang="ts">
import type { CategoricalToken } from '../../constants/designSystemCatalog';

defineProps<{
  tokens: CategoricalToken[];
  onCopy: (val: string) => void;
}>();
</script>

<template>
  <section class="step-section">
    <div class="step-title-bar">
      <span class="badge badge-step">NORMA 02</span>
      <b>Paleta Categórica Permitida (Tipos de Aviso — Sin Colisión con SLA)</b>
    </div>

    <div class="card">
      <p class="chart-reseña" style="margin-bottom: 16px;">
        Ninguna tipología de aviso utiliza el verde esmeralda de "Cumple Plazo" ni el rojo carmesí de "Excede Plazo". Se emplean 6 tonos de igual peso perceptual calibrados para ambos temas.
      </p>

      <div class="cat-grid">
        <div v-for="cat in tokens" :key="cat.category" class="cat-card">
          <div class="cat-dual-preview">
            <div class="cat-half" :style="{ backgroundColor: cat.light }" @click="onCopy(cat.light)">
              <span>☀️ {{ cat.light }}</span>
            </div>
            <div class="cat-half" :style="{ backgroundColor: cat.dark }" @click="onCopy(cat.dark)">
              <span>🌙 {{ cat.dark }}</span>
            </div>
          </div>
          <div class="cat-body">
            <div class="cat-head">
              <b>{{ cat.category }}</b>
              <code>{{ cat.token }}</code>
            </div>
            <p class="cat-desc">{{ cat.rationale }}</p>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

<style scoped>
.cat-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
}

.cat-card {
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-md);
  overflow: hidden;
  background: var(--bg-subtle);
}

.cat-dual-preview {
  display: grid;
  grid-template-columns: 1fr 1fr;
  height: 54px;
}

.cat-half {
  display: flex;
  align-items: center;
  justify-content: center;
  color: #FFFFFF;
  font-family: var(--font-family-mono);
  font-size: 0.75rem;
  font-weight: 700;
  cursor: pointer;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.5);
}

.cat-body {
  padding: 12px 14px;
}

.cat-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 6px;
  font-size: 0.9rem;
  color: var(--text-primary);
}

.cat-head code {
  font-size: 0.74rem;
  color: var(--color-brand);
}

.cat-desc {
  font-size: 0.78rem;
  color: var(--text-secondary);
  line-height: 1.45;
}

@media (max-width: 1024px) {
  .cat-grid {
    grid-template-columns: 1fr;
  }
}
</style>


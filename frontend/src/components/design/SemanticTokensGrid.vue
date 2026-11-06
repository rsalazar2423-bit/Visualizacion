<script setup lang="ts">
import { CheckCircle2, XCircle, Copy, Check } from 'lucide-vue-next';
import type { SemanticToken } from '../../constants/designSystemCatalog';

defineProps<{
  tokens: SemanticToken[];
  copiedToken: string | null;
  onCopy: (val: string) => void;
}>();
</script>

<template>
  <section class="step-section">
    <div class="step-title-bar">
      <span class="badge badge-step">NORMA 01</span>
      <b>Colores Semánticos Permitidos (Exclusivos para Estado SLA y Alertas)</b>
    </div>

    <div class="grid-2">
      <div v-for="item in tokens" :key="item.token" class="card sem-card">
        <div class="sem-swatches">
          <div
            class="swatch-box"
            :style="{ backgroundColor: item.light }"
            title="Clic para copiar HEX Claro"
            @click="onCopy(item.light)"
          >
            <span class="swatch-tag">☀️ Claro</span>
            <span class="swatch-hex">{{ item.light }}</span>
          </div>
          <div
            class="swatch-box"
            :style="{ backgroundColor: item.dark }"
            title="Clic para copiar HEX Oscuro"
            @click="onCopy(item.dark)"
          >
            <span class="swatch-tag">🌙 Oscuro</span>
            <span class="swatch-hex">{{ item.dark }}</span>
          </div>
        </div>

        <div class="sem-info">
          <div class="sem-title-row">
            <h3 class="sem-name">{{ item.label }}</h3>
            <button class="token-copy-btn" @click="onCopy(item.token)">
              <code>{{ item.token }}</code>
              <Check v-if="copiedToken === item.token" :size="12" />
              <Copy v-else :size="12" />
            </button>
          </div>

          <div class="rule-line allowed">
            <CheckCircle2 :size="14" class="rule-icon" />
            <span><b>Uso permitido:</b> {{ item.allowed }}</span>
          </div>
          <div class="rule-line forbidden">
            <XCircle :size="14" class="rule-icon" />
            <span><b>Restricción:</b> {{ item.forbidden }}</span>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

<style scoped>
.sem-card {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.sem-swatches {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
}

.swatch-box {
  height: 68px;
  border-radius: var(--radius-md);
  padding: 10px 12px;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  color: #FFFFFF;
  cursor: pointer;
  box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.2);
  transition: transform var(--transition-fast);
}

.swatch-box:hover {
  transform: scale(1.02);
}

.swatch-tag {
  font-size: 0.7rem;
  font-weight: 700;
  opacity: 0.92;
}

.swatch-hex {
  font-family: var(--font-family-mono);
  font-size: 0.84rem;
  font-weight: 800;
}

.sem-info {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.sem-title-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}

.sem-name {
  font-size: 1.02rem;
  font-weight: 800;
  color: var(--text-primary);
}

.token-copy-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  background: var(--bg-subtle);
  border: 1px solid var(--border-subtle);
  color: var(--text-primary);
  padding: 3px 8px;
  border-radius: var(--radius-sm);
  font-size: 0.76rem;
  cursor: pointer;
}

.token-copy-btn:hover {
  border-color: var(--color-brand);
}

.rule-line {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  font-size: 0.8rem;
  line-height: 1.45;
  padding: 6px 10px;
  border-radius: var(--radius-sm);
}

.rule-line.allowed {
  background: var(--sla-success-bg);
  color: var(--text-primary);
}

.rule-line.allowed .rule-icon {
  color: var(--sla-success);
  flex-shrink: 0;
  margin-top: 2px;
}

.rule-line.forbidden {
  background: var(--sla-danger-bg);
  color: var(--text-primary);
}

.rule-line.forbidden .rule-icon {
  color: var(--sla-danger);
  flex-shrink: 0;
  margin-top: 2px;
}
</style>


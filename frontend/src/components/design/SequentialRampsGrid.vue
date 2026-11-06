<script setup lang="ts">
import { Layers } from 'lucide-vue-next';

defineProps<{
  deptoPaletteLight: readonly string[];
  deptoPaletteDark: readonly string[];
  prioOrder: readonly string[];
  prioColors: Record<string, string>;
  onCopy: (val: string) => void;
}>();
</script>

<template>
  <section class="step-section">
    <div class="step-title-bar">
      <span class="badge badge-step">NORMA 03</span>
      <b>Escalas Secuenciales para Territorios y Plazos (Reemplazo del Arcoíris)</b>
    </div>

    <div class="grid-2">
      <!-- Rampa Territorial -->
      <div class="card">
        <h3 class="card-title" style="margin-bottom: 6px;">
          <Layers :size="16" /> Rampa Secuencial de Concentración Territorial
        </h3>
        <p class="card-subtitle" style="margin-bottom: 14px;">
          Ordena departamentos y municipios de mayor a menor volumen de avisos usando una progresión continua Teal ➔ Azul Acero ➔ Pizarra.
        </p>

        <div class="ramp-label">☀️ Tema Claro</div>
        <div class="ramp-strip">
          <div
            v-for="(hex, idx) in deptoPaletteLight"
            :key="'l-' + idx"
            class="ramp-cell"
            :style="{ backgroundColor: hex }"
            :title="`Nivel ${idx + 1}: ${hex}`"
            @click="onCopy(hex)"
          >
            <span>{{ idx + 1 }}</span>
          </div>
        </div>

        <div class="ramp-label" style="margin-top: 12px;">🌙 Tema Oscuro</div>
        <div class="ramp-strip">
          <div
            v-for="(hex, idx) in deptoPaletteDark"
            :key="'d-' + idx"
            class="ramp-cell"
            :style="{ backgroundColor: hex }"
            :title="`Nivel ${idx + 1}: ${hex}`"
            @click="onCopy(hex)"
          >
            <span>{{ idx + 1 }}</span>
          </div>
        </div>
      </div>

      <!-- Rampa de Horizontes de Prioridad -->
      <div class="card">
        <h3 class="card-title" style="margin-bottom: 6px;">
          <Layers :size="16" /> Rampa de Horizontes de Plazo (Prioridades)
        </h3>
        <p class="card-subtitle" style="margin-bottom: 14px;">
          Codifica la urgencia temporal desde plazos inmediatos (Semana / Mes en azul profundo) hasta plazos de largo aliento (Seis años en pizarra neutro).
        </p>

        <div class="prio-ramp-list">
          <div
            v-for="prio in prioOrder"
            :key="prio"
            class="prio-ramp-item"
            @click="onCopy(prioColors[prio])"
          >
            <span class="prio-swatch" :style="{ backgroundColor: prioColors[prio] }"></span>
            <span class="prio-name">{{ prio }}</span>
            <code class="prio-hex">{{ prioColors[prio] }}</code>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

<style scoped>
.ramp-label {
  font-size: 0.76rem;
  font-weight: 700;
  color: var(--text-secondary);
  margin-bottom: 6px;
}

.ramp-strip {
  display: grid;
  grid-template-columns: repeat(12, 1fr);
  height: 44px;
  border-radius: var(--radius-sm);
  overflow: hidden;
  border: 1px solid var(--border-subtle);
}

.ramp-cell {
  display: flex;
  align-items: center;
  justify-content: center;
  color: #FFFFFF;
  font-size: 0.7rem;
  font-weight: 700;
  cursor: pointer;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.6);
}

.prio-ramp-list {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 8px;
}

.prio-ramp-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 10px;
  background: var(--bg-subtle);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-sm);
  cursor: pointer;
}

.prio-swatch {
  width: 14px;
  height: 14px;
  border-radius: 4px;
  flex-shrink: 0;
}

.prio-name {
  font-size: 0.78rem;
  font-weight: 700;
  color: var(--text-primary);
  flex: 1;
}

.prio-hex {
  font-size: 0.7rem;
  color: var(--text-muted);
}

@media (max-width: 1024px) {
  .prio-ramp-list {
    grid-template-columns: 1fr;
  }
}
</style>


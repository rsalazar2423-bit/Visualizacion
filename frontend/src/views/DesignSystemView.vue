<script setup lang="ts">
import { ref } from 'vue';
import { Palette, Sun, Moon } from 'lucide-vue-next';
import { useThemeStore } from '../stores/themeStore';
import {
  DEPTO_PALETTE,
  getSequentialTerritoryPalette,
  PRIO_ORDER,
  PRIO_COLORS,
} from '../constants/themeTokens';
import {
  SURFACE_TOKENS,
  SEMANTIC_TOKENS,
  CATEGORICAL_TOKENS,
  DEPRECATED_COLORS,
} from '../constants/designSystemCatalog';
import SemanticTokensGrid from '../components/design/SemanticTokensGrid.vue';
import CategoricalTokensGrid from '../components/design/CategoricalTokensGrid.vue';
import SequentialRampsGrid from '../components/design/SequentialRampsGrid.vue';
import SurfaceTokensTable from '../components/design/SurfaceTokensTable.vue';
import DeprecatedColorsPanel from '../components/design/DeprecatedColorsPanel.vue';

const themeStore = useThemeStore();
const copiedToken = ref<string | null>(null);

function copyValue(val: string) {
  navigator.clipboard?.writeText(val);
  copiedToken.value = val;
  setTimeout(() => {
    if (copiedToken.value === val) copiedToken.value = null;
  }, 1600);
}
</script>

<template>
  <div class="design-system-view">
    <!-- Encabezado y Conmutador en Vivo -->
    <header class="ds-hero card">
      <div class="ds-hero-top">
        <div>
          <span class="badge">
            <Palette :size="13" /> Gobernanza Visual & Arquitectura Cromática
          </span>
          <h1 class="ds-title">Sistema de Diseño y Paleta Oficial de Colores Permitidos</h1>
          <p class="ds-subtitle">
            Manual normativo de color para <b>EcoGrid DEC</b>. Aplica la regla <b>60-30-10</b> y el principio de <b>Separación Semántica Estricta</b> para garantizar legibilidad ejecutiva en Tema Claro y Tema Oscuro.
          </p>
        </div>

        <button class="btn ds-theme-btn" @click="themeStore.toggleTheme">
          <Moon v-if="themeStore.isDark" :size="16" />
          <Sun v-else :size="16" />
          <span>Probar en {{ themeStore.isDark ? 'Tema Claro' : 'Tema Oscuro' }}</span>
        </button>
      </div>

      <!-- Regla 60-30-10 -->
      <div class="rule-proportion-bar">
        <div class="prop-segment prop-60">
          <b>60% Superficies Neutras</b>
          <span>Fondos Pizarra / Blanco / Obsidiana (Cero ruido visual)</span>
        </div>
        <div class="prop-segment prop-30">
          <b>30% Estructura y Datos Base</b>
          <span>Escalas secuenciales Teal / Cobalto / Índigo</span>
        </div>
        <div class="prop-segment prop-10">
          <b>10% Semántico SLA</b>
          <span>Éxito / Riesgo / Vencido</span>
        </div>
      </div>
    </header>

    <!-- SECCIÓN 1: PALETA SEMÁNTICA ESTRICTA (SLA) -->
    <SemanticTokensGrid
      :tokens="SEMANTIC_TOKENS"
      :copied-token="copiedToken"
      :on-copy="copyValue"
    />

    <!-- SECCIÓN 2: PALETA CATEGÓRICA ARMÓNICA (TIPOS DE AVISO) -->
    <CategoricalTokensGrid
      :tokens="CATEGORICAL_TOKENS"
      :on-copy="copyValue"
    />

    <!-- SECCIÓN 3: ESCALAS SECUENCIALES (TERRITORIOS Y PLAZOS) -->
    <SequentialRampsGrid
      :depto-palette-light="DEPTO_PALETTE"
      :depto-palette-dark="getSequentialTerritoryPalette(true)"
      :prio-order="PRIO_ORDER"
      :prio-colors="PRIO_COLORS"
      :on-copy="copyValue"
    />

    <!-- SECCIÓN 4: SUPERFICIES Y TOKENS DE TEMA CLARO / OSCURO -->
    <SurfaceTokensTable
      :tokens="SURFACE_TOKENS"
      :on-copy="copyValue"
    />

    <!-- SECCIÓN 5: COLORES DESCARTADOS / PROHIBIDOS -->
    <DeprecatedColorsPanel
      :colors="DEPRECATED_COLORS"
    />
  </div>
</template>

<style scoped>
.design-system-view {
  display: flex;
  flex-direction: column;
  gap: 28px;
}

.ds-hero {
  display: flex;
  flex-direction: column;
  gap: 20px;
  padding: 28px;
}

.ds-hero-top {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 20px;
  flex-wrap: wrap;
}

.ds-title {
  font-size: 1.85rem;
  font-weight: 800;
  color: var(--text-primary);
  margin: 10px 0 6px;
  letter-spacing: -0.4px;
}

.ds-subtitle {
  font-size: 0.95rem;
  color: var(--text-secondary);
  max-width: 820px;
  line-height: 1.55;
}

.ds-theme-btn {
  white-space: nowrap;
}

.rule-proportion-bar {
  display: grid;
  grid-template-columns: 6fr 3fr 1.5fr;
  border-radius: var(--radius-md);
  overflow: hidden;
  border: 1px solid var(--border-strong);
}

.prop-segment {
  padding: 12px 16px;
  display: flex;
  flex-direction: column;
  gap: 2px;
  font-size: 0.78rem;
}

.prop-segment b {
  font-size: 0.85rem;
}

.prop-60 {
  background: var(--bg-subtle);
  color: var(--text-primary);
}

.prop-30 {
  background: #0F766E;
  color: #FFFFFF;
}

.prop-10 {
  background: #DC2626;
  color: #FFFFFF;
}

@media (max-width: 1024px) {
  .rule-proportion-bar {
    grid-template-columns: 1fr;
  }
}
</style>

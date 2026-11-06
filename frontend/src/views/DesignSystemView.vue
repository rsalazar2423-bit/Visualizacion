<script setup lang="ts">
import { ref } from 'vue';
import { Palette, Sun, Moon, AlertTriangle, AlertOctagon } from 'lucide-vue-next';
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
  DEPRECATED_COLORS,
} from '../constants/designSystemCatalog';
import SemanticTokensGrid from '../components/design/SemanticTokensGrid.vue';
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
            <Palette :size="13" /> Gobernanza Oficial de Color
          </span>
          <h1 class="ds-title">Paleta de Colores Únicos Permitidos en EcoGrid</h1>
          <p class="ds-subtitle">
            Regla de oro: <b>ÚNICAMENTE se permiten la Rampa Base (Teal ➔ Azul ➔ Pizarra) + 1 ROJO de Alerta + 1 NARANJA de Advertencia.</b> Todos los demás colores están prohibidos y eliminados del sistema.
          </p>
        </div>

        <button class="btn ds-theme-btn" @click="themeStore.toggleTheme">
          <Moon v-if="themeStore.isDark" :size="16" />
          <Sun v-else :size="16" />
          <span>Ver en {{ themeStore.isDark ? 'Tema Claro' : 'Tema Oscuro' }}</span>
        </button>
      </div>

      <!-- Resumen Visual de los Únicos Colores Permitidos -->
      <div class="palette-audit-summary card">
        <h3 class="audit-title">Elenco Cromático Oficial Cerrado (8 Tonos Totales)</h3>
        <div class="official-palette-strip">
          <!-- Rampa Base: 6 Tonos -->
          <div class="swatch-group">
            <span class="group-title">Rampa Base (Datos / Jerarquías / Tipologías)</span>
            <div class="swatch-row">
              <div
                v-for="(hex, idx) in (themeStore.isDark ? getSequentialTerritoryPalette(true) : DEPTO_PALETTE)"
                :key="idx"
                class="swatch-cell"
                :style="{ backgroundColor: hex }"
                :title="`Rampa ${idx + 1}: ${hex}`"
                @click="copyValue(hex)"
              >
                <span>{{ idx + 1 }}</span>
                <code>{{ hex }}</code>
              </div>
            </div>
          </div>

          <!-- Rojo de Alerta -->
          <div class="swatch-group alert-group">
            <span class="group-title">Rojo (Alerta Crítica / Vencidos)</span>
            <div
              class="swatch-cell single-alert danger"
              :style="{ backgroundColor: themeStore.isDark ? '#EF4444' : '#DC2626' }"
              @click="copyValue(themeStore.isDark ? '#EF4444' : '#DC2626')"
            >
              <AlertOctagon :size="16" />
              <span>ROJO ÚNICO</span>
              <code>{{ themeStore.isDark ? '#EF4444' : '#DC2626' }}</code>
            </div>
          </div>

          <!-- Naranja de Advertencia -->
          <div class="swatch-group alert-group">
            <span class="group-title">Naranja (Advertencia / Retraso)</span>
            <div
              class="swatch-cell single-alert warning"
              :style="{ backgroundColor: themeStore.isDark ? '#F97316' : '#EA580C' }"
              @click="copyValue(themeStore.isDark ? '#F97316' : '#EA580C')"
            >
              <AlertTriangle :size="16" />
              <span>NARANJA ÚNICO</span>
              <code>{{ themeStore.isDark ? '#F97316' : '#EA580C' }}</code>
            </div>
          </div>
        </div>
      </div>
    </header>

    <!-- SECCIÓN 1: RAMPA INSTITUCIONAL (LA BASE DE DATOS Y JERARQUÍAS) -->
    <SequentialRampsGrid
      :depto-palette-light="DEPTO_PALETTE"
      :depto-palette-dark="getSequentialTerritoryPalette(true)"
      :prio-order="PRIO_ORDER"
      :prio-colors="PRIO_COLORS"
      :on-copy="copyValue"
    />

    <!-- SECCIÓN 2: SEÑALÉTICA EXCLUSIVA (ROJO Y NARANJA) -->
    <SemanticTokensGrid
      :tokens="SEMANTIC_TOKENS"
      :copied-token="copiedToken"
      :on-copy="copyValue"
    />

    <!-- SECCIÓN 3: SUPERFICIES Y FONDOS NEUTROS -->
    <SurfaceTokensTable
      :tokens="SURFACE_TOKENS"
      :on-copy="copyValue"
    />

    <!-- SECCIÓN 4: COLORES PROHIBIDOS / DESCARTADOS (AUDITORÍA) -->
    <DeprecatedColorsPanel
      :colors="DEPRECATED_COLORS"
    />
  </div>
</template>

<style scoped>
.design-system-view {
  display: flex;
  flex-direction: column;
  gap: 16px;
  height: 100%;
  overflow-y: auto;
  padding-bottom: 24px;
}

.ds-hero {
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding: 22px;
}

.ds-hero-top {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  flex-wrap: wrap;
}

.ds-title {
  font-size: 1.65rem;
  font-weight: 800;
  color: var(--text-primary);
  margin: 6px 0 4px;
}

.ds-subtitle {
  font-size: 0.92rem;
  color: var(--text-secondary);
  margin: 0;
}

.palette-audit-summary {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 16px;
  background: var(--bg-subtle);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-md);
}

.audit-title {
  margin: 0;
  font-size: 0.95rem;
  font-weight: 800;
  color: var(--text-primary);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.official-palette-strip {
  display: grid;
  grid-template-columns: 2fr 1fr 1fr;
  gap: 14px;
}

.swatch-group {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.group-title {
  font-size: 0.75rem;
  font-weight: 700;
  color: var(--text-secondary);
  text-transform: uppercase;
}

.swatch-row {
  display: grid;
  grid-template-columns: repeat(6, 1fr);
  gap: 6px;
}

.swatch-cell {
  height: 64px;
  border-radius: var(--radius-sm);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 2px;
  color: #FFFFFF;
  cursor: pointer;
  transition: transform 0.15s ease;
  font-size: 0.8rem;
  font-weight: 700;
  text-shadow: 0 1px 2px rgba(0,0,0,0.4);
}

.swatch-cell:hover {
  transform: translateY(-2px);
}

.swatch-cell code {
  font-size: 0.68rem;
  opacity: 0.9;
  background: rgba(0,0,0,0.25);
  padding: 1px 4px;
  border-radius: 3px;
}

.single-alert {
  height: 64px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}

@media (max-width: 960px) {
  .official-palette-strip {
    grid-template-columns: 1fr;
  }
}
</style>

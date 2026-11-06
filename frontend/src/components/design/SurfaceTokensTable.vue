<script setup lang="ts">
import type { SurfaceToken } from '../../constants/designSystemCatalog';

defineProps<{
  tokens: SurfaceToken[];
  onCopy: (val: string) => void;
}>();
</script>

<template>
  <section class="step-section">
    <div class="step-title-bar">
      <span class="badge badge-step">NORMA 04</span>
      <b>Matriz de Superficies y Tipografía (Tema Claro vs. Tema Oscuro)</b>
    </div>

    <div class="card table-wrapper-ds">
      <table class="ds-table">
        <thead>
          <tr>
            <th>Componente / Token</th>
            <th>Variable CSS</th>
            <th>☀️ Tema Claro</th>
            <th>🌙 Tema Oscuro</th>
            <th>Función Arquitectónica</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="s in tokens" :key="s.token">
            <td><b>{{ s.name }}</b></td>
            <td>
              <button class="token-copy-btn" @click="onCopy(s.token)">
                <code>{{ s.token }}</code>
              </button>
            </td>
            <td>
              <span class="inline-color-chip" @click="onCopy(s.light)">
                <span class="chip-circle" :style="{ backgroundColor: s.light }"></span>
                <code>{{ s.light }}</code>
              </span>
            </td>
            <td>
              <span class="inline-color-chip" @click="onCopy(s.dark)">
                <span class="chip-circle" :style="{ backgroundColor: s.dark }"></span>
                <code>{{ s.dark }}</code>
              </span>
            </td>
            <td class="role-cell">{{ s.role }}</td>
          </tr>
        </tbody>
      </table>
    </div>
  </section>
</template>

<style scoped>
.table-wrapper-ds {
  padding: 0;
  overflow-x: auto;
}

.ds-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.84rem;
  text-align: left;
}

.ds-table th {
  background: var(--bg-table-header);
  color: var(--text-secondary);
  padding: 12px 16px;
  font-size: 0.75rem;
  text-transform: uppercase;
  border-bottom: 1px solid var(--border-subtle);
}

.ds-table td {
  padding: 12px 16px;
  border-bottom: 1px solid var(--border-subtle);
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

.inline-color-chip {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
}

.chip-circle {
  width: 16px;
  height: 16px;
  border-radius: 50%;
  border: 1px solid var(--border-strong);
}

.role-cell {
  color: var(--text-secondary);
  font-size: 0.8rem;
}
</style>


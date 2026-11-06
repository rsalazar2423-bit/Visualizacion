<script setup lang="ts">
import { Play, Pause, RotateCcw } from 'lucide-vue-next';

defineProps<{
  isPlaying: boolean;
  timeMode: 'all' | 'cumulative' | 'single';
  selectedYear: number;
  availableYears: readonly number[];
}>();

defineEmits<{
  (e: 'toggle-play'): void;
  (e: 'reset-timeline'): void;
  (e: 'set-mode', mode: 'all' | 'cumulative' | 'single'): void;
  (e: 'select-year', yr: number): void;
  (e: 'slider-input', yr: number): void;
}>();
</script>

<template>
  <div class="timeline-bar">
    <div class="timeline-controls">
      <button class="btn-play" :class="{ playing: isPlaying }" @click="$emit('toggle-play')">
        <Pause v-if="isPlaying" :size="15" />
        <Play v-else :size="15" />
        <span>{{ isPlaying ? 'Pausar' : 'Reproducir Historia' }}</span>
      </button>

      <button class="btn-reset-tl" title="Restablecer línea de tiempo" @click="$emit('reset-timeline')">
        <RotateCcw :size="14" />
      </button>

      <div class="mode-switch">
        <button
          class="mode-chip"
          :class="{ active: timeMode === 'cumulative' }"
          @click="$emit('set-mode', 'cumulative')"
        >
          Acumulado hasta {{ selectedYear }}
        </button>
        <button
          class="mode-chip"
          :class="{ active: timeMode === 'single' }"
          @click="$emit('set-mode', 'single')"
        >
          Solo Año {{ selectedYear }}
        </button>
        <button
          class="mode-chip"
          :class="{ active: timeMode === 'all' }"
          @click="$emit('set-mode', 'all')"
        >
          Todo (2008–2023)
        </button>
      </div>
    </div>

    <div class="timeline-slider-box" :class="{ disabled: timeMode === 'all' }">
      <input
        :value="selectedYear"
        type="range"
        :min="availableYears[0] || 2008"
        :max="availableYears[availableYears.length - 1] || 2023"
        step="1"
        class="year-slider"
        @input="$emit('slider-input', Number(($event.target as HTMLInputElement).value))"
      />
      <div class="year-ticks">
        <button
          v-for="yr in availableYears"
          :key="yr"
          class="year-tick-btn"
          :class="{ active: timeMode !== 'all' && selectedYear === yr }"
          @click="$emit('select-year', yr)"
        >
          {{ yr }}
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.timeline-bar {
  display: flex;
  flex-direction: column;
  gap: 10px;
  background: var(--bg-subtle);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-md);
  padding: 12px 16px;
}

.timeline-controls {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  flex-wrap: wrap;
}

.btn-play {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  padding: 7px 16px;
  border-radius: var(--radius-full);
  background: var(--color-brand);
  color: #FFFFFF;
  font-size: 0.8rem;
  font-weight: 700;
  border: none;
  cursor: pointer;
  transition: all var(--transition-fast);
}

[data-theme="dark"] .btn-play {
  color: #0B0F19;
}

.btn-play.playing {
  background: var(--sla-warning);
  color: #FFFFFF;
}

.btn-reset-tl {
  background: var(--bg-card);
  border: 1px solid var(--border-subtle);
  color: var(--text-secondary);
  padding: 7px;
  border-radius: 50%;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.btn-reset-tl:hover {
  color: var(--text-primary);
  border-color: var(--color-brand);
}

.mode-switch {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
}

.mode-chip {
  background: var(--bg-card);
  border: 1px solid var(--border-subtle);
  color: var(--text-secondary);
  font-size: 0.75rem;
  font-weight: 600;
  padding: 5px 10px;
  border-radius: var(--radius-sm);
  cursor: pointer;
}

.mode-chip.active {
  background: var(--color-brand-soft);
  border-color: var(--color-brand);
  color: var(--color-brand);
  font-weight: 700;
}

.timeline-slider-box {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.timeline-slider-box.disabled {
  opacity: 0.5;
}

.year-slider {
  width: 100%;
  accent-color: var(--color-brand);
  cursor: pointer;
}

.year-ticks {
  display: flex;
  justify-content: space-between;
  gap: 2px;
}

.year-tick-btn {
  background: transparent;
  border: none;
  font-size: 0.68rem;
  font-weight: 600;
  color: var(--text-muted);
  cursor: pointer;
  padding: 2px 4px;
  border-radius: var(--radius-sm);
}

.year-tick-btn:hover {
  color: var(--color-brand);
}

.year-tick-btn.active {
  color: var(--color-brand);
  font-weight: 800;
  background: var(--color-brand-soft);
}
</style>


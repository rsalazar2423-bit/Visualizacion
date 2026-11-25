<script setup lang="ts">
import { onMounted, onUnmounted } from 'vue';
import { Sparkles, ChevronLeft, ChevronRight, X, CheckCircle2 } from 'lucide-vue-next';
import { useStoryStore, STORY_STEPS } from '../../stores/storyStore';

const story = useStoryStore();

function onKeydown(e: KeyboardEvent) {
  if (!story.isActive) return;
  if (e.key === 'Escape') story.close();
  else if (e.key === 'ArrowRight') story.next();
  else if (e.key === 'ArrowLeft') story.prev();
}

onMounted(() => window.addEventListener('keydown', onKeydown));
onUnmounted(() => window.removeEventListener('keydown', onKeydown));
</script>

<template>
  <transition name="story-slide">
    <aside v-if="story.isActive" class="story-dock" role="dialog" aria-label="Recorrido guiado del tablero">
      <div class="story-header">
        <div class="story-act">
          <Sparkles :size="13" class="act-ico" />
          <span>{{ story.currentStep.act }}</span>
        </div>
        <div class="story-header-right">
          <span class="step-counter">{{ story.currentIndex + 1 }} / {{ story.totalSteps }}</span>
          <button class="btn-close-story" title="Cerrar recorrido (Esc)" @click="story.close">
            <X :size="14" />
          </button>
        </div>
      </div>

      <h4 class="story-title">{{ story.currentStep.title }}</h4>
      <p class="story-body">{{ story.currentStep.narrative }}</p>
      <div class="story-takeaway">
        <CheckCircle2 :size="13" class="takeaway-ico" />
        <span>{{ story.currentStep.takeaway }}</span>
      </div>

      <footer class="story-footer">
        <div class="step-dots">
          <button
            v-for="(s, idx) in STORY_STEPS"
            :key="s.id"
            class="dot-btn"
            :class="{ active: idx === story.currentIndex }"
            :title="s.act"
            @click="story.goTo(idx)"
          />
        </div>

        <div class="story-actions">
          <button class="btn-nav" :disabled="story.currentIndex === 0" @click="story.prev">
            <ChevronLeft :size="14" />
            <span>Anterior</span>
          </button>
          <button class="btn-nav primary" @click="story.next">
            <span>{{ story.currentIndex === story.totalSteps - 1 ? 'Finalizar' : 'Siguiente' }}</span>
            <ChevronRight v-if="story.currentIndex < story.totalSteps - 1" :size="14" />
          </button>
        </div>
      </footer>
    </aside>
  </transition>
</template>

<style scoped>
.story-dock {
  position: fixed;
  right: 18px;
  bottom: 18px;
  z-index: 90;
  width: min(440px, calc(100vw - 24px));
  background: var(--bg-card);
  border: 1px solid var(--border-strong);
  border-top: 3px solid var(--color-brand);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-lg);
  padding: 14px 16px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.story-header { display: flex; justify-content: space-between; align-items: center; gap: 8px; }
.story-act { display: inline-flex; align-items: center; gap: 5px; font-size: 0.71rem; font-weight: 800; text-transform: uppercase; letter-spacing: 0.04em; color: var(--color-brand); }
.act-ico { flex-shrink: 0; }
.story-header-right { display: flex; align-items: center; gap: 8px; }
.step-counter { font-size: 0.72rem; font-weight: 700; color: var(--text-secondary); }
.btn-close-story { border: none; background: var(--bg-subtle); color: var(--text-secondary); width: 24px; height: 24px; border-radius: 50%; display: grid; place-items: center; cursor: pointer; }
.btn-close-story:hover { color: var(--text-primary); }

.story-title { margin: 0; font-size: 0.96rem; font-weight: 800; color: var(--text-primary); }
.story-body { margin: 0; font-size: 0.79rem; line-height: 1.45; color: var(--text-secondary); }
.story-takeaway {
  display: flex; align-items: flex-start; gap: 6px; font-size: 0.75rem; font-weight: 600; color: var(--text-primary);
  background: var(--color-brand-soft); border-radius: var(--radius-sm); padding: 7px 10px; line-height: 1.35;
}
.takeaway-ico { color: var(--color-brand); flex-shrink: 0; margin-top: 2px; }

.story-footer { display: flex; justify-content: space-between; align-items: center; gap: 10px; margin-top: 2px; }
.step-dots { display: flex; align-items: center; gap: 5px; }
.dot-btn { width: 8px; height: 8px; border-radius: 50%; border: none; background: var(--border-strong); cursor: pointer; padding: 0; transition: all 0.15s ease; }
.dot-btn.active { width: 18px; border-radius: 999px; background: var(--color-brand); }

.story-actions { display: flex; align-items: center; gap: 6px; }
.btn-nav {
  display: inline-flex; align-items: center; gap: 4px; height: 30px; padding: 0 11px;
  border-radius: var(--radius-sm); border: 1px solid var(--border-subtle); background: var(--bg-subtle);
  color: var(--text-primary); font-size: 0.75rem; font-weight: 700; cursor: pointer;
}
.btn-nav:disabled { opacity: 0.4; cursor: not-allowed; }
.btn-nav.primary { background: var(--color-brand); border-color: var(--color-brand); color: #ffffff; }

.story-slide-enter-active, .story-slide-leave-active { transition: opacity 0.2s ease, transform 0.2s ease; }
.story-slide-enter-from, .story-slide-leave-to { opacity: 0; transform: translateY(12px); }
</style>

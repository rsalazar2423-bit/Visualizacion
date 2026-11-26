<script setup lang="ts">
import { ref, computed, watch, nextTick, onMounted, onUnmounted } from 'vue';
import { Sparkles, ChevronLeft, ChevronRight, X, MousePointerClick, GripHorizontal } from 'lucide-vue-next';
import { useStoryStore, STORY_STEPS } from '../../stores/storyStore';

const story = useStoryStore();
const spotRect = ref<{ top: number; left: number; width: number; height: number } | null>(null);
const dockPos = ref<{ x: number; y: number } | null>(null);
const dockRef = ref<HTMLElement | null>(null);
let dragOffset = { x: 0, y: 0 };
let isDragging = false;
let retryTimer: number | null = null;

const dockStyle = computed(() =>
  dockPos.value
    ? { left: `${dockPos.value.x}px`, top: `${dockPos.value.y}px`, right: 'auto', bottom: 'auto' }
    : {},
);

function startDrag(e: PointerEvent) {
  if ((e.target as HTMLElement)?.closest('button') || !dockRef.value) return;
  const r = dockRef.value.getBoundingClientRect();
  isDragging = true;
  dragOffset = { x: e.clientX - r.left, y: e.clientY - r.top };
  window.addEventListener('pointermove', onDrag);
  window.addEventListener('pointerup', stopDrag);
}

function onDrag(e: PointerEvent) {
  if (!isDragging || !dockRef.value) return;
  const r = dockRef.value.getBoundingClientRect();
  const maxX = Math.max(8, window.innerWidth - r.width - 8);
  const maxY = Math.max(8, window.innerHeight - r.height - 8);
  dockPos.value = {
    x: Math.min(Math.max(8, e.clientX - dragOffset.x), maxX),
    y: Math.min(Math.max(8, e.clientY - dragOffset.y), maxY),
  };
}

function stopDrag() {
  isDragging = false;
  window.removeEventListener('pointermove', onDrag);
  window.removeEventListener('pointerup', stopDrag);
}

function updateSpotlight() {
  if (!story.isActive) {
    spotRect.value = null;
    return;
  }
  const el = document.querySelector(story.currentStep.selector) as HTMLElement | null;
  if (!el) {
    spotRect.value = null;
    return;
  }
  const r = el.getBoundingClientRect();
  if (r.width === 0 || r.height === 0) {
    spotRect.value = null;
    return;
  }
  spotRect.value = {
    top: Math.max(4, r.top - 4),
    left: Math.max(4, r.left - 4),
    width: r.width + 8,
    height: r.height + 8,
  };
}

function scheduleSpotlight() {
  if (retryTimer) window.clearTimeout(retryTimer);
  nextTick(() => {
    updateSpotlight();
    retryTimer = window.setTimeout(updateSpotlight, 260);
  });
}

function onKeydown(e: KeyboardEvent) {
  if (!story.isActive) return;
  if (e.key === 'Escape') story.close();
  else if (e.key === 'ArrowRight') story.next();
  else if (e.key === 'ArrowLeft') story.prev();
}

watch(() => [story.isActive, story.currentIndex], scheduleSpotlight);
onMounted(() => {
  window.addEventListener('keydown', onKeydown);
  window.addEventListener('resize', updateSpotlight);
});
onUnmounted(() => {
  stopDrag();
  if (retryTimer) window.clearTimeout(retryTimer);
  window.removeEventListener('keydown', onKeydown);
  window.removeEventListener('resize', updateSpotlight);
});
</script>

<template>
  <teleport to="body">
    <div
      v-if="story.isActive && spotRect"
      class="spotlight-ring"
      :style="{
        top: `${spotRect.top}px`,
        left: `${spotRect.left}px`,
        width: `${spotRect.width}px`,
        height: `${spotRect.height}px`,
      }"
    />

    <transition name="story-slide">
      <aside
        v-if="story.isActive"
        ref="dockRef"
        class="story-dock"
        :style="dockStyle"
        role="dialog"
        aria-label="Recorrido guiado del tablero"
      >
        <div class="story-header" title="Arrastra para mover esta ventana" @pointerdown="startDrag">
          <div class="story-act">
            <GripHorizontal :size="13" class="drag-ico" />
            <Sparkles :size="13" />
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
          <MousePointerClick :size="14" class="takeaway-ico" />
          <span>{{ story.currentStep.actionHint }}</span>
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
  </teleport>
</template>

<style scoped>
.spotlight-ring {
  position: fixed;
  z-index: 80;
  pointer-events: none;
  border-radius: var(--radius-lg);
  border: 2.5px solid #2563eb;
  box-shadow: 0 0 0 9999px rgba(15, 23, 42, 0.28), 0 0 18px rgba(37, 99, 235, 0.4);
  transition: all 0.28s cubic-bezier(0.16, 1, 0.3, 1);
}

.story-dock {
  position: fixed;
  right: 18px;
  bottom: 18px;
  z-index: 10050;
  width: min(440px, calc(100vw - 24px));
  background: #0f172a;
  color: #f8fafc;
  border: 1px solid #334155;
  border-top: 3px solid #38bdf8;
  border-radius: var(--radius-lg);
  box-shadow: 0 18px 40px rgba(15, 23, 42, 0.45);
  padding: 14px 16px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

[data-theme="dark"] .story-dock {
  background: #1e293b;
  border-color: #475569;
  border-top-color: #38bdf8;
  box-shadow: 0 18px 44px rgba(0, 0, 0, 0.65);
}

.story-header { display: flex; justify-content: space-between; align-items: center; gap: 8px; cursor: grab; user-select: none; }
.story-header:active { cursor: grabbing; }
.drag-ico { color: #94a3b8; }
.story-act { display: inline-flex; align-items: center; gap: 5px; font-size: 0.71rem; font-weight: 800; text-transform: uppercase; letter-spacing: 0.04em; color: #38bdf8; }
.story-header-right { display: flex; align-items: center; gap: 8px; }
.step-counter { font-size: 0.72rem; font-weight: 700; color: #94a3b8; }
.btn-close-story { border: none; background: rgba(148, 163, 184, 0.16); color: #cbd5e1; width: 24px; height: 24px; border-radius: 50%; display: grid; place-items: center; cursor: pointer; }
.btn-close-story:hover { color: #ffffff; background: rgba(148, 163, 184, 0.28); }

.story-title { margin: 0; font-size: 0.96rem; font-weight: 800; color: #f8fafc; }
.story-body { margin: 0; font-size: 0.79rem; line-height: 1.45; color: #cbd5e1; }
.story-takeaway {
  display: flex; align-items: flex-start; gap: 6px; font-size: 0.75rem; font-weight: 600; color: #e0f2fe;
  background: rgba(56, 189, 248, 0.14); border: 1px solid rgba(56, 189, 248, 0.25); border-radius: var(--radius-sm); padding: 7px 10px; line-height: 1.35;
}
.takeaway-ico { color: #38bdf8; flex-shrink: 0; margin-top: 2px; }

.story-footer { display: flex; justify-content: space-between; align-items: center; gap: 10px; margin-top: 2px; }
.step-dots { display: flex; align-items: center; gap: 5px; }
.dot-btn { width: 8px; height: 8px; border-radius: 50%; border: none; background: #475569; cursor: pointer; padding: 0; transition: all 0.15s ease; }
.dot-btn.active { width: 18px; border-radius: 999px; background: #38bdf8; }

.story-actions { display: flex; align-items: center; gap: 6px; }
.btn-nav {
  display: inline-flex; align-items: center; gap: 4px; height: 30px; padding: 0 11px;
  border-radius: var(--radius-sm); border: 1px solid #334155; background: rgba(148, 163, 184, 0.12);
  color: #f8fafc; font-size: 0.75rem; font-weight: 700; cursor: pointer;
}
.btn-nav:disabled { opacity: 0.4; cursor: not-allowed; }
.btn-nav.primary { background: #2563eb; border-color: #2563eb; color: #ffffff; }

.story-slide-enter-active, .story-slide-leave-active { transition: opacity 0.2s ease, transform 0.2s ease; }
.story-slide-enter-from, .story-slide-leave-to { opacity: 0; transform: translateY(12px); }
</style>

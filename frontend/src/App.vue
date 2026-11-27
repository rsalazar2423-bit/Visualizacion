<script setup lang="ts">
import { ref } from 'vue';
import TopNavbar from './components/common/TopNavbar.vue';
import SidebarTree, { type SidebarMode } from './components/common/SidebarTree.vue';
import StoryTourOverlay from './components/common/StoryTourOverlay.vue';

const sidebarMode = ref<SidebarMode>('icons');

function cycleSidebarMode() {
  if (sidebarMode.value === 'hidden') sidebarMode.value = 'icons';
  else if (sidebarMode.value === 'icons') sidebarMode.value = 'expanded';
  else sidebarMode.value = 'hidden';
}

function setSidebarMode(m: SidebarMode) {
  sidebarMode.value = m;
}
</script>

<template>
  <div class="app-layout" :class="`sidebar-${sidebarMode}`">
    <SidebarTree
      :mode="sidebarMode"
      :on-cycle-mode="cycleSidebarMode"
      :on-set-mode="setSidebarMode"
    />
    <TopNavbar :on-toggle-sidebar="cycleSidebarMode" />
    
    <main class="main-content">
      <router-view v-slot="{ Component }">
        <transition name="fade" mode="out-in">
          <component :is="Component" />
        </transition>
      </router-view>
    </main>
    <StoryTourOverlay />
  </div>
</template>

<style>
.app-layout.sidebar-icons .main-content {
  padding-left: 56px;
}

.app-layout.sidebar-expanded .main-content {
  padding-left: 248px;
}

.main-content {
  transition: padding-left 0.2s ease;
}

@media (max-width: 768px) {
  .app-layout.sidebar-icons .main-content,
  .app-layout.sidebar-expanded .main-content {
    padding-left: 0;
  }
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease, transform 0.2s ease;
}

.fade-enter-from {
  opacity: 0;
  transform: translateY(6px);
}

.fade-leave-to {
  opacity: 0;
  transform: translateY(-6px);
}
</style>

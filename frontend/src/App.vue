<script setup lang="ts">
import { ref } from 'vue';
import TopNavbar from './components/common/TopNavbar.vue';
import SidebarDrawer from './components/common/SidebarDrawer.vue';
import Footer from './components/common/Footer.vue';

const isSidebarOpen = ref(false);

function toggleSidebar() {
  isSidebarOpen.value = !isSidebarOpen.value;
}

function closeSidebar() {
  isSidebarOpen.value = false;
}
</script>

<template>
  <div class="app-layout">
    <SidebarDrawer :is-open="isSidebarOpen" :on-close="closeSidebar" />
    <TopNavbar :on-toggle-sidebar="toggleSidebar" />
    
    <main class="main-content">
      <router-view v-slot="{ Component }">
        <transition name="fade" mode="out-in">
          <component :is="Component" />
        </transition>
      </router-view>
    </main>

    <Footer />
  </div>
</template>

<style>
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

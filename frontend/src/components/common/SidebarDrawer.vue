<script setup lang="ts">
import { useRoute } from 'vue-router';
import { Home, Activity, Map, Leaf, X, ShieldCheck } from 'lucide-vue-next';

const props = defineProps<{
  isOpen: boolean;
  onClose: () => void;
}>();

const route = useRoute();

const navItems = [
  { name: 'Portada Institucional', path: '/', icon: Home },
  { name: 'Tablero 1: Operaciones y SLA', path: '/operaciones', icon: Activity },
  { name: 'Tablero 2: Jerarquía Territorial', path: '/territorio', icon: Map },
];
</script>

<template>
  <div>
    <!-- Overlay -->
    <div
      v-if="props.isOpen"
      class="drawer-overlay"
      @click="props.onClose"
    ></div>

    <!-- Drawer Content -->
    <aside :class="['sidebar-drawer', { 'is-open': props.isOpen }]">
      <div class="drawer-header">
        <div class="drawer-brand">
          <div class="logo-circle">
            <Leaf :size="20" color="#0D9763" />
          </div>
          <div>
            <div class="drawer-title">EcoGrid DEC</div>
            <div class="drawer-subtitle">Monitoreo Analítico</div>
          </div>
        </div>
        <button class="close-btn" aria-label="Cerrar" @click="props.onClose">
          <X :size="18" />
        </button>
      </div>

      <nav class="drawer-nav">
        <router-link
          v-for="item in navItems"
          :key="item.path"
          :to="item.path"
          :class="['nav-link', { 'active': route.path === item.path }]"
          @click="props.onClose"
        >
          <span class="nav-icon">
            <component :is="item.icon" :size="18" />
          </span>
          <span class="nav-text">{{ item.name }}</span>
          <span v-if="route.path === item.path" class="active-indicator"></span>
        </router-link>
      </nav>

      <div class="drawer-footer">
        <div class="footer-badge">
          <ShieldCheck :size="15" color="#0D9763" />
          <span>Cobertura Nacional 2026</span>
        </div>
        <div class="version-text">Versión 2.0 · Vue 3 + TS</div>
      </div>
    </aside>
  </div>
</template>

<style scoped>
.drawer-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background: rgba(0, 0, 0, 0.45);
  backdrop-filter: blur(3px);
  z-index: 1000;
  transition: opacity var(--transition-normal);
}

.sidebar-drawer {
  position: fixed;
  top: 0;
  left: -320px;
  width: 300px;
  height: 100vh;
  background: var(--bg-drawer);
  border-right: 1px solid var(--border-subtle);
  box-shadow: var(--shadow-lg);
  z-index: 1001;
  display: flex;
  flex-direction: column;
  transition: left var(--transition-normal) cubic-bezier(0.16, 1, 0.3, 1);
}

.sidebar-drawer.is-open {
  left: 0;
}

.drawer-header {
  padding: 20px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  border-bottom: 1px solid var(--border-subtle);
}

.drawer-brand {
  display: flex;
  align-items: center;
  gap: 12px;
}

.logo-circle {
  width: 38px;
  height: 38px;
  border-radius: var(--radius-md);
  background: rgba(16, 185, 129, 0.15);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.2rem;
}

.drawer-title {
  font-weight: 800;
  font-size: 1.05rem;
  color: var(--text-primary);
}

.drawer-subtitle {
  font-size: 0.72rem;
  color: var(--text-secondary);
}

.close-btn {
  background: transparent;
  border: none;
  font-size: 1.1rem;
  color: var(--text-secondary);
  cursor: pointer;
  padding: 6px;
  border-radius: var(--radius-sm);
}

.close-btn:hover {
  background: var(--bg-table-stripe);
  color: var(--text-primary);
}

.drawer-nav {
  flex: 1;
  padding: 16px 12px;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.nav-link {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 14px;
  border-radius: var(--radius-md);
  color: var(--text-secondary);
  font-weight: 600;
  font-size: 0.9rem;
  transition: all var(--transition-fast);
  position: relative;
}

.nav-link:hover {
  background: var(--bg-table-hover);
  color: var(--color-emerald);
}

.nav-link.active {
  background: rgba(16, 185, 129, 0.12);
  color: var(--color-emerald);
  font-weight: 700;
}

.nav-icon {
  font-size: 1.15rem;
}

.active-indicator {
  position: absolute;
  right: 12px;
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background-color: var(--color-emerald);
}

.drawer-footer {
  padding: 20px;
  border-top: 1px solid var(--border-subtle);
}

.footer-badge {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 0.78rem;
  color: var(--text-secondary);
  font-weight: 600;
  margin-bottom: 6px;
}

.version-text {
  font-size: 0.7rem;
  color: var(--text-muted);
}
</style>

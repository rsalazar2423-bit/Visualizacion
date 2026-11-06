<script setup lang="ts">
import { useRoute } from 'vue-router';
import { Home, Activity, Map, Sliders, Leaf, X, ShieldCheck, Palette } from 'lucide-vue-next';

const props = defineProps<{
  isOpen: boolean;
  onClose: () => void;
}>();

const route = useRoute();

const navItems = [
  { name: 'Portada y Resumen Ejecutivo', path: '/', icon: Home },
  { name: '01 · Seguimiento y Cumplimiento', path: '/operaciones', icon: Activity },
  { name: '02 · Diagnóstico Territorial y Técnico', path: '/territorio', icon: Map },
  { name: '03 · Capacidad y Mejora Operativa', path: '/capacidad', icon: Sliders },
  { name: 'Gobernanza de Color y Diseño', path: '/diseno', icon: Palette },
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
            <Leaf :size="20" class="brand-icon" />
          </div>
          <div>
            <div class="drawer-title">EcoGrid DEC</div>
            <div class="drawer-subtitle">Control Táctico-Operacional</div>
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
          <ShieldCheck :size="15" class="brand-icon" />
          <span>Sistema de Diseño Dual · Claro / Oscuro</span>
        </div>
        <div class="version-text">Infraestructura de Transmisión · Colombia</div>
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
  background: rgba(15, 23, 42, 0.5);
  backdrop-filter: blur(3px);
  z-index: 1000;
  transition: opacity var(--transition-normal);
}

.sidebar-drawer {
  position: fixed;
  top: 0;
  left: -320px;
  width: 310px;
  height: 100vh;
  background: var(--bg-drawer);
  border-right: 1px solid var(--border-subtle);
  box-shadow: var(--shadow-lg);
  z-index: 1001;
  display: flex;
  flex-direction: column;
  transition: left var(--transition-normal);
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
  background: var(--color-brand-soft);
  display: flex;
  align-items: center;
  justify-content: center;
}

.brand-icon {
  color: var(--color-brand);
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
  background: var(--bg-subtle);
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
  font-size: 0.88rem;
  transition: all var(--transition-fast);
  position: relative;
}

.nav-link:hover {
  background: var(--bg-table-hover);
  color: var(--color-brand);
}

.nav-link.active {
  background: var(--color-brand-soft);
  color: var(--color-brand);
  font-weight: 700;
}

.nav-icon {
  display: flex;
  align-items: center;
}

.active-indicator {
  position: absolute;
  right: 12px;
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background-color: var(--color-brand);
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

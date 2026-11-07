<script setup lang="ts">
import { ref } from 'vue';
import { useRoute } from 'vue-router';
import { Sun, Moon, Activity, Map, Sliders, Home, Palette, QrCode } from 'lucide-vue-next';
import { useThemeStore } from '../../stores/themeStore';
import QrAccessModal from './QrAccessModal.vue';

const props = defineProps<{
  onToggleSidebar: () => void;
}>();

const route = useRoute();
const themeStore = useThemeStore();
const isQrOpen = ref(false);

const topNavLinks = [
  { label: 'Resumen', path: '/', icon: Home },
  { label: '01 · Seguimiento y SLA', path: '/operaciones', icon: Activity },
  { label: '02 · Territorio y Mapa Histórico', path: '/territorio', icon: Map },
  { label: '03 · Capacidad y Mejora', path: '/capacidad', icon: Sliders },
  { label: 'Paleta y Diseño', path: '/diseno', icon: Palette },
];
</script>

<template>
  <header class="top-navbar">
    <div class="navbar-left">
      <button class="nav-btn menu-btn" aria-label="Abrir Menú" @click="props.onToggleSidebar">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round">
          <line x1="3" y1="12" x2="21" y2="12"></line>
          <line x1="3" y1="6" x2="21" y2="6"></line>
          <line x1="3" y1="18" x2="21" y2="18"></line>
        </svg>
      </button>

      <router-link to="/" class="brand-link" title="EcoGrid DEC · Portada">
        <img
          :src="themeStore.isDark ? '/assets/icon_dark.png' : '/assets/icon_light.png'"
          alt="EcoGrid Colombia"
          class="brand-logo-img"
        />
        <div class="brand-text-container">
          <span class="brand-title">EcoGrid DEC</span>
          <span class="brand-subtitle">GESTIÓN OPERATIVA & CUMPLIMIENTO DE LA ATENCIÓN</span>
        </div>
      </router-link>
    </div>

    <!-- Navegación Directa de las 3 Vistas Tácticas -->
    <nav class="navbar-center">
      <router-link
        v-for="item in topNavLinks"
        :key="item.path"
        :to="item.path"
        :class="['top-nav-pill', { active: route.path === item.path }]"
      >
        <component :is="item.icon" :size="14" />
        <span>{{ item.label }}</span>
      </router-link>
    </nav>

    <div class="navbar-right">
      <div class="institutional-badge">
        <span class="inst-dot"></span>
        <span class="inst-text">Suroccidente & Centro · Transmisión</span>
      </div>

      <!-- Botón de Acceso Móvil por QR -->
      <button
        class="qr-access-btn"
        title="Generar código QR para acceder desde celular o tablet"
        @click="isQrOpen = true"
      >
        <QrCode :size="15" />
        <span class="qr-btn-text">QR Móvil</span>
      </button>

      <button
        class="theme-toggle-btn"
        :title="themeStore.isDark ? 'Cambiar a Tema Claro' : 'Cambiar a Tema Oscuro'"
        @click="themeStore.toggleTheme"
      >
        <Moon v-if="themeStore.isDark" :size="15" />
        <Sun v-else :size="15" />
        <span class="theme-label">{{ themeStore.isDark ? 'Oscuro' : 'Claro' }}</span>
      </button>

      <!-- Modal de Código QR -->
      <QrAccessModal :is-open="isQrOpen" @close="isQrOpen = false" />
    </div>
  </header>
</template>

<style scoped>
.top-navbar {
  height: 72px;
  background: var(--bg-card);
  border-bottom: 1px solid var(--border-subtle);
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 24px;
  position: sticky;
  top: 0;
  z-index: 100;
  backdrop-filter: blur(12px);
  box-shadow: var(--shadow-sm);
  gap: 16px;
}

.navbar-left,
.navbar-right {
  display: flex;
  align-items: center;
  gap: 14px;
}

.menu-btn {
  background: transparent;
  border: 1px solid var(--border-subtle);
  color: var(--text-primary);
  cursor: pointer;
  padding: 8px;
  border-radius: var(--radius-sm);
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all var(--transition-fast);
}

.menu-btn:hover {
  background: var(--bg-subtle);
  border-color: var(--color-brand);
}

.brand-link {
  display: flex;
  align-items: center;
  gap: 12px;
  text-decoration: none;
}

.brand-logo-img {
  height: 46px;
  width: auto;
  object-fit: contain;
  display: block;
}

.brand-text-container {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.brand-title {
  font-size: 1.15rem;
  font-weight: 800;
  letter-spacing: -0.4px;
  color: var(--text-primary);
  line-height: 1.1;
}

.brand-subtitle {
  font-size: 0.62rem;
  font-weight: 700;
  letter-spacing: 0.7px;
  color: var(--color-brand);
}

.navbar-center {
  display: flex;
  align-items: center;
  gap: 6px;
  background: var(--bg-subtle);
  padding: 4px;
  border-radius: var(--radius-md);
  border: 1px solid var(--border-subtle);
}

.top-nav-pill {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  border-radius: var(--radius-sm);
  font-size: 0.8rem;
  font-weight: 600;
  color: var(--text-secondary);
  transition: all var(--transition-fast);
  white-space: nowrap;
}

.top-nav-pill:hover {
  color: var(--text-primary);
  background: var(--bg-card-hover);
}

.top-nav-pill.active {
  background: var(--bg-card);
  color: var(--color-brand);
  font-weight: 700;
  box-shadow: var(--shadow-sm);
}

.institutional-badge {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 5px 12px;
  border-radius: var(--radius-full);
  background: var(--color-brand-soft);
  color: var(--color-brand);
  font-size: 0.76rem;
  font-weight: 600;
  border: 1px solid rgba(13, 148, 136, 0.25);
}

.inst-dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background-color: var(--color-brand);
}

.theme-toggle-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  border-radius: var(--radius-md);
  background: var(--bg-subtle);
  border: 1px solid var(--border-subtle);
  color: var(--text-primary);
  font-size: 0.8rem;
  font-weight: 600;
  cursor: pointer;
  transition: all var(--transition-fast);
}

.theme-toggle-btn:hover {
  border-color: var(--color-brand);
  background: var(--bg-card-hover);
}

.qr-access-btn {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  padding: 6px 12px;
  border-radius: var(--radius-md);
  background: rgba(29, 78, 216, 0.08);
  border: 1px solid rgba(29, 78, 216, 0.25);
  color: #1D4ED8;
  font-size: 0.8rem;
  font-weight: 700;
  cursor: pointer;
  transition: all var(--transition-fast);
}

.qr-access-btn:hover {
  background: rgba(29, 78, 216, 0.16);
  border-color: #1D4ED8;
}

[data-theme="dark"] .qr-access-btn {
  background: rgba(56, 189, 248, 0.1);
  border-color: rgba(56, 189, 248, 0.25);
  color: #38BDF8;
}

[data-theme="dark"] .qr-access-btn:hover {
  background: rgba(56, 189, 248, 0.2);
  border-color: #38BDF8;
}

@media (max-width: 1180px) {
  .institutional-badge {
    display: none;
  }
}

@media (max-width: 900px) {
  .navbar-center {
    display: none;
  }
}

@media (max-width: 640px) {
  .theme-label,
  .qr-btn-text {
    display: none;
  }
}
</style>

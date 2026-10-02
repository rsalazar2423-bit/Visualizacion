<script setup lang="ts">
import { Sun, Moon } from 'lucide-vue-next';
import { useThemeStore } from '../../stores/themeStore';

const props = defineProps<{
  onToggleSidebar: () => void;
}>();

const themeStore = useThemeStore();
</script>

<template>
  <header class="top-navbar">
    <div class="navbar-left">
      <button class="nav-btn menu-btn" aria-label="Abrir Menú" @click="props.onToggleSidebar">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round">
          <line x1="3" y1="12" x2="21" y2="12"></line>
          <line x1="3" y1="6" x2="21" y2="6"></line>
          <line x1="3" y1="18" x2="21" y2="18"></line>
        </svg>
      </button>

      <router-link to="/" class="brand-link" title="EcoGrid Colombia · Portada">
        <img
          :src="themeStore.isDark ? '/assets/icon_dark.png' : '/assets/icon_light.png'"
          alt="EcoGrid Colombia"
          class="brand-logo-img"
        />
        <div class="brand-text-container">
          <span class="brand-title">EcoGrid Colombia</span>
          <span class="brand-subtitle">SUPERVISIÓN AMBIENTAL & INFRAESTRUCTURA DEC</span>
        </div>
      </router-link>
    </div>

    <div class="navbar-right">
      <div class="institutional-badge">
        <span class="inst-dot"></span>
        <span class="inst-text">Operación Nacional · 10 Departamentos</span>
      </div>

      <button class="theme-toggle-btn" :title="themeStore.isDark ? 'Cambiar a Modo Claro' : 'Cambiar a Modo Oscuro'" @click="themeStore.toggleTheme">
        <Moon v-if="themeStore.isDark" :size="15" />
        <Sun v-else :size="15" />
        <span class="theme-label">{{ themeStore.isDark ? 'Modo Oscuro' : 'Modo Claro' }}</span>
      </button>
    </div>
  </header>
</template>

<style scoped>
.top-navbar {
  height: 78px;
  background: var(--bg-card);
  border-bottom: 2px solid var(--border-subtle);
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 28px;
  position: sticky;
  top: 0;
  z-index: 100;
  backdrop-filter: blur(12px);
  box-shadow: 0 2px 10px rgba(5, 38, 31, 0.05);
}

.navbar-left, .navbar-right {
  display: flex;
  align-items: center;
  gap: 18px;
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
  background: var(--bg-table-stripe);
  border-color: var(--color-emerald);
}

.brand-link {
  display: flex;
  align-items: center;
  gap: 16px;
  text-decoration: none;
}

.brand-logo-img {
  height: 56px;
  width: auto;
  object-fit: contain;
  display: block;
  filter: drop-shadow(0 3px 6px rgba(0, 0, 0, 0.1));
}

.brand-text-container {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.brand-title {
  font-size: 1.25rem;
  font-weight: 800;
  letter-spacing: -0.4px;
  color: var(--text-primary);
  line-height: 1.1;
}

.brand-subtitle {
  font-size: 0.62rem;
  font-weight: 700;
  letter-spacing: 0.8px;
  color: var(--color-emerald);
}

.institutional-badge {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 6px 14px;
  border-radius: var(--radius-full);
  background: rgba(13, 151, 99, 0.1);
  color: var(--color-emerald);
  font-size: 0.82rem;
  font-weight: 600;
  border: 1px solid rgba(13, 151, 99, 0.25);
}

.inst-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background-color: var(--color-emerald);
  box-shadow: 0 0 6px rgba(13, 151, 99, 0.6);
}

.theme-toggle-btn {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 6px 14px;
  border-radius: var(--radius-md);
  background: var(--bg-table-stripe);
  border: 1px solid var(--border-subtle);
  color: var(--text-primary);
  font-size: 0.82rem;
  font-weight: 600;
  cursor: pointer;
  transition: all var(--transition-fast);
}

.theme-toggle-btn:hover {
  border-color: var(--color-mint);
  background: var(--bg-table-hover);
}

@media (max-width: 640px) {
  .partner-badge {
    display: none;
  }
  .theme-label {
    display: none;
  }
}
</style>

import { defineStore } from 'pinia';
import { ref } from 'vue';

export const useThemeStore = defineStore('theme', () => {
  const savedTheme = localStorage.getItem('ecogrid-theme') as 'light' | 'dark' | null;
  const isDark = ref(savedTheme === 'dark');

  function applyTheme() {
    if (isDark.value) {
      document.documentElement.setAttribute('data-theme', 'dark');
      localStorage.setItem('ecogrid-theme', 'dark');
    } else {
      document.documentElement.removeAttribute('data-theme');
      localStorage.setItem('ecogrid-theme', 'light');
    }
  }

  function toggleTheme() {
    isDark.value = !isDark.value;
    applyTheme();
  }

  // Initialize on load
  applyTheme();

  return {
    isDark,
    toggleTheme,
    applyTheme,
  };
});

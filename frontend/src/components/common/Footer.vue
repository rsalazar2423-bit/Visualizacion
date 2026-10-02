<template>
  <footer class="app-footer">
    <div class="footer-content">
      <div class="footer-left">
        <span class="footer-brand">EcoGrid Colombia</span>
        <span class="footer-sep">·</span>
        <span>Aliado Estratégico DEC (Distribución Eléctrica de Colombia)</span>
      </div>
      <div class="footer-right">
        <span>Sistema de Inteligencia Analítica v2.0 (Vue 3 + TS)</span>
      </div>
    </div>
  </footer>
</template>

<style scoped>
.app-footer {
  background: var(--bg-card);
  border-top: 1px solid var(--border-subtle);
  padding: 18px 24px;
  font-size: 0.8rem;
  color: var(--text-secondary);
  margin-top: auto;
}

.footer-content {
  max-width: 1440px;
  margin: 0 auto;
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 12px;
}

.footer-left {
  display: flex;
  align-items: center;
  gap: 8px;
}

.footer-brand {
  font-weight: 700;
  color: var(--color-emerald);
}

.footer-sep {
  color: var(--text-muted);
}
</style>

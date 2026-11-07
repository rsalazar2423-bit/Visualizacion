<script setup lang="ts">
import { ref, computed, watch, onMounted, onBeforeUnmount } from 'vue';
import { useRoute } from 'vue-router';
import { QrCode, X, Copy, Check, ExternalLink, Smartphone } from 'lucide-vue-next';
import QRCode from 'qrcode';

const props = defineProps<{
  isOpen: boolean;
}>();

const emit = defineEmits<{
  (e: 'close'): void;
}>();

const route = useRoute();
const qrDataUrl = ref<string>('');
const copied = ref(false);

const currentUrl = computed(() => {
  if (typeof window !== 'undefined') {
    const origin = window.location.origin.includes('localhost')
      ? 'https://visualizacion-mu.vercel.app'
      : window.location.origin;
    return `${origin}${route.fullPath}`;
  }
  return 'https://visualizacion-mu.vercel.app';
});

async function generateQr() {
  try {
    const url = currentUrl.value;
    qrDataUrl.value = await QRCode.toDataURL(url, {
      width: 320,
      margin: 2,
      color: {
        dark: '#0F172A',
        light: '#FFFFFF',
      },
      errorCorrectionLevel: 'M',
    });
  } catch (err) {
    console.error('Error generando código QR:', err);
  }
}

async function copyUrl() {
  try {
    await navigator.clipboard.writeText(currentUrl.value);
    copied.value = true;
    setTimeout(() => {
      copied.value = false;
    }, 2200);
  } catch (err) {
    console.warn('Error al copiar al portapapeles:', err);
  }
}

function onKeyDown(e: KeyboardEvent) {
  if (e.key === 'Escape' && props.isOpen) {
    emit('close');
  }
}

watch(
  () => [props.isOpen, currentUrl.value],
  ([open]) => {
    if (open) {
      generateQr();
    }
  },
  { immediate: true }
);

onMounted(() => {
  window.addEventListener('keydown', onKeyDown);
});

onBeforeUnmount(() => {
  window.removeEventListener('keydown', onKeyDown);
});
</script>

<template>
  <Teleport to="body">
    <Transition name="qr-fade">
      <div v-if="isOpen" class="qr-modal-backdrop" @click.self="emit('close')">
        <div class="qr-modal-card card" role="dialog" aria-modal="true">
          <!-- Cabecera del Modal -->
          <div class="qr-modal-header">
            <div class="qr-header-title">
              <div class="qr-icon-badge">
                <QrCode :size="18" />
              </div>
              <div>
                <h3 class="qr-title">Acceso Móvil / Auditoría en Vivo</h3>
                <p class="qr-subtitle">Escanea desde tu celular o tablet para interactuar con el dashboard</p>
              </div>
            </div>

            <button
              class="qr-close-btn"
              title="Cerrar modal (Esc)"
              aria-label="Cerrar modal"
              @click="emit('close')"
            >
              <X :size="18" />
            </button>
          </div>

          <!-- Cuerpo: Código QR -->
          <div class="qr-modal-body">
            <div class="qr-frame">
              <img
                v-if="qrDataUrl"
                :src="qrDataUrl"
                alt="Código QR para acceso móvil al dashboard EcoGrid"
                class="qr-image"
              />
              <div v-else class="qr-placeholder">
                Generando código QR...
              </div>
            </div>

            <!-- Indicación de Dispositivo -->
            <div class="device-prompt">
              <Smartphone :size="16" class="device-icon" />
              <span>Abre la app de cámara en iOS o Android y apunta al código.</span>
            </div>

            <!-- Enlace directo y botón Copiar -->
            <div class="url-copy-box">
              <input
                type="text"
                readonly
                :value="currentUrl"
                class="url-input"
              />
              <button
                class="btn-copy"
                :class="{ copied }"
                title="Copiar URL al portapapeles"
                @click="copyUrl"
              >
                <component :is="copied ? Check : Copy" :size="14" />
                <span>{{ copied ? '¡Copiado!' : 'Copiar' }}</span>
              </button>
            </div>
          </div>

          <!-- Pie del Modal -->
          <div class="qr-modal-footer">
            <a
              :href="currentUrl"
              target="_blank"
              rel="noopener noreferrer"
              class="btn-open-link"
            >
              <span>Abrir en nueva pestaña</span>
              <ExternalLink :size="13" />
            </a>

            <button class="btn-done" @click="emit('close')">
              Entendido
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.qr-modal-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(11, 15, 25, 0.82);
  backdrop-filter: blur(8px);
  z-index: 2500;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 16px;
}

.qr-modal-card {
  width: 100%;
  max-width: 440px;
  background: var(--bg-card);
  border: 1px solid var(--border-strong);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-lg);
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.qr-modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px;
  border-bottom: 1px solid var(--border-subtle);
  background: var(--bg-subtle);
  gap: 12px;
}

.qr-header-title {
  display: flex;
  align-items: center;
  gap: 12px;
}

.qr-icon-badge {
  width: 36px;
  height: 36px;
  border-radius: var(--radius-md);
  background: rgba(29, 78, 216, 0.12);
  color: #1D4ED8;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

[data-theme="dark"] .qr-icon-badge {
  background: rgba(56, 189, 248, 0.15);
  color: #38BDF8;
}

.qr-title {
  font-size: 1.05rem;
  font-weight: 800;
  color: var(--text-primary);
  margin: 0;
}

.qr-subtitle {
  font-size: 0.76rem;
  color: var(--text-secondary);
  margin: 2px 0 0;
}

.qr-close-btn {
  background: transparent;
  border: none;
  color: var(--text-muted);
  cursor: pointer;
  padding: 6px;
  border-radius: var(--radius-sm);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  transition: all var(--transition-fast);
}

.qr-close-btn:hover {
  background: var(--bg-hover);
  color: var(--text-primary);
}

.qr-modal-body {
  padding: 24px 20px 20px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
}

.qr-frame {
  background: #FFFFFF;
  padding: 14px;
  border-radius: var(--radius-md);
  border: 1px solid var(--border-subtle);
  box-shadow: 0 4px 14px rgba(0, 0, 0, 0.08);
  display: flex;
  align-items: center;
  justify-content: center;
}

.qr-image {
  width: 230px;
  height: 230px;
  display: block;
}

.qr-placeholder {
  width: 230px;
  height: 230px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #64748B;
  font-size: 0.85rem;
}

.device-prompt {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 0.78rem;
  color: var(--text-secondary);
  text-align: center;
}

.device-icon {
  color: #1D4ED8;
  flex-shrink: 0;
}

[data-theme="dark"] .device-icon {
  color: #38BDF8;
}

.url-copy-box {
  display: flex;
  width: 100%;
  gap: 8px;
}

.url-input {
  flex: 1;
  min-width: 0;
  background: var(--bg-subtle);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-sm);
  padding: 8px 10px;
  font-size: 0.76rem;
  font-family: monospace;
  color: var(--text-secondary);
  outline: none;
}

.btn-copy {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 8px 14px;
  border-radius: var(--radius-sm);
  background: #1D4ED8;
  color: #FFFFFF;
  font-size: 0.78rem;
  font-weight: 700;
  border: none;
  cursor: pointer;
  transition: all var(--transition-fast);
  flex-shrink: 0;
}

.btn-copy.copied {
  background: #059669;
}

[data-theme="dark"] .btn-copy {
  background: #38BDF8;
  color: #0F172A;
}

[data-theme="dark"] .btn-copy.copied {
  background: #10B981;
  color: #FFFFFF;
}

.qr-modal-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 20px;
  border-top: 1px solid var(--border-subtle);
  background: var(--bg-subtle);
}

.btn-open-link {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  font-size: 0.78rem;
  font-weight: 600;
  color: var(--text-secondary);
  transition: color var(--transition-fast);
}

.btn-open-link:hover {
  color: #1D4ED8;
}

.btn-done {
  padding: 6px 14px;
  background: var(--bg-card);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-sm);
  font-size: 0.8rem;
  font-weight: 600;
  color: var(--text-primary);
  cursor: pointer;
}

.btn-done:hover {
  background: var(--bg-hover);
}

.qr-fade-enter-active,
.qr-fade-leave-active {
  transition: opacity 0.2s ease, transform 0.2s ease;
}

.qr-fade-enter-from,
.qr-fade-leave-to {
  opacity: 0;
  transform: scale(0.96);
}
</style>

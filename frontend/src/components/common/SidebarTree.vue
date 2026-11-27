<script setup lang="ts">
import { ref, computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import {
  Home,
  Activity,
  MapPin,
  Sliders,
  ChevronRight,
  ChevronDown,
  PanelLeftClose,
  EyeOff,
} from 'lucide-vue-next';

export type SidebarMode = 'hidden' | 'icons' | 'expanded';

const props = defineProps<{
  mode: SidebarMode;
  onCycleMode: () => void;
  onSetMode: (m: SidebarMode) => void;
}>();

const route = useRoute();
const router = useRouter();
const openGroups = ref<Record<string, boolean>>({
  operaciones: true,
  territorio: true,
  capacidad: true,
});

interface TreeChild {
  label: string;
  to: string;
}

interface TreeNode {
  id: string;
  label: string;
  icon: any;
  to: string;
  children?: TreeChild[];
}

const TREE_NODES: TreeNode[] = [
  { id: 'home', label: 'Resumen', icon: Home, to: '/' },
  {
    id: 'operaciones',
    label: '01 · Seguimiento y SLA',
    icon: Activity,
    to: '/operaciones',
    children: [
      { label: 'Dinámica & Plazos SLA', to: '/operaciones' },
      { label: 'Composición & Sankey', to: '/operaciones?tab=sla' },
    ],
  },
  {
    id: 'territorio',
    label: '02 · Territorio y Mapa',
    icon: MapPin,
    to: '/territorio',
    children: [
      { label: 'Triaje NLP', to: '/territorio?tab=nlp' },
      { label: 'Mapa Histórico', to: '/territorio?tab=map' },
    ],
  },
  {
    id: 'capacidad',
    label: '03 · Capacidad y Mejora',
    icon: Sliders,
    to: '/capacidad',
    children: [
      { label: 'Centro del Coordinador', to: '/capacidad?tab=coordinator' },
      { label: 'Equilibrio y Carga', to: '/capacidad?tab=balance' },
      { label: 'Simulador de Cuadrillas', to: '/capacidad?tab=simulator' },
    ],
  },
];

const currentFullPath = computed(() => route.fullPath);

function isNodeActive(node: TreeNode): boolean {
  if (node.to === '/') return route.path === '/';
  return route.path.startsWith(node.to);
}

function isChildActive(child: TreeChild): boolean {
  return currentFullPath.value === child.to;
}

function toggleGroup(id: string) {
  openGroups.value[id] = !openGroups.value[id];
}

function navigate(to: string) {
  router.push(to);
}
</script>

<template>
  <aside
    v-if="mode !== 'hidden'"
    class="sidebar-tree"
    :class="`mode-${mode}`"
    aria-label="Navegación principal en árbol"
  >
    <div v-if="mode === 'expanded'" class="tree-header">
      <span class="tree-title">Navegación</span>
      <div class="tree-mode-actions">
        <button
          class="mode-btn"
          title="Cambiar a solo iconos"
          @click="onSetMode('icons')"
        >
          <PanelLeftClose :size="15" />
        </button>
        <button
          class="mode-btn"
          title="Ocultar menú"
          @click="onSetMode('hidden')"
        >
          <EyeOff :size="14" />
        </button>
      </div>
    </div>

    <nav class="tree-nav">
      <div v-for="node in TREE_NODES" :key="node.id" class="tree-group">
        <div
          class="tree-item"
          :class="{ active: isNodeActive(node) }"
          :title="mode === 'icons' ? node.label : undefined"
          @click="navigate(node.to)"
        >
          <component :is="node.icon" :size="16" class="tree-icon" />
          <span v-if="mode === 'expanded'" class="tree-label">{{ node.label }}</span>
          <button
            v-if="mode === 'expanded' && node.children"
            class="chevron-btn"
            :aria-label="`Expandir ${node.label}`"
            @click.stop="toggleGroup(node.id)"
          >
            <ChevronDown v-if="openGroups[node.id]" :size="14" />
            <ChevronRight v-else :size="14" />
          </button>
        </div>

        <div
          v-if="mode === 'expanded' && node.children && openGroups[node.id]"
          class="tree-children"
        >
          <button
            v-for="child in node.children"
            :key="child.to"
            class="tree-child"
            :class="{ active: isChildActive(child) }"
            @click="navigate(child.to)"
          >
            <span class="child-dot"></span>
            <span>{{ child.label }}</span>
          </button>
        </div>
      </div>
    </nav>
  </aside>
</template>

<style scoped>
.sidebar-tree {
  position: fixed;
  top: 56px;
  left: 0;
  bottom: 0;
  z-index: 90;
  background: var(--bg-card);
  border-right: 1px solid var(--border-subtle);
  display: flex;
  flex-direction: column;
  transition: width 0.2s ease;
  overflow-y: auto;
  overflow-x: hidden;
}

.sidebar-tree.mode-expanded {
  width: 232px;
}

.sidebar-tree.mode-icons {
  width: 56px;
}

.tree-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 10px 8px;
  border-bottom: 1px solid var(--border-subtle);
}

.mode-icons .tree-header {
  justify-content: center;
}

.tree-title {
  font-size: 0.74rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--text-muted);
}

.tree-mode-actions {
  display: flex;
  align-items: center;
  gap: 4px;
}

.mode-btn {
  width: 26px;
  height: 26px;
  border-radius: 6px;
  border: 1px solid var(--border-subtle);
  background: var(--bg-soft, #f8fafc);
  color: var(--text-secondary);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
}

.mode-btn:hover {
  color: var(--color-brand);
  border-color: var(--color-brand);
}

.tree-nav {
  padding: 8px;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.tree-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 10px;
  border-radius: 8px;
  cursor: pointer;
  color: var(--text-secondary);
  font-size: 0.8rem;
  font-weight: 600;
  transition: background 0.15s ease, color 0.15s ease;
}

.mode-icons .tree-item {
  justify-content: center;
  padding: 9px 0;
}

.tree-item:hover {
  background: var(--bg-soft, #f1f5f9);
  color: var(--text-primary);
}

.tree-item.active {
  background: rgba(16, 185, 129, 0.12);
  color: var(--color-brand);
}

.tree-icon {
  flex-shrink: 0;
}

.tree-label {
  flex: 1;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.chevron-btn {
  border: none;
  background: transparent;
  color: inherit;
  cursor: pointer;
  padding: 2px;
  display: inline-flex;
  align-items: center;
}

.tree-children {
  display: flex;
  flex-direction: column;
  gap: 2px;
  padding-left: 22px;
  margin-top: 2px;
}

.tree-child {
  display: flex;
  align-items: center;
  gap: 7px;
  padding: 6px 8px;
  border: none;
  background: transparent;
  border-radius: 6px;
  cursor: pointer;
  color: var(--text-muted);
  font-size: 0.76rem;
  font-weight: 500;
  text-align: left;
}

.tree-child:hover {
  background: var(--bg-soft, #f1f5f9);
  color: var(--text-primary);
}

.tree-child.active {
  color: var(--color-brand);
  font-weight: 700;
}

.child-dot {
  width: 5px;
  height: 5px;
  border-radius: 999px;
  background: currentColor;
  flex-shrink: 0;
}
</style>

import { createRouter, createWebHistory } from 'vue-router';
import HomeView from '../views/HomeView.vue';

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/',
      name: 'home',
      component: HomeView,
      meta: { title: 'EcoGrid DEC · Gestión Operativa y Cumplimiento de la Atención' },
    },
    {
      path: '/operaciones',
      name: 'operations',
      component: () => import('../views/OperationsView.vue'),
      meta: { title: 'EcoGrid DEC · 01 Seguimiento y Cumplimiento' },
    },
    {
      path: '/territorio',
      name: 'territory',
      component: () => import('../views/HierarchyView.vue'),
      meta: { title: 'EcoGrid DEC · 02 Diagnóstico Territorial y Técnico' },
    },
    {
      path: '/capacidad',
      name: 'capacity',
      component: () => import('../views/CapacityView.vue'),
      meta: { title: 'EcoGrid DEC · 03 Capacidad y Mejora Operativa' },
    },
    {
      path: '/diseno',
      name: 'design-system',
      component: () => import('../views/DesignSystemView.vue'),
      meta: { title: 'EcoGrid DEC · Sistema de Diseño y Paleta de Colores' },
    },
    {
      path: '/:pathMatch(.*)*',
      redirect: '/',
    },
  ],
});

router.afterEach((to) => {
  if (to.meta.title) {
    document.title = to.meta.title as string;
  }
});

export default router;

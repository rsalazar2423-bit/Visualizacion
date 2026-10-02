import { createRouter, createWebHistory } from 'vue-router';
import HomeView from '../views/HomeView.vue';

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/',
      name: 'home',
      component: HomeView,
      meta: { title: 'EcoGrid Colombia · Portada Institucional' },
    },
    {
      path: '/operaciones',
      name: 'operations',
      component: () => import('../views/OperationsView.vue'),
      meta: { title: 'EcoGrid Colombia · Tablero Operativo' },
    },
    {
      path: '/territorio',
      name: 'territory',
      component: () => import('../views/HierarchyView.vue'),
      meta: { title: 'EcoGrid Colombia · Tablero Jerárquico' },
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

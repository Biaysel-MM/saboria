import { createRouter, createWebHistory } from 'vue-router'

export const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/', name: 'home', component: () => import('../pages/Home.vue') },
    { path: '/admin', name: 'admin', component: () => import('../pages/Admin.vue') },
  ],
  scrollBehavior(to, from, savedPosition) {
    if (savedPosition) return savedPosition
    if (to.hash) return { el: to.hash, behavior: 'smooth', top: 96 }
    return { top: 0 }
  },
})

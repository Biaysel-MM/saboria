import { createRouter, createWebHistory } from 'vue-router'
import { getAuthToken, getSessionRole } from '../stores/auth.js'
import { notify } from '../stores/toasts.js'

export const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/', name: 'home', component: () => import('../pages/Home.vue') },

    {
      path: '/login',
      name: 'login',
      component: () => import('../pages/Login.vue'),
      meta: { guest: true },
    },
    {
      path: '/registro',
      name: 'registro',
      component: () => import('../pages/Registro.vue'),
      meta: { guest: true },
    },
    {
      path: '/verificar',
      name: 'verificar',
      component: () => import('../pages/Verificar.vue'),
    },

    {
      path: '/admin/login',
      name: 'admin-login',
      component: () => import('../pages/admin/Login.vue'),
      meta: { guest: true },
    },
    {
      path: '/admin',
      component: () => import('../components/admin/AdminLayout.vue'),
      meta: { requiresAuth: true, requiresAdmin: true },
      children: [
        {
          path: '',
          redirect: { path: '/admin/productos' },
        },
        {
          path: 'productos',
          name: 'admin-productos',
          component: () => import('../pages/admin/Catalogo.vue'),
        },
        {
          // misma vista, pero a la sección de categorías
          path: 'categorias',
          name: 'admin-categorias',
          component: () => import('../pages/admin/Catalogo.vue'),
        },
        {
          path: 'productos/nuevo',
          name: 'admin-producto-nuevo',
          component: () => import('../pages/admin/ProductoForm.vue'),
        },
        {
          path: 'productos/:id/editar',
          name: 'admin-producto-editar',
          component: () => import('../pages/admin/ProductoForm.vue'),
        },
        {
          path: 'categorias/nueva',
          name: 'admin-categoria-nueva',
          component: () => import('../pages/admin/CategoriaForm.vue'),
        },
        {
          path: 'categorias/:id/editar',
          name: 'admin-categoria-editar',
          component: () => import('../pages/admin/CategoriaForm.vue'),
        },
        {
          path: 'textos',
          name: 'admin-textos',
          component: () => import('../pages/admin/Textos.vue'),
        },
        {
          path: 'comentarios',
          name: 'admin-comentarios',
          component: () => import('../pages/admin/Comentarios.vue'),
        },
        {
          path: 'usuarios',
          name: 'admin-usuarios',
          component: () => import('../pages/admin/Usuarios.vue'),
        },
      ],
    },

    { path: '/:pathMatch(.*)*', redirect: '/' },
  ],
  scrollBehavior(to, from, savedPosition) {
    if (savedPosition) return savedPosition
    if (to.hash) return { el: to.hash, behavior: 'smooth', top: 96 }
    return { top: 0 }
  },
})

/**
 * Sin token no entras al panel; con token no vuelves al login.
 * El rol se comprueba solo si la sesión ya se cargó (si el backend está
 * caído no se echa al usuario: el panel muestra su banner de reintento).
 */
router.beforeEach((to) => {
  const token = getAuthToken()
  const role = getSessionRole()
  const needsAuth = to.matched.some((r) => r.meta.requiresAuth)
  const needsAdmin = to.matched.some((r) => r.meta.requiresAdmin)

  if (needsAuth && !token) {
    // El panel conserva su propio login; las rutas públicas usan /login.
    return {
      path: to.path.startsWith('/admin') ? '/admin/login' : '/login',
      query: { redirect: to.fullPath },
    }
  }
  if (needsAuth && role && needsAdmin && role !== 'admin') {
    notify('error', 'No tienes acceso al panel de administración')
    return { path: '/' }
  }
  if (to.meta.guest && token && role) {
    return { path: role === 'admin' ? '/admin/productos' : '/' }
  }
})

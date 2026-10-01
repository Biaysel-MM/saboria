<script setup>
import { onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuth, getAuthToken } from '../../stores/auth.js'
import { loadAdmin, busy, loaded, loadError } from '../../stores/admin.js'
import { notify } from '../../stores/toasts.js'
import ToastHost from './ToastHost.vue'
import ConfirmModal from './ConfirmModal.vue'

const route = useRoute()
const router = useRouter()
const { user, loading: authLoading, isAuthenticated, signOut } = useAuth()

onMounted(() => {
  // Con token intenta cargar aunque /auth/me falle (back caído): así el
  // usuario ve el toast "no se pudo conectar" en vez de un panel vacío.
  if (isAuthenticated.value || getAuthToken()) loadAdmin()
})

// Solo vuelve al login si el backend rechazó el token (401 lo borra).
// Si simplemente no hubo conexión, el token sigue siendo válido.
// immediate: cubre el caso en que /auth/me responde antes de montar este
// layout (sin cambios después, el watch normal nunca se dispararía).
watch(
  [isAuthenticated, authLoading],
  ([auth, loading]) => {
    if (!loading && !auth && !getAuthToken()) {
      router.replace({
        path: '/admin/login',
        query: { redirect: route.fullPath },
      })
    }
  },
  { immediate: true },
)

// Un cliente con sesión no puede quedarse en el panel (el guard del router
// lo frena si el rol ya estaba cargado; este watch cubre la carga tardía).
watch(
  user,
  (u) => {
    if (u && u.role !== 'admin') {
      notify('error', 'No tienes acceso al panel de administración')
      router.replace('/')
    }
  },
  { immediate: true },
)

function logout() {
  signOut()
  router.replace('/admin/login')
}

const nav = [
  { to: '/admin/productos', icon: 'carbon:dashboard', label: 'Catálogo' },
  { to: '/admin/comentarios', icon: 'carbon:review', label: 'Comentarios' },
  { to: '/admin/usuarios', icon: 'carbon:user', label: 'Usuarios' },
  { to: '/admin/textos', icon: 'carbon:notebook', label: 'Textos del sitio' },
]

function isActive(to) {
  if (to === '/admin/productos') {
    // el catálogo cubre productos y categorías
    return (
      route.path.startsWith('/admin/productos') ||
      route.path.startsWith('/admin/categorias')
    )
  }
  return route.path.startsWith(to)
}
</script>

<template>
  <div class="min-h-screen bg-cream text-ink">
    <ToastHost />
    <ConfirmModal />

    <header class="border-b border-ink/10 bg-white">
      <div class="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-5 py-4">
        <div class="flex items-center gap-3">
          <span class="grid h-10 w-10 place-items-center rounded-2xl bg-ink text-cream">
            <Icon icon="carbon:dashboard" :width="20" :height="20" />
          </span>
          <div>
            <h1 class="font-display text-lg font-semibold leading-tight">
              Panel de Saboria
            </h1>
            <p class="text-xs text-ink/50">
              {{ user?.fullName }} · {{ user?.email }}
            </p>
          </div>
        </div>
        <div class="flex items-center gap-2">
          <router-link
            to="/"
            class="inline-flex items-center gap-1.5 rounded-full border border-ink/15 px-4 py-2 text-sm font-semibold text-ink/70 transition-colors hover:bg-cream"
          >
            <Icon icon="carbon:home" :width="15" :height="15" />
            Ver sitio
          </router-link>
          <button
            type="button"
            class="inline-flex items-center gap-1.5 rounded-full bg-ink px-4 py-2 text-sm font-bold text-cream transition-colors hover:bg-brand"
            @click="logout"
          >
            <Icon icon="carbon:logout" :width="15" :height="15" />
            Salir
          </button>
        </div>
      </div>

      <nav class="mx-auto flex max-w-6xl flex-wrap gap-1 px-5 pb-3">
        <router-link
          v-for="n in nav"
          :key="n.to"
          :to="n.to"
          class="inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-semibold transition-colors"
          :class="
            isActive(n.to)
              ? 'bg-ink text-cream hover:bg-ink hover:text-cream'
              : 'text-ink/60 hover:bg-cream hover:text-ink'
          "
        >
          <Icon :icon="n.icon" :width="15" :height="15" />
          {{ n.label }}
        </router-link>
      </nav>

      <!-- barra de progreso mientras carga/guarda -->
      <div v-if="busy && loaded" class="h-0.5 w-full overflow-hidden bg-ink/5">
        <div class="h-full w-1/3 animate-pulse bg-brand" />
      </div>
    </header>

    <main
      v-if="authLoading || (busy && !loaded)"
      class="flex min-h-[50vh] items-center justify-center gap-2 text-ink/45"
    >
      <Icon icon="carbon:renew" :width="18" :height="18" class="animate-spin" />
      Cargando…
    </main>
    <main v-else class="mx-auto max-w-6xl px-5 py-8">
      <div
        v-if="loadError"
        class="mb-6 flex flex-wrap items-center gap-3 rounded-2xl border border-amber-300 bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-900"
      >
        <Icon icon="carbon:warning-alt" :width="16" :height="16" class="shrink-0" />
        <span class="flex-1 min-w-48">{{ loadError }}</span>
        <button
          type="button"
          class="inline-flex items-center gap-1.5 rounded-full bg-amber-600 px-4 py-1.5 text-xs font-bold text-white transition-colors hover:bg-amber-700"
          @click="loadAdmin({ force: true })"
        >
          <Icon icon="carbon:renew" :width="13" :height="13" />
          Reintentar
        </button>
      </div>
      <router-view />
    </main>
  </div>
</template>

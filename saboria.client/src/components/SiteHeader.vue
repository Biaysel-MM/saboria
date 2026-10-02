<script setup>
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import logo from '../assets/logoSaboria.png'
import { useAuth } from '../stores/auth.js'
import { notify } from '../stores/toasts.js'

const router = useRouter()
const route = useRoute()
const navOpen = ref(false) // menú móvil (hamburgesa)
const accountOpen = ref(false) // desplegable de la cuenta
const accountWrap = ref(null)
const { user, isAuthenticated, isAdmin, signOut } = useAuth()

const initial = computed(() =>
  (user.value?.fullName || '?').trim().charAt(0).toUpperCase(),
)

const roleLabel = computed(() => (isAdmin.value ? 'Administrador' : 'Cliente'))

const links = [
  { hash: '#inicio', label: 'Inicio' },
  { hash: '#menu', label: 'Menú' },
  { hash: '#categorias', label: 'Categorías' },
  { hash: '#contacto', label: 'Contacto' },
]

const onHome = computed(() => route.path === '/')

/** Los enlaces del header apuntan a secciones de la home. Desde otra ruta
 *  (p. ej. /producto/3) se navega a "/" con el ancla para que el scroll
 *  ocurra en la home; si ya se está en la home, solo se desplaza. */
function goTo(hash) {
  closeAll()
  if (onHome.value) {
    document.querySelector(hash)?.scrollIntoView({ behavior: 'smooth' })
    return
  }
  router.push({ path: '/', hash })
}

function toggleAccount() {
  accountOpen.value = !accountOpen.value
  navOpen.value = false
}

function toggleNav() {
  navOpen.value = !navOpen.value
  accountOpen.value = false
}

function closeAll() {
  accountOpen.value = false
  navOpen.value = false
}

function onDocClick(e) {
  if (accountWrap.value && !accountWrap.value.contains(e.target)) {
    accountOpen.value = false
  }
}

function onKey(e) {
  if (e.key === 'Escape') closeAll()
}

onMounted(() => {
  document.addEventListener('click', onDocClick)
  document.addEventListener('keydown', onKey)
})
onBeforeUnmount(() => {
  document.removeEventListener('click', onDocClick)
  document.removeEventListener('keydown', onKey)
})

function logout() {
  closeAll()
  signOut()
  notify('ok', 'Sesión cerrada')
  router.push('/')
}
</script>

<template>
  <header class="fixed top-0 right-0 left-0 z-50 px-4 pt-4 sm:px-6">
    <div class="mx-auto grid max-w-7xl grid-cols-[auto_1fr_auto] items-center gap-4">
      <button
        type="button"
        class="flex items-center"
        aria-label="Saboria — inicio"
        @click="goTo('#inicio')"
      >
        <img :src="logo" alt="Saboria" class="h-11 w-auto" style="filter: brightness(0)" />
      </button>

      <!-- píldora blanca con los enlaces -->
      <nav
        class="hidden justify-self-center rounded-full border border-ink/5 bg-white px-3 py-2 shadow-[0_14px_40px_-18px_rgba(36,26,23,0.5)] md:flex"
        aria-label="Principal"
      >
        <button
          v-for="l in links"
          :key="l.hash"
          type="button"
          class="rounded-full px-4 py-1.5 text-sm font-semibold text-ink/70 transition-colors duration-200 hover:bg-cream hover:text-ink"
          @click="goTo(l.hash)"
        >
          {{ l.label }}
        </button>
      </nav>

      <div class="flex items-center justify-end gap-2">
        <!-- un solo icono de cuenta con menú desplegable; solo en escritorio
             (en teléfonos la cuenta vive dentro del menú hamburguesa) -->
        <div ref="accountWrap" class="relative hidden md:block">
          <button
            type="button"
            class="flex h-11 w-11 items-center justify-center rounded-full border text-sm font-bold transition-colors"
            :class="
              isAuthenticated
                ? 'border-ink bg-ink text-cream hover:border-brand hover:bg-brand'
                : 'border-ink/15 bg-white/70 text-ink backdrop-blur-sm hover:bg-white'
            "
            :aria-expanded="accountOpen"
            aria-haspopup="menu"
            aria-label="Menú de cuenta"
            :title="isAuthenticated ? `Sesión de ${user?.fullName}` : 'Iniciar sesión'"
            @click.stop="toggleAccount"
          >
            <span v-if="isAuthenticated" aria-hidden="true">{{ initial }}</span>
            <Icon v-else icon="carbon:user" :width="18" :height="18" />
          </button>

          <Transition name="drop">
            <div
              v-if="accountOpen"
              class="absolute right-0 top-[calc(100%+10px)] w-64 overflow-hidden rounded-3xl border border-ink/8 bg-white p-2 shadow-[0_24px_60px_-24px_rgba(36,26,23,0.5)]"
              role="menu"
            >
              <!-- quién es -->
              <div v-if="isAuthenticated" class="px-3 pt-2 pb-1">
                <div class="flex items-center gap-2.5">
                  <span
                    class="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-ink text-sm font-bold text-cream"
                  >
                    {{ initial }}
                  </span>
                  <div class="min-w-0">
                    <p class="truncate text-sm font-bold text-ink">
                      {{ user?.fullName }}
                    </p>
                    <p class="truncate text-xs text-ink/50">{{ user?.email }}</p>
                  </div>
                </div>
                <span
                  class="mt-2 inline-block rounded-full bg-brand/10 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-[0.12em] text-brand"
                >
                  {{ roleLabel }}
                </span>
              </div>
              <div v-else class="px-3 pt-2 pb-1">
                <p class="text-sm font-bold text-ink">Hola, invitado</p>
                <p class="text-xs text-ink/50">Inicia sesión para dejar reseñas.</p>
              </div>

              <div class="my-1.5 h-px bg-ink/10" />

              <button type="button" role="menuitem" class="menu-item" @click="goTo('#menu')">
                <Icon icon="carbon:menu" :width="16" :height="16" />
                Ver menú
              </button>
              <router-link
                v-if="isAdmin"
                to="/admin/productos"
                role="menuitem"
                class="menu-item"
                @click="closeAll"
              >
                <Icon icon="carbon:dashboard" :width="16" :height="16" />
                Panel de administración
              </router-link>

              <template v-if="isAuthenticated">
                <button
                  type="button"
                  role="menuitem"
                  class="menu-item w-full"
                  @click="logout"
                >
                  <Icon icon="carbon:logout" :width="16" :height="16" />
                  Cerrar sesión
                </button>
              </template>
              <template v-else>
                <router-link to="/login" role="menuitem" class="menu-item" @click="closeAll">
                  <Icon icon="carbon:login" :width="16" :height="16" />
                  Entrar
                </router-link>
                <router-link
                  to="/registro"
                  role="menuitem"
                  class="menu-item"
                  @click="closeAll"
                >
                  <Icon icon="carbon:add" :width="16" :height="16" />
                  Crear cuenta
                </router-link>
              </template>
            </div>
          </Transition>
        </div>

        <button
          type="button"
          class="flex h-11 w-11 items-center justify-center rounded-full border border-ink/15 bg-white/70 text-ink backdrop-blur-sm transition-colors hover:bg-white md:hidden"
          :aria-expanded="navOpen"
          aria-label="Abrir menú"
          @click="toggleNav"
        >
          <svg v-if="!navOpen" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
            <path d="M3 6h18M3 12h18M3 18h18" />
          </svg>
          <svg v-else width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
            <path d="M18 6 6 18M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>

    <Transition name="menu">
      <nav
        v-if="navOpen"
        class="mx-auto mt-2 flex max-w-7xl flex-col gap-1 rounded-3xl border border-ink/5 bg-white p-4 shadow-[0_20px_50px_-24px_rgba(36,26,23,0.5)] md:hidden"
        aria-label="Móvil"
      >
        <button
          v-for="l in links"
          :key="'m-' + l.hash"
          type="button"
          class="rounded-xl px-3 py-2.5 text-left text-sm font-semibold text-ink/75 transition-colors hover:bg-cream hover:text-ink"
          @click="goTo(l.hash)"
        >
          {{ l.label }}
        </button>

        <div class="my-2 h-px bg-ink/10" />

        <!-- sesión: la misma información del desplegable de escritorio -->
        <div v-if="isAuthenticated" class="flex items-center gap-2.5 px-3 py-1.5">
          <span
            class="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-ink text-sm font-bold text-cream"
          >
            {{ initial }}
          </span>
          <div class="min-w-0">
            <p class="truncate text-sm font-bold text-ink">
              {{ user?.fullName }}
            </p>
            <p class="truncate text-xs text-ink/50">{{ user?.email }}</p>
            <span
              class="mt-1 inline-block rounded-full bg-brand/10 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-[0.12em] text-brand"
            >
              {{ roleLabel }}
            </span>
          </div>
        </div>
        <div v-else class="px-3 py-1.5">
          <p class="text-sm font-bold text-ink">Hola, invitado</p>
          <p class="text-xs text-ink/50">Inicia sesión para dejar reseñas.</p>
        </div>

        <router-link
          v-if="isAdmin"
          to="/admin/productos"
          role="menuitem"
          class="menu-item"
          @click="navOpen = false"
        >
          <Icon icon="carbon:dashboard" :width="16" :height="16" />
          Panel de administración
        </router-link>

        <button
          v-if="isAuthenticated"
          type="button"
          role="menuitem"
          class="menu-item w-full"
          @click="logout"
        >
          <Icon icon="carbon:logout" :width="16" :height="16" />
          Cerrar sesión
        </button>
        <template v-else>
          <router-link to="/login" role="menuitem" class="menu-item" @click="navOpen = false">
            <Icon icon="carbon:login" :width="16" :height="16" />
            Entrar
          </router-link>
          <router-link
            to="/registro"
            role="menuitem"
            class="menu-item"
            @click="navOpen = false"
          >
            <Icon icon="carbon:add" :width="16" :height="16" />
            Crear cuenta
          </router-link>
        </template>
      </nav>
    </Transition>
  </header>
</template>

<style scoped>
.menu-item {
  display: flex;
  align-items: center;
  gap: 0.625rem;
  width: 100%;
  border-radius: 0.9rem;
  padding: 0.6rem 0.75rem;
  font-size: 0.875rem;
  font-weight: 600;
  color: rgba(36, 26, 23, 0.75);
  text-align: left;
  transition:
    background-color 0.2s ease,
    color 0.2s ease;
}

.menu-item:hover {
  background: #faf5ee;
  color: #241a17;
}

.menu-enter-active,
.menu-leave-active {
  transition:
    opacity 0.25s ease,
    transform 0.25s ease;
}

.menu-enter-from,
.menu-leave-to {
  opacity: 0;
  transform: translateY(-8px);
}

.drop-enter-active,
.drop-leave-active {
  transition:
    opacity 0.18s ease,
    transform 0.18s ease;
}

.drop-enter-from,
.drop-leave-to {
  opacity: 0;
  transform: translateY(-6px);
}
</style>

<script setup>
import { onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuth } from '../stores/auth.js'
import { notify } from '../stores/toasts.js'
import ToastHost from '../components/admin/ToastHost.vue'

const route = useRoute()
const router = useRouter()
const { user, loading: authLoading, isAuthenticated, signIn } = useAuth()

const email = ref(String(route.query.email || ''))
const password = ref('')
const showPassword = ref(false)
const loggingIn = ref(false)
// Tras un login propio, el watch de sesión no debe redirigir por su cuenta
// (evita que pise el destino elegido aquí, p. ej. el panel de admin).
let justLoggedIn = false

function friendly(message = '') {
  if (/credenciales inválidas/i.test(message)) return 'Correo o contraseña incorrectos'
  if (/desactivada/i.test(message))
    return 'Esta cuenta está desactivada. Contacta con el administrador.'
  if (/password must be longer than or equal to 6/i.test(message))
    return 'La contraseña debe tener al menos 6 caracteres'
  if (/email must be an email/i.test(message)) return 'Introduce un correo válido'
  if (/No se pudo conectar|servidor/i.test(message)) return message
  return message
}

async function submitLogin() {
  loggingIn.value = true
  const res = await signIn(email.value.trim(), password.value)
  loggingIn.value = false

  if (res.needsVerification) {
    notify('warn', 'Debes verificar tu correo antes de entrar')
    router.push({ path: '/verificar', query: { email: email.value.trim() } })
    return
  }
  if (!res.success) {
    notify('error', friendly(res.error))
    return
  }
  justLoggedIn = true
  notify('ok', `¡Hola de nuevo, ${res.user?.fullName || ''}!`)
  const role = res.user?.role
  router.replace(
    role === 'admin'
      ? String(route.query.redirect || '/admin/productos')
      : '/',
  )
}

// Si ya había sesión (token), al cargar el usuario se sale de aquí.
watch(
  [user, authLoading],
  ([u, loading]) => {
    if (loading || !u || justLoggedIn) return
    router.replace(u.role === 'admin' ? '/admin/productos' : '/')
  },
  { immediate: true },
)

onMounted(() => {
  if (isAuthenticated.value) return // lo resuelve el watch
})
</script>

<template>
  <div class="flex min-h-screen items-center justify-center bg-cream px-5">
    <ToastHost />
    <div class="w-full max-w-md">
      <div class="mb-6 text-center">
        <span
          class="mx-auto grid h-14 w-14 place-items-center rounded-3xl bg-ink text-cream"
        >
          <Icon icon="carbon:login" :width="26" :height="26" />
        </span>
        <h1 class="mt-4 font-display text-2xl font-semibold">Entrar a Saboria</h1>
        <p class="mt-1 text-sm text-ink/55">
          Entra para calificar productos y dejar tus comentarios.
        </p>
      </div>

      <form
        class="rounded-3xl border border-ink/10 bg-white p-8 shadow-[0_24px_60px_-30px_rgba(36,26,23,0.4)]"
        @submit.prevent="submitLogin"
      >
        <label class="block text-xs font-bold uppercase tracking-[0.12em] text-ink/50">
          Correo
        </label>
        <input
          v-model="email"
          type="email"
          autocomplete="username"
          placeholder="tu@correo.do"
          class="mt-1.5 w-full rounded-xl border border-ink/15 px-4 py-2.5 text-sm outline-none transition-colors focus:border-brand"
        />

        <label
          class="mt-5 block text-xs font-bold uppercase tracking-[0.12em] text-ink/50"
        >
          Contraseña
        </label>
        <div class="relative mt-1.5">
          <input
            v-model="password"
            :type="showPassword ? 'text' : 'password'"
            autocomplete="current-password"
            placeholder="••••••••"
            class="w-full rounded-xl border border-ink/15 px-4 py-2.5 pr-11 text-sm outline-none transition-colors focus:border-brand"
          />
          <button
            type="button"
            class="absolute right-1.5 top-1/2 grid h-8 w-8 -translate-y-1/2 place-items-center rounded-lg text-ink/45 transition-colors hover:bg-cream hover:text-ink"
            :aria-label="showPassword ? 'Ocultar contraseña' : 'Ver contraseña'"
            :title="showPassword ? 'Ocultar contraseña' : 'Ver contraseña'"
            @click="showPassword = !showPassword"
          >
            <Icon
              :icon="showPassword ? 'carbon:view-off' : 'carbon:view'"
              :width="18"
              :height="18"
            />
          </button>
        </div>

        <button
          type="submit"
          :disabled="loggingIn"
          class="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-full bg-ink py-3 text-sm font-bold text-cream transition-all hover:bg-brand disabled:opacity-50"
        >
          <Icon
            :icon="loggingIn ? 'carbon:renew' : 'carbon:login'"
            :width="16"
            :height="16"
            :class="loggingIn ? 'animate-spin' : ''"
          />
          {{ loggingIn ? 'Entrando…' : 'Entrar' }}
        </button>

        <p class="mt-5 text-center text-sm text-ink/55">
          ¿No tienes cuenta?
          <router-link
            to="/registro"
            class="font-semibold text-brand transition-colors hover:underline"
          >
            Regístrate
          </router-link>
        </p>

        <router-link
          to="/"
          class="mt-4 inline-flex w-full items-center justify-center gap-1.5 text-sm text-ink/50 transition-colors hover:text-brand"
        >
          <Icon icon="carbon:home" :width="14" :height="14" />
          Volver al sitio
        </router-link>
      </form>

      <p v-if="authLoading" class="mt-4 text-center text-xs text-ink/40">
        Comprobando sesión…
      </p>
    </div>
  </div>
</template>

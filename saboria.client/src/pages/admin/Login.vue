<script setup>
import { onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuth } from '../../stores/auth.js'
import { notify } from '../../stores/toasts.js'
import ToastHost from '../../components/admin/ToastHost.vue'

const route = useRoute()
const router = useRouter()
const { user, isAuthenticated, loading: authLoading, signIn } = useAuth()

const email = ref('admin@saboria.do')
const password = ref('')
const showPassword = ref(false)
const loggingIn = ref(false)

/** Los errores del servidor se traducen y se muestran SIEMPRE como toast. */
function friendly(message = '') {
  if (/password must be longer than or equal to 6/i.test(message))
    return 'La contraseña debe tener al menos 6 caracteres'
  if (/email must be an email/i.test(message))
    return 'Introduce un correo válido'
  if (/unauthorized|credenciales|credentials|invalid/i.test(message))
    return 'Correo o contraseña incorrectos'
  return message
}

async function submitLogin() {
  loggingIn.value = true
  const res = await signIn(email.value.trim(), password.value)
  loggingIn.value = false
  if (!res.success) {
    notify('error', friendly(res.error))
    return
  }
  notify('ok', `¡Bienvenido, ${user.value?.fullName || 'admin'}!`)
  router.replace(route.query.redirect || '/admin/productos')
}

onMounted(() => {
  if (isAuthenticated.value) {
    router.replace(route.query.redirect || '/admin/productos')
  }
})
</script>

<template>
  <div class="flex min-h-screen items-center justify-center bg-cream px-5">
    <ToastHost />
    <div class="w-full max-w-md">
      <div class="mb-6 text-center">
        <span class="mx-auto grid h-14 w-14 place-items-center rounded-3xl bg-ink text-cream">
          <Icon icon="carbon:login" :width="26" :height="26" />
        </span>
        <h1 class="mt-4 font-display text-2xl font-semibold">Saboria — Admin</h1>
        <p class="mt-1 text-sm text-ink/55">
          Entra para editar productos, categorías y textos del sitio.
        </p>
      </div>

      <form
        class="rounded-3xl border border-ink/10 bg-white p-8 shadow-[0_24px_60px_-30px_rgba(36,26,23,0.4)]"
        @submit.prevent="submitLogin"
      >
        <label
          class="block text-xs font-bold uppercase tracking-[0.12em] text-ink/50"
        >
          Correo
        </label>
        <input
          v-model="email"
          type="email"
          autocomplete="username"
          placeholder="admin@saboria.do"
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

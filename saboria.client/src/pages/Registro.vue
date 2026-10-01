<script setup>
import { ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useAuth } from '../stores/auth.js'
import { notify } from '../stores/toasts.js'
import ToastHost from '../components/admin/ToastHost.vue'

const router = useRouter()
const { user, loading: authLoading, register } = useAuth()

const fullName = ref('')
const email = ref('')
const password = ref('')
const showPassword = ref(false)
const sending = ref(false)

function friendly(message = '') {
  if (/ya tiene una cuenta/i.test(message)) return 'Este correo ya tiene una cuenta'
  if (/password must be longer than or equal to 6/i.test(message))
    return 'La contraseña debe tener al menos 6 caracteres'
  if (/email must be an email/i.test(message)) return 'Introduce un correo válido'
  if (/full.?name/i.test(message)) return 'Escribe tu nombre completo'
  return message
}

async function submitRegister() {
  if (password.value.length < 6) {
    notify('error', 'La contraseña debe tener al menos 6 caracteres')
    return
  }
  sending.value = true
  const res = await register({
    fullName: fullName.value.trim(),
    email: email.value.trim(),
    password: password.value,
  })
  sending.value = false

  if (!res.success) {
    notify('error', friendly(res.error))
    return
  }
  notify('ok', 'Cuenta creada. Revisa tu correo para el código de verificación')
  router.push({
    path: '/verificar',
    query: { email: res.email, ...(res.devCode ? { dev: res.devCode } : {}) },
  })
}

// Sesión ya iniciada → salir de aquí.
watch(
  [user, authLoading],
  ([u, loading]) => {
    if (loading || !u) return
    router.replace(u.role === 'admin' ? '/admin/productos' : '/')
  },
  { immediate: true },
)
</script>

<template>
  <div class="flex min-h-screen items-center justify-center bg-cream px-5 py-10">
    <ToastHost />
    <div class="w-full max-w-md">
      <div class="mb-6 text-center">
        <span
          class="mx-auto grid h-14 w-14 place-items-center rounded-3xl bg-ink text-cream"
        >
          <Icon icon="carbon:user" :width="26" :height="26" />
        </span>
        <h1 class="mt-4 font-display text-2xl font-semibold">Crea tu cuenta</h1>
        <p class="mt-1 text-sm text-ink/55">
          Califica tus favoritos y deja comentarios en el menú.
        </p>
      </div>

      <form
        class="rounded-3xl border border-ink/10 bg-white p-8 shadow-[0_24px_60px_-30px_rgba(36,26,23,0.4)]"
        @submit.prevent="submitRegister"
      >
        <label class="block text-xs font-bold uppercase tracking-[0.12em] text-ink/50">
          Nombre
        </label>
        <input
          v-model="fullName"
          type="text"
          autocomplete="name"
          placeholder="Tu nombre"
          required
          minlength="2"
          maxlength="120"
          class="mt-1.5 w-full rounded-xl border border-ink/15 px-4 py-2.5 text-sm outline-none transition-colors focus:border-brand"
        />

        <label
          class="mt-5 block text-xs font-bold uppercase tracking-[0.12em] text-ink/50"
        >
          Correo
        </label>
        <input
          v-model="email"
          type="email"
          autocomplete="email"
          placeholder="tu@correo.do"
          required
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
            autocomplete="new-password"
            placeholder="Mínimo 6 caracteres"
            required
            minlength="6"
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
          :disabled="sending"
          class="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-full bg-ink py-3 text-sm font-bold text-cream transition-all hover:bg-brand disabled:opacity-50"
        >
          <Icon
            :icon="sending ? 'carbon:renew' : 'carbon:send'"
            :width="16"
            :height="16"
            :class="sending ? 'animate-spin' : ''"
          />
          {{ sending ? 'Creando cuenta…' : 'Crear cuenta' }}
        </button>

        <p class="mt-5 text-center text-sm text-ink/55">
          ¿Ya tienes cuenta?
          <router-link
            to="/login"
            class="font-semibold text-brand transition-colors hover:underline"
          >
            Inicia sesión
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
    </div>
  </div>
</template>

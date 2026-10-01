<script setup>
import { onBeforeUnmount, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuth } from '../stores/auth.js'
import { notify } from '../stores/toasts.js'
import ToastHost from '../components/admin/ToastHost.vue'

const route = useRoute()
const router = useRouter()
const { user, loading: authLoading, verifyCode, resendCode } = useAuth()

const email = ref(String(route.query.email || ''))
const devHint = ref(String(route.query.dev || ''))
const code = ref('')
const checking = ref(false)
const resending = ref(false)
const cooldown = ref(0)
let timer = null

function startCooldown() {
  cooldown.value = 30
  clearInterval(timer)
  timer = setInterval(() => {
    cooldown.value -= 1
    if (cooldown.value <= 0) clearInterval(timer)
  }, 1000)
}
onBeforeUnmount(() => clearInterval(timer))

async function submitVerify() {
  const cleanEmail = email.value.trim()
  const cleanCode = code.value.replace(/\D/g, '')
  if (!cleanEmail) {
    notify('error', 'Escribe tu correo')
    return
  }
  if (cleanCode.length !== 6) {
    notify('error', 'El código tiene 6 dígitos')
    return
  }
  checking.value = true
  const res = await verifyCode(cleanEmail, cleanCode)
  checking.value = false
  if (!res.success) {
    notify('error', res.error)
    return
  }
  notify('ok', '¡Cuenta verificada! Bienvenido a Saboria')
  router.replace('/')
}

async function resend() {
  const cleanEmail = email.value.trim()
  if (!cleanEmail) {
    notify('error', 'Escribe tu correo para reenviar el código')
    return
  }
  resending.value = true
  const res = await resendCode(cleanEmail)
  resending.value = false
  if (!res.success) {
    notify('error', res.error)
    return
  }
  notify('ok', 'Código reenviado. Revisa tu correo')
  // Sin SMTP (modo desarrollo) el backend devuelve el código aquí.
  if (res.devCode) {
    devHint.value = res.devCode
    notify('warn', `Modo desarrollo: tu código es ${res.devCode}`)
  }
  startCooldown()
}

// Sesión ya iniciada (p. ej. tras verificar) → salir de aquí.
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
  <div class="flex min-h-screen items-center justify-center bg-cream px-5">
    <ToastHost />
    <div class="w-full max-w-md">
      <div class="mb-6 text-center">
        <span
          class="mx-auto grid h-14 w-14 place-items-center rounded-3xl bg-ink text-cream"
        >
          <Icon icon="carbon:email" :width="26" :height="26" />
        </span>
        <h1 class="mt-4 font-display text-2xl font-semibold">Verifica tu correo</h1>
        <p class="mt-1 text-sm text-ink/55">
          Te enviamos un código de 6 dígitos. Escríbelo para activar tu cuenta.
        </p>
      </div>

      <form
        class="rounded-3xl border border-ink/10 bg-white p-8 shadow-[0_24px_60px_-30px_rgba(36,26,23,0.4)]"
        @submit.prevent="submitVerify"
      >
        <label class="block text-xs font-bold uppercase tracking-[0.12em] text-ink/50">
          Correo
        </label>
        <input
          v-model="email"
          type="email"
          autocomplete="email"
          placeholder="tu@correo.do"
          class="mt-1.5 w-full rounded-xl border border-ink/15 px-4 py-2.5 text-sm outline-none transition-colors focus:border-brand"
        />

        <label
          class="mt-5 block text-xs font-bold uppercase tracking-[0.12em] text-ink/50"
        >
          Código de verificación
        </label>
        <input
          v-model="code"
          type="text"
          inputmode="numeric"
          autocomplete="one-time-code"
          maxlength="6"
          placeholder="000000"
          class="mt-1.5 w-full rounded-xl border border-ink/15 px-4 py-3 text-center font-display text-2xl font-semibold tracking-[0.5em] outline-none transition-colors focus:border-brand"
          @input="code = code.replace(/\D/g, '').slice(0, 6)"
        />

        <div
          v-if="devHint"
          class="mt-4 flex items-center gap-2 rounded-xl border border-amber-300 bg-amber-50 px-3 py-2 text-xs font-semibold text-amber-900"
        >
          <Icon icon="carbon:warning-alt" :width="14" :height="14" class="shrink-0" />
          Modo desarrollo (sin correo configurado): usa el código
          <strong class="tracking-[0.2em]">{{ devHint }}</strong>
        </div>

        <button
          type="submit"
          :disabled="checking"
          class="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-full bg-ink py-3 text-sm font-bold text-cream transition-all hover:bg-brand disabled:opacity-50"
        >
          <Icon
            :icon="checking ? 'carbon:renew' : 'carbon:checkmark'"
            :width="16"
            :height="16"
            :class="checking ? 'animate-spin' : ''"
          />
          {{ checking ? 'Comprobando…' : 'Verificar y entrar' }}
        </button>

        <button
          type="button"
          :disabled="resending || cooldown > 0"
          class="mt-3 inline-flex w-full items-center justify-center gap-1.5 rounded-full border border-ink/15 py-2.5 text-sm font-semibold text-ink/65 transition-colors hover:bg-cream hover:text-ink disabled:opacity-50"
          @click="resend"
        >
          <Icon icon="carbon:send" :width="14" :height="14" />
          {{
            cooldown > 0
              ? `Reenviar en ${cooldown}s`
              : resending
                ? 'Reenviando…'
                : 'Reenviar código'
          }}
        </button>

        <router-link
          to="/login"
          class="mt-4 inline-flex w-full items-center justify-center gap-1.5 text-sm text-ink/50 transition-colors hover:text-brand"
        >
          <Icon icon="carbon:login" :width="14" :height="14" />
          Volver a iniciar sesión
        </router-link>
      </form>
    </div>
  </div>
</template>

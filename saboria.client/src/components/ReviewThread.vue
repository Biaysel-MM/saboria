<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import StarRating from './StarRating.vue'
import { api } from '../services/api.js'
import { notify } from '../stores/toasts.js'
import { useAuth } from '../stores/auth.js'
import { askConfirm } from '../stores/confirm.js'
import { formatDate, nameInitial } from '../utils/format.js'

/**
 * Una reseña con sus respuestas recogidas: la lista sale cerrada y se
 * despliega al pulsar. Emite `edit`, `remove` y `changed` (tras responder,
 * editar o borrar) para que la vista padre recargue la lista.
 */
const props = defineProps({
  review: { type: Object, required: true },
  loginRedirect: { type: String, default: '/login' },
})

const emit = defineEmits(['edit', 'remove', 'changed'])

const router = useRouter()
const { isAuthenticated, user } = useAuth()

const showReplies = ref(false)
const replying = ref(false)
const replyText = ref('')
const replyBusy = ref(false)

const isMine = () => !!user.value && props.review.user?.id === user.value.id

function toggleReplies() {
  showReplies.value = !showReplies.value
}

function toggleReply() {
  if (!isAuthenticated.value) {
    router.push({
      path: props.loginRedirect,
      query: { redirect: router.currentRoute.value.fullPath },
    })
    return
  }
  replying.value = !replying.value
  replyText.value = ''
}

async function sendReply() {
  const text = replyText.value.trim()
  if (!text || replyBusy.value) return
  replyBusy.value = true
  try {
    await api.post(`/reviews/${props.review.id}/replies`, { comment: text })
    replying.value = false
    replyText.value = ''
    showReplies.value = true
    notify('ok', 'Respuesta publicada')
    emit('changed')
  } catch (e) {
    notify('error', e.message)
  } finally {
    replyBusy.value = false
  }
}

async function deleteReply(rep) {
  const ok = await askConfirm('¿Eliminar tu respuesta? No se puede deshacer.', {
    title: 'Eliminar respuesta',
    confirmLabel: 'Eliminar',
  })
  if (!ok) return
  try {
    await api.delete(`/reviews/${rep.id}`)
    notify('ok', 'Respuesta eliminada')
    emit('changed')
  } catch (e) {
    notify('error', e.message)
  }
}
</script>

<template>
  <li class="rounded-2xl border border-ink/8 bg-white p-4">
    <div class="flex items-start justify-between gap-2">
      <span class="flex min-w-0 items-center gap-2">
        <span
          class="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-brand/15 text-[11px] font-bold text-brand"
        >
          {{ nameInitial(review.user) }}
        </span>
        <span class="truncate text-sm font-semibold text-ink">
          {{ review.user?.fullName || 'Cliente' }}
        </span>
        <span
          v-if="isMine()"
          class="shrink-0 rounded-full bg-brand/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.1em] text-brand"
        >
          Tu reseña
        </span>
      </span>
      <span class="flex shrink-0 items-center gap-1">
        <span class="mr-1 text-xs text-ink/40">{{ formatDate(review.createdAt) }}</span>
        <template v-if="isMine()">
          <button
            type="button"
            class="grid h-7 w-7 place-items-center rounded-lg text-ink/45 transition-colors hover:bg-cream hover:text-ink"
            aria-label="Editar reseña"
            title="Editar"
            @click="emit('edit', review)"
          >
            <Icon icon="carbon:edit" :width="14" :height="14" />
          </button>
          <button
            type="button"
            class="grid h-7 w-7 place-items-center rounded-lg text-ink/45 transition-colors hover:bg-cream hover:text-red-600"
            aria-label="Eliminar reseña"
            title="Eliminar"
            @click="emit('remove', review)"
          >
            <Icon icon="carbon:trash-can" :width="14" :height="14" />
          </button>
        </template>
      </span>
    </div>

    <div class="mt-1.5 flex items-center gap-2">
      <StarRating :value="review.rating" :size="14" />
    </div>

    <p v-if="review.comment" class="mt-2 text-sm leading-relaxed text-ink/70">
      {{ review.comment }}
    </p>

    <!-- respuestas: plegadas por defecto (estilo mensaje, un solo nivel) -->
    <button
      v-if="review.replies?.length"
      type="button"
      class="mt-3 inline-flex items-center gap-1.5 text-xs font-bold text-ink/45 transition-colors hover:text-brand mr-2"
      :aria-expanded="showReplies"
      @click="toggleReplies"
    >
      <Icon
        :icon="showReplies ? 'carbon:chevron-up' : 'carbon:chevron-down'"
        :width="14"
        :height="14"
      />
      {{ review.replies.length }}
      {{ review.replies.length === 1 ? 'respuesta' : 'respuestas' }}
    </button>

    <ul v-if="review.replies?.length && showReplies" class="mt-3 space-y-2 border-t border-ink/8 pt-3">
      <li v-for="rep in review.replies" :key="rep.id" class="flex items-start gap-2">
        <span
          class="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-brand/15 text-[11px] font-bold text-brand"
        >
          {{ nameInitial(rep.user) }}
        </span>
        <div class="min-w-0 flex-1 rounded-2xl rounded-tl-sm bg-cream/80 px-3 py-2">
          <div class="flex items-center justify-between gap-2">
            <span class="text-xs font-bold text-ink">{{ rep.user?.fullName || 'Cliente' }}</span>
            <span class="text-[10px] text-ink/40">{{ formatDate(rep.createdAt) }}</span>
          </div>
          <p class="mt-0.5 break-words text-sm leading-relaxed text-ink/75">{{ rep.comment }}</p>
        </div>
        <button
          v-if="user && rep.user?.id === user.id"
          type="button"
          class="grid h-7 w-7 shrink-0 place-items-center rounded-lg text-ink/35 transition-colors hover:bg-white hover:text-red-600"
          aria-label="Eliminar respuesta"
          title="Eliminar"
          @click="deleteReply(rep)"
        >
          <Icon icon="carbon:trash-can" :width="13" :height="13" />
        </button>
      </li>
    </ul>

    <button
      type="button"
      class="mt-3 inline-flex items-center gap-1.5 text-xs font-bold text-ink/45 transition-colors hover:text-brand"
      @click="toggleReply"
    >
      <Icon icon="carbon:reply" :width="14" :height="14" />
      Responder
    </button>

    <div v-if="replying" class="mt-2.5 rounded-xl border border-ink/10 bg-white p-2.5">
      <textarea
        v-model="replyText"
        rows="2"
        maxlength="1000"
        placeholder="Escribe una respuesta…"
        class="w-full resize-none rounded-lg border border-ink/15 px-3 py-2 text-sm outline-none transition-colors focus:border-brand"
      />
      <div class="mt-2 flex items-center justify-between gap-3">
        <span class="text-[11px] text-ink/40">{{ replyText.length }}/1000</span>
        <div class="flex gap-2">
          <button
            type="button"
            class="rounded-full border border-ink/15 px-3.5 py-1.5 text-xs font-semibold text-ink/60 transition-colors hover:text-ink"
            @click="replying = false"
          >
            Cancelar
          </button>
          <button
            type="button"
            :disabled="replyBusy || !replyText.trim()"
            class="inline-flex items-center gap-1.5 rounded-full bg-ink px-4 py-1.5 text-xs font-bold text-cream transition-colors hover:bg-brand disabled:opacity-50"
            @click="sendReply"
          >
            <Icon
              :icon="replyBusy ? 'carbon:renew' : 'carbon:send'"
              :width="13"
              :height="13"
              :class="replyBusy ? 'animate-spin' : ''"
            />
            {{ replyBusy ? 'Enviando…' : 'Enviar' }}
          </button>
        </div>
      </div>
    </div>
  </li>
</template>
<script setup>
import { reactive, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import StarRating from './StarRating.vue'
import { api } from '../services/api.js'
import { notify } from '../stores/toasts.js'
import { useAuth } from '../stores/auth.js'

/**
 * Formulario de reseña: publica una nueva o edita una propia (`editing`).
 * Emite `saved` con el resumen nuevo para que la vista lo muestre.
 */
const props = defineProps({
  productId: { type: [Number, String], required: true },
  /** Reseña propia que se está editando (null = reseña nueva). */
  editing: { type: Object, default: null },
  loginRedirect: { type: String, default: '/login' },
})

const emit = defineEmits(['saved', 'cancel-edit'])

const router = useRouter()
const { isAuthenticated } = useAuth()

const submitting = ref(false)
const form = reactive({ rating: 0, comment: '' })

// Al editar, el formulario refleja la reseña cargada; al cancelar o al
// cambiar de objetivo vuelve al estado "nueva".
watch(
  () => props.editing,
  (r) => {
    form.rating = r?.rating || 0
    form.comment = r?.comment || ''
  },
  { immediate: true },
)

function cancel() {
  form.rating = 0
  form.comment = ''
  emit('cancel-edit')
}

async function submit() {
  if (submitting.value) return
  if (!form.rating) {
    notify('error', 'Elige cuántas estrellas quieres poner')
    return
  }
  submitting.value = true
  try {
    const payload = { rating: form.rating, comment: form.comment.trim() || undefined }
    const data = props.editing
      ? await api.put(`/reviews/${props.editing.id}`, payload)
      : await api.post(`/products/${props.productId}/reviews`, payload)
    notify('ok', props.editing ? 'Reseña actualizada' : 'Reseña publicada')
    cancel()
    emit('saved', { summary: data.summary })
  } catch (e) {
    notify('error', e.message)
  } finally {
    submitting.value = false
  }
}

function goLogin() {
  router.push({ path: props.loginRedirect, query: { redirect: router.currentRoute.value.fullPath } })
}
</script>

<template>
  <section
    class="rounded-2xl border border-ink/10 bg-cream/70 p-4"
    aria-label="Tu reseña"
  >
    <template v-if="!isAuthenticated">
      <p class="text-sm leading-relaxed text-ink/65">
        Inicia sesión para calificar este producto y dejar tu comentario.
      </p>
      <button
        type="button"
        class="mt-3 inline-flex items-center gap-1.5 rounded-full bg-ink px-5 py-2.5 text-sm font-bold text-cream transition-colors hover:bg-brand"
        @click="goLogin"
      >
        <Icon icon="carbon:login" :width="15" :height="15" />
        Iniciar sesión
      </button>
    </template>

    <template v-else>
      <p class="text-xs font-bold uppercase tracking-[0.12em] text-ink/50">
        {{ editing ? 'Edita tu reseña' : 'Califica este producto' }}
      </p>
      <div class="mt-2 flex items-center gap-3">
        <StarRating
          :value="form.rating"
          :size="26"
          editable
          @select="(n) => (form.rating = n)"
        />
        <span class="text-sm font-semibold text-ink/70">
          {{ form.rating ? `${form.rating} de 5` : 'Sin calificar' }}
        </span>
      </div>
      <textarea
        v-model="form.comment"
        rows="3"
        maxlength="1000"
        placeholder="Cuéntanos qué te pareció (opcional)"
        class="mt-3 w-full resize-none rounded-xl border border-ink/15 bg-white px-3.5 py-2.5 text-sm outline-none transition-colors focus:border-brand"
      />
      <div class="mt-3 flex items-center justify-between gap-3">
        <span class="text-xs text-ink/40">{{ form.comment.length }}/1000</span>
        <div class="flex gap-2">
          <button
            v-if="editing"
            type="button"
            class="rounded-full border border-ink/15 px-4 py-2 text-sm font-semibold text-ink/60 transition-colors hover:bg-white hover:text-ink"
            @click="cancel"
          >
            Cancelar
          </button>
          <button
            type="button"
            :disabled="submitting"
            class="inline-flex items-center gap-1.5 rounded-full bg-ink px-5 py-2 text-sm font-bold text-cream transition-colors hover:bg-brand disabled:opacity-50"
            @click="submit"
          >
            <Icon
              :icon="submitting ? 'carbon:renew' : 'carbon:send'"
              :width="14"
              :height="14"
              :class="submitting ? 'animate-spin' : ''"
            />
            {{ submitting ? 'Enviando…' : editing ? 'Guardar cambios' : 'Publicar' }}
          </button>
        </div>
      </div>
    </template>
  </section>
</template>
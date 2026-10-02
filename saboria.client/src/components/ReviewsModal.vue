<script setup>
import { computed, reactive, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { api } from '../services/api.js'
import { notify } from '../stores/toasts.js'
import { useAuth } from '../stores/auth.js'
import { askConfirm } from '../stores/confirm.js'
import { categories, products, resolveImage } from '../data/products.js'
import { activeReviewProduct, closeReviews } from '../state/reviews.js'
import StarRating from './StarRating.vue'

const router = useRouter()
const { isAuthenticated, user } = useAuth()

const loading = ref(false)
const submitting = ref(false)
const editingId = ref(null)
const formSection = ref(null)
const reviews = ref([])
const summary = reactive({ avg: 0, count: 0 })

const form = reactive({ rating: 0, comment: '' })

// Respuesta plana a una reseña (un solo nivel; varias permitidas).
const replyTo = ref(null)
const replyText = ref('')
const replyBusy = ref(false)

const product = computed(() => activeReviewProduct.value)
const open = computed(() => !!product.value)

const GENERAL_IMAGE = resolveImage('categoriaGeneral.png')

/** Icono de cabecera = imagen de la categoría del producto (o la general).
 *  Se lee del catálogo reactivo: si el admin cambia la foto de la
 *  categoría, el modal la toma al instante. */
const headerImage = computed(() => {
  const p = product.value
  if (!p) return GENERAL_IMAGE
  const cat =
    categories.find((c) => c.id === p.categoryId) ||
    categories.find((c) => c.name === p.tag)
  return resolveImage(cat?.imageUrl) || GENERAL_IMAGE
})

/** Sincroniza el promedio visible en la tarjeta del producto. */
function syncCard() {
  const p = products.find((x) => x.id === product.value?.id)
  if (p) {
    p.ratingAvg = summary.avg
    p.ratingCount = summary.count
  }
}

async function load() {
  if (!product.value) return
  loading.value = true
  try {
    const data = await api.get(`/products/${product.value.id}/reviews`)
    // Todas las reseñas visibles, incluidas las del propio usuario (se
    // marcan con "Tu reseña" y traen editar/borrar). Se permiten varias.
    reviews.value = data.reviews || []
    summary.avg = data.summary?.avg || 0
    summary.count = data.summary?.count || 0
    cancelEdit()
    syncCard()
  } catch (e) {
    notify('error', e.message)
  } finally {
    loading.value = false
  }
}

watch(activeReviewProduct, (p) => {
  if (p) {
    replyTo.value = null
    replyText.value = ''
    load()
  }
})

function onKey(e) {
  if (e.key === 'Escape' && open.value) closeReviews()
}
if (typeof window !== 'undefined') {
  window.addEventListener('keydown', onKey)
}

async function submitReview() {
  if (!form.rating) {
    notify('error', 'Elige cuántas estrellas quieres poner')
    return
  }
  submitting.value = true
  try {
    const payload = { rating: form.rating, comment: form.comment.trim() || undefined }
    const wasEditing = editingId.value
    const data = wasEditing
      ? await api.put(`/reviews/${wasEditing}`, payload)
      : await api.post(`/products/${product.value.id}/reviews`, payload)
    summary.avg = data.summary?.avg ?? summary.avg
    summary.count = data.summary?.count ?? summary.count
    notify('ok', wasEditing ? 'Reseña actualizada' : 'Reseña publicada')
    await load()
  } catch (e) {
    notify('error', e.message)
  } finally {
    submitting.value = false
  }
}

/** ¿Esta reseña es del usuario con sesión? */
function isMine(r) {
  return !!user.value && r.user?.id === user.value.id
}

/** Carga una reseña propia en el formulario para editarla. */
function startEdit(r) {
  editingId.value = r.id
  form.rating = r.rating || 0
  form.comment = r.comment || ''
  formSection.value?.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
}

function cancelEdit() {
  editingId.value = null
  form.rating = 0
  form.comment = ''
}

async function deleteReview(r) {
  const ok = await askConfirm('¿Eliminar tu reseña? No se puede deshacer.', {
    title: 'Eliminar reseña',
    confirmLabel: 'Eliminar',
  })
  if (!ok) return
  try {
    await api.delete(`/reviews/${r.id}`)
    notify('ok', 'Reseña eliminada')
    await load()
  } catch (e) {
    notify('error', e.message)
  }
}

/** Abre (o cierra) el textarea de respuesta bajo una reseña. */
function toggleReply(r) {
  if (!isAuthenticated.value) {
    goLogin()
    return
  }
  replyTo.value = replyTo.value === r.id ? null : r.id
  replyText.value = ''
}

async function sendReply() {
  const text = replyText.value.trim()
  if (!text || replyBusy.value) return
  replyBusy.value = true
  try {
    await api.post(`/reviews/${replyTo.value}/replies`, { comment: text })
    replyTo.value = null
    replyText.value = ''
    notify('ok', 'Respuesta publicada')
    await load()
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
    await load()
  } catch (e) {
    notify('error', e.message)
  }
}

/** Inicial del avatar de una respuesta (estilo mensaje). */
function replyInitial(rep) {
  const name = (rep.user?.fullName || 'Cliente').trim()
  return name.charAt(0).toUpperCase()
}

function goLogin() {
  closeReviews()
  router.push('/login')
}

function formatDate(iso) {
  try {
    return new Date(iso).toLocaleDateString('es-DO', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    })
  } catch {
    return ''
  }
}
</script>

<template>
  <Teleport to="body">
    <Transition name="modal">
      <div
        v-if="open"
        class="fixed inset-0 z-[70] flex items-center justify-center p-4 sm:p-6"
        role="dialog"
        aria-modal="true"
        :aria-label="`Reseñas de ${product.name}`"
      >
        <div class="absolute inset-0 bg-black/55 backdrop-blur-[3px]" @click="closeReviews" />

        <div
          class="relative flex max-h-[88vh] w-full max-w-lg flex-col overflow-hidden rounded-3xl border border-ink/10 bg-white shadow-[0_40px_90px_-30px_rgba(0,0,0,0.6)]"
        >
          <!-- cabecera -->
          <header class="flex items-start gap-3 border-b border-ink/8 px-6 py-5">
            <span
              class="grid h-11 w-11 shrink-0 place-items-center overflow-hidden rounded-2xl bg-cream text-2xl"
            >
              <img
                :src="headerImage"
                :alt="product.name"
                class="h-11 w-11 object-contain"
              />
            </span>
            <div class="min-w-0 flex-1">
              <h2 class="truncate font-display text-lg font-semibold text-ink">
                {{ product.name }}
              </h2>
              <div class="mt-1 flex flex-wrap items-center gap-2">
                <StarRating :value="Math.round(summary.avg)" :size="15" />
                <span class="text-sm font-semibold text-ink">
                  {{ summary.avg ? summary.avg.toFixed(1) : '—' }}
                </span>
                <span class="text-xs text-ink/50">
                  ({{ summary.count }} {{ summary.count === 1 ? 'reseña' : 'reseñas' }})
                </span>
              </div>
            </div>
            <button
              type="button"
              class="grid h-9 w-9 shrink-0 place-items-center rounded-xl text-ink/45 transition-colors hover:bg-cream hover:text-ink"
              aria-label="Cerrar"
              @click="closeReviews"
            >
              <Icon icon="carbon:close" :width="18" :height="18" />
            </button>
          </header>

          <!-- cuerpo -->
          <div class="min-h-0 flex-1 overflow-y-auto px-6 py-5">
            <div
              v-if="loading"
              class="flex items-center justify-center gap-2 py-10 text-ink/45"
            >
              <Icon icon="carbon:renew" :width="18" :height="18" class="animate-spin" />
              Cargando reseñas…
            </div>

            <template v-else>
              <!-- formulario (nueva reseña o edición de una propia) -->
              <section
                ref="formSection"
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
                    {{ editingId ? 'Edita tu reseña' : 'Califica este producto' }}
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
                    <span class="text-xs text-ink/40">
                      {{ form.comment.length }}/1000
                    </span>
                    <div class="flex gap-2">
                      <button
                        v-if="editingId"
                        type="button"
                        class="rounded-full border border-ink/15 px-4 py-2 text-sm font-semibold text-ink/60 transition-colors hover:bg-white hover:text-ink"
                        @click="cancelEdit"
                      >
                        Cancelar
                      </button>
                      <button
                        type="button"
                        :disabled="submitting"
                        class="inline-flex items-center gap-1.5 rounded-full bg-ink px-5 py-2 text-sm font-bold text-cream transition-colors hover:bg-brand disabled:opacity-50"
                        @click="submitReview"
                      >
                        <Icon
                          :icon="submitting ? 'carbon:renew' : 'carbon:send'"
                          :width="14"
                          :height="14"
                          :class="submitting ? 'animate-spin' : ''"
                        />
                        {{ submitting ? 'Enviando…' : editingId ? 'Guardar cambios' : 'Publicar' }}
                      </button>
                    </div>
                  </div>
                </template>
              </section>

              <!-- lista (todas las reseñas; las propias marcadas) -->
              <section class="mt-5" aria-label="Reseñas">
                <div v-if="!reviews.length" class="py-6 text-center">
                  <p class="text-sm text-ink/55">
                    Todavía no hay reseñas. ¡Sé el primero en opinar!
                  </p>
                </div>
                <ul v-else-if="reviews.length" class="space-y-3">
                  <li
                    v-for="r in reviews"
                    :key="r.id"
                    class="rounded-2xl border border-ink/8 bg-white p-4"
                  >
                    <div class="flex items-start justify-between gap-2">
                      <span class="flex min-w-0 items-center gap-2">
                        <span
                          class="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-brand/15 text-[11px] font-bold text-brand"
                        >
                          {{ replyInitial(r) }}
                        </span>
                        <span class="truncate text-sm font-semibold text-ink">
                          {{ r.user?.fullName || 'Cliente' }}
                        </span>
                        <span
                          v-if="isMine(r)"
                          class="shrink-0 rounded-full bg-brand/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.1em] text-brand"
                        >
                          Tu reseña
                        </span>
                      </span>
                      <span class="flex shrink-0 items-center gap-1">
                        <span class="mr-1 text-xs text-ink/40">{{ formatDate(r.createdAt) }}</span>
                        <template v-if="isMine(r)">
                          <button
                            type="button"
                            class="grid h-7 w-7 place-items-center rounded-lg text-ink/45 transition-colors hover:bg-cream hover:text-ink"
                            aria-label="Editar reseña"
                            title="Editar"
                            @click="startEdit(r)"
                          >
                            <Icon icon="carbon:edit" :width="14" :height="14" />
                          </button>
                          <button
                            type="button"
                            class="grid h-7 w-7 place-items-center rounded-lg text-ink/45 transition-colors hover:bg-cream hover:text-red-600"
                            aria-label="Eliminar reseña"
                            title="Eliminar"
                            @click="deleteReview(r)"
                          >
                            <Icon icon="carbon:trash-can" :width="14" :height="14" />
                          </button>
                        </template>
                      </span>
                    </div>
                    <div class="mt-1.5 flex items-center gap-2">
                      <StarRating :value="r.rating" :size="14" />
                    </div>
                    <p
                      v-if="r.comment"
                      class="mt-2 text-sm leading-relaxed text-ink/70"
                    >
                      {{ r.comment }}
                    </p>

                    <!-- respuestas (estilo mensaje, un solo nivel) -->
                    <ul
                      v-if="r.replies?.length"
                      class="mt-3 space-y-2 border-t border-ink/8 pt-3"
                    >
                      <li
                        v-for="rep in r.replies"
                        :key="rep.id"
                        class="flex items-start gap-2"
                      >
                        <span
                          class="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-brand/15 text-[11px] font-bold text-brand"
                        >
                          {{ replyInitial(rep) }}
                        </span>
                        <div class="min-w-0 flex-1 rounded-2xl rounded-tl-sm bg-cream/80 px-3 py-2">
                          <div class="flex items-center justify-between gap-2">
                            <span class="text-xs font-bold text-ink">
                              {{ rep.user?.fullName || 'Cliente' }}
                            </span>
                            <span class="text-[10px] text-ink/40">{{ formatDate(rep.createdAt) }}</span>
                          </div>
                          <p class="mt-0.5 break-words text-sm leading-relaxed text-ink/75">
                            {{ rep.comment }}
                          </p>
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
                      @click="toggleReply(r)"
                    >
                      <Icon icon="carbon:reply" :width="14" :height="14" />
                      Responder
                    </button>

                    <div
                      v-if="replyTo === r.id"
                      class="mt-2.5 rounded-xl border border-ink/10 bg-white p-2.5"
                    >
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
                            @click="replyTo = null"
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
                </ul>
              </section>
            </template>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.modal-enter-active,
.modal-leave-active {
  transition: opacity 0.22s ease;
}
.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}
</style>

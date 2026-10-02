<script setup>
import { computed, ref, watch } from 'vue'
import ReviewForm from './ReviewForm.vue'
import ReviewThread from './ReviewThread.vue'
import { api } from '../services/api.js'
import { notify } from '../stores/toasts.js'
import { askConfirm } from '../stores/confirm.js'

/**
 * Lista de reseñas de un producto + formulario. Se usa tal cual en el modal
 * (resumen) y en la página de producto (lista completa):
 * - `limit` recorta la lista (modal = 3); en la página no se pasa y se ve todo.
 */
const props = defineProps({
  product: { type: Object, required: true },
  /** Máximo de reseñas que se pintan (0 = todas). */
  limit: { type: Number, default: 0 },
  loginRedirect: { type: String, default: '/login' },
})

const emit = defineEmits(['summary'])

const loading = ref(false)
const editing = ref(null)
const reviews = ref([])
const summary = ref({ avg: 0, count: 0 })

/** El resumen vive en el padre (cabecera del modal / de la página). */
function publishSummary() {
  emit('summary', { ...summary.value })
}

const visible = computed(() =>
  props.limit > 0 ? reviews.value.slice(0, props.limit) : reviews.value,
)

async function load() {
  if (!props.product?.id) return
  loading.value = true
  try {
    const data = await api.get(`/products/${props.product.id}/reviews`)
    // Todas las reseñas visibles, incluidas las del propio usuario (se
    // marcan con "Tu reseña" y traen editar/borrar). Se permiten varias.
    reviews.value = data.reviews || []
    summary.value = { avg: data.summary?.avg || 0, count: data.summary?.count || 0 }
    cancelEdit()
    publishSummary()
  } catch (e) {
    notify('error', e.message)
  } finally {
    loading.value = false
  }
}

watch(() => props.product?.id, load, { immediate: true })

async function refresh() {
  await load()
}

/** Tras publicar/editar, el resumen llega fresco: se refleja sin recargar. */
function onSaved({ summary: s }) {
  if (s) summary.value = { avg: s.avg ?? 0, count: s.count ?? 0 }
  load()
}

function startEdit(r) {
  editing.value = r
}

function cancelEdit() {
  editing.value = null
}

async function removeReview(r) {
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

defineExpose({ summary, refresh })
</script>

<template>
  <div>
    <div v-if="loading" class="flex items-center justify-center gap-2 py-10 text-ink/45">
      <Icon icon="carbon:renew" :width="18" :height="18" class="animate-spin" />
      Cargando reseñas…
    </div>

    <template v-else>
      <ReviewForm
        :product-id="product.id"
        :editing="editing"
        :login-redirect="loginRedirect"
        @saved="onSaved"
        @cancel-edit="cancelEdit"
      />

      <section class="mt-5" aria-label="Reseñas">
        <div v-if="!reviews.length" class="py-6 text-center">
          <p class="text-sm text-ink/55">
            Todavía no hay reseñas. ¡Sé el primero en opinar!
          </p>
        </div>
        <ul v-else class="space-y-3">
          <ReviewThread
            v-for="r in visible"
            :key="r.id"
            :review="r"
            :login-redirect="loginRedirect"
            @edit="startEdit"
            @remove="removeReview"
            @changed="refresh"
          />
        </ul>
      </section>
    </template>
  </div>
</template>
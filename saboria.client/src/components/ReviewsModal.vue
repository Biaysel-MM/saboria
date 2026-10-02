<script setup>
import { computed, onBeforeUnmount, onMounted, reactive, watch } from 'vue'
import { useRouter } from 'vue-router'
import StarRating from './StarRating.vue'
import ReviewsPanel from './ReviewsPanel.vue'
import { categories, products, resolveImage } from '../data/products.js'
import { activeReviewProduct, closeReviews } from '../state/reviews.js'

/**
 * Modal resumen: header con promedio + 3 reseñas como máximo + enlace a la
 * página completa del producto (que sí tiene URL y no se corta nunca).
 */
const PREVIEW = 3

const router = useRouter()
const product = computed(() => activeReviewProduct.value)
const open = computed(() => !!product.value)
const summary = reactive({ avg: 0, count: 0 })

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

/** Sincroniza el promedio visible en la tarjeta del producto y en la página. */
watch(summary, (s) => {
  const p = products.find((x) => x.id === product.value?.id)
  if (p) {
    p.ratingAvg = s.avg
    p.ratingCount = s.count
  }
})

/** Cuando cambia de producto, el resumen arranca en cero (no hay "chispa"). */
watch(product, () => {
  summary.avg = 0
  summary.count = 0
})

function goToAll() {
  const id = product.value?.id
  if (id === undefined || id === null) return
  closeReviews()
  router.push({ name: 'producto', params: { id: String(id) } })
}

function onKey(e) {
  if (e.key === 'Escape' && open.value) closeReviews()
}

onMounted(() => window.addEventListener('keydown', onKey))
onBeforeUnmount(() => window.removeEventListener('keydown', onKey))
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
            <ReviewsPanel :product="product" :limit="PREVIEW" @summary="Object.assign(summary, $event)" />
          </div>

          <!-- la lista completa vive en su propia página: URL compartible -->
          <footer
            v-if="summary.count > PREVIEW"
            class="border-t border-ink/8 bg-cream/50 px-6 py-3"
          >
            <button
              type="button"
              class="flex w-full items-center justify-center gap-1.5 text-sm font-bold text-ink/60 transition-colors hover:text-brand"
              @click="goToAll"
            >
              <Icon icon="carbon:list" :width="16" :height="16" />
              Ver todas las reseñas ({{ summary.count }})
            </button>
          </footer>
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
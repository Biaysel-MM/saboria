<script setup>
import { computed, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import SiteHeader from '../components/SiteHeader.vue'
import SiteFooter from '../components/SiteFooter.vue'
import StarRating from '../components/StarRating.vue'
import ReviewsPanel from '../components/ReviewsPanel.vue'
import ToastHost from '../components/admin/ToastHost.vue'
import ConfirmModal from '../components/admin/ConfirmModal.vue'
import { categories, catalogReady, products, resolveImage } from '../data/products.js'

/**
 * Página de reseñas de un producto. Es el destino de "Ver todas": URL propia
 * (compartible y indexable), lista completa y el mismo formulario del modal.
 * La lista viene del catálogo ya cargado; si la API no responde, se usan los
 * datos seed y la página se degrada sin romperse.
 */
const route = useRoute()
const router = useRouter()

const summary = ref({ avg: 0, count: 0 })

const productId = computed(() => String(route.params.id ?? ''))
const product = computed(() => products.find((p) => String(p.id) === productId.value) || null)

const GENERAL_IMAGE = resolveImage('categoriaGeneral.png')

const headerImage = computed(() => {
  const p = product.value
  if (!p) return GENERAL_IMAGE
  const cat =
    categories.find((c) => c.id === p.categoryId) ||
    categories.find((c) => c.name === p.tag)
  return resolveImage(cat?.imageUrl) || GENERAL_IMAGE
})

/** El resumen lo publica el panel; mientras carga se usa el del catálogo. */
const avg = computed(() => summary.value.avg || product.value?.ratingAvg || 0)
const count = computed(() => summary.value.count || product.value?.ratingCount || 0)

const gradient = computed(() => {
  const p = product.value
  if (!p) return { background: 'linear-gradient(135deg, #fff1c9, #ffab3d)' }
  return { background: `radial-gradient(120% 100% at 70% 20%, ${p.c1} 0%, ${p.c2} 55%, ${p.c3} 100%)` }
})

// El catálogo se carga al arrancar la app: mientras no esté listo se espera
// (el id puede ser de la API o del seed) y solo entonces se busca el producto.
const searching = ref(true)
watch(
  [() => catalogReady.done, product],
  () => {
    if (catalogReady.done) searching.value = false
  },
  { immediate: true },
)

function onSummary(s) {
  summary.value = s
}
</script>

<template>
  <SiteHeader />

  <main class="min-h-screen bg-cream pb-16 pt-28">
    <div class="mx-auto max-w-3xl px-5 sm:px-8">
      <!-- producto no encontrado -->
      <div
        v-if="!searching && !product"
        class="rounded-3xl border border-ink/10 bg-white p-10 text-center"
      >
        <span class="mx-auto grid h-14 w-14 place-items-center rounded-3xl bg-cream text-ink/40">
          <Icon icon="carbon:search" :width="24" :height="24" />
        </span>
        <h1 class="mt-4 font-display text-xl font-semibold text-ink">
          No encontramos ese producto
        </h1>
        <p class="mt-2 text-sm text-ink/55">
          Puede que se haya quitado del menú. Vuelve al inicio para ver todo lo que tenemos.
        </p>
        <button
          type="button"
          class="mt-5 inline-flex items-center gap-1.5 rounded-full bg-ink px-5 py-2.5 text-sm font-bold text-cream transition-colors hover:bg-brand"
          @click="router.push('/')"
        >
          <Icon icon="carbon:home" :width="15" :height="15" />
          Volver al inicio
        </button>
      </div>

      <template v-else-if="product">
        <!-- migas + cabecera del producto -->
        <nav class="mb-4 flex items-center gap-1.5 text-xs text-ink/50" aria-label="Ruta">
          <router-link to="/" class="transition-colors hover:text-brand">Inicio</router-link>
          <Icon icon="carbon:chevron-right" :width="12" :height="12" />
          <span class="truncate font-semibold text-ink/70">{{ product.name }}</span>
        </nav>

        <header class="overflow-hidden rounded-3xl border border-ink/8 bg-white">
          <div class="flex flex-col gap-5 p-5 sm:flex-row sm:items-center sm:p-6">
            <span
              class="grid h-28 w-28 shrink-0 place-items-center overflow-hidden rounded-3xl sm:h-32 sm:w-32"
              :style="gradient"
            >
              <img
                v-if="resolveImage(product.image)"
                :src="resolveImage(product.image)"
                :alt="product.name"
                class="h-full w-full object-contain drop-shadow-[0_12px_16px_rgba(40,24,20,0.28)]"
              />
              <span v-else class="text-5xl">{{ product.emoji }}</span>
            </span>

            <div class="min-w-0 flex-1">
              <span
                class="inline-flex items-center rounded-full px-3 py-1 text-[11px] font-bold uppercase tracking-[0.16em]"
                :style="{ background: product.accentSoft, color: product.accent }"
              >
                {{ product.tag }}
              </span>
              <h1 class="mt-2 font-display text-2xl font-semibold leading-tight text-ink">
                {{ product.name }}
              </h1>
              <p v-if="product.description" class="mt-2 text-sm leading-relaxed text-ink/60">
                {{ product.description }}
              </p>

              <div class="mt-3 flex flex-wrap items-center gap-x-3 gap-y-2">
                <span class="flex items-center gap-1.5">
                  <StarRating :value="avg" :size="16" />
                  <span class="text-sm font-bold text-ink/70">{{ avg.toFixed(1) }}</span>
                </span>
                <span class="text-sm text-ink/50">
                  {{ count }} {{ count === 1 ? 'reseña' : 'reseñas' }}
                </span>
                <span class="font-display text-lg font-semibold text-ink">
                  RD${{ product.price }}
                </span>
              </div>
            </div>
          </div>
        </header>

        <!-- lista completa + formulario -->
        <section class="mt-6" aria-label="Todas las reseñas">
          <h2 class="mb-4 font-display text-lg font-semibold text-ink">
            Reseñas
          </h2>
          <ReviewsPanel
            :key="product.id"
            :product="product"
            @summary="onSummary"
          />
        </section>

        <p class="mt-8 text-center text-xs text-ink/40">
          <router-link to="/" class="font-semibold transition-colors hover:text-brand">
            Volver al menú
          </router-link>
        </p>
      </template>

      <!-- buscando el producto en el catálogo -->
      <div v-else class="flex items-center justify-center gap-2 py-20 text-ink/45">
        <Icon icon="carbon:renew" :width="18" :height="18" class="animate-spin" />
        Buscando producto…
      </div>
    </div>
  </main>

  <SiteFooter />
  <ConfirmModal />
  <ToastHost />
</template>
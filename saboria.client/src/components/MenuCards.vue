<script setup>
import { computed, ref, watch } from 'vue'
import { products, heroProducts, resolveImage, siteTexts } from '../data/products.js'
import { active } from '../state/hero.js'
import { openReviews } from '../state/reviews.js'
import PaginationBar from './admin/PaginationBar.vue'
import StarRating from './StarRating.vue'

/** Tarjetas por página. Con menos productos no aparece el paginado. */
const PAGE_SIZE = 10

const page = ref(1)
const totalPages = computed(() => Math.max(1, Math.ceil(products.length / PAGE_SIZE)))
const visibleProducts = computed(() =>
  products.slice((page.value - 1) * PAGE_SIZE, page.value * PAGE_SIZE),
)

/** Si el admin añade o quita productos, la página se mantiene válida. */
watch(products, () => {
  if (page.value > totalPages.value) page.value = totalPages.value
})

/** Cambiar de página deja la vista en el menú, no arriba del todo. */
function goPage(p) {
  page.value = p
  document.getElementById('menu')?.scrollIntoView({ behavior: 'smooth' })
}

/** Si esta tarjeta corresponde al producto activo del hero. */
function isHeroActive(p) {
  return heroProducts.value[active.value]?.id === p.id
}

/** Si el producto está dentro de la lista (limitada) del hero. */
function inHero(p) {
  return heroProducts.value.some((x) => x.id === p.id)
}

function pick(p) {
  const idx = heroProducts.value.findIndex((x) => x.id === p.id)
  if (idx >= 0) active.value = idx
  document.getElementById('inicio')?.scrollIntoView({ behavior: 'smooth' })
}

/** Abre las reseñas sin disparar el "pick" del hero. */
function showReviews(p) {
  openReviews(p)
}
</script>

<template>
  <section id="menu" class="scroll-mt-24 bg-cream py-16 sm:py-20">
    <div class="mx-auto max-w-7xl px-5 sm:px-8">
      <div class="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <span
            class="inline-flex items-center rounded-full bg-brand/10 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.16em] text-brand"
          >
            {{ siteTexts.menuBadge }}
          </span>
          <h2 class="mt-4 font-display text-[clamp(28px,3.8vw,42px)] font-semibold leading-tight tracking-tight text-ink">
            {{ siteTexts.menuTitle }}
          </h2>
        </div>
        <p class="max-w-sm text-sm leading-relaxed text-ink/55">
          {{ siteTexts.menuText }}
        </p>
      </div>

      <div class="mt-10 grid grid-cols-2 gap-4 md:grid-cols-3 sm:gap-5 lg:grid-cols-5">
        <!-- div con rol button: el HTML no permite botones anidados y la
             tarjeta contiene botones propios (reseñas). -->
        <div
          v-for="p in visibleProducts"
          :key="p.id"
          role="button"
          tabindex="0"
          class="group overflow-hidden rounded-3xl border border-ink/8 bg-white text-left shadow-[0_2px_10px_-6px_rgba(36,26,23,0.25)] transition-[translate,box-shadow,border-color] duration-300 hover:-translate-y-1.5 hover:border-transparent hover:shadow-[0_24px_48px_-24px_rgba(36,26,23,0.4)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand cursor-pointer"
          :aria-label="inHero(p) ? `Ver ${p.name} en el hero` : p.name"
          @click="pick(p)"
          @keydown.enter.prevent="pick(p)"
          @keydown.space.prevent="pick(p)"
        >
          <div
            class="relative flex aspect-[4/3] items-center justify-center overflow-hidden rounded-t-3xl p-4"
            :style="{ background: `radial-gradient(120% 100% at 70% 20%, ${p.c1} 0%, ${p.c2} 55%, ${p.c3} 100%)` }"
          >
            <img
              v-if="resolveImage(p.image)"
              :src="resolveImage(p.image)"
              :alt="p.name"
              draggable="false"
              class="max-h-full max-w-full object-contain drop-shadow-[0_12px_16px_rgba(40,24,20,0.28)] transition-transform duration-500 group-hover:scale-110 group-hover:-rotate-2"
            />
            <span v-else class="text-5xl">{{ p.emoji }}</span>

            <span
              class="absolute left-3 top-3 rounded-full bg-white/85 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.12em] backdrop-blur-sm"
              :style="{ color: p.accent }"
            >
              {{ p.tag }}
            </span>

            <!-- producto activo en el hero: punto verde pulsante -->
            <span
              v-if="isHeroActive(p)"
              class="absolute right-3 top-3 flex h-2.5 w-2.5"
              title="Activo en el hero"
            >
              <span
                class="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-75"
              ></span>
              <span
                class="relative inline-flex h-2.5 w-2.5 rounded-full bg-green-500"
              ></span>
              <span class="sr-only">Activo en el hero</span>
            </span>

            <span
              class="absolute inset-x-0 bottom-0 translate-y-full bg-white/95 px-3 py-2 text-center text-xs font-bold text-ink transition-transform duration-300 group-hover:translate-y-0"
            >
              {{ inHero(p) ? 'Ver en el hero →' : 'Solo en el menú' }}
            </span>
          </div>

          <div class="p-3 sm:p-4">
            <h3 class="font-display text-[15px] font-semibold leading-snug text-ink sm:text-base">
              {{ p.name }}
            </h3>

            <!-- estrellas siempre (vacías si no hay reseñas); el promedio
                 solo cuando existe -->
            <div class="mt-1.5 flex items-center gap-1.5">
              <StarRating :value="p.ratingAvg" :size="14" />
              <span
                v-if="p.ratingCount"
                class="text-xs font-bold text-ink/70"
              >
                {{ p.ratingAvg.toFixed(1) }}
              </span>
            </div>

            <!-- precio + botón de reseñas (mismo estilo del antiguo "Ver") -->
            <div class="mt-3 flex flex-wrap items-center justify-between gap-2">
              <span class="font-display text-base font-semibold text-ink sm:text-xl">
                RD${{ p.price }}
              </span>
              <button
                type="button"
                class="inline-flex items-center gap-1 rounded-full px-3 py-1 text-[11px] font-bold transition-transform hover:-translate-y-0.5"
                :style="{ background: p.accentSoft, color: p.accent }"
                :aria-label="`Ver reseñas de ${p.name}`"
                @click.stop="showReviews(p)"
              >
                <Icon icon="carbon:review" :width="12" :height="12" />
                Reseñas
              </button>
            </div>
          </div>
        </div>
      </div>

      <PaginationBar
        :page="page"
        :total="products.length"
        :page-size="PAGE_SIZE"
        @update:page="goPage"
      />
    </div>
  </section>
</template>

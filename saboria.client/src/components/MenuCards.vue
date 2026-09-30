<script setup>
import { products, heroProducts, resolveImage, siteTexts } from '../data/products.js'
import { active } from '../state/hero.js'

/** Si esta tarjeta corresponde al producto activo del hero. */
function isHeroActive(p) {
  return heroProducts.value[active.value]?.id === p.id
}

function pick(p) {
  const idx = heroProducts.value.findIndex((x) => x.id === p.id)
  if (idx >= 0) active.value = idx
  document.getElementById('inicio')?.scrollIntoView({ behavior: 'smooth' })
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
        <button
          v-for="(p, i) in products"
          :key="p.id"
          type="button"
          class="group overflow-hidden rounded-3xl border border-ink/8 bg-white text-left shadow-[0_2px_10px_-6px_rgba(36,26,23,0.25)] transition-all duration-300 hover:-translate-y-1.5 hover:border-transparent hover:shadow-[0_24px_48px_-24px_rgba(36,26,23,0.4)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
          :aria-label="p.isFeatured ? `Ver ${p.name} en el hero` : p.name"
          @click="pick(p)"
        >
          <div
            class="relative flex aspect-[4/3] items-center justify-center overflow-hidden p-4"
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

            <span
              class="absolute inset-x-0 bottom-0 translate-y-full bg-white/95 px-3 py-2 text-center text-xs font-bold text-ink transition-transform duration-300 group-hover:translate-y-0"
            >
              {{ p.isFeatured ? 'Ver en el hero →' : 'Solo en el menú' }}
            </span>
          </div>

          <div class="p-4">
            <h3 class="font-display text-[15px] font-semibold leading-snug text-ink sm:text-base">
              {{ p.name }}
            </h3>
            <div class="mt-3 flex items-center justify-between gap-2">
              <span class="font-display text-lg font-semibold text-ink sm:text-xl">
                RD${{ p.price }}
              </span>
              <span
                class="rounded-full px-2.5 py-1 text-[11px] font-bold"
                :style="{ background: p.accentSoft, color: p.accent }"
              >
                {{ isHeroActive(p) ? '● Activo' : p.isFeatured ? 'Ver' : 'Menú' }}
              </span>
            </div>
          </div>
        </button>
      </div>
    </div>
  </section>
</template>

<script setup>
import { categories, resolveImage, siteTexts } from '../data/products.js'
import logo from '../assets/logoSaboria.png'

// Imagen por defecto de categorías sin imagen propia.
const GENERAL = resolveImage('categoriaGeneral.png')
</script>

<template>
  <section class="relative scroll-mt-24 bg-white py-20 sm:py-24">
    <div id="categorias" class="mx-auto max-w-7xl scroll-mt-24 px-5 sm:px-8">
      <div class="max-w-2xl">
        <span
          class="inline-flex items-center rounded-full bg-brand/10 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.16em] text-brand"
        >
          {{ siteTexts.catalogBadge }}
        </span>
        <h2 class="mt-4 font-display text-[clamp(30px,4vw,44px)] font-semibold leading-tight tracking-tight text-ink">
          {{ siteTexts.catalogTitle }}
        </h2>
        <p class="mt-4 text-base leading-relaxed text-ink/60">
          {{ siteTexts.catalogText }}
        </p>
      </div>

      <ul class="mt-12 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        <li
          v-for="c in categories"
          :key="c.name"
          class="group rounded-3xl border border-ink/8 bg-white p-5 transition-all duration-300 hover:-translate-y-1.5 hover:border-brand/30 hover:shadow-xl hover:shadow-brand/10"
        >
          <img
            :src="resolveImage(c.imageUrl) || GENERAL"
            :alt="c.name"
            class="h-12 w-12 rounded-2xl object-cover transition-transform duration-300 group-hover:scale-110 group-hover:-rotate-6"
          />
          <h3 class="mt-4 font-display text-lg font-semibold text-ink">{{ c.name }}</h3>
          <p class="mt-1 text-sm text-ink/55">{{ c.note }}</p>
        </li>
      </ul>
    </div>

    <!-- banda CTA -->
    <div class="mx-auto mt-20 max-w-7xl px-5 sm:px-8">
      <div
        class="relative overflow-hidden rounded-[32px] bg-ink px-7 py-12 text-center sm:px-14 sm:py-16"
      >
        <div
          class="pointer-events-none absolute -left-24 -top-24 h-72 w-72 rounded-full bg-brand/40 blur-3xl"
        />
        <div
          class="pointer-events-none absolute -bottom-28 -right-16 h-80 w-80 rounded-full bg-amber-400/30 blur-3xl"
        />
        <div class="relative">
          <img
            :src="logo"
            alt="Saboria"
            class="mx-auto mb-6 h-16 w-auto sm:h-20"
          />
          <h2 class="font-display text-[clamp(26px,3.6vw,40px)] font-semibold leading-tight text-cream">
            {{ siteTexts.ctaTitle }}
          </h2>
          <p class="mx-auto mt-3 max-w-xl text-base text-cream/65">
            {{ siteTexts.ctaText }}
          </p>
          <div class="mt-7 flex flex-wrap items-center justify-center gap-3">
            <a
              href="#menu"
              class="rounded-full bg-brand px-7 py-3.5 text-sm font-bold text-white transition-all duration-300 hover:-translate-y-0.5 hover:bg-brand-deep"
            >
              Hacer pedido
            </a>
            <a
              href="#contacto"
              class="rounded-full border border-cream/25 px-7 py-3.5 text-sm font-bold text-cream transition-all duration-300 hover:-translate-y-0.5 hover:bg-cream/10"
            >
              Contactanos
            </a>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

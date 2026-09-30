<script setup>
import { ref } from 'vue'
import logo from '../assets/logoSaboria.png'

const open = ref(false)

const links = [
  { href: '#inicio', label: 'Inicio' },
  { href: '#menu', label: 'Menú' },
  { href: '#categorias', label: 'Categorías' },
  { href: '#contacto', label: 'Contacto' },
]
</script>

<template>
  <header class="fixed top-0 right-0 left-0 z-50 px-4 pt-4 sm:px-6">
    <div class="mx-auto grid max-w-7xl grid-cols-[auto_1fr_auto] items-center gap-4">
      <a href="#inicio" class="flex items-center" aria-label="Saboria — inicio">
        <img :src="logo" alt="Saboria" class="h-11 w-auto" style="filter: brightness(0)" />
      </a>

      <!-- píldora blanca con los enlaces -->
      <nav
        class="hidden justify-self-center rounded-full border border-ink/5 bg-white px-3 py-2 shadow-[0_14px_40px_-18px_rgba(36,26,23,0.5)] md:flex"
        aria-label="Principal"
      >
        <a
          v-for="l in links"
          :key="l.href"
          :href="l.href"
          class="rounded-full px-4 py-1.5 text-sm font-semibold text-ink/70 transition-colors duration-200 hover:bg-cream hover:text-ink"
        >
          {{ l.label }}
        </a>
      </nav>

      <div class="flex items-center justify-end gap-3">
        <a
          href="#menu"
          class="hidden rounded-full bg-ink px-5 py-2.5 text-sm font-bold text-cream transition-all duration-300 hover:-translate-y-0.5 hover:bg-brand sm:inline-flex"
        >
          Ver menú
        </a>

        <button
          type="button"
          class="flex h-11 w-11 items-center justify-center rounded-full border border-ink/15 bg-white/70 text-ink backdrop-blur-sm transition-colors hover:bg-white md:hidden"
          :aria-expanded="open"
          aria-label="Abrir menú"
          @click="open = !open"
        >
          <svg v-if="!open" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
            <path d="M3 6h18M3 12h18M3 18h18" />
          </svg>
          <svg v-else width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
            <path d="M18 6 6 18M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>

    <Transition name="menu">
      <nav
        v-if="open"
        class="mx-auto mt-2 flex max-w-7xl flex-col gap-1 rounded-3xl border border-ink/5 bg-white p-4 shadow-[0_20px_50px_-24px_rgba(36,26,23,0.5)] md:hidden"
        aria-label="Móvil"
      >
        <a
          v-for="l in links"
          :key="'m-' + l.href"
          :href="l.href"
          class="rounded-xl px-3 py-2.5 text-sm font-semibold text-ink/75 transition-colors hover:bg-cream hover:text-ink"
          @click="open = false"
        >
          {{ l.label }}
        </a>
        <a
          href="#menu"
          class="mt-2 rounded-full bg-ink px-5 py-3 text-center text-sm font-bold text-cream"
          @click="open = false"
        >
          Ver menú
        </a>
      </nav>
    </Transition>
  </header>
</template>

<style scoped>
.menu-enter-active,
.menu-leave-active {
  transition:
    opacity 0.25s ease,
    transform 0.25s ease;
}

.menu-enter-from,
.menu-leave-to {
  opacity: 0;
  transform: translateY(-8px);
}
</style>

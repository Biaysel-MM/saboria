<script setup>
import { computed } from 'vue'
import { siteTexts } from '../data/products.js'
import logo from '../assets/logoSaboria.png'

const phoneHref = computed(
  () => 'tel:' + siteTexts.phone.replace(/[^+\d]/g, ''),
)
</script>

<template>
  <footer id="contacto" class="border-t border-ink/8 bg-white">
    <div class="mx-auto max-w-7xl px-5 py-14 sm:px-8">
      <div class="grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <img
            :src="logo"
            alt="Saboria"
            class="h-16 w-auto"
            style="filter: brightness(0)"
          />
          <p class="mt-4 max-w-xs text-sm leading-relaxed text-ink/55">
            {{ siteTexts.footerDescription }}
          </p>
        </div>

        <div>
          <h3 class="text-sm font-bold uppercase tracking-[0.14em] text-ink/45">Menú</h3>
          <ul class="mt-4 space-y-2.5 text-sm text-ink/65">
            <li><a href="#inicio" class="transition-colors hover:text-brand">Malteadas</a></li>
            <li><a href="#inicio" class="transition-colors hover:text-brand">Wraps y desayunos</a></li>
            <li><a href="#inicio" class="transition-colors hover:text-brand">Jugos y cafés</a></li>
            <li><a href="#inicio" class="transition-colors hover:text-brand">Pasteles y helados</a></li>
          </ul>
        </div>

        <div>
          <h3 class="text-sm font-bold uppercase tracking-[0.14em] text-ink/45">Horario</h3>
          <ul class="mt-4 space-y-2.5 text-sm text-ink/65">
            <li>{{ siteTexts.scheduleWeek }}</li>
            <li>{{ siteTexts.scheduleSaturday }}</li>
            <li>{{ siteTexts.scheduleSunday }}</li>
          </ul>
        </div>

        <div>
          <h3 class="text-sm font-bold uppercase tracking-[0.14em] text-ink/45">Contacto</h3>
          <ul class="mt-4 space-y-2.5 text-sm text-ink/65">
            <li>{{ siteTexts.address }}</li>
            <li>
              <a :href="phoneHref" class="transition-colors hover:text-brand">{{ siteTexts.phone }}</a>
            </li>
            <li>
              <a :href="`mailto:${siteTexts.email}`" class="transition-colors hover:text-brand">{{ siteTexts.email }}</a>
            </li>
          </ul>
        </div>
      </div>

      <div
        class="mt-12 flex flex-col items-center justify-between gap-3 border-t border-ink/8 pt-6 text-xs text-ink/45 sm:flex-row"
      >
        <p>© {{ new Date().getFullYear() }} Saboria. Todos los derechos reservados.</p>
        <div class="flex items-center gap-4">
          <router-link to="/admin" class="transition-colors hover:text-brand">
            Administrador
          </router-link>
          <p>Hecho con Vue 3 + Tailwind CSS</p>
        </div>
      </div>
    </div>
  </footer>
</template>

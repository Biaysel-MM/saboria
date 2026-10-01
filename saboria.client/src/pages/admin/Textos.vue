<script setup>
import { computed, nextTick, ref, watch } from 'vue'
import { api } from '../../services/api.js'
import { loadCatalog } from '../../data/products.js'
import { notify } from '../../stores/toasts.js'
import { loadAdmin, settings, busy } from '../../stores/admin.js'

const GROUPS = [
  {
    title: 'Sección menú',
    icon: 'carbon:list',
    fields: [
      { key: 'menuBadge', label: 'Etiqueta', type: 'input' },
      { key: 'menuTitle', label: 'Título', type: 'input' },
      { key: 'menuText', label: 'Párrafo', type: 'textarea' },
    ],
  },
  {
    title: 'Sección catálogo',
    icon: 'carbon:catalog',
    fields: [
      { key: 'catalogBadge', label: 'Etiqueta', type: 'input' },
      { key: 'catalogTitle', label: 'Título', type: 'input' },
      { key: 'catalogText', label: 'Párrafo', type: 'textarea' },
    ],
  },
  {
    title: 'Banda CTA',
    icon: 'carbon:send',
    fields: [
      { key: 'ctaTitle', label: 'Título', type: 'input' },
      { key: 'ctaText', label: 'Párrafo', type: 'textarea' },
    ],
  },
  {
    title: 'Footer',
    icon: 'carbon:document',
    fields: [{ key: 'footerDescription', label: 'Descripción', type: 'textarea' }],
  },
  {
    title: 'Horarios',
    icon: 'carbon:time',
    fields: [
      { key: 'scheduleWeek', label: 'Lunes a viernes', type: 'input' },
      { key: 'scheduleSaturday', label: 'Sábado', type: 'input' },
      { key: 'scheduleSunday', label: 'Domingo', type: 'input' },
    ],
  },
  {
    title: 'Contacto',
    icon: 'carbon:email',
    fields: [
      { key: 'address', label: 'Dirección', type: 'input' },
      { key: 'phone', label: 'Teléfono', type: 'input' },
      { key: 'email', label: 'Correo', type: 'input' },
    ],
  },
]

const savedAt = ref(null)

async function save() {
  busy.value = true
  try {
    await api.put('/admin/settings', settings.value)
    notify('ok', 'Textos guardados — la página pública ya los muestra')
    await loadAdmin({ force: true })
    loadCatalog()
    // tras el flush del watcher que limpia savedAt, lo marcamos de nuevo
    await nextTick()
    savedAt.value = new Date().toLocaleTimeString('es-DO', {
      hour: '2-digit',
      minute: '2-digit',
    })
    window.scrollTo({ top: 0, behavior: 'smooth' })
  } catch (e) {
    notify('error', e.message)
  } finally {
    busy.value = false
  }
}

// si el usuario sigue editando, el indicador de "guardado" caduca
watch(settings, () => {
  savedAt.value = null
}, { deep: true })

const phoneHref = computed(
  () => `tel:${(settings.value.phone || '').replace(/[^+\d]/g, '')}`,
)
const emailHref = computed(() => `mailto:${settings.value.email || ''}`)
</script>

<template>
  <div>
    <div class="flex flex-wrap items-center justify-between gap-3">
      <div class="flex items-center gap-3">
        <span class="grid h-11 w-11 place-items-center rounded-2xl bg-brand/10 text-brand">
          <Icon icon="carbon:notebook" :width="22" :height="22" />
        </span>
        <div>
          <h2 class="font-display text-xl font-semibold leading-tight">
            Textos del sitio
          </h2>
          <p class="text-xs text-ink/50">
            Editados a la izquierda, la vista previa se actualiza al escribir
          </p>
        </div>
      </div>
      <div class="flex items-center gap-3">
        <p v-if="savedAt" class="text-xs font-semibold text-green-600">
          <Icon icon="carbon:checkmark" :width="13" :height="13" class="mr-1 inline-block" />
          Guardado a las {{ savedAt }}
        </p>
        <button
          type="button"
          class="inline-flex items-center gap-1.5 rounded-full bg-ink px-6 py-2.5 text-sm font-bold text-cream transition-colors hover:bg-brand disabled:opacity-50"
          :disabled="busy"
          @click="save"
        >
          <Icon
            :icon="busy ? 'carbon:renew' : 'carbon:save'"
            :width="15"
            :height="15"
            :class="busy ? 'animate-spin' : ''"
          />
          {{ busy ? 'Guardando…' : 'Guardar textos' }}
        </button>
      </div>
    </div>

    <div class="mt-6 grid items-start gap-6 lg:grid-cols-2">
      <!-- ============================================ editor -->
      <div class="space-y-5">
        <div
          v-for="g in GROUPS"
          :key="g.title"
          class="rounded-3xl border border-ink/10 bg-white p-5"
        >
          <h3 class="flex items-center gap-2 font-display text-sm font-semibold">
            <span class="grid h-7 w-7 place-items-center rounded-lg bg-cream text-ink/60">
              <Icon :icon="g.icon" :width="14" :height="14" />
            </span>
            {{ g.title }}
          </h3>
          <div class="mt-4 space-y-3.5">
            <div v-for="f in g.fields" :key="f.key">
              <label
                class="block text-[11px] font-bold uppercase tracking-[0.1em] text-ink/45"
              >
                {{ f.label }}
              </label>
              <textarea
                v-if="f.type === 'textarea'"
                v-model="settings[f.key]"
                rows="2"
                class="mt-1.5 w-full rounded-xl border border-ink/15 px-3.5 py-2.5 text-sm outline-none transition-colors focus:border-brand"
              />
              <input
                v-else-if="f.type === 'number'"
                v-model.number="settings[f.key]"
                type="number"
                :min="f.min"
                :max="f.max"
                class="mt-1.5 w-28 rounded-xl border border-ink/15 px-3.5 py-2.5 text-sm outline-none transition-colors focus:border-brand"
              />
              <input
                v-else
                v-model="settings[f.key]"
                class="mt-1.5 w-full rounded-xl border border-ink/15 px-3.5 py-2.5 text-sm outline-none transition-colors focus:border-brand"
              />
            </div>
          </div>
        </div>

        <div class="flex justify-end lg:hidden">
          <button
            type="button"
            class="inline-flex items-center gap-1.5 rounded-full bg-ink px-6 py-3 text-sm font-bold text-cream transition-colors hover:bg-brand disabled:opacity-50"
            :disabled="busy"
            @click="save"
          >
            <Icon icon="carbon:save" :width="15" :height="15" />
            Guardar textos
          </button>
        </div>
      </div>

      <!-- ====================================== previsualización -->
      <div class="lg:sticky lg:top-24">
        <p
          class="mb-3 inline-flex items-center gap-1.5 rounded-full bg-brand/10 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.14em] text-brand"
        >
          <Icon icon="carbon:view" :width="13" :height="13" />
          Previsualización en vivo
        </p>

        <div class="overflow-hidden rounded-3xl border border-ink/10 bg-white">
          <!-- secciones de texto -->
          <div class="space-y-6 p-6">
            <!-- secciones con badge + título + párrafo (la banda CTA se
                 pinta aparte, más abajo) -->
            <div v-for="g in GROUPS.slice(0, 2)" :key="g.title">
              <span
                class="inline-flex items-center rounded-full bg-brand/10 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.16em] text-brand"
              >
                {{ settings[g.fields[0].key] }}
              </span>
              <h3 class="mt-3 font-display text-xl font-semibold leading-tight text-ink">
                {{ settings[g.fields[1].key] }}
              </h3>
              <p
                v-if="g.fields[2]"
                class="mt-2 text-sm leading-relaxed text-ink/60"
              >
                {{ settings[g.fields[2].key] }}
              </p>
            </div>

            <!-- banda CTA -->
            <div class="relative overflow-hidden rounded-3xl bg-ink p-6 text-center">
              <div
                class="pointer-events-none absolute -left-12 -top-12 h-36 w-36 rounded-full bg-brand/40 blur-3xl"
              />
              <div
                class="pointer-events-none absolute -bottom-14 -right-8 h-40 w-40 rounded-full bg-amber-400/30 blur-3xl"
              />
              <div class="relative">
                <h4 class="font-display text-lg font-semibold text-cream">
                  {{ settings.ctaTitle }}
                </h4>
                <p class="mt-2 text-xs leading-relaxed text-cream/65">
                  {{ settings.ctaText }}
                </p>
                <div class="mt-4 flex flex-wrap items-center justify-center gap-2">
                  <span class="rounded-full bg-brand px-4 py-2 text-[11px] font-bold text-white">
                    Hacer pedido
                  </span>
                  <span class="rounded-full border border-cream/25 px-4 py-2 text-[11px] font-bold text-cream">
                    Contactanos
                  </span>
                </div>
              </div>
            </div>
          </div>

          <!-- footer -->
          <div class="border-t border-ink/8 bg-cream/60 p-6">
            <p class="text-xs leading-relaxed text-ink/60">
              {{ settings.footerDescription }}
            </p>
            <div class="mt-4 grid gap-2 text-xs text-ink/60 sm:grid-cols-2">
              <p class="flex items-center gap-1.5">
                <Icon icon="carbon:time" :width="13" :height="13" class="text-brand" />
                {{ settings.scheduleWeek }}
              </p>
              <p class="flex items-center gap-1.5">
                <Icon icon="carbon:time" :width="13" :height="13" class="text-brand" />
                {{ settings.scheduleSaturday }}
              </p>
              <p class="flex items-center gap-1.5">
                <Icon icon="carbon:time" :width="13" :height="13" class="text-brand" />
                {{ settings.scheduleSunday }}
              </p>
              <p class="flex items-center gap-1.5">
                <Icon icon="carbon:location" :width="13" :height="13" class="text-brand" />
                {{ settings.address }}
              </p>
              <a :href="phoneHref" class="flex items-center gap-1.5 hover:text-brand">
                <Icon icon="carbon:phone" :width="13" :height="13" class="text-brand" />
                {{ settings.phone }}
              </a>
              <a :href="emailHref" class="flex items-center gap-1.5 hover:text-brand">
                <Icon icon="carbon:email" :width="13" :height="13" class="text-brand" />
                {{ settings.email }}
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

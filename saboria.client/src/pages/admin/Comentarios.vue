<script setup>
import { computed, onMounted, ref } from 'vue'
import { api } from '../../services/api.js'
import { notify } from '../../stores/toasts.js'
import { askConfirm } from '../../stores/confirm.js'
import { resolveImage } from '../../data/products.js'
import StarRating from '../../components/StarRating.vue'

/** Imagen por defecto (la misma que usan las categorías). */
const GENERAL = resolveImage('categoriaGeneral.png')

const rows = ref([])
const loading = ref(false)
const busyId = ref(null)
const query = ref('')
const filter = ref('todos')

const FILTERS = [
  { key: 'todos', label: 'Todos' },
  { key: 'visibles', label: 'Visibles' },
  { key: 'ocultos', label: 'Ocultos' },
]

const filtered = computed(() => {
  const q = query.value.trim().toLowerCase()
  return rows.value.filter((r) => {
    if (filter.value === 'visibles' && r.isHidden) return false
    if (filter.value === 'ocultos' && !r.isHidden) return false
    if (!q) return true
    const hay =
      `${r.product?.name || ''} ${r.user?.fullName || ''} ${r.comment || ''}`.toLowerCase()
    return hay.includes(q)
  })
})

const hiddenCount = computed(() => rows.value.filter((r) => r.isHidden).length)

async function load() {
  loading.value = true
  try {
    rows.value = await api.get('/admin/reviews')
  } catch (e) {
    notify('error', e.message)
  } finally {
    loading.value = false
  }
}
onMounted(load)

async function toggleHidden(r) {
  busyId.value = r.id
  try {
    const updated = await api.put(`/admin/reviews/${r.id}/moderate`, {
      action: r.isHidden ? 'show' : 'hide',
    })
    r.isHidden = updated.isHidden
    notify('ok', r.isHidden ? 'Comentario oculto' : 'Comentario visible')
  } catch (e) {
    notify('error', e.message)
  } finally {
    busyId.value = null
  }
}

async function removeRow(r) {
  const ok = await askConfirm(
    `¿Eliminar la reseña de ${r.user?.fullName || 'este usuario'} en "${r.product?.name || 'un producto'}"? Esta acción no se puede deshacer.`,
    { title: 'Eliminar comentario', confirmLabel: 'Eliminar' },
  )
  if (!ok) return
  busyId.value = r.id
  try {
    await api.delete(`/admin/reviews/${r.id}`)
    rows.value = rows.value.filter((x) => x.id !== r.id)
    notify('ok', 'Comentario eliminado')
  } catch (e) {
    notify('error', e.message)
  } finally {
    busyId.value = null
  }
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

/** Imagen de la CATEGORÍA del producto (su "característica"), no la del producto. */
function rowImage(r) {
  return resolveImage(r.product?.category?.imageUrl) || GENERAL
}
</script>

<template>
  <div>
    <!-- cabecera -->
    <div class="flex flex-wrap items-center justify-between gap-3">
      <div class="flex items-center gap-3">
        <span class="grid h-11 w-11 place-items-center rounded-2xl bg-brand/10 text-brand">
          <Icon icon="carbon:review" :width="22" :height="22" />
        </span>
        <div>
          <h2 class="font-display text-xl font-semibold leading-tight">Comentarios</h2>
          <p class="text-xs text-ink/50">
            {{ filtered.length }} de {{ rows.length }}
            <template v-if="hiddenCount"> · {{ hiddenCount }} oculto(s)</template>
            · oculta sin borrar para moderar
          </p>
        </div>
      </div>
      <button
        type="button"
        class="inline-flex items-center gap-1.5 rounded-full border border-ink/15 bg-white px-4 py-2 text-sm font-semibold text-ink/70 transition-colors hover:bg-cream"
        :disabled="loading"
        @click="load"
      >
        <Icon
          icon="carbon:renew"
          :width="15"
          :height="15"
          :class="loading ? 'animate-spin' : ''"
        />
        Recargar
      </button>
    </div>

    <!-- toolbar -->
    <div class="mt-5 flex flex-wrap items-center gap-3">
      <div class="relative min-w-[240px] flex-1">
        <Icon
          icon="carbon:search"
          :width="16"
          :height="16"
          class="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-ink/35"
        />
        <input
          v-model="query"
          type="search"
          placeholder="Buscar por producto, usuario o texto…"
          class="w-full rounded-full border border-ink/15 bg-white py-2.5 pl-10 pr-4 text-sm outline-none transition-colors focus:border-brand"
        />
      </div>
      <div class="flex flex-wrap gap-1.5">
        <button
          v-for="f in FILTERS"
          :key="f.key"
          type="button"
          class="rounded-full border px-3.5 py-1.5 text-xs font-bold transition-colors"
          :class="
            filter === f.key
              ? 'border-ink bg-ink text-cream'
              : 'border-ink/15 bg-white text-ink/55 hover:border-ink/30 hover:text-ink'
          "
          @click="filter = f.key"
        >
          {{ f.label }}
        </button>
      </div>
    </div>

    <!-- cargando -->
    <div
      v-if="loading && !rows.length"
      class="mt-5 flex items-center justify-center gap-2 rounded-3xl border border-ink/10 bg-white py-12 text-ink/45"
    >
      <Icon icon="carbon:renew" :width="18" :height="18" class="animate-spin" />
      Cargando comentarios…
    </div>

    <!-- lista -->
    <ul v-else-if="filtered.length" class="mt-5 space-y-3">
      <li
        v-for="r in filtered"
        :key="r.id"
        class="rounded-3xl border bg-white p-4 transition-colors"
        :class="r.isHidden ? 'border-ink/10 opacity-75' : 'border-ink/10'"
      >
        <div class="flex flex-wrap items-start justify-between gap-3">
          <div class="flex min-w-0 items-start gap-3">
            <span
              class="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-cream text-lg"
            >
              <img
                v-if="rowImage(r)"
                :src="rowImage(r)"
                :alt="r.product?.name || ''"
                class="h-full w-full object-contain"
              />
              <template v-else>{{ r.product?.emoji || '🥤' }}</template>
            </span>
            <div class="min-w-0">
              <div class="flex flex-wrap items-center gap-2">
                <p class="truncate text-sm font-semibold text-ink">
                  {{ r.user?.fullName || 'Usuario' }}
                </p>
                <span class="text-xs text-ink/40">→</span>
                <p class="truncate text-sm font-semibold text-ink">
                  {{ r.product?.name || 'Producto' }}
                </p>
              </div>
              <div class="mt-1 flex items-center gap-2">
                <StarRating :value="r.rating" :size="14" />
                <span class="text-xs text-ink/40">{{ formatDate(r.createdAt) }}</span>
                <span
                  class="rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.1em]"
                  :class="
                    r.isHidden
                      ? 'bg-ink/10 text-ink/50'
                      : 'bg-green-100 text-green-700'
                  "
                >
                  {{ r.isHidden ? 'Oculto' : 'Visible' }}
                </span>
              </div>
              <p
                v-if="r.comment"
                class="mt-2 text-sm leading-relaxed text-ink/70"
              >
                {{ r.comment }}
              </p>
            </div>
          </div>

          <div class="flex shrink-0 flex-wrap gap-1.5">
            <button
              type="button"
              class="inline-flex items-center gap-1 rounded-full px-2.5 py-1.5 text-[11px] font-bold transition-colors"
              :class="
                r.isHidden
                  ? 'bg-green-100 text-green-700 hover:bg-green-200'
                  : 'bg-ink/10 text-ink/60 hover:bg-ink/15'
              "
              :disabled="busyId === r.id"
              @click="toggleHidden(r)"
            >
              <Icon
                :icon="r.isHidden ? 'carbon:view' : 'carbon:view-off'"
                :width="12"
                :height="12"
              />
              {{ r.isHidden ? 'Mostrar' : 'Ocultar' }}
            </button>
            <button
              type="button"
              class="inline-flex items-center gap-1 rounded-full border border-red-200 px-2.5 py-1.5 text-[11px] font-bold text-red-500 transition-colors hover:bg-red-50"
              :disabled="busyId === r.id"
              @click="removeRow(r)"
            >
              <Icon icon="carbon:trash-can" :width="12" :height="12" />
              Eliminar
            </button>
          </div>
        </div>
      </li>
    </ul>

    <!-- vacío -->
    <div
      v-else
      class="mt-5 rounded-3xl border border-dashed border-ink/15 bg-white/60 px-6 py-12 text-center"
    >
      <span class="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-cream text-ink/40">
        <Icon icon="carbon:review" :width="22" :height="22" />
      </span>
      <p class="mt-3 text-sm font-semibold text-ink/60">
        {{ query || filter !== 'todos' ? 'Ningún comentario coincide' : 'Todavía no hay comentarios' }}
      </p>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { resolveImage } from '../../data/products.js'
import {
  products,
  categories,
  patchProduct,
  removeProduct,
  reorderTo,
  patchCategory,
  removeCategory,
} from '../../stores/admin.js'
import PaginationBar from '../../components/admin/PaginationBar.vue'

const GENERAL_CAT = resolveImage('categoriaGeneral.png')

/* ---------------------------------------------------------- productos */

const PROD_SIZE = 9
const prodQuery = ref('')
const prodFilter = ref('todos')
const prodPage = ref(1)

const FILTERS = [
  { key: 'todos', label: 'Todos' },
  { key: 'visibles', label: 'Visibles' },
  { key: 'ocultos', label: 'Ocultos' },
  { key: 'hero', label: 'En hero' },
]

const filteredProducts = computed(() => {
  const q = prodQuery.value.trim().toLowerCase()
  return products.value.filter((p) => {
    if (prodFilter.value === 'visibles' && !p.isActive) return false
    if (prodFilter.value === 'ocultos' && p.isActive) return false
    if (prodFilter.value === 'hero' && !p.isFeatured) return false
    if (!q) return true
    const hay = `${p.name} ${p.tag || ''} ${p.category?.name || ''}`.toLowerCase()
    return hay.includes(q)
  })
})

const prodPages = computed(() =>
  Math.ceil(filteredProducts.value.length / PROD_SIZE),
)
const prodPageSafe = computed(() =>
  Math.min(prodPage.value, Math.max(prodPages.value, 1)),
)
const pageProducts = computed(() => {
  const start = (prodPageSafe.value - 1) * PROD_SIZE
  return filteredProducts.value.slice(start, start + PROD_SIZE)
})

watch([prodQuery, prodFilter], () => {
  prodPage.value = 1
})

function clearProdFilters() {
  prodQuery.value = ''
  prodFilter.value = 'todos'
}

/* ------------------------------------------- drag & drop de productos */
/* Pointer events: funciona con ratón y con dedo. El movimiento se
   traduce a una reordenación del ORDEN GLOBAL (reorderTo), así funciona
   aunque haya búsqueda, filtro o paginado activos. */

const dragIndex = ref(null)
const dropIndex = ref(null)

function onHandleDown(e, i) {
  if (e.pointerType === 'mouse' && e.button !== 0) return
  e.preventDefault()
  dragIndex.value = i
  dropIndex.value = i
  window.addEventListener('pointermove', onDragMove)
  window.addEventListener('pointerup', onDragUp, { once: true })
  window.addEventListener('pointercancel', onDragUp, { once: true })
}

function onDragMove(e) {
  const el = document.elementFromPoint(e.clientX, e.clientY)
  const row = el?.closest?.('[data-row]')
  if (row) dropIndex.value = Number(row.dataset.row)
}

function onDragUp() {
  window.removeEventListener('pointermove', onDragMove)
  const from = dragIndex.value
  const to = dropIndex.value
  dragIndex.value = null
  dropIndex.value = null
  if (from == null || to == null || from === to) return
  const visible = pageProducts.value
  reorderTo(visible[from].id, visible[to].id)
}

/* --------------------------------------------------------- categorías */

const CAT_SIZE = 6
const catQuery = ref('')
const catPage = ref(1)

const filteredCategories = computed(() => {
  const q = catQuery.value.trim().toLowerCase()
  if (!q) return categories.value
  return categories.value.filter((c) =>
    `${c.name} ${c.note || ''}`.toLowerCase().includes(q),
  )
})
const catPages = computed(() =>
  Math.ceil(filteredCategories.value.length / CAT_SIZE),
)
const catPageSafe = computed(() =>
  Math.min(catPage.value, Math.max(catPages.value, 1)),
)
const pageCategories = computed(() => {
  const start = (catPageSafe.value - 1) * CAT_SIZE
  return filteredCategories.value.slice(start, start + CAT_SIZE)
})

watch(catQuery, () => {
  catPage.value = 1
})

/* /admin/categorias lleva a esta misma vista, pero a la sección de
   categorías (útil al volver de guardar una categoría). */
const route = useRoute()
function scrollToSection() {
  if (route.name !== 'admin-categorias') return
  requestAnimationFrame(() => {
    document
      .getElementById('seccion-categorias')
      ?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  })
}
onMounted(scrollToSection)
watch(() => route.fullPath, scrollToSection)
</script>

<template>
  <div class="space-y-14">
    <!-- ============================================== PRODUCTOS -->
    <section id="seccion-productos" class="scroll-mt-24">
      <div class="flex flex-wrap items-center justify-between gap-3">
        <div class="flex items-center gap-3">
          <span class="grid h-11 w-11 place-items-center rounded-2xl bg-brand/10 text-brand">
            <Icon icon="carbon:shopping-cart" :width="22" :height="22" />
          </span>
          <div>
            <h2 class="font-display text-xl font-semibold leading-tight">
              Productos
            </h2>
            <p class="text-xs text-ink/50">
              {{ filteredProducts.length }} de {{ products.length }} ·
              arrastra las tarjetas para ordenar el carrusel
            </p>
          </div>
        </div>
        <router-link
          to="/admin/productos/nuevo"
          class="inline-flex items-center gap-1.5 rounded-full bg-brand px-5 py-2.5 text-sm font-bold text-white transition-all hover:bg-brand-deep"
        >
          <Icon icon="carbon:add" :width="16" :height="16" />
          Nuevo producto
        </router-link>
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
            v-model="prodQuery"
            type="search"
            placeholder="Buscar producto, categoría o tipo…"
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
              prodFilter === f.key
                ? 'border-ink bg-ink text-cream'
                : 'border-ink/15 bg-white text-ink/55 hover:border-ink/30 hover:text-ink'
            "
            @click="prodFilter = f.key"
          >
            {{ f.label }}
          </button>
        </div>
      </div>

      <!-- grid de tarjetas -->
      <div
        v-if="pageProducts.length"
        class="mt-5 grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3"
      >
        <article
          v-for="(p, i) in pageProducts"
          :key="p.id"
          :data-row="i"
          class="flex flex-col rounded-3xl border border-ink/10 bg-white transition-all"
          :class="{
            'scale-[0.98] opacity-40': dragIndex === i,
            'border-brand bg-brand/5 ring-2 ring-brand/20':
              dropIndex === i && dragIndex !== null && dragIndex !== i,
            'opacity-55': p.isActive === false && dragIndex !== i,
          }"
        >
          <div class="flex items-center gap-3 p-4 pb-3">
            <button
              type="button"
              class="grid h-8 w-8 shrink-0 cursor-grab touch-none select-none place-items-center rounded-xl text-ink/35 transition-colors hover:bg-cream hover:text-ink/70 active:cursor-grabbing"
              title="Arrastra para reordenar"
              aria-label="Arrastra para reordenar"
              @pointerdown.prevent="onHandleDown($event, i)"
            >
              <Icon icon="carbon:draggable" :width="16" :height="16" />
            </button>
            <span
              class="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-2xl text-xl"
              :style="{
                background: `radial-gradient(120% 100% at 70% 20%, ${p.c1} 0%, ${p.c2} 55%, ${p.c3} 100%)`,
              }"
            >
              <img
                v-if="resolveImage(p.imageUrl)"
                :src="resolveImage(p.imageUrl)"
                alt=""
                class="max-h-full max-w-full object-contain p-1"
              />
              <span v-else class="text-base">{{ p.emoji }}</span>
            </span>
            <div class="min-w-0 flex-1">
              <p class="truncate font-semibold leading-tight">{{ p.name }}</p>
              <p class="mt-0.5 truncate text-xs text-ink/50">
                {{ p.category?.name || p.tag }}
              </p>
            </div>
            <p class="shrink-0 text-sm font-bold">RD${{ p.price }}</p>
          </div>

          <div class="flex flex-wrap gap-1.5 px-4">
            <button
              type="button"
              class="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-bold transition-colors"
              :class="
                p.isActive
                  ? 'bg-green-100 text-green-700 hover:bg-green-200'
                  : 'bg-ink/10 text-ink/50 hover:bg-ink/15'
              "
              @click="patchProduct(p, { isActive: !p.isActive })"
            >
              <Icon
                :icon="p.isActive ? 'carbon:view' : 'carbon:view-off'"
                :width="12"
                :height="12"
              />
              {{ p.isActive ? 'Visible' : 'Oculto' }}
            </button>
            <button
              type="button"
              class="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-bold transition-colors"
              :class="
                p.isFeatured
                  ? 'bg-brand/15 text-brand hover:bg-brand/25'
                  : 'bg-ink/10 text-ink/50 hover:bg-ink/15'
              "
              @click="patchProduct(p, { isFeatured: !p.isFeatured })"
            >
              <Icon icon="carbon:star" :width="12" :height="12" />
              {{ p.isFeatured ? 'En hero' : 'Sin hero' }}
            </button>
          </div>

          <div class="mt-3 flex gap-2 border-t border-ink/8 p-3">
            <router-link
              :to="`/admin/productos/${p.id}/editar`"
              class="inline-flex flex-1 items-center justify-center gap-1.5 rounded-full border border-ink/15 px-3 py-2 text-xs font-semibold text-ink/70 transition-colors hover:bg-cream"
            >
              <Icon icon="carbon:edit" :width="13" :height="13" />
              Editar
            </router-link>
            <button
              type="button"
              class="inline-flex flex-1 items-center justify-center gap-1.5 rounded-full border border-red-200 px-3 py-2 text-xs font-semibold text-red-500 transition-colors hover:bg-red-50"
              @click="removeProduct(p)"
            >
              <Icon icon="carbon:trash-can" :width="13" :height="13" />
              Eliminar
            </button>
          </div>
        </article>
      </div>

      <!-- vacío -->
      <div
        v-else
        class="mt-5 rounded-3xl border border-dashed border-ink/15 bg-white/60 px-6 py-12 text-center"
      >
        <span class="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-cream text-ink/40">
          <Icon icon="carbon:search" :width="22" :height="22" />
        </span>
        <p class="mt-3 text-sm font-semibold text-ink/60">
          Ningún producto coincide con tu búsqueda
        </p>
        <button
          type="button"
          class="mt-3 rounded-full border border-ink/15 bg-white px-4 py-2 text-xs font-bold text-ink/60 transition-colors hover:border-ink/30 hover:text-ink"
          @click="clearProdFilters"
        >
          <Icon icon="carbon:renew" :width="13" :height="13" class="mr-1 inline-block" />
          Limpiar filtros
        </button>
      </div>

      <PaginationBar
        v-model:page="prodPage"
        :total="filteredProducts.length"
        :page-size="PROD_SIZE"
      />
    </section>

    <!-- =========================================== CATEGORÍAS -->
    <section id="seccion-categorias" class="scroll-mt-24">
      <div class="flex flex-wrap items-center justify-between gap-3">
        <div class="flex items-center gap-3">
          <span class="grid h-11 w-11 place-items-center rounded-2xl bg-brand/10 text-brand">
            <Icon icon="carbon:category" :width="22" :height="22" />
          </span>
          <div>
            <h2 class="font-display text-xl font-semibold leading-tight">
              Categorías
            </h2>
            <p class="text-xs text-ink/50">
              {{ filteredCategories.length }} de {{ categories.length }}
            </p>
          </div>
        </div>
        <router-link
          to="/admin/categorias/nueva"
          class="inline-flex items-center gap-1.5 rounded-full bg-brand px-5 py-2.5 text-sm font-bold text-white transition-all hover:bg-brand-deep"
        >
          <Icon icon="carbon:add" :width="16" :height="16" />
          Nueva categoría
        </router-link>
      </div>

      <div class="relative mt-5 max-w-md">
        <Icon
          icon="carbon:search"
          :width="16"
          :height="16"
          class="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-ink/35"
        />
        <input
          v-model="catQuery"
          type="search"
          placeholder="Buscar categoría…"
          class="w-full rounded-full border border-ink/15 bg-white py-2.5 pl-10 pr-4 text-sm outline-none transition-colors focus:border-brand"
        />
      </div>

      <div
        v-if="pageCategories.length"
        class="mt-5 grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3"
      >
        <article
          v-for="c in pageCategories"
          :key="c.id"
          class="rounded-3xl border border-ink/10 bg-white p-4 transition-all"
          :class="{ 'opacity-55': !c.isActive }"
        >
          <div class="flex items-center gap-3">
            <img
              :src="resolveImage(c.imageUrl) || GENERAL_CAT"
              alt=""
              class="h-12 w-12 shrink-0 rounded-2xl border border-ink/8 object-contain"
            />
            <div class="min-w-0 flex-1">
              <p class="truncate font-semibold leading-tight">{{ c.name }}</p>
              <p class="mt-0.5 truncate text-xs text-ink/50">
                {{ c.note || 'Sin nota' }}
              </p>
            </div>
            <button
              type="button"
              class="inline-flex shrink-0 items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-bold transition-colors"
              :class="
                c.isActive
                  ? 'bg-green-100 text-green-700 hover:bg-green-200'
                  : 'bg-ink/10 text-ink/50 hover:bg-ink/15'
              "
              @click="patchCategory(c, { isActive: !c.isActive })"
            >
              <Icon
                :icon="c.isActive ? 'carbon:view' : 'carbon:view-off'"
                :width="12"
                :height="12"
              />
              {{ c.isActive ? 'Visible' : 'Oculto' }}
            </button>
          </div>
          <div class="mt-3 flex gap-2 border-t border-ink/8 pt-3">
            <router-link
              :to="`/admin/categorias/${c.id}/editar`"
              class="inline-flex flex-1 items-center justify-center gap-1.5 rounded-full border border-ink/15 px-3 py-2 text-xs font-semibold text-ink/70 transition-colors hover:bg-cream"
            >
              <Icon icon="carbon:edit" :width="13" :height="13" />
              Editar
            </router-link>
            <button
              type="button"
              class="inline-flex flex-1 items-center justify-center gap-1.5 rounded-full border border-red-200 px-3 py-2 text-xs font-semibold text-red-500 transition-colors hover:bg-red-50"
              @click="removeCategory(c)"
            >
              <Icon icon="carbon:trash-can" :width="13" :height="13" />
              Eliminar
            </button>
          </div>
        </article>
      </div>

      <div
        v-else
        class="mt-5 rounded-3xl border border-dashed border-ink/15 bg-white/60 px-6 py-12 text-center"
      >
        <span class="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-cream text-ink/40">
          <Icon icon="carbon:search" :width="22" :height="22" />
        </span>
        <p class="mt-3 text-sm font-semibold text-ink/60">
          Ninguna categoría coincide
        </p>
      </div>

      <PaginationBar
        v-model:page="catPage"
        :total="filteredCategories.length"
        :page-size="CAT_SIZE"
      />
    </section>
  </div>
</template>

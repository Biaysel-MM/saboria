<script setup>
import { computed, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { api } from '../../services/api.js'
import { resolveImage, loadCatalog } from '../../data/products.js'
import { notify } from '../../stores/toasts.js'
import {
  loadAdmin,
  loaded,
  categories,
  products,
  busy,
} from '../../stores/admin.js'

const route = useRoute()
const router = useRouter()

const editingId = computed(() =>
  route.name === 'admin-producto-editar' ? Number(route.params.id) : null,
)
const title = computed(() =>
  editingId.value ? 'Editar producto' : 'Nuevo producto',
)

const emptyProduct = () => ({
  name: '',
  description: '',
  price: 0,
  emoji: '🍓', // fijo: solo se muestra si no hay imagen
  imageUrl: '',
  c1: '#ffe3ec',
  c2: '#ff8fb3',
  c3: '#ff4d84',
  accent: '#e8467c',
  categoryId: null,
  isFeatured: true,
  isActive: true,
})

const form = ref(emptyProduct())
const notFound = ref(false)
const uploading = ref(false)
const fileInput = ref(null)
const dragOverFile = ref(false)
const formEl = ref(null)

onMounted(async () => {
  if (!loaded.value) await loadAdmin()
  if (editingId.value) {
    const p = products.value.find((x) => x.id === editingId.value)
    if (!p) {
      notFound.value = true
      notify('error', 'Producto no encontrado')
      router.replace('/admin/productos')
      return
    }
    form.value = {
      name: p.name,
      description: p.description || '',
      price: p.price,
      emoji: p.emoji || '🍓',
      imageUrl: p.imageUrl || '',
      c1: p.c1,
      c2: p.c2,
      c3: p.c3,
      accent: p.accent,
      categoryId: p.categoryId ?? null,
      isFeatured: p.isFeatured,
      isActive: p.isActive,
    }
  } else {
    form.value.categoryId = categories.value[0]?.id ?? null
  }
})

/* ------------------------------------------------------------- imagen */

async function uploadFile(file) {
  if (!file) return
  uploading.value = true
  try {
    const fd = new FormData()
    fd.append('file', file)
    const res = await api.post('/admin/upload/image', fd)
    form.value.imageUrl = res.url
    notify('ok', 'Imagen subida correctamente')
  } catch (e) {
    notify('error', `No se pudo subir la imagen: ${e.message}`)
  } finally {
    uploading.value = false
    if (fileInput.value) fileInput.value.value = ''
  }
}

function pickImage(e) {
  uploadFile(e.target.files?.[0])
}
function onDropFile(e) {
  dragOverFile.value = false
  uploadFile(e.dataTransfer?.files?.[0])
}

/* ------------------------------------------------------------ paletas */

const COLOR_THEMES = [
  { name: 'Fresa', c1: '#ffe3ec', c2: '#ff8fb3', c3: '#ff4d84', accent: '#e8467c' },
  { name: 'Mango', c1: '#fff1c9', c2: '#ffab3d', c3: '#ff7a12', accent: '#ea6a06' },
  { name: 'Matcha', c1: '#eaf9d8', c2: '#93d76a', c3: '#4fb63c', accent: '#3f9c2c' },
  { name: 'Menta', c1: '#dcfafa', c2: '#6fd9d6', c3: '#1fb9b6', accent: '#0e9a97' },
  { name: 'Choco', c1: '#f0d5c6', c2: '#c98a68', c3: '#96583c', accent: '#7c452c' },
  { name: 'Café', c1: '#f2e2cd', c2: '#c99a70', c3: '#96663f', accent: '#7a4e2c' },
  { name: 'Ciruela', c1: '#f2e7ff', c2: '#bb96f5', c3: '#8b5cf6', accent: '#7c3aed' },
  { name: 'Frambuesa', c1: '#ffe0ea', c2: '#ff87ab', c3: '#ff3d75', accent: '#f2356b' },
  { name: 'Miel', c1: '#fff5c9', c2: '#ffd45c', c3: '#ffb31f', accent: '#e0980a' },
  { name: 'Arándano', c1: '#e0edff', c2: '#82b1ff', c3: '#3d7dff', accent: '#2f5fd8' },
  { name: 'Sandía', c1: '#ffe9e3', c2: '#ff8a70', c3: '#ff4438', accent: '#e02f24' },
  { name: 'Lavanda', c1: '#efe9ff', c2: '#b9a7f2', c3: '#8e76e0', accent: '#7259c9' },
]

function applyTheme(t) {
  form.value.c1 = t.c1
  form.value.c2 = t.c2
  form.value.c3 = t.c3
  form.value.accent = t.accent
  notify('ok', `Paleta "${t.name}" aplicada`)
}

function hexToHsl(hex) {
  let h = String(hex || '#888888').replace('#', '')
  if (h.length === 3) h = h.split('').map((c) => c + c).join('')
  const r = parseInt(h.slice(0, 2), 16) / 255
  const g = parseInt(h.slice(2, 4), 16) / 255
  const b = parseInt(h.slice(4, 6), 16) / 255
  const max = Math.max(r, g, b)
  const min = Math.min(r, g, b)
  const l = (max + min) / 2
  let hh = 0
  let s = 0
  if (max !== min) {
    const d = max - min
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min)
    if (max === r) hh = (g - b) / d + (g < b ? 6 : 0)
    else if (max === g) hh = (b - r) / d + 2
    else hh = (r - g) / d + 4
    hh /= 6
  }
  return { h: hh * 360, s: s * 100, l: l * 100 }
}

function hslToHex(h, s, l) {
  h = ((h % 360) + 360) % 360
  s = Math.min(100, Math.max(0, s)) / 100
  l = Math.min(100, Math.max(0, l)) / 100
  const c = (1 - Math.abs(2 * l - 1)) * s
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1))
  const m = l - c / 2
  let r = 0
  let g = 0
  let b = 0
  if (h < 60) [r, g, b] = [c, x, 0]
  else if (h < 120) [r, g, b] = [x, c, 0]
  else if (h < 180) [r, g, b] = [0, c, x]
  else if (h < 240) [r, g, b] = [0, x, c]
  else if (h < 300) [r, g, b] = [x, 0, c]
  else [r, g, b] = [c, 0, x]
  const to = (v) =>
    Math.round((v + m) * 255).toString(16).padStart(2, '0')
  return `#${to(r)}${to(g)}${to(b)}`
}

const ROLE_DELTAS = {
  c1: [
    { key: 'c2', dl: -16, ds: 4 },
    { key: 'c3', dl: -32, ds: 8 },
    { key: 'accent', dl: -44, ds: 10 },
  ],
  c2: [
    { key: 'c1', dl: 16, ds: -4 },
    { key: 'c3', dl: -16, ds: 4 },
    { key: 'accent', dl: -28, ds: 8 },
  ],
  c3: [
    { key: 'c1', dl: 34, ds: -8 },
    { key: 'c2', dl: 17, ds: -4 },
    { key: 'accent', dl: -12, ds: 6 },
  ],
  accent: [
    { key: 'c3', dl: 14, ds: -6 },
    { key: 'c2', dl: 30, ds: -10 },
    { key: 'c1', dl: 44, ds: -14 },
  ],
}
const SLOT_LABEL = { c1: 'claro', c2: 'medio', c3: 'intenso', accent: 'acento' }

function fillFrom(slot) {
  const base = hexToHsl(form.value[slot])
  for (const d of ROLE_DELTAS[slot]) {
    form.value[d.key] = hslToHex(base.h, base.s + d.ds, base.l + d.dl)
  }
  notify('ok', `Paleta generada desde el color ${SLOT_LABEL[slot]}`)
}

/* ------------------------------------------------------------- guardar */

const previewGradient = computed(() =>
  `radial-gradient(115% 95% at 70% 18%, ${form.value.c1} 0%, ${form.value.c2} 42%, ${form.value.c3} 100%)`,
)

async function save() {
  if (!form.value.name.trim()) {
    notify('warn', 'El nombre es obligatorio')
    return
  }
  if (!form.value.categoryId) {
    notify('warn', 'La categoría es obligatoria')
    return
  }
  busy.value = true
  try {
    const payload = {
      name: form.value.name,
      description: form.value.description,
      price: Number(form.value.price) || 0,
      c1: form.value.c1,
      c2: form.value.c2,
      c3: form.value.c3,
      accent: form.value.accent,
      categoryId: Number(form.value.categoryId),
      imageUrl: form.value.imageUrl || null,
      isFeatured: form.value.isFeatured,
      isActive: form.value.isActive,
    }
    if (editingId.value) {
      await api.put(`/admin/products/${editingId.value}`, payload)
      notify('ok', 'Producto actualizado — la página pública ya lo muestra')
    } else {
      await api.post('/admin/products', payload)
      notify('ok', 'Producto creado — la página pública ya lo muestra')
    }
    await loadAdmin({ force: true })
    loadCatalog()
    router.push('/admin/productos')
  } catch (e) {
    notify('error', e.message)
  } finally {
    busy.value = false
  }
}

function cancel() {
  router.push('/admin/productos')
}
</script>

<template>
  <div>
    <!-- barra superior -->
    <div
      class="sticky top-0 z-30 -mx-5 mb-6 flex flex-wrap items-center justify-between gap-3 border-b border-ink/10 bg-cream/90 px-5 py-3.5 backdrop-blur"
    >
      <div class="flex items-center gap-3">
        <div>
          <h2 class="font-display text-lg font-semibold leading-tight">
            {{ title }}
          </h2>
          <p class="text-xs text-ink/50">
            Los cambios se ven en el sitio público al guardar
          </p>
        </div>
      </div>
      <div class="flex gap-2">
        <button
          type="button"
          class="inline-flex items-center gap-1.5 rounded-full border border-ink/15 bg-white px-5 py-2.5 text-sm font-semibold text-ink/60 transition-colors hover:border-ink/30 hover:text-ink"
          @click="cancel"
        >
          <Icon icon="carbon:close" :width="15" :height="15" />
          Cancelar
        </button>
        <button
          type="button"
          class="inline-flex items-center gap-1.5 rounded-full bg-ink px-6 py-2.5 text-sm font-bold text-cream transition-colors hover:bg-brand disabled:opacity-50"
          :disabled="busy || uploading"
          @click="formEl?.requestSubmit()"
        >
          <Icon
            :icon="busy ? 'carbon:renew' : 'carbon:save'"
            :width="15"
            :height="15"
            :class="busy ? 'animate-spin' : ''"
          />
          {{ busy ? 'Guardando…' : 'Guardar' }}
        </button>
      </div>
    </div>

    <form ref="formEl" class="rounded-3xl border border-ink/10 bg-white p-6" @submit.prevent="save">
      <div class="grid gap-6 md:grid-cols-2">
        <!-- preview + imagen -->
        <div>
          <div
            class="flex aspect-[4/3] items-center justify-center overflow-hidden rounded-2xl"
            :style="{ background: previewGradient }"
          >
            <img
              v-if="resolveImage(form.imageUrl)"
              :src="resolveImage(form.imageUrl)"
              alt=""
              class="max-h-full max-w-full object-contain p-4 drop-shadow-[0_12px_16px_rgba(40,24,20,0.28)]"
            />
            <span v-else class="text-6xl">{{ form.emoji }}</span>
          </div>

          <div
            class="mt-3 rounded-2xl border-2 border-dashed px-4 py-6 text-center transition-colors"
            :class="
              dragOverFile
                ? 'border-brand bg-brand/5'
                : 'border-ink/20 hover:border-brand/60'
            "
            @dragover.prevent="dragOverFile = true"
            @dragleave="dragOverFile = false"
            @drop.prevent="onDropFile"
          >
            <Icon
              icon="carbon:upload"
              :width="22"
              :height="22"
              class="mx-auto text-ink/35"
            />
            <p class="mt-2 text-sm font-semibold text-ink/75">
              {{ uploading ? 'Subiendo…' : 'Arrastra aquí tu imagen' }}
            </p>
            <p class="mt-1 text-xs text-ink/50">
              PNG sin fondo · JPG, PNG, WEBP o GIF · máx. 5 MB
            </p>
            <button
              type="button"
              class="mt-3 inline-flex items-center gap-1.5 rounded-full bg-ink px-5 py-2.5 text-xs font-bold text-cream transition-colors hover:bg-brand disabled:opacity-50"
              :disabled="uploading"
              @click="fileInput?.click()"
            >
              <Icon icon="carbon:image" :width="14" :height="14" />
              {{ uploading ? 'Subiendo…' : 'Seleccionar archivo' }}
            </button>
            <input
              ref="fileInput"
              type="file"
              class="hidden"
              accept="image/png,image/jpeg,image/webp,image/gif"
              @change="pickImage"
            />
            <button
              v-if="form.imageUrl"
              type="button"
              class="mt-2 inline-flex w-full items-center justify-center gap-1 text-xs text-red-500 hover:underline"
              @click="form.imageUrl = ''"
            >
              <Icon icon="carbon:trash-can" :width="12" :height="12" />
              Quitar imagen
            </button>
          </div>
        </div>

        <!-- campos -->
        <div class="space-y-4">
          <div>
            <label class="block text-xs font-bold uppercase tracking-[0.12em] text-ink/50">
              Nombre *
            </label>
            <input
              v-model="form.name"
              placeholder="Malteada de Fresa"
              class="mt-1.5 w-full rounded-xl border border-ink/15 px-4 py-2.5 text-sm outline-none transition-colors focus:border-brand"
            />
          </div>

          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="block text-xs font-bold uppercase tracking-[0.12em] text-ink/50">
                Precio RD$
              </label>
              <input
                v-model.number="form.price"
                type="number"
                min="0"
                class="mt-1.5 w-full rounded-xl border border-ink/15 px-4 py-2.5 text-sm outline-none transition-colors focus:border-brand"
              />
            </div>
            <div>
              <label class="block text-xs font-bold uppercase tracking-[0.12em] text-ink/50">
                Categoría *
              </label>
              <select
                v-model="form.categoryId"
                class="mt-1.5 w-full rounded-xl border border-ink/15 px-4 py-2.5 text-sm outline-none transition-colors focus:border-brand"
              >
                <option
                  v-for="c in categories"
                  :key="c.id"
                  :value="c.id"
                >
                  {{ c.name }}
                </option>
              </select>
            </div>
          </div>
          <p class="-mt-2 text-xs text-ink/45">
            La categoría es también la etiqueta ("tipo") que se muestra en el
            hero y las tarjetas.
          </p>

          <div>
            <label class="block text-xs font-bold uppercase tracking-[0.12em] text-ink/50">
              Descripción
            </label>
            <textarea
              v-model="form.description"
              rows="3"
              class="mt-1.5 w-full rounded-xl border border-ink/15 px-4 py-2.5 text-sm outline-none transition-colors focus:border-brand"
            />
          </div>

          <!-- colores -->
          <div>
            <label class="block text-xs font-bold uppercase tracking-[0.12em] text-ink/50">
              Temas de colores (de un clic)
            </label>
            <div class="mt-2 flex flex-wrap gap-2">
              <button
                v-for="t in COLOR_THEMES"
                :key="t.name"
                type="button"
                class="flex items-center gap-2 rounded-full border border-ink/15 py-1 pl-1 pr-3 text-xs font-semibold transition-all hover:border-brand hover:bg-brand/5"
                @click="applyTheme(t)"
              >
                <span class="flex overflow-hidden rounded-full">
                  <span
                    v-for="c in [t.c1, t.c2, t.c3, t.accent]"
                    :key="c"
                    class="h-4 w-3"
                    :style="{ background: c }"
                  />
                </span>
                {{ t.name }}
              </button>
            </div>

            <label class="mt-4 block text-xs font-bold uppercase tracking-[0.12em] text-ink/50">
              O elige el color a mano y genera el resto
            </label>
            <div class="mt-2 flex flex-wrap gap-4">
              <div
                v-for="slot in ['c1', 'c2', 'c3', 'accent']"
                :key="slot"
                class="flex flex-col items-center gap-1"
              >
                <input
                  v-model="form[slot]"
                  type="color"
                  class="h-10 w-14 cursor-pointer rounded-lg border border-ink/10 p-0"
                />
                <span class="text-[10px] font-bold uppercase text-ink/45">
                  {{ SLOT_LABEL[slot] }}
                </span>
                <button
                  type="button"
                  class="inline-flex items-center gap-1 text-[11px] font-semibold text-ink/50 transition-colors hover:text-brand"
                  title="Generar los otros 3 colores desde este"
                  @click="fillFrom(slot)"
                >
                  <Icon icon="carbon:magic-wand" :width="12" :height="12" />
                  generar
                </button>
              </div>
            </div>
          </div>

          <div class="flex flex-wrap gap-4">
            <label class="flex items-center gap-2 text-sm font-semibold">
              <input
                v-model="form.isFeatured"
                type="checkbox"
                class="h-4 w-4 accent-brand"
              />
              Aparece en el hero
            </label>
            <label class="flex items-center gap-2 text-sm font-semibold">
              <input
                v-model="form.isActive"
                type="checkbox"
                class="h-4 w-4 accent-brand"
              />
              Visible en el sitio
            </label>
          </div>
        </div>
      </div>
    </form>
  </div>
</template>

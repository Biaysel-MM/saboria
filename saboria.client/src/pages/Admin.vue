<script setup>
import { computed, onMounted, ref, watch } from 'vue'
import { api } from '../services/api.js'
import { useAuth } from '../stores/auth.js'
import { loadCatalog, resolveImage } from '../data/products.js'

const { user, isAuthenticated, loading: authLoading, signIn, signOut } = useAuth()

/* ---------------------------------------------------------------- login */
const email = ref('admin@saboria.do')
const password = ref('')
const loginError = ref('')
const loggingIn = ref(false)

async function submitLogin() {
  loggingIn.value = true
  loginError.value = ''
  const res = await signIn(email.value.trim(), password.value)
  if (!res.success) loginError.value = res.error
  loggingIn.value = false
}

/* ---------------------------------------------------------------- toasts */
const toasts = ref([])
let toastSeq = 0

function notify(type, text) {
  const id = ++toastSeq
  toasts.value.push({ id, type, text })
  setTimeout(() => {
    toasts.value = toasts.value.filter((t) => t.id !== id)
  }, 3800)
}

const TOAST_CLASS = {
  ok: 'bg-green-600',
  error: 'bg-red-600',
  warn: 'bg-amber-500',
}
const TOAST_ICON = { ok: '✓', error: '✕', warn: '⚠' }

/* ----------------------------------------------------------------- tabs */
const tab = ref('productos')
const tabs = [
  { key: 'productos', label: 'Productos' },
  { key: 'categorias', label: 'Categorías' },
  { key: 'textos', label: 'Textos del sitio' },
]

/* ------------------------------------------------------------- estado */
const adminProducts = ref([])
const adminCategories = ref([])
const settingsForm = ref({})
const busy = ref(false)

async function refreshAll() {
  const [products, categories, settings] = await Promise.all([
    api.get('/admin/products'),
    api.get('/admin/categories'),
    api.get('/admin/settings'),
  ])
  adminProducts.value = products
  adminCategories.value = categories
  const { id, updatedAt, ...texts } = settings
  settingsForm.value = { ...texts }
}

async function loadAdmin() {
  busy.value = true
  try {
    await refreshAll()
  } catch (e) {
    notify('error', e.message)
  } finally {
    busy.value = false
  }
}

watch(isAuthenticated, (v) => {
  if (v) loadAdmin()
})

onMounted(() => {
  if (isAuthenticated.value) loadAdmin()
})

/** Tras cada mutación, refresca el panel y la página pública. */
async function afterChange() {
  await refreshAll()
  loadCatalog()
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

/* ------------------------------------------------- generador de paleta */

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
    Math.round((v + m) * 255)
      .toString(16)
      .padStart(2, '0')
  return `#${to(r)}${to(g)}${to(b)}`
}

/** Deltas relativos al color base elegido (claro/medio/intenso/acento). */
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

/* ------------------------------------------------------------ productos */

const emptyProduct = () => ({
  id: null,
  name: '',
  description: '',
  price: 0,
  // Emoji fijo (no editable): se muestra solo si el producto no tiene imagen.
  emoji: '🍽️',
  imageUrl: '',
  c1: '#ffe3ec',
  c2: '#ff8fb3',
  c3: '#ff4d84',
  accent: '#e8467c',
  categoryId: null,
  isFeatured: true,
  isActive: true,
})

const showForm = ref(false)
const form = ref(emptyProduct())
const uploading = ref(false)
const fileInput = ref(null)
const dragOverFile = ref(false)

function newProduct() {
  form.value = emptyProduct()
  // La categoría es obligatoria: preseleccionamos la primera.
  form.value.categoryId = adminCategories.value[0]?.id ?? null
  showForm.value = true
}

function editProduct(p) {
  form.value = {
    id: p.id,
    name: p.name,
    description: p.description || '',
    price: p.price,
    emoji: p.emoji || '🍽️',
    imageUrl: p.imageUrl || '',
    c1: p.c1,
    c2: p.c2,
    c3: p.c3,
    accent: p.accent,
    categoryId: p.categoryId ?? null,
    isFeatured: p.isFeatured,
    isActive: p.isActive,
  }
  showForm.value = true
}

const previewGradient = computed(() =>
  `radial-gradient(115% 95% at 70% 18%, ${form.value.c1} 0%, ${form.value.c2} 42%, ${form.value.c3} 100%)`,
)

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

async function saveProduct() {
  if (!form.value.name.trim() || !form.value.categoryId) {
    notify('warn', 'El nombre y la categoría son obligatorios')
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
    if (form.value.id) {
      await api.put(`/admin/products/${form.value.id}`, payload)
      notify('ok', 'Producto actualizado — la página pública ya lo muestra')
    } else {
      await api.post('/admin/products', payload)
      notify('ok', 'Producto creado — la página pública ya lo muestra')
    }
    showForm.value = false
    await afterChange()
  } catch (e) {
    notify('error', e.message)
  } finally {
    busy.value = false
  }
}

async function patchProduct(p, data) {
  try {
    await api.put(`/admin/products/${p.id}`, data)
    notify('ok', `${p.name} actualizado`)
    await afterChange()
  } catch (e) {
    notify('error', e.message)
  }
}

async function deleteProduct(p) {
  if (!confirm(`¿Eliminar "${p.name}" definitivamente?`)) return
  try {
    await api.delete(`/admin/products/${p.id}`)
    notify('ok', 'Producto eliminado')
    await afterChange()
  } catch (e) {
    notify('error', e.message)
  }
}

/* --------------------------------------------- orden con drag & drop */
/* Pointer events en lugar de HTML5 DnD: funciona con ratón Y con
   táctil (los eventos dragstart/drop de HTML5 no existen en móvil). */

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
  commitOrder(from, to)
}

async function commitOrder(from, to) {
  const list = [...adminProducts.value]
  const [moved] = list.splice(from, 1)
  list.splice(to, 0, moved)
  try {
    adminProducts.value = list
    await api.put('/admin/products/order', { ids: list.map((p) => p.id) })
    notify('ok', 'Orden actualizado — el hero usa este orden')
    await afterChange()
  } catch (e) {
    notify('error', e.message)
    await refreshAll()
  }
}

/* ----------------------------------------------------------- categorías */

const showCatForm = ref(false)
const catForm = ref({
  id: null,
  name: '',
  note: '',
  isActive: true,
  imageUrl: '',
})
const catUploading = ref(false)
const catFileInput = ref(null)
const catDragOver = ref(false)

// Imagen por defecto de categorías sin imagen propia.
const GENERAL_CAT = resolveImage('categoriaGeneral.png')

function newCategory() {
  catForm.value = {
    id: null,
    name: '',
    note: '',
    isActive: true,
    imageUrl: '',
  }
  showCatForm.value = true
}

function editCategory(c) {
  catForm.value = {
    id: c.id,
    name: c.name,
    note: c.note || '',
    isActive: c.isActive,
    imageUrl: c.imageUrl || '',
  }
  showCatForm.value = true
}

async function uploadCatFile(file) {
  if (!file) return
  catUploading.value = true
  try {
    const fd = new FormData()
    fd.append('file', file)
    const res = await api.post('/admin/upload/image', fd)
    catForm.value.imageUrl = res.url
    notify('ok', 'Imagen de categoría subida')
  } catch (e) {
    notify('error', `No se pudo subir la imagen: ${e.message}`)
  } finally {
    catUploading.value = false
    if (catFileInput.value) catFileInput.value.value = ''
  }
}

function pickCatImage(e) {
  uploadCatFile(e.target.files?.[0])
}

function onDropCatFile(e) {
  catDragOver.value = false
  uploadCatFile(e.dataTransfer?.files?.[0])
}

function useGeneralCat() {
  catForm.value.imageUrl = ''
  notify('ok', 'Se usará la imagen general')
}

async function saveCategory() {
  if (!catForm.value.name.trim()) {
    notify('warn', 'El nombre es obligatorio')
    return
  }
  try {
    const payload = {
      name: catForm.value.name.trim(),
      note: catForm.value.note || null,
      imageUrl: catForm.value.imageUrl,
      isActive: catForm.value.isActive,
    }
    if (catForm.value.id) {
      await api.put(`/admin/categories/${catForm.value.id}`, payload)
      notify('ok', 'Categoría actualizada')
    } else {
      await api.post('/admin/categories', payload)
      notify('ok', 'Categoría creada')
    }
    showCatForm.value = false
    await afterChange()
  } catch (e) {
    notify('error', e.message)
  }
}

async function deleteCategory(c) {
  if (!confirm(`¿Eliminar la categoría "${c.name}"? Sus productos quedan sin categoría.`))
    return
  try {
    await api.delete(`/admin/categories/${c.id}`)
    notify('ok', 'Categoría eliminada')
    await afterChange()
  } catch (e) {
    notify('error', e.message)
  }
}

/* --------------------------------------------------------------- textos */

async function saveSettings() {
  try {
    await api.put('/admin/settings', settingsForm.value)
    notify('ok', 'Textos guardados — la página pública ya los muestra')
    await afterChange()
  } catch (e) {
    notify('error', e.message)
  }
}

const textFields = [
  { key: 'menuBadge', label: 'Menú — etiqueta', type: 'input' },
  { key: 'menuTitle', label: 'Menú — título', type: 'input' },
  { key: 'menuText', label: 'Menú — párrafo', type: 'textarea' },
  { key: 'catalogBadge', label: 'Catálogo — etiqueta', type: 'input' },
  { key: 'catalogTitle', label: 'Catálogo — título', type: 'input' },
  { key: 'catalogText', label: 'Catálogo — párrafo', type: 'textarea' },
  { key: 'ctaTitle', label: 'Banda CTA — título', type: 'input' },
  { key: 'ctaText', label: 'Banda CTA — párrafo', type: 'textarea' },
  { key: 'footerDescription', label: 'Footer — descripción', type: 'textarea' },
  { key: 'scheduleWeek', label: 'Horario — lunes a viernes', type: 'input' },
  { key: 'scheduleSaturday', label: 'Horario — sábado', type: 'input' },
  { key: 'scheduleSunday', label: 'Horario — domingo', type: 'input' },
  { key: 'address', label: 'Dirección', type: 'input' },
  { key: 'phone', label: 'Teléfono', type: 'input' },
  { key: 'email', label: 'Correo', type: 'input' },
]

function logout() {
  signOut()
}
</script>

<template>
  <div class="min-h-screen bg-cream text-ink">
    <!-- ---------------------------------------------------------- toasts -->
    <div
      class="pointer-events-none fixed right-4 top-4 z-[60] flex w-[min(360px,calc(100vw-2rem))] flex-col gap-2"
      role="status"
      aria-live="polite"
    >
      <TransitionGroup name="toast">
        <div
          v-for="t in toasts"
          :key="t.id"
          class="pointer-events-auto flex items-start gap-2 rounded-2xl px-4 py-3 text-sm font-semibold text-white shadow-[0_16px_40px_-18px_rgba(0,0,0,0.5)]"
          :class="TOAST_CLASS[t.type] || 'bg-ink'"
        >
          <span aria-hidden="true">{{ TOAST_ICON[t.type] || '•' }}</span>
          <span>{{ t.text }}</span>
        </div>
      </TransitionGroup>
    </div>

    <!-- ------------------------------------------------------------ login -->
    <div
      v-if="authLoading"
      class="flex min-h-screen items-center justify-center text-ink/50"
    >
      Cargando…
    </div>

    <div
      v-else-if="!isAuthenticated"
      class="flex min-h-screen items-center justify-center px-5"
    >
      <form
        class="w-full max-w-md rounded-3xl border border-ink/10 bg-white p-8 shadow-[0_24px_60px_-30px_rgba(36,26,23,0.4)]"
        @submit.prevent="submitLogin"
      >
        <h1 class="font-display text-2xl font-semibold">Saboria — Admin</h1>
        <p class="mt-1 text-sm text-ink/55">
          Entra para editar productos, categorías y textos del sitio.
        </p>

        <label class="mt-6 block text-xs font-bold uppercase tracking-[0.12em] text-ink/50">
          Correo
        </label>
        <input
          v-model="email"
          type="email"
          required
          autocomplete="username"
          class="mt-1.5 w-full rounded-xl border border-ink/15 px-4 py-2.5 text-sm outline-none focus:border-brand"
        />

        <label class="mt-4 block text-xs font-bold uppercase tracking-[0.12em] text-ink/50">
          Contraseña
        </label>
        <input
          v-model="password"
          type="password"
          required
          autocomplete="current-password"
          class="mt-1.5 w-full rounded-xl border border-ink/15 px-4 py-2.5 text-sm outline-none focus:border-brand"
        />

        <p
          v-if="loginError"
          class="mt-4 rounded-xl bg-red-50 px-3 py-2 text-sm text-red-600"
        >
          {{ loginError }}
        </p>

        <button
          type="submit"
          :disabled="loggingIn"
          class="mt-6 w-full rounded-full bg-ink py-3 text-sm font-bold text-cream transition-all hover:bg-brand disabled:opacity-50"
        >
          {{ loggingIn ? 'Entrando…' : 'Entrar' }}
        </button>

        <router-link
          to="/"
          class="mt-4 block text-center text-sm text-ink/50 hover:text-brand"
        >
          ← Volver al sitio
        </router-link>
      </form>
    </div>

    <!-- ----------------------------------------------------------- panel -->
    <div v-else>
      <header class="border-b border-ink/10 bg-white">
        <div
          class="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-5 py-4"
        >
          <div>
            <h1 class="font-display text-lg font-semibold">Panel de Saboria</h1>
            <p class="text-xs text-ink/50">
              {{ user?.fullName }} · {{ user?.email }}
            </p>
          </div>
          <div class="flex items-center gap-2">
            <router-link
              to="/"
              class="rounded-full border border-ink/15 px-4 py-2 text-sm font-semibold text-ink/70 transition-colors hover:bg-cream"
            >
              Ver sitio
            </router-link>
            <button
              type="button"
              class="rounded-full bg-ink px-4 py-2 text-sm font-bold text-cream transition-colors hover:bg-brand"
              @click="logout"
            >
              Salir
            </button>
          </div>
        </div>

        <nav class="mx-auto flex max-w-6xl gap-1 px-5 pb-3">
          <button
            v-for="t in tabs"
            :key="t.key"
            type="button"
            class="rounded-full px-4 py-2 text-sm font-semibold transition-colors"
            :class="
              tab === t.key
                ? 'bg-ink text-cream'
                : 'text-ink/60 hover:bg-cream hover:text-ink'
            "
            @click="tab = t.key"
          >
            {{ t.label }}
          </button>
        </nav>
      </header>

      <main class="mx-auto max-w-6xl px-5 py-8">
        <!-- ============================================ PRODUCTOS -->
        <section v-if="tab === 'productos'">
          <div class="flex flex-wrap items-center justify-between gap-3">
            <p class="text-sm text-ink/55">
              {{ adminProducts.length }} productos · arrastra las filas para
              ordenar el carrusel
            </p>
            <button
              type="button"
              class="rounded-full bg-brand px-5 py-2.5 text-sm font-bold text-white transition-all hover:bg-brand-deep"
              @click="newProduct"
            >
              + Nuevo producto
            </button>
          </div>

          <!-- formulario -->
          <form
            v-if="showForm"
            class="mt-5 rounded-3xl border border-ink/10 bg-white p-6"
            @submit.prevent="saveProduct"
          >
            <div class="flex items-center justify-between">
              <h2 class="font-display text-lg font-semibold">
                {{ form.id ? 'Editar producto' : 'Nuevo producto' }}
              </h2>
              <button
                type="button"
                class="text-sm text-ink/50 hover:text-ink"
                @click="showForm = false"
              >
                Cerrar
              </button>
            </div>

            <div class="mt-5 grid gap-5 md:grid-cols-2">
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
                  <span v-else class="text-6xl">{{ form.emoji || '🍽️' }}</span>
                </div>

                <!-- zona de arrastre -->
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
                  <p class="text-sm font-semibold text-ink/75">
                    {{ uploading ? 'Subiendo…' : 'Arrastra aquí tu imagen' }}
                  </p>
                  <p class="mt-1 text-xs text-ink/50">
                    PNG sin fondo · JPG, PNG, WEBP o GIF · máx. 5 MB
                  </p>
                  <button
                    type="button"
                    class="mt-3 rounded-full bg-ink px-5 py-2.5 text-xs font-bold text-cream transition-colors hover:bg-brand disabled:opacity-50"
                    :disabled="uploading"
                    @click="fileInput?.click()"
                  >
                    {{ uploading ? 'Subiendo…' : '📄 Seleccionar archivo' }}
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
                    class="mt-2 block w-full text-xs text-red-500 hover:underline"
                    @click="form.imageUrl = ''"
                  >
                    Quitar imagen
                  </button>
                </div>
              </div>

              <!-- campos -->
              <div class="space-y-4">
                <div>
                  <label
                    class="block text-xs font-bold uppercase tracking-[0.12em] text-ink/50"
                  >
                    Nombre *
                  </label>
                  <input
                    v-model="form.name"
                    required
                    class="mt-1.5 w-full rounded-xl border border-ink/15 px-4 py-2.5 text-sm outline-none focus:border-brand"
                  />
                </div>

                <div>
                  <label
                    class="block text-xs font-bold uppercase tracking-[0.12em] text-ink/50"
                  >
                    Precio RD$
                  </label>
                  <input
                    v-model.number="form.price"
                    type="number"
                    min="0"
                    class="mt-1.5 w-full rounded-xl border border-ink/15 px-4 py-2.5 text-sm outline-none focus:border-brand"
                  />
                </div>

                <div>
                  <label
                    class="block text-xs font-bold uppercase tracking-[0.12em] text-ink/50"
                  >
                    Categoría *
                  </label>
                  <select
                    v-model="form.categoryId"
                    required
                    class="mt-1.5 w-full rounded-xl border border-ink/15 px-4 py-2.5 text-sm outline-none focus:border-brand"
                  >
                    <option
                      v-for="c in adminCategories"
                      :key="c.id"
                      :value="c.id"
                    >
                      {{ c.name }}
                    </option>
                  </select>
                  <p class="mt-1 text-xs text-ink/45">
                    La categoría también es la etiqueta ("tipo") que se muestra
                    en el hero y las tarjetas.
                  </p>
                </div>

                <div>
                  <label
                    class="block text-xs font-bold uppercase tracking-[0.12em] text-ink/50"
                  >
                    Descripción
                  </label>
                  <textarea
                    v-model="form.description"
                    rows="3"
                    class="mt-1.5 w-full rounded-xl border border-ink/15 px-4 py-2.5 text-sm outline-none focus:border-brand"
                  />
                </div>

                <!-- colores -->
                <div>
                  <label
                    class="block text-xs font-bold uppercase tracking-[0.12em] text-ink/50"
                  >
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

                  <label
                    class="mt-4 block text-xs font-bold uppercase tracking-[0.12em] text-ink/50"
                  >
                    O elige el color a mano y genera el resto ✨
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
                        class="text-[11px] font-semibold text-ink/50 transition-colors hover:text-brand"
                        title="Generar los otros 3 colores desde este"
                        @click="fillFrom(slot)"
                      >
                        ✨ generar
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

            <div class="mt-6 flex gap-3">
              <button
                type="submit"
                :disabled="busy || uploading"
                class="rounded-full bg-ink px-6 py-3 text-sm font-bold text-cream transition-colors hover:bg-brand disabled:opacity-50"
              >
                {{ busy ? 'Guardando…' : 'Guardar' }}
              </button>
              <button
                type="button"
                class="rounded-full border border-ink/15 px-6 py-3 text-sm font-semibold text-ink/60"
                @click="showForm = false"
              >
                Cancelar
              </button>
            </div>
          </form>

          <!-- lista — móvil: tarjetas -->
          <div class="mt-5 space-y-3 md:hidden">
            <div
              v-for="(p, i) in adminProducts"
              :key="'card-' + p.id"
              :data-row="i"
              class="rounded-3xl border border-ink/10 bg-white p-4 transition-colors"
              :class="{
                'opacity-40': dragIndex === i,
                'bg-brand/5': dropIndex === i && dragIndex !== null && dragIndex !== i,
                'opacity-50': p.isActive === false && dragIndex !== i,
              }"
            >
              <div class="flex items-center gap-3">
                <span
                  class="cursor-grab touch-none select-none text-lg leading-none text-ink/35"
                  title="Arrastra para reordenar"
                  aria-hidden="true"
                  @pointerdown.prevent="onHandleDown($event, i)"
                >
                  ⠿
                </span>
                <span
                  class="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-xl text-lg"
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
                  <span v-else>{{ p.emoji }}</span>
                </span>
                <div class="min-w-0 flex-1">
                  <p class="truncate font-semibold">{{ p.name }}</p>
                  <p class="truncate text-xs text-ink/50">
                    {{ p.category?.name || p.tag }} · RD${{ p.price }}
                  </p>
                </div>
              </div>
              <div class="mt-3 flex flex-wrap items-center gap-1.5">
                <button
                  type="button"
                  class="rounded-full px-2.5 py-1 text-[11px] font-bold"
                  :class="
                    p.isActive
                      ? 'bg-green-100 text-green-700'
                      : 'bg-ink/10 text-ink/50'
                  "
                  @click="patchProduct(p, { isActive: !p.isActive })"
                >
                  {{ p.isActive ? 'Visible' : 'Oculto' }}
                </button>
                <button
                  type="button"
                  class="rounded-full px-2.5 py-1 text-[11px] font-bold"
                  :class="
                    p.isFeatured
                      ? 'bg-brand/15 text-brand'
                      : 'bg-ink/10 text-ink/50'
                  "
                  @click="patchProduct(p, { isFeatured: !p.isFeatured })"
                >
                  {{ p.isFeatured ? 'En hero' : 'Sin hero' }}
                </button>
                <span class="flex-1" />
                <button
                  type="button"
                  class="rounded-full border border-ink/15 px-3 py-1.5 text-xs font-semibold text-ink/70 hover:bg-cream"
                  @click="editProduct(p)"
                >
                  Editar
                </button>
                <button
                  type="button"
                  class="rounded-full border border-red-200 px-3 py-1.5 text-xs font-semibold text-red-500 hover:bg-red-50"
                  @click="deleteProduct(p)"
                >
                  Eliminar
                </button>
              </div>
            </div>
          </div>

          <!-- lista — escritorio: tabla -->
          <div
            class="mt-5 hidden overflow-x-auto rounded-3xl border border-ink/10 bg-white md:block"
          >
            <table class="w-full min-w-[720px] text-sm">
              <thead>
                <tr
                  class="border-b border-ink/10 text-left text-xs uppercase tracking-[0.1em] text-ink/45"
                >
                  <th class="px-4 py-3">Orden</th>
                  <th class="px-2 py-3">Producto</th>
                  <th class="px-2 py-3">Precio</th>
                  <th class="px-2 py-3">Estado</th>
                  <th class="px-4 py-3 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody>
                <tr
                  v-for="(p, i) in adminProducts"
                  :key="p.id"
                  :data-row="i"
                  class="border-b border-ink/5 transition-colors last:border-0"
                  :class="{
                    'opacity-40': dragIndex === i,
                    'bg-brand/5': dropIndex === i && dragIndex !== null && dragIndex !== i,
                    'opacity-50': p.isActive === false && dragIndex !== i,
                  }"
                >
                  <td class="px-4 py-3">
                    <span
                      class="cursor-grab touch-none select-none text-lg leading-none text-ink/35"
                      title="Arrastra para reordenar"
                      aria-hidden="true"
                      @pointerdown.prevent="onHandleDown($event, i)"
                    >
                      ⠿
                    </span>
                  </td>
                  <td class="px-2 py-3">
                    <div class="flex items-center gap-3">
                      <span
                        class="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-xl text-lg"
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
                        <span v-else>{{ p.emoji }}</span>
                      </span>
                      <div>
                        <p class="font-semibold">{{ p.name }}</p>
                        <p class="text-xs text-ink/50">
                          {{ p.category?.name || p.tag }}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td class="px-2 py-3 font-semibold">RD${{ p.price }}</td>
                  <td class="px-2 py-3">
                    <div class="flex flex-wrap gap-1.5">
                      <button
                        type="button"
                        class="rounded-full px-2.5 py-1 text-[11px] font-bold"
                        :class="
                          p.isActive
                            ? 'bg-green-100 text-green-700'
                            : 'bg-ink/10 text-ink/50'
                        "
                        @click="patchProduct(p, { isActive: !p.isActive })"
                      >
                        {{ p.isActive ? 'Visible' : 'Oculto' }}
                      </button>
                      <button
                        type="button"
                        class="rounded-full px-2.5 py-1 text-[11px] font-bold"
                        :class="
                          p.isFeatured
                            ? 'bg-brand/15 text-brand'
                            : 'bg-ink/10 text-ink/50'
                        "
                        @click="patchProduct(p, { isFeatured: !p.isFeatured })"
                      >
                        {{ p.isFeatured ? 'En hero' : 'Sin hero' }}
                      </button>
                    </div>
                  </td>
                  <td class="px-4 py-3">
                    <div class="flex justify-end gap-2">
                      <button
                        type="button"
                        class="rounded-full border border-ink/15 px-3 py-1.5 text-xs font-semibold text-ink/70 hover:bg-cream"
                        @click="editProduct(p)"
                      >
                        Editar
                      </button>
                      <button
                        type="button"
                        class="rounded-full border border-red-200 px-3 py-1.5 text-xs font-semibold text-red-500 hover:bg-red-50"
                        @click="deleteProduct(p)"
                      >
                        Eliminar
                      </button>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        <!-- ========================================== CATEGORÍAS -->
        <section v-else-if="tab === 'categorias'">
          <div class="flex items-center justify-between gap-3">
            <p class="text-sm text-ink/55">
              {{ adminCategories.length }} categorías
            </p>
            <button
              type="button"
              class="rounded-full bg-brand px-5 py-2.5 text-sm font-bold text-white transition-all hover:bg-brand-deep"
              @click="newCategory"
            >
              + Nueva categoría
            </button>
          </div>

          <form
            v-if="showCatForm"
            class="mt-5 rounded-3xl border border-ink/10 bg-white p-6"
            @submit.prevent="saveCategory"
          >
            <div class="flex items-center justify-between">
              <h2 class="font-display text-lg font-semibold">
                {{ catForm.id ? 'Editar categoría' : 'Nueva categoría' }}
              </h2>
              <button
                type="button"
                class="text-sm text-ink/50 hover:text-ink"
                @click="showCatForm = false"
              >
                Cerrar
              </button>
            </div>
            <div class="mt-4 flex flex-wrap items-center gap-4">
              <img
                :src="resolveImage(catForm.imageUrl) || GENERAL_CAT"
                alt=""
                class="h-16 w-16 rounded-2xl border border-ink/10 object-cover"
              />
              <div
                class="rounded-2xl border-2 border-dashed px-4 py-3 transition-colors"
                :class="
                  catDragOver
                    ? 'border-brand bg-brand/5'
                    : 'border-ink/20 hover:border-brand/60'
                "
                @dragover.prevent="catDragOver = true"
                @dragleave="catDragOver = false"
                @drop.prevent="onDropCatFile"
              >
                <p class="text-xs font-semibold text-ink/70">
                  {{ catUploading ? 'Subiendo…' : 'Arrastra la imagen o elígela' }}
                </p>
                <div class="mt-2 flex gap-2">
                  <button
                    type="button"
                    class="rounded-full bg-ink px-4 py-2 text-xs font-bold text-cream transition-colors hover:bg-brand disabled:opacity-50"
                    :disabled="catUploading"
                    @click="catFileInput?.click()"
                  >
                    📄 Elegir imagen
                  </button>
                  <button
                    v-if="catForm.imageUrl"
                    type="button"
                    class="rounded-full border border-ink/15 px-4 py-2 text-xs font-semibold text-ink/60"
                    @click="useGeneralCat"
                  >
                    Usar imagen general
                  </button>
                </div>
                <input
                  ref="catFileInput"
                  type="file"
                  class="hidden"
                  accept="image/png,image/jpeg,image/webp,image/gif"
                  @change="pickCatImage"
                />
              </div>
            </div>
            <p class="mt-1 text-xs text-ink/45">
              Si la categoría no tiene imagen propia se muestra la imagen
              general.
            </p>

            <div class="mt-4 grid gap-4 sm:grid-cols-2">
              <div>
                <label
                  class="block text-xs font-bold uppercase tracking-[0.12em] text-ink/50"
                >
                  Nombre *
                </label>
                <input
                  v-model="catForm.name"
                  required
                  class="mt-1.5 w-full rounded-xl border border-ink/15 px-4 py-2.5 text-sm outline-none focus:border-brand"
                />
              </div>
              <div>
                <label
                  class="block text-xs font-bold uppercase tracking-[0.12em] text-ink/50"
                >
                  Nota
                </label>
                <input
                  v-model="catForm.note"
                  placeholder="Batidas al momento"
                  class="mt-1.5 w-full rounded-xl border border-ink/15 px-4 py-2.5 text-sm outline-none focus:border-brand"
                />
              </div>
            </div>
            <label class="mt-4 flex items-center gap-2 text-sm font-semibold">
              <input
                v-model="catForm.isActive"
                type="checkbox"
                class="h-4 w-4 accent-brand"
              />
              Visible en el sitio
            </label>
            <div class="mt-5 flex gap-3">
              <button
                type="submit"
                :disabled="busy"
                class="rounded-full bg-ink px-6 py-3 text-sm font-bold text-cream transition-colors hover:bg-brand disabled:opacity-50"
              >
                Guardar
              </button>
              <button
                type="button"
                class="rounded-full border border-ink/15 px-6 py-3 text-sm font-semibold text-ink/60"
                @click="showCatForm = false"
              >
                Cancelar
              </button>
            </div>
          </form>

          <div class="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <div
              v-for="c in adminCategories"
              :key="c.id"
              class="rounded-3xl border border-ink/10 bg-white p-5"
              :class="{ 'opacity-50': !c.isActive }"
            >
              <div class="flex items-center gap-3">
                <img
                  :src="resolveImage(c.imageUrl) || GENERAL_CAT"
                  alt=""
                  class="h-11 w-11 shrink-0 rounded-2xl object-cover"
                />
                <div>
                  <p class="font-semibold">{{ c.name }}</p>
                  <p class="text-xs text-ink/50">{{ c.note || '—' }}</p>
                </div>
              </div>
              <div class="mt-4 flex gap-2">
                <button
                  type="button"
                  class="rounded-full border border-ink/15 px-3 py-1.5 text-xs font-semibold text-ink/70 hover:bg-cream"
                  @click="editCategory(c)"
                >
                  Editar
                </button>
                <button
                  type="button"
                  class="rounded-full border border-red-200 px-3 py-1.5 text-xs font-semibold text-red-500 hover:bg-red-50"
                  @click="deleteCategory(c)"
                >
                  Eliminar
                </button>
              </div>
            </div>
          </div>
        </section>

        <!-- ============================================= TEXTOS -->
        <section v-else>
          <p class="text-sm text-ink/55">
            Estos textos se muestran en la página pública (sección menú,
            catálogo, banda CTA y footer).
          </p>
          <form
            class="mt-5 rounded-3xl border border-ink/10 bg-white p-6"
            @submit.prevent="saveSettings"
          >
            <div class="grid gap-5 md:grid-cols-2">
              <div
                v-for="f in textFields"
                :key="f.key"
                :class="f.type === 'textarea' ? 'md:col-span-2' : ''"
              >
                <label
                  class="block text-xs font-bold uppercase tracking-[0.12em] text-ink/50"
                >
                  {{ f.label }}
                </label>
                <textarea
                  v-if="f.type === 'textarea'"
                  v-model="settingsForm[f.key]"
                  rows="2"
                  class="mt-1.5 w-full rounded-xl border border-ink/15 px-4 py-2.5 text-sm outline-none focus:border-brand"
                />
                <input
                  v-else
                  v-model="settingsForm[f.key]"
                  class="mt-1.5 w-full rounded-xl border border-ink/15 px-4 py-2.5 text-sm outline-none focus:border-brand"
                />
              </div>
            </div>
            <button
              type="submit"
              :disabled="busy"
              class="mt-6 rounded-full bg-ink px-6 py-3 text-sm font-bold text-cream transition-colors hover:bg-brand disabled:opacity-50"
            >
              {{ busy ? 'Guardando…' : 'Guardar textos' }}
            </button>
          </form>
        </section>
      </main>
    </div>
  </div>
</template>

<style scoped>
.toast-enter-active,
.toast-leave-active {
  transition:
    opacity 0.3s ease,
    transform 0.3s ease;
}

.toast-enter-from,
.toast-leave-to {
  opacity: 0;
  transform: translateX(28px);
}
</style>

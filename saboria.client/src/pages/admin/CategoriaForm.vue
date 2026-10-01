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
  busy,
} from '../../stores/admin.js'

const route = useRoute()
const router = useRouter()

const editingId = computed(() =>
  route.name === 'admin-categoria-editar' ? Number(route.params.id) : null,
)
const title = computed(() =>
  editingId.value ? 'Editar categoría' : 'Nueva categoría',
)

const GENERAL_CAT = resolveImage('categoriaGeneral.png')

const form = ref({ name: '', note: '', isActive: true, imageUrl: '' })
const uploading = ref(false)
const fileInput = ref(null)
const dragOver = ref(false)
const formEl = ref(null)

onMounted(async () => {
  if (!loaded.value) await loadAdmin()
  if (editingId.value) {
    const c = categories.value.find((x) => x.id === editingId.value)
    if (!c) {
      notify('error', 'Categoría no encontrada')
      router.replace('/admin/categorias')
      return
    }
    form.value = {
      name: c.name,
      note: c.note || '',
      isActive: c.isActive,
      imageUrl: c.imageUrl || '',
    }
  }
})

const previewSrc = computed(
  () => resolveImage(form.value.imageUrl) || GENERAL_CAT,
)

async function uploadFile(file) {
  if (!file) return
  uploading.value = true
  try {
    const fd = new FormData()
    fd.append('file', file)
    const res = await api.post('/admin/upload/image', fd)
    form.value.imageUrl = res.url
    notify('ok', 'Imagen de categoría subida')
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
  dragOver.value = false
  uploadFile(e.dataTransfer?.files?.[0])
}
function useGeneral() {
  form.value.imageUrl = ''
  notify('ok', 'Se usará la imagen general')
}

async function save() {
  if (!form.value.name.trim()) {
    notify('warn', 'El nombre es obligatorio')
    return
  }
  busy.value = true
  try {
    const payload = {
      name: form.value.name.trim(),
      note: form.value.note || null,
      imageUrl: form.value.imageUrl,
      isActive: form.value.isActive,
    }
    if (editingId.value) {
      await api.put(`/admin/categories/${editingId.value}`, payload)
      notify('ok', 'Categoría actualizada — la página pública ya lo muestra')
    } else {
      await api.post('/admin/categories', payload)
      notify('ok', 'Categoría creada — la página pública ya lo muestra')
    }
    await loadAdmin({ force: true })
    loadCatalog()
    router.push('/admin/categorias')
  } catch (e) {
    notify('error', e.message)
  } finally {
    busy.value = false
  }
}

function cancel() {
  router.push('/admin/categorias')
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
            Si no tiene imagen propia se muestra la imagen general
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

    <form ref="formEl" class="max-w-2xl rounded-3xl border border-ink/10 bg-white p-6" @submit.prevent="save">
      <!-- imagen -->
      <label class="block text-xs font-bold uppercase tracking-[0.12em] text-ink/50">
        Imagen de la categoría
      </label>
      <div class="mt-2 flex flex-wrap items-center gap-4">
        <img
          :src="previewSrc"
          alt=""
          class="h-16 w-16 rounded-2xl border border-ink/10 object-contain"
        />
        <div
          class="flex-1 rounded-2xl border-2 border-dashed px-4 py-3 transition-colors"
          :class="
            dragOver
              ? 'border-brand bg-brand/5'
              : 'border-ink/20 hover:border-brand/60'
          "
          @dragover.prevent="dragOver = true"
          @dragleave="dragOver = false"
          @drop.prevent="onDropFile"
        >
          <p class="text-xs font-semibold text-ink/70">
            {{ uploading ? 'Subiendo…' : 'Arrastra la imagen o elígela' }}
          </p>
          <div class="mt-2 flex flex-wrap gap-2">
            <button
              type="button"
              class="inline-flex items-center gap-1.5 rounded-full bg-ink px-4 py-2 text-xs font-bold text-cream transition-colors hover:bg-brand disabled:opacity-50"
              :disabled="uploading"
              @click="fileInput?.click()"
            >
              <Icon icon="carbon:image" :width="13" :height="13" />
              Elegir imagen
            </button>
            <button
              v-if="form.imageUrl"
              type="button"
              class="inline-flex items-center gap-1.5 rounded-full border border-ink/15 px-4 py-2 text-xs font-semibold text-ink/60 transition-colors hover:border-ink/30 hover:text-ink"
              @click="useGeneral"
            >
              <Icon icon="carbon:renew" :width="13" :height="13" />
              Usar imagen general
            </button>
          </div>
          <input
            ref="fileInput"
            type="file"
            class="hidden"
            accept="image/png,image/jpeg,image/webp,image/gif"
            @change="pickImage"
          />
        </div>
      </div>

      <div class="mt-6 grid gap-4 sm:grid-cols-2">
        <div>
          <label class="block text-xs font-bold uppercase tracking-[0.12em] text-ink/50">
            Nombre *
          </label>
          <input
            v-model="form.name"
            placeholder="Malteadas"
            class="mt-1.5 w-full rounded-xl border border-ink/15 px-4 py-2.5 text-sm outline-none transition-colors focus:border-brand"
          />
        </div>
        <div>
          <label class="block text-xs font-bold uppercase tracking-[0.12em] text-ink/50">
            Nota
          </label>
          <input
            v-model="form.note"
            placeholder="Batidas al momento"
            class="mt-1.5 w-full rounded-xl border border-ink/15 px-4 py-2.5 text-sm outline-none transition-colors focus:border-brand"
          />
        </div>
      </div>

      <label class="mt-5 flex items-center gap-2 text-sm font-semibold">
        <input
          v-model="form.isActive"
          type="checkbox"
          class="h-4 w-4 accent-brand"
        />
        Visible en el sitio
      </label>
    </form>
  </div>
</template>

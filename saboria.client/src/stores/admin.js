import { ref } from 'vue'
import { api } from '../services/api.js'
import { loadCatalog } from '../data/products.js'
import { notify } from './toasts.js'
import { askConfirm } from './confirm.js'

/* Estado compartido de todas las vistas del panel. */
export const products = ref([])
export const categories = ref([])
export const settings = ref({})
export const busy = ref(false)
export const loaded = ref(false)
/** Último error de carga del panel (banner persistente + reintento). */
export const loadError = ref(null)

/** Recarga productos + categorías + textos desde la API. */
export async function refreshAll() {
  const [p, c, s] = await Promise.all([
    api.get('/admin/products'),
    api.get('/admin/categories'),
    api.get('/admin/settings'),
  ])
  products.value = p
  categories.value = c
  const { id, updatedAt, ...texts } = s
  settings.value = { ...texts }
}

/** Carga inicial del panel (idempotente: reutiliza la petición en vuelo). */
const RETRY_COOLDOWN_MS = 8000
let inflight = null
let failedAt = 0

export async function loadAdmin({ force = false } = {}) {
  if (loaded.value && !force) return
  if (inflight) return inflight
  // Tras un fallo no reintentar en los próximos segundos: cada montaje de
  // vista disparaba otra tanda de peticiones y martillaba el backend
  // (throttler 429) mientras seguía caído. Recargar la página reinicia esto.
  if (!force && failedAt && Date.now() - failedAt < RETRY_COOLDOWN_MS) return
  busy.value = true
  inflight = (async () => {
    try {
      await refreshAll()
      loaded.value = true
      failedAt = 0
      loadError.value = null
    } catch (e) {
      failedAt = Date.now()
      loadError.value = e.message
      notify('error', e.message)
    } finally {
      busy.value = false
      inflight = null
    }
  })()
  return inflight
}

/**
 * Tras cada mutación: refresca el panel y la página pública
 * (el admin siempre ve los datos reales recién guardados).
 */
export async function afterChange() {
  await refreshAll()
  loadCatalog()
}

/* --------------------------------------------------------------- productos */

export async function patchProduct(p, data) {
  try {
    await api.put(`/admin/products/${p.id}`, data)
    notify('ok', `${p.name} actualizado`)
    await afterChange()
  } catch (e) {
    notify('error', e.message)
  }
}

export async function removeProduct(p) {
  const ok = await askConfirm(
    `¿Eliminar "${p.name}" definitivamente? Esta acción no se puede deshacer.`,
    { title: 'Eliminar producto', confirmLabel: 'Eliminar' },
  )
  if (!ok) return
  try {
    await api.delete(`/admin/products/${p.id}`)
    notify('ok', 'Producto eliminado')
    await afterChange()
  } catch (e) {
    notify('error', e.message)
  }
}

/**
 * Reordena moviendo `movedId` a la posición de `targetId` en el ORDEN
 * GLOBAL (funciona igual con búsqueda, filtro o paginado activos).
 */
export async function reorderTo(movedId, targetId) {
  if (movedId === targetId) return
  const list = [...products.value]
  const fromGlobal = list.findIndex((p) => p.id === movedId)
  const toGlobal = list.findIndex((p) => p.id === targetId)
  if (fromGlobal < 0 || toGlobal < 0) return
  const [moved] = list.splice(fromGlobal, 1)
  let insertAt = list.findIndex((p) => p.id === targetId)
  // Mover hacia abajo → queda justo después del objetivo (replica el
  // comportamiento del drag sobre la lista completa).
  if (fromGlobal < toGlobal) insertAt += 1
  list.splice(insertAt, 0, moved)
  try {
    products.value = list
    await api.put('/admin/products/order', { ids: list.map((p) => p.id) })
    notify('ok', 'Orden actualizado — el hero usa este orden')
    await afterChange()
  } catch (e) {
    notify('error', e.message)
    await refreshAll()
  }
}

/* -------------------------------------------------------------- categorías */

export async function patchCategory(c, data) {
  try {
    await api.put(`/admin/categories/${c.id}`, data)
    notify('ok', `${c.name} actualizada`)
    await afterChange()
  } catch (e) {
    notify('error', e.message)
  }
}

export async function removeCategory(c) {
  const ok = await askConfirm(
    `¿Eliminar la categoría "${c.name}"? Sus productos quedan sin categoría.`,
    { title: 'Eliminar categoría', confirmLabel: 'Eliminar' },
  )
  if (!ok) return
  try {
    await api.delete(`/admin/categories/${c.id}`)
    notify('ok', 'Categoría eliminada')
    await afterChange()
  } catch (e) {
    notify('error', e.message)
  }
}

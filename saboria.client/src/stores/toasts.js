import { ref } from 'vue'

/** Toasts globales del panel (éxito / error / aviso). */
export const toasts = ref([])
let seq = 0

function remove(id) {
  toasts.value = toasts.value.filter((t) => t.id !== id)
}

export function notify(type, text) {
  // Si el mismo mensaje ya está visible solo refresca su temporizador:
  // evita apilar copias idénticas cuando algo reintenta en bucle.
  const existing = toasts.value.find((t) => t.type === type && t.text === text)
  if (existing) {
    clearTimeout(existing.timer)
    existing.timer = setTimeout(() => remove(existing.id), 3800)
    return
  }
  const id = ++seq
  const timer = setTimeout(() => remove(id), 3800)
  toasts.value.push({ id, type, text, timer })
}

export const TOAST_CLASS = {
  ok: 'bg-green-600',
  error: 'bg-red-600',
  warn: 'bg-amber-500',
}
export const TOAST_ICON = {
  ok: 'carbon:checkmark',
  error: 'carbon:close-filled',
  warn: 'carbon:warning-alt',
}

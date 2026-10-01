import { ref } from 'vue'

/**
 * Confirmación en modal (fondo con blur) en lugar del alert() del
 * navegador. Uso: `if (await askConfirm('¿Eliminar X?')) { ... }`
 */
export const confirmState = ref({
  open: false,
  title: 'Confirmar',
  message: '',
  confirmLabel: 'Confirmar',
  danger: true,
})

let resolver = null

export function askConfirm(
  message,
  { title = 'Confirmar', confirmLabel = 'Confirmar', danger = true } = {},
) {
  confirmState.value = { open: true, title, message, confirmLabel, danger }
  return new Promise((resolve) => {
    resolver = resolve
  })
}

export function settleConfirm(ok) {
  if (!confirmState.value.open) return
  confirmState.value.open = false
  const r = resolver
  resolver = null
  r?.(ok)
}

/** Utilidades de formato compartidas por las vistas de reseñas. */

/** '2026-03-14T10:00:00Z' → '14 mar 2026' */
export function formatDate(iso) {
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

/** Inicial del avatar de un usuario (reseñas y respuestas). */
export function nameInitial(user) {
  return (user?.fullName || 'Cliente').trim().charAt(0).toUpperCase()
}
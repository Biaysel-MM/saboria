import { ref } from 'vue'

/**
 * Producto cuyo modal de reseñas está abierto (patrón de state/hero.js).
 * Cualquier componente puede llamar a openReviews(producto).
 */
export const activeReviewProduct = ref(null)

export function openReviews(product) {
  activeReviewProduct.value = product
}

export function closeReviews() {
  activeReviewProduct.value = null
}

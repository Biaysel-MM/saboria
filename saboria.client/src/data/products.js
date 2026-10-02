import { reactive, computed } from 'vue'
import { api } from '../services/api.js'
import { active } from '../state/hero.js'

/* ------------------------------------------------------------------ assets */

const files = import.meta.glob('../assets/*.png', {
  eager: true,
  query: '?url',
  import: 'default',
})

const imageMap = {}
for (const path in files) {
  imageMap[path.split('/').pop().toLowerCase()] = files[path]
}

/**
 * Resuelve la imagen de un producto:
 * - '/uploads/...' o 'http...' → la URL tal cual (imagen subida por el admin)
 * - 'malteadaFresa.png'        → asset empaquetado del front (productos seed)
 * - null                       → sin imagen (el componente usa el emoji)
 */
export function resolveImage(file) {
  if (!file) return null
  if (file.startsWith('/') || file.startsWith('http')) return file
  return imageMap[file.toLowerCase()] || null
}

/* ------------------------------------------------------------- utilidades */

export function gradientOf(p) {
  return `radial-gradient(115% 95% at 70% 18%, ${p.c1} 0%, ${p.c2} 42%, ${p.c3} 100%)`
}

/** '#e8467c' + 0.16 → 'rgba(232, 70, 124, 0.16)' */
function rgba(hex, alpha) {
  const h = hex.replace('#', '')
  const full = h.length === 3 ? h.split('').map((c) => c + c).join('') : h
  const n = parseInt(full, 16)
  const r = (n >> 16) & 255
  const g = (n >> 8) & 255
  const b = n & 255
  return `rgba(${r}, ${g}, ${b}, ${alpha})`
}

/** Deriva accentSoft/glow/gradient a partir de los colores base. */
function decorate(p) {
  p.accentSoft = rgba(p.accent, 0.16)
  p.glow = rgba(p.accent, 0.5)
  p.gradient = gradientOf(p)
  // Reseñas: promedio y contador (0 hasta que llegue el bootstrap).
  p.ratingAvg = p.ratingAvg ?? 0
  p.ratingCount = p.ratingCount ?? 0
  return p
}

/** Producto de la API → forma que usan los componentes. */
function fromApi(p) {
  return decorate({
    id: p.id,
    name: p.name,
    // "Tipo" unificado con categoría: la etiqueta SIEMPRE es el nombre de
    // la categoría del producto (p.tag viene sincronizado desde la API).
    tag: p.category?.name || p.tag,
    description: p.description || '',
    price: p.price,
    emoji: p.emoji || '🍓',
    image: p.imageUrl || null,
    c1: p.c1,
    c2: p.c2,
    c3: p.c3,
    accent: p.accent,
    categoryId: p.categoryId ?? null,
    isFeatured: !!p.isFeatured,
    sortOrder: p.sortOrder ?? 0,
    ratingAvg: p.rating?.avg ?? 0,
    ratingCount: p.rating?.count ?? 0,
  })
}

/* ------------------------------------------------------------ datos seed */
/* Fallback local: si la API no responde, la página sigue viéndose completa. */

const seedProducts = [
  {
    id: 'malteada-fresa',
    name: 'Malteada de Fresa',
    tag: 'Malteadas',
    description: 'Fresas frescas, leche cremosa y nuestro toque especial batido al momento.',
    price: 250,
    emoji: '🥤',
    image: 'malteadaFresa.png',
    c1: '#ffe3ec', c2: '#ff8fb3', c3: '#ff4d84', accent: '#e8467c',
    isFeatured: true,
  },
  {
    id: 'wrap-pollo',
    name: 'Wrap de Pollo',
    tag: 'Wraps',
    description: 'Pollo a la parrilla, vegetales crujientes y aderezo de la casa en tortilla suave.',
    price: 320,
    emoji: '🌯',
    image: 'wrapPollo.png',
    c1: '#eaf9d8', c2: '#93d76a', c3: '#4fb63c', accent: '#3f9c2c',
    isFeatured: true,
  },
  {
    id: 'jugo-mango',
    name: 'Jugo de Mango',
    tag: 'Jugos naturales',
    description: 'Mango maduro exprimido al momento, bien frío y sin azúcar añadida.',
    price: 180,
    emoji: '🧃',
    image: 'jugoMango.png',
    c1: '#fff1c9', c2: '#ffab3d', c3: '#ff7a12', accent: '#ea6a06',
    isFeatured: true,
  },
  {
    id: 'croissant',
    name: 'Croissant de Chocolate',
    tag: 'Panadería',
    description: 'Hojaldre artesanal, dorado y hojaldrado, relleno de chocolate belga.',
    price: 150,
    emoji: '🥐',
    image: 'croissant.png',
    c1: '#f8e9cd', c2: '#e2b067', c3: '#c98a3c', accent: '#a9702a',
    isFeatured: true,
  },
  {
    id: 'pastel-chocolate',
    name: 'Pastel de Chocolate',
    tag: 'Pasteles',
    description: 'Capas de bizcocho húmedo con crema de cacao y un toque de fresa fresca.',
    price: 280,
    emoji: '🍰',
    image: 'pastelChocolate.png',
    c1: '#f0d5c6', c2: '#c98a68', c3: '#96583c', accent: '#7c452c',
    isFeatured: true,
  },
  {
    id: 'helado',
    name: 'Helado Artesanal',
    tag: 'Helados',
    description: 'Tres bolitas de helado cremoso con salsa y topping a tu elección.',
    price: 220,
    emoji: '🍦',
    image: 'helado.png',
    c1: '#dcfafa', c2: '#6fd9d6', c3: '#1fb9b6', accent: '#0e9a97',
    isFeatured: true,
  },
  {
    id: 'cafe',
    name: 'Café de Especialidad',
    tag: 'Cafés',
    description: 'Grano seleccionado, tostado medio y preparado en espresso con crema perfecta.',
    price: 160,
    emoji: '☕',
    image: 'cafe.png',
    c1: '#f2e2cd', c2: '#c99a70', c3: '#96663f', accent: '#7a4e2c',
    isFeatured: true,
  },
  {
    id: 'postre',
    name: 'Cupcake de Vainilla',
    tag: 'Postres',
    description: 'Bizcocho suave de vainilla con frosting decorado y confites de colores.',
    price: 140,
    emoji: '🧁',
    image: 'postre.png',
    c1: '#f2e7ff', c2: '#bb96f5', c3: '#8b5cf6', accent: '#7c3aed',
    isFeatured: true,
  },
  {
    id: 'pastel-fresa',
    name: 'Pastel de Fresa',
    tag: 'Pasteles',
    description: 'Bizcocho ligero con crema fresca y fresas de temporada en cada capa.',
    price: 290,
    emoji: '🍓',
    image: 'pastelFresa.png',
    c1: '#ffe0ea', c2: '#ff87ab', c3: '#ff3d75', accent: '#f2356b',
    isFeatured: true,
  },
  {
    id: 'waffles',
    name: 'Waffles con Miel',
    tag: 'Desayunos',
    description: 'Waffles dorados y crujientes con miel de abejas, fruta y un toque de mantequilla.',
    price: 260,
    emoji: '🧇',
    image: 'waffles.png',
    c1: '#fff5c9', c2: '#ffd45c', c3: '#ffb31f', accent: '#e0980a',
    isFeatured: true,
  },
].map((p) => decorate(p))

const seedCategories = [
  { emoji: '🥤', name: 'Malteadas', note: 'Batidas al momento' },
  { emoji: '🌯', name: 'Wraps', note: 'Recetas de la casa' },
  { emoji: '🧃', name: 'Jugos naturales', note: 'Fruta fresca' },
  { emoji: '☕', name: 'Cafés', note: 'Grano de especialidad' },
  { emoji: '🥐', name: 'Panadería', note: 'Horneado diario' },
  { emoji: '🍰', name: 'Pasteles', note: 'Porcionados o completos' },
  { emoji: '🍦', name: 'Helados', note: 'Artesanales' },
  { emoji: '🧇', name: 'Desayunos', note: 'Todo el día' },
  { emoji: '🧁', name: 'Postres', note: 'Detalles dulces' },
]

const seedSettings = {
  footerDescription:
    'Comida y bebida hecha con ingredientes frescos, servida con cariño. Un lugar para explorar antojos.',
  scheduleWeek: 'Lun – Vie: 7:00 AM – 9:00 PM',
  scheduleSaturday: 'Sábado: 8:00 AM – 10:00 PM',
  scheduleSunday: 'Domingo: 8:00 AM – 6:00 PM',
  address: 'Av. Principal 123, Santo Domingo',
  phone: '+1 (809) 555-5555',
  email: 'hola@saboria.do',
  menuBadge: 'Nuestro menú',
  menuTitle: 'Toca una tarjeta y miralo en el hero',
  menuText:
    'Cada producto tiene su propio color y ambiente. Toca cualquiera para verlo animado arriba.',
  catalogBadge: 'Nuestro catálogo',
  catalogTitle: 'Todo lo que encontrarás en Saboria',
  catalogText:
    'Desde malteadas y jugos naturales hasta panadería recién horneada. Elige tu antojo y déjate sorprender.',
  ctaTitle: '¿Se te antojó algo?',
  ctaText:
    'Pide para llevar o reserva tu mesa. Preparamos todo al momento para que llegue fresco.',
}

/* --------------------------------------------------------------- estado */

export const products = reactive([...seedProducts])
export const categories = reactive([...seedCategories])
export const siteTexts = reactive({ ...seedSettings })

/** Productos que aparecen en el hero (los "destacados" del admin). Si el
 *  admin marca más de los que caben en una tira de puntos, el carrusel
 *  paginará los números (máx. 6 visibles).
 *  Se entregan en orden inverso al del admin: así los puntos numerados se
 *  leen 1..N de izquierda a derecha empezando por el primer destacado, y al
 *  pulsar la flecha derecha se avanza al siguiente producto (los números
 *  suben y las cards salen hacia la derecha). */
export const heroProducts = computed(() => {
  const featured = products.filter((p) => p.isFeatured)
  // El sitio nunca puede quedarse sin hero: si el admin ocultó todo, usamos
  // la lista completa como último recurso.
  return [...(featured.length ? featured : products)].reverse()
})

/** El hero empieza en el primer destacado del admin, que con el orden
 *  inverso es el último índice. */
export function resetHeroStart() {
  active.value = Math.max(0, heroProducts.value.length - 1)
}
resetHeroStart()

export const catalogReady = reactive({ done: false, source: 'seed' })

/**
 * Carga datos reales desde la API. Si el backend no responde se mantienen
 * los datos seed y la página sigue funcionando.
 */
export async function loadCatalog() {
  try {
    const data = await api.get('/bootstrap')
    const serverProducts = (data.products ?? []).map(fromApi)
    const serverCategories = (data.categories ?? []).map((c) => ({
      id: c.id,
      emoji: c.emoji,
      name: c.name,
      note: c.note || '',
      imageUrl: c.imageUrl || null,
    }))

    // Nunca dejar la página vacía (evita hero/tarjetas sin nada).
    if (serverProducts.length) {
      products.splice(0, products.length, ...serverProducts)
    }
    if (serverCategories.length) {
      categories.splice(0, categories.length, ...serverCategories)
    }
    if (data.settings) {
      const { id, updatedAt, ...texts } = data.settings
      Object.assign(siteTexts, texts)
    }
    // El catálogo real puede tener otro número de destacados: el hero
    // arranca siempre en el primero (último índice del orden inverso).
    resetHeroStart()
    catalogReady.done = true
    catalogReady.source = 'api'
    return true
  } catch (err) {
    console.warn('[saboria] API no disponible, usando datos locales:', err?.message)
    catalogReady.done = true
    catalogReady.source = 'seed'
    return false
  }
}

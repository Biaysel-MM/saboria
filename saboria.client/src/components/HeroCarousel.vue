<script setup>
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { heroProducts, resolveImage } from '../data/products.js'
import { active } from '../state/hero.js'
import { openReviews } from '../state/reviews.js'
import StarRating from './StarRating.vue'

const N = computed(() => heroProducts.value.length || 1)
const SPAN = 170
const COMMIT = 0.32

const root = ref(null)
const stage = ref(null)
const dragging = ref(false)
const dragX = ref(0)

let frozen = null
let wheelCooldown = 0

const current = computed(
  () => heroProducts.value[active.value] ?? heroProducts.value[0],
)

// El catálogo llega después del render (API): si la lista cambia de tamaño,
// el índice activo puede quedar fuera de rango.
watch(
  () => heroProducts.value.length,
  (n) => {
    if (n > 0 && active.value >= n) active.value = n - 1
    if (n === 0) active.value = 0
  },
)

const stageLeft = ref('62%')
const glowTop = ref('46%')
function updateStage() {
  const w = window.innerWidth
  const wide = w >= 1024
  stageLeft.value = wide ? '62%' : '50%'
  glowTop.value = wide ? '46%' : '58%'
}
updateStage()

/* colores del hero sincronizados con el header */
watch(
  current,
  (p) => {
    const s = document.documentElement.style
    s.setProperty('--hero-c1', p.c1)
    s.setProperty('--hero-c2', p.c2)
    s.setProperty('--hero-c3', p.c3)
  },
  { immediate: true },
)

function offsetOf(i) {
  let o = (i - active.value + N.value) % N.value
  if (o > N.value / 2) o -= N.value
  return o
}

/* 0 = activo, +1 = segundo (izq/atras), +2 = tercero,
   +3 = oculto atras, -1 = debajo (sale al avanzar), <=-2 mas abajo */
function baseSlot(o) {
  const vw = window.innerWidth
  const vh = window.innerHeight
  const wide = vw >= 1024
  const X1 = vw * (wide ? 0.13 : 0.18)
  const X2 = vw * (wide ? 0.24 : 0.34)
  const DOWN = Math.max(340, vh * 0.62)

  if (o <= -2) return { x: 0, y: DOWN + 240, s: 0.6, b: 12, op: 0, z: 4 }
  if (o === -1) return { x: 0, y: DOWN, s: 0.78, b: 10, op: 0, z: 8 }
  if (o === 0) return { x: 0, y: 0, s: 1, b: 0, op: 1, z: 40 }
  if (o === 1) return { x: X1, y: 12, s: 0.6, b: 5, op: 0.72, z: 30 }
  if (o === 2) return { x: X2, y: 24, s: 0.4, b: 11, op: 0.4, z: 20 }
  return { x: X2 + 60, y: 32, s: 0.33, b: 15, op: 0, z: 10 }
}

function slotAt(f) {
  const lo = Math.floor(f)
  const t = f - lo
  const a = baseSlot(lo)
  const b = baseSlot(lo + 1)
  if (t <= 0) return a
  const lerp = (k) => a[k] + (b[k] - a[k]) * t
  return { x: lerp('x'), y: lerp('y'), s: lerp('s'), b: lerp('b'), op: lerp('op'), z: lerp('z') }
}

function shadowFor(s) {
  return `drop-shadow(0 ${(24 * s).toFixed(0)}px ${(30 * s).toFixed(
    0,
  )}px rgba(40, 24, 20, ${(0.26 * s).toFixed(2)}))`
}

const progress = computed(() => {
  if (!dragging.value) return 0
  /* arrastrar a la izquierda (dx<0) = avanzar = p>0 */
  return Math.max(-1.1, Math.min(1.1, -dragX.value / SPAN))
})

function itemStyle(i) {
  const o = offsetOf(i)

  /* arrastre: delta correcto sobre el estado congelado (permite encadenar) */
  if (dragging.value && frozen && frozen[i]) {
    const from = slotAt(o)
    const p = progress.value
    const to = slotAt(o - p)
    const fr = frozen[i]
    const k = from.s > 0.05 ? to.s / from.s : 1
    /* la transformacion va relativa al centro del elemento (origin), no al borde */
    const t0x = from.x - fr.w / 2
    const t0y = from.y - fr.h / 2
    const t1x = to.x - fr.w / 2
    const t1y = to.y - fr.h / 2
    const ex = t1x - k * t0x
    const ey = t1y - k * t0y
    const weight = Math.max(0, 1 - Math.abs(o - p))
    const finger = dragX.value * 0.28 * weight
    const op = Math.max(0, Math.min(1, fr.opacity + (to.op - from.op)))
    const blur = Math.max(0, fr.blur + (to.b - from.b))

    return {
      left: stageLeft.value,
      transform: `translate3d(${(ex + finger).toFixed(1)}px, ${ey.toFixed(
        1,
      )}px, 0) scale(${k.toFixed(3)}) ${fr.transform}`,
      opacity: op,
      filter: `blur(${blur.toFixed(1)}px) ${shadowFor(to.s)}`,
      zIndex: Math.round(to.z),
      pointerEvents: op > 0.05 ? 'auto' : 'none',
    }
  }

  /* reposo / transición normal */
  const sl = slotAt(o)
  return {
    left: stageLeft.value,
    transform: `translate3d(${sl.x.toFixed(1)}px, ${sl.y.toFixed(
      1,
    )}px, 0) translate(-50%, -50%) scale(${sl.s.toFixed(3)})`,
    opacity: Math.max(0, Math.min(1, sl.op)),
    filter: `blur(${sl.b.toFixed(1)}px) ${shadowFor(sl.s)}`,
    zIndex: Math.round(sl.z),
    pointerEvents: sl.op > 0.05 ? 'auto' : 'none',
  }
}

function startMove(index) {
  if (dragging.value) return
  if (index === active.value) return
  active.value = index
}

function go(dir) {
  if (dragging.value) return
  startMove((active.value + dir + N.value) % N.value)
}

function onDot(index) {
  if (dragging.value || index === active.value) return
  startMove(index)
}

/* ---------- paginación de puntos numerados ----------
   Máx. 6 círculos entre las flechas. Si hay más productos que puntos,
   los extremos (1 y N) quedan fijos y una ventana central de 4 números
   se desliza alrededor del activo: 8 productos en el 5 => 1 3 4 5 6 8. */
const MAX_DOTS = 6
const visibleDots = computed(() => {
  const n = heroProducts.value.length
  if (n <= MAX_DOTS) return Array.from({ length: n }, (_, i) => i)
  const a = Math.min(Math.max(active.value, 0), n - 1)
  const middle = MAX_DOTS - 2
  const mStart = Math.min(Math.max(a - 2, 1), n - 1 - middle)
  const set = new Set([0, n - 1])
  for (let k = 0; k < middle; k++) set.add(mStart + k)
  return [...set].sort((x, y) => x - y)
})
/* Orden visual descendente: con "siguiente" moviéndose a la izquierda
   (dirección de las cards), el número activo también se desplaza hacia
   la izquierda en vez de saltar a la derecha. */
const displayDots = computed(() => [...visibleDots.value].reverse())

/* ---------- puntero ---------- */
let startX = 0
let startY = 0
let startTime = 0
let decided = false
let activePointer = null

function parseBlur(f) {
  if (!f || f === 'none') return 0
  const m = f.match(/blur\(([\d.]+)px\)/)
  return m ? parseFloat(m[1]) : 0
}

function captureFreeze() {
  const els = stage.value?.querySelectorAll('.hero-item')
  if (!els || !els.length) {
    frozen = null
    return
  }
  frozen = []
  els.forEach((el) => {
    const i = Number(el.dataset.index)
    const cs = getComputedStyle(el)
    frozen[i] = {
      transform:
        cs.transform && cs.transform !== 'none' ? cs.transform : 'translate(-50%, -50%)',
      opacity: parseFloat(cs.opacity) || 0,
      blur: parseBlur(cs.filter),
      w: el.offsetWidth,
      h: el.offsetHeight,
    }
  })
}

function onPointerDown(e) {
  if (e.pointerType === 'mouse' && e.button !== 0) return
  activePointer = e.pointerId
  startX = e.clientX
  startY = e.clientY
  startTime = performance.now()
  decided = false
}

function onPointerMove(e) {
  if (activePointer === null || e.pointerId !== activePointer) return
  const dx = e.clientX - startX
  const dy = e.clientY - startY

  if (!decided) {
    if (Math.abs(dx) < 9 && Math.abs(dy) < 9) return
    decided = true
    if (Math.abs(dy) > Math.abs(dx)) {
      activePointer = null
      return
    }
    captureFreeze()
    dragging.value = true
    try {
      stage.value?.setPointerCapture(e.pointerId)
    } catch {
      /* noop */
    }
  }

  if (!dragging.value) return
  dragX.value = dx
}

function finishDrag(e, cancelled = false) {
  if (activePointer === null || (e && e.pointerId !== activePointer)) return
  const dx = dragX.value
  const p = progress.value
  const dt = Math.max(1, performance.now() - startTime)
  const wasDragging = dragging.value
  activePointer = null
  decided = false

  if (!wasDragging) {
    if (cancelled) return
    const el = e?.target?.closest?.('.hero-item')
    if (!el) return
    const o = offsetOf(Number(el.dataset.index))
    if (o < 0) return
    startMove((active.value + Math.max(1, o) + N.value) % N.value)
    return
  }

  dragging.value = false
  dragX.value = 0
  frozen = null
  if (cancelled) return

  const velocity = Math.abs(dx) / dt
  const passed = Math.abs(p) >= COMMIT || (Math.abs(p) >= 0.12 && velocity > 0.5)
  if (passed) go(p > 0 ? 1 : -1)
}

function onPointerUp(e) {
  finishDrag(e)
}
function onPointerCancel(e) {
  finishDrag(e, true)
}

/* ---------- rueda horizontal ---------- */
function onWheel(e) {
  if (Math.abs(e.deltaX) <= Math.abs(e.deltaY) || Math.abs(e.deltaX) < 4) return
  e.preventDefault()
  const now = performance.now()
  if (now < wheelCooldown) return
  wheelCooldown = now + 260
  /* scroll a la izquierda = avanzar (igual que la flecha) */
  go(e.deltaX < 0 ? 1 : -1)
}

/* ---------- teclado ---------- */
function onKeydown(e) {
  const tag = e.target?.tagName
  if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return
  const el = root.value
  if (!el) return
  const r = el.getBoundingClientRect()
  if (!(r.bottom > 140 && r.top < window.innerHeight - 140)) return
  if (e.key === 'ArrowLeft') go(1)
  else if (e.key === 'ArrowRight') go(-1)
}

function onResize() {
  updateStage()
}

onMounted(() => {
  root.value?.addEventListener('wheel', onWheel, { passive: false })
  window.addEventListener('keydown', onKeydown)
  window.addEventListener('resize', onResize)
})

onBeforeUnmount(() => {
  root.value?.removeEventListener('wheel', onWheel)
  window.removeEventListener('keydown', onKeydown)
  window.removeEventListener('resize', onResize)
})

const pad = (n) => String(n).padStart(2, '0')
</script>

<template>
  <section
    id="inicio"
    ref="root"
    class="relative isolate flex min-h-[100svh] select-none flex-col overflow-hidden"
    :style="{
      '--accent': current.accent,
      '--accent-soft': current.accentSoft,
      '--glow': current.glow,
      '--stage-x': stageLeft,
    }"
    aria-roledescription="carrusel"
    aria-label="Productos destacados"
  >
    <!-- fondos intensos con transición -->
    <div
      v-for="(p, i) in heroProducts"
      :key="'bg-' + p.id"
      class="absolute inset-0 -z-10 transition-opacity duration-[900ms] ease-out"
      :style="{ background: p.gradient, opacity: i === active ? 1 : 0 }"
      aria-hidden="true"
    />
    <div
      class="pointer-events-none absolute -z-10 h-[clamp(340px,62vh,680px)] w-[clamp(340px,62vh,680px)] rounded-full blur-3xl transition-all duration-[900ms]"
      :style="{
        left: stageLeft,
        top: glowTop,
        transform: 'translate(-50%, -50%)',
        background: `radial-gradient(circle, ${current.glow} 0%, transparent 68%)`,
      }"
      aria-hidden="true"
    />

    <!-- escenario de productos -->
    <div class="relative flex-1">
      <div
        class="pointer-events-none absolute bottom-[15%] h-7 w-[clamp(150px,26vw,360px)] rounded-[50%] blur-xl transition-all duration-[900ms]"
        :style="{
          left: stageLeft,
          transform: 'translateX(-50%)',
          background: `radial-gradient(ellipse, ${current.glow} 0%, transparent 70%)`,
          opacity: 0.5,
        }"
        aria-hidden="true"
      />

      <div
        ref="stage"
        class="absolute inset-0 touch-pan-y"
        :class="dragging ? 'cursor-grabbing' : 'cursor-grab'"
        @pointerdown="onPointerDown"
        @pointermove="onPointerMove"
        @pointerup="onPointerUp"
        @pointercancel="onPointerCancel"
      >
        <div
          v-for="(p, i) in heroProducts"
          :key="p.id"
          class="hero-item"
          :class="{ 'is-dragging': dragging }"
          :style="itemStyle(i)"
          :data-index="i"
          role="group"
          :aria-label="p.name"
          :aria-hidden="offsetOf(i) !== 0"
        >
          <img
            v-if="resolveImage(p.image)"
            :src="resolveImage(p.image)"
            :alt="p.name"
            draggable="false"
            class="hero-item-img"
          />
          <div v-else class="hero-item-fallback" :style="{ background: p.accentSoft }">
            <span>{{ p.emoji }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- olas de cierre (altas) -->
    <div
      class="pointer-events-none absolute bottom-0 left-0 z-20 w-full"
      aria-hidden="true"
    >
      <svg
        viewBox="0 0 1440 90"
        preserveAspectRatio="none"
        class="block h-[92px] w-full sm:h-[128px] lg:h-[168px]"
      >
        <path
          fill="rgba(230, 208, 182, 0.55)"
          d="M0,52 C160,84 320,18 520,34 C720,50 860,92 1060,74 C1220,60 1340,26 1440,40 L1440,90 L0,90 Z"
        />
        <path
          fill="#fffaf3"
          d="M0,66 C170,92 340,36 540,50 C740,64 880,98 1080,84 C1240,73 1360,44 1440,56 L1440,90 L0,90 Z"
        />
      </svg>
    </div>

    <!-- información: arriba en mobile, izquierda en desktop -->
    <div
      class="hero-info relative z-30 order-first px-6 pt-20 pb-1 text-center lg:absolute lg:left-10 lg:top-1/2 lg:max-w-[360px] lg:-translate-y-1/2 lg:order-none lg:px-0 lg:pt-0 lg:pb-0 xl:left-16"
    >
      <Transition name="info" mode="out-in">
        <div :key="current.id">
          <span
            class="inline-flex items-center rounded-full px-3 py-1 text-[11px] font-bold uppercase tracking-[0.16em] transition-colors duration-700"
            :style="{ background: 'var(--accent-soft)', color: 'var(--accent)' }"
          >
            {{ current.tag }}
          </span>

          <h1
            class="mt-3 font-display text-[clamp(30px,4.4vw,50px)] font-semibold leading-[1.04] tracking-tight text-ink"
          >
            {{ current.name }}
          </h1>

          <p class="desc mx-auto mt-3 max-w-[34ch] text-[15px] leading-relaxed text-ink/65 line-clamp-2 lg:line-clamp-none">
            {{ current.description }}
          </p>

          <!-- estrellas siempre (vacías si no hay reseñas) + botón colorido;
               el promedio solo cuando existe -->
          <div class="hero-reviews mt-4 flex flex-wrap items-center justify-center gap-x-3 gap-y-2">
            <span class="flex items-center gap-2">
              <StarRating :value="current.ratingAvg" :size="16" />
              <span
                v-if="current.ratingCount"
                class="text-sm font-bold text-ink/65"
              >
                {{ current.ratingAvg.toFixed(1) }}
              </span>
            </span>
            <button
              type="button"
              class="rounded-full px-5 py-2.5 text-xs font-bold text-white shadow-lg transition-all duration-300 hover:-translate-y-0.5"
              :style="{
                background: 'var(--accent)',
                boxShadow: '0 14px 26px -12px var(--glow)',
              }"
              aria-label="Reseñas del producto destacado"
              @click="openReviews(current)"
            >
              Reseñas
            </button>
          </div>

          <div class="hero-cta mt-5 flex flex-col items-center gap-4">
            <span class="hero-price font-display text-[32px] font-semibold leading-none text-ink">
              RD${{ current.price }}
            </span>
            <a
              href="#menu"
              class="group inline-flex items-center gap-2 rounded-full px-6 py-3 text-sm font-bold text-white shadow-lg transition-all duration-300 hover:-translate-y-0.5"
              :style="{
                background: 'var(--accent)',
                boxShadow: '0 14px 26px -12px var(--glow)',
              }"
            >
              Ver producto
              <span class="transition-transform duration-300 group-hover:translate-x-1">→</span>
            </a>
          </div>
        </div>
      </Transition>
    </div>

    <!-- controles (z-50: siempre por encima de las imágenes del carrusel) -->
    <div
      class="relative z-50 flex items-center justify-center gap-5 px-6 pb-24 pt-4 lg:absolute lg:bottom-24 lg:left-1/2 lg:-translate-x-1/2 lg:px-0 lg:pb-0 lg:pt-0"
    >
      <button
        type="button"
        class="arrow"
        aria-label="Producto siguiente"
        @click="go(1)"
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
          <path d="M19 12H5" />
          <path d="m12 19-7-7 7-7" />
        </svg>
      </button>

      <div class="flex items-center gap-2" role="tablist" aria-label="Seleccionar producto">
        <button
          v-for="i in displayDots"
          :key="'dot-' + heroProducts[i].id"
          type="button"
          class="dot"
          :class="{ active: i === active }"
          role="tab"
          :aria-selected="i === active"
          :aria-label="heroProducts[i].name"
          @click="onDot(i)"
        >
          {{ i + 1 }}
        </button>
      </div>

      <button
        type="button"
        class="arrow"
        aria-label="Producto anterior"
        @click="go(-1)"
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
          <path d="M5 12h14" />
          <path d="m12 5 7 7-7 7" />
        </svg>
      </button>
    </div>
  </section>
</template>

<style scoped>
.hero-item {
  position: absolute;
  top: 50%;
  width: clamp(220px, 60vw, 340px);
  height: clamp(240px, 40vh, 420px);
  display: flex;
  align-items: center;
  justify-content: center;
  will-change: transform, opacity, filter;
  transition:
    transform 0.78s cubic-bezier(0.22, 0.61, 0.36, 1),
    opacity 0.62s ease,
    filter 0.78s cubic-bezier(0.22, 0.61, 0.36, 1);
}

@media (min-width: 1024px) {
  .hero-item {
    width: clamp(340px, 38vw, 520px);
    height: clamp(440px, 60vh, 660px);
  }
}

/* móvil pequeño: imágenes y textos más compactos; los controles
   (flechas + dots) nunca quedan tapados ni desbordados */
@media (max-width: 400px) {
  .hero-item {
    width: clamp(150px, 44vw, 180px);
    height: clamp(150px, 30vh, 200px);
  }

  .hero-item-fallback {
    width: clamp(96px, 26vw, 136px);
    height: clamp(96px, 26vw, 136px);
    font-size: clamp(40px, 10vw, 56px);
  }

  div.hero-info {
    padding-top: 4.5rem;
    padding-left: 1.25rem;
    padding-right: 1.25rem;
  }

  .hero-info h1 {
    margin-top: 0.5rem;
    font-size: clamp(24px, 7vw, 28px);
  }

  .hero-info .desc {
    margin-top: 0.5rem;
    font-size: 13.5px;
  }

  .hero-info .hero-reviews {
    margin-top: 0.75rem;
    column-gap: 0.5rem;
  }

  .hero-info .hero-cta {
    margin-top: 1rem;
    gap: 0.75rem;
  }

  .hero-info .hero-price {
    font-size: 26px;
  }
}

.hero-item.is-dragging {
  transition:
    transform 0.08s linear,
    opacity 0.08s linear,
    filter 0.08s linear;
}

.hero-item-img {
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
  pointer-events: none;
}

.hero-item-fallback {
  display: flex;
  align-items: center;
  justify-content: center;
  width: clamp(140px, 26vw, 240px);
  height: clamp(140px, 26vw, 240px);
  border-radius: 50%;
  border: 2px dashed rgba(36, 26, 23, 0.18);
  font-size: clamp(56px, 11vw, 110px);
  line-height: 1;
  user-select: none;
}

.arrow {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 46px;
  height: 46px;
  border-radius: 50%;
  border: 1px solid rgba(36, 26, 23, 0.14);
  background: rgba(255, 255, 255, 0.78);
  color: #241a17;
  backdrop-filter: blur(10px);
  cursor: pointer;
  transition:
    transform 0.28s cubic-bezier(0.22, 0.61, 0.36, 1),
    background-color 0.28s ease,
    color 0.28s ease,
    border-color 0.28s ease,
    box-shadow 0.28s ease;
}

.arrow svg {
  width: 18px;
  height: 18px;
  transition: transform 0.28s cubic-bezier(0.22, 0.61, 0.36, 1);
}

.arrow:hover {
  background: var(--accent);
  border-color: var(--accent);
  color: #fff;
  transform: scale(1.09);
  box-shadow: 0 16px 28px -14px var(--glow);
}

.arrow:hover svg {
  transform: scale(1.08);
}

.arrow:active {
  transform: scale(0.96);
}

.arrow:focus-visible,
.dot:focus-visible {
  outline: 2px solid var(--accent);
  outline-offset: 3px;
}

.dot {
  width: 20px;
  height: 20px;
  padding: 0;
  border: none;
  border-radius: 999px;
  background: rgba(36, 26, 23, 0.14);
  color: rgba(36, 26, 23, 0.55);
  font-size: 10px;
  font-weight: 700;
  line-height: 1;
  display: grid;
  place-items: center;
  cursor: pointer;
  transition:
    background-color 0.45s ease,
    color 0.45s ease,
    transform 0.25s ease;
}

.dot:hover {
  background: rgba(36, 26, 23, 0.34);
  color: #fff;
  transform: scale(1.12);
}

.dot.active {
  background: var(--accent);
  color: #fff;
  transform: scale(1.08);
}

.info-enter-active {
  transition:
    opacity 0.45s ease 0.16s,
    transform 0.5s cubic-bezier(0.22, 0.61, 0.36, 1) 0.16s;
}

.info-enter-from {
  opacity: 0;
  transform: translateY(18px);
}

.info-leave-active {
  transition:
    opacity 0.26s ease,
    transform 0.26s ease;
}

.info-leave-to {
  opacity: 0;
  transform: translateY(-12px);
}
</style>

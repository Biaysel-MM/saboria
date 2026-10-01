<script setup>
import { ref } from 'vue'

/**
 * Estrellas de calificación.
 * - readonly (por defecto): solo muestra `value` (0–5).
 * - editable: permite pulsar y emite `select` con la estrella elegida.
 */
const props = defineProps({
  value: { type: Number, default: 0 },
  size: { type: Number, default: 16 },
  editable: { type: Boolean, default: false },
  label: { type: String, default: 'estrellas' },
})

const emit = defineEmits(['select'])

const hover = ref(0)
const shown = () => (hover.value || props.value)

function pick(n) {
  if (!props.editable) return
  emit('select', n)
}

/** 'full' | 'half' | 'empty' para la estrella n (soporta 3.5 → media estrella). */
function fillOf(n) {
  const v = shown()
  if (v >= n) return 'full'
  if (v >= n - 0.5) return 'half'
  return 'empty'
}
</script>

<template>
  <span
    class="inline-flex items-center gap-0.5"
    :role="editable ? 'radiogroup' : 'img'"
    :aria-label="`${value} de 5 ${label}`"
    @mouseleave="hover = 0"
  >
    <button
      v-for="n in 5"
      :key="n"
      type="button"
      class="transition-transform"
      :class="[
        editable
          ? 'cursor-pointer rounded p-0.5 hover:scale-125'
          : 'cursor-default p-0.5',
      ]"
      :style="{
        color:
          fillOf(n) === 'empty' ? 'rgba(36,26,23,0.18)' : '#f2b01e',
      }"
      :disabled="!editable"
      :aria-label="editable ? `Poner ${n} de 5` : undefined"
      @mouseenter="editable && (hover = n)"
      @click="pick(n)"
    >
      <Icon
        :icon="
          fillOf(n) === 'half'
            ? 'carbon:star-half'
            : 'carbon:star-filled'
        "
        :width="size"
        :height="size"
      />
    </button>
  </span>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  total: { type: Number, required: true },
  pageSize: { type: Number, required: true },
  page: { type: Number, required: true },
})
const emit = defineEmits(['update:page'])

const pages = computed(() => Math.ceil(props.total / props.pageSize))

/** Números visibles: primera, última y vecinas de la actual con "…". */
const numbers = computed(() => {
  const n = pages.value
  const cur = props.page
  const set = new Set([1, n, cur - 1, cur, cur + 1].filter((x) => x >= 1 && x <= n))
  const sorted = [...set].sort((a, b) => a - b)
  const out = []
  let prev = 0
  for (const x of sorted) {
    if (prev && x - prev > 1) out.push('…')
    out.push(x)
    prev = x
  }
  return out
})

const range = computed(() => {
  const from = (props.page - 1) * props.pageSize + 1
  const to = Math.min(props.page * props.pageSize, props.total)
  return `${from}–${to}`
})

function go(p) {
  if (p < 1 || p > pages.value || p === props.page) return
  emit('update:page', p)
}
</script>

<template>
  <div
    v-if="pages > 1"
    class="mt-5 flex flex-wrap items-center justify-between gap-3"
  >
    <p class="text-xs font-semibold text-ink/45">
      Mostrando {{ range }} de {{ total }}
    </p>
    <div class="flex items-center gap-1.5">
      <button
        type="button"
        class="grid h-9 w-9 place-items-center rounded-full border border-ink/15 text-ink/55 transition-colors hover:border-ink/30 hover:text-ink disabled:opacity-35"
        :disabled="page === 1"
        aria-label="Página anterior"
        @click="go(page - 1)"
      >
        <Icon icon="carbon:chevron-left" :width="18" :height="18" />
      </button>
      <template v-for="(item, i) in numbers" :key="i">
        <span v-if="item === '…'" class="px-1 text-ink/35">…</span>
        <button
          v-else
          type="button"
          class="grid h-9 min-w-9 place-items-center rounded-full px-2.5 text-sm font-bold transition-colors"
          :class="
            item === page
              ? 'bg-ink text-cream'
              : 'border border-ink/15 text-ink/60 hover:border-ink/30 hover:text-ink'
          "
          @click="go(item)"
        >
          {{ item }}
        </button>
      </template>
      <button
        type="button"
        class="grid h-9 w-9 place-items-center rounded-full border border-ink/15 text-ink/55 transition-colors hover:border-ink/30 hover:text-ink disabled:opacity-35"
        :disabled="page === pages"
        aria-label="Página siguiente"
        @click="go(page + 1)"
      >
        <Icon icon="carbon:chevron-right" :width="18" :height="18" />
      </button>
    </div>
  </div>
</template>

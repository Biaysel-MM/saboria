<script setup>
import { onBeforeUnmount, onMounted, ref } from 'vue'

const visible = ref(false)

function onScroll() {
  visible.value = window.scrollY > 500
}
function goTop() {
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

onMounted(() => {
  window.addEventListener('scroll', onScroll, { passive: true })
  onScroll()
})
onBeforeUnmount(() => window.removeEventListener('scroll', onScroll))
</script>

<template>
  <Transition name="pop">
    <button
      v-if="visible"
      type="button"
      aria-label="Volver arriba"
      title="Volver arriba"
      class="fixed bottom-5 right-5 z-40 grid h-11 w-11 place-items-center rounded-full bg-ink text-cream shadow-[0_14px_32px_-10px_rgba(36,26,23,0.55)] transition-colors hover:bg-brand"
      @click="goTop"
    >
      <Icon icon="carbon:chevron-up" :width="20" :height="20" />
    </button>
  </Transition>
</template>

<style scoped>
.pop-enter-active,
.pop-leave-active {
  transition: opacity 0.2s ease, transform 0.2s ease;
}
.pop-enter-from,
.pop-leave-to {
  opacity: 0;
  transform: translateY(10px);
}
</style>

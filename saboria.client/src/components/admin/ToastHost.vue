<script setup>
import { toasts, TOAST_CLASS, TOAST_ICON } from '../../stores/toasts.js'
</script>

<template>
  <div
    class="pointer-events-none fixed right-4 top-4 z-[80] flex w-[min(360px,calc(100vw-2rem))] flex-col gap-2"
    role="status"
    aria-live="polite"
  >
    <TransitionGroup name="toast">
      <div
        v-for="t in toasts"
        :key="t.id"
        class="pointer-events-auto flex items-start gap-2.5 rounded-2xl px-4 py-3 text-sm font-semibold text-white shadow-[0_16px_40px_-18px_rgba(0,0,0,0.5)]"
        :class="TOAST_CLASS[t.type] || 'bg-ink'"
      >
        <Icon :icon="TOAST_ICON[t.type] || 'carbon:information'" :width="16" :height="16" class="mt-0.5 shrink-0" />
        <span>{{ t.text }}</span>
      </div>
    </TransitionGroup>
  </div>
</template>

<style scoped>
.toast-enter-active,
.toast-leave-active {
  transition:
    opacity 0.3s ease,
    transform 0.3s ease;
}
.toast-enter-from,
.toast-leave-to {
  opacity: 0;
  transform: translateX(28px);
}
</style>

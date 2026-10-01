<script setup>
import { confirmState, settleConfirm } from '../../stores/confirm.js'

function onKey(e) {
  if (e.key === 'Escape') settleConfirm(false)
}
</script>

<template>
  <Teleport to="body">
    <Transition name="modal">
      <div
        v-if="confirmState.open"
        class="fixed inset-0 z-[70] flex items-center justify-center p-5"
        role="dialog"
        aria-modal="true"
        :aria-label="confirmState.title"
        @keydown="onKey"
      >
        <!-- fondo negro translúcido con blur -->
        <div
          class="absolute inset-0 bg-black/55 backdrop-blur-[3px]"
          @click="settleConfirm(false)"
        />
        <div
          class="relative w-full max-w-sm scale-100 rounded-3xl border border-ink/10 bg-white p-6 shadow-[0_40px_90px_-30px_rgba(0,0,0,0.6)]"
        >
          <div class="flex items-start gap-3">
            <span
              class="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl"
              :class="confirmState.danger ? 'bg-red-100 text-red-600' : 'bg-cream text-ink'"
            >
              <Icon
                :icon="confirmState.danger ? 'carbon:warning-alt' : 'carbon:information'"
                :width="20"
                :height="20"
              />
            </span>
            <div>
              <h2 class="font-display text-lg font-semibold text-ink">
                {{ confirmState.title }}
              </h2>
              <p class="mt-1 text-sm leading-relaxed text-ink/60">
                {{ confirmState.message }}
              </p>
            </div>
          </div>
          <div class="mt-6 flex justify-end gap-2.5">
            <button
              type="button"
              class="rounded-full border border-ink/15 px-5 py-2.5 text-sm font-semibold text-ink/60 transition-colors hover:bg-cream hover:text-ink"
              @click="settleConfirm(false)"
            >
              Cancelar
            </button>
            <button
              type="button"
              class="rounded-full px-5 py-2.5 text-sm font-bold text-white transition-all"
              :class="
                confirmState.danger
                  ? 'bg-red-600 hover:bg-red-700'
                  : 'bg-ink hover:bg-brand'
              "
              autofocus
              @click="settleConfirm(true)"
            >
              {{ confirmState.confirmLabel }}
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.modal-enter-active,
.modal-leave-active {
  transition: opacity 0.22s ease;
}
.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}
</style>

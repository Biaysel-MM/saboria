<script setup>
import { computed, onMounted, ref } from 'vue'
import { api } from '../../services/api.js'
import { notify } from '../../stores/toasts.js'
import { askConfirm } from '../../stores/confirm.js'
import { useAuth } from '../../stores/auth.js'

const { user: me } = useAuth()

const rows = ref([])
const loading = ref(false)
const busyId = ref(null)
const query = ref('')

const filtered = computed(() => {
  const q = query.value.trim().toLowerCase()
  if (!q) return rows.value
  return rows.value.filter((u) =>
    `${u.fullName} ${u.email}`.toLowerCase().includes(q),
  )
})

const adminCount = computed(
  () => rows.value.filter((u) => u.role === 'admin' && u.isActive).length,
)

async function load() {
  loading.value = true
  try {
    rows.value = await api.get('/admin/users')
  } catch (e) {
    notify('error', e.message)
  } finally {
    loading.value = false
  }
}
onMounted(load)

/** true si la fila es el propio admin (no puede autorreducirse). */
const isSelf = (u) => me.value && u.id === me.value.id

async function toggleRole(u) {
  const toAdmin = u.role !== 'admin'
  if (!toAdmin) {
    const ok = await askConfirm(
      `¿Quitar el rol de admin a ${u.fullName}? Debe quedar al menos un administrador activo.`,
      { title: 'Quitar admin', confirmLabel: 'Quitar admin' },
    )
    if (!ok) return
  }
  busyId.value = u.id
  try {
    const updated = await api.put(`/admin/users/${u.id}`, {
      role: toAdmin ? 'admin' : 'cliente',
    })
    u.role = updated.role
    notify(
      'ok',
      toAdmin
        ? `${u.fullName} ahora es administrador`
        : `${u.fullName} ahora es cliente`,
    )
  } catch (e) {
    notify('error', e.message)
  } finally {
    busyId.value = null
  }
}

async function toggleActive(u) {
  if (u.isActive) {
    const ok = await askConfirm(
      `¿Suspender a ${u.fullName}? No podrá iniciar sesión hasta reactivala.`,
      { title: 'Suspender usuario', confirmLabel: 'Suspender' },
    )
    if (!ok) return
  }
  busyId.value = u.id
  try {
    const updated = await api.put(`/admin/users/${u.id}`, {
      isActive: !u.isActive,
    })
    u.isActive = updated.isActive
    notify('ok', u.isActive ? 'Usuario reactivado' : 'Usuario suspendido')
  } catch (e) {
    notify('error', e.message)
  } finally {
    busyId.value = null
  }
}

function formatDate(iso) {
  if (!iso) return '—'
  try {
    return new Date(iso).toLocaleDateString('es-DO', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    })
  } catch {
    return '—'
  }
}
</script>

<template>
  <div>
    <!-- cabecera -->
    <div class="flex flex-wrap items-center justify-between gap-3">
      <div class="flex items-center gap-3">
        <span class="grid h-11 w-11 place-items-center rounded-2xl bg-brand/10 text-brand">
          <Icon icon="carbon:user" :width="22" :height="22" />
        </span>
        <div>
          <h2 class="font-display text-xl font-semibold leading-tight">Usuarios</h2>
          <p class="text-xs text-ink/50">
            {{ filtered.length }} de {{ rows.length }} ·
            {{ adminCount }} administrador{{ adminCount === 1 ? '' : 'es' }} activo{{ adminCount === 1 ? '' : 'es' }}
          </p>
        </div>
      </div>
      <button
        type="button"
        class="inline-flex items-center gap-1.5 rounded-full border border-ink/15 bg-white px-4 py-2 text-sm font-semibold text-ink/70 transition-colors hover:bg-cream"
        :disabled="loading"
        @click="load"
      >
        <Icon
          icon="carbon:renew"
          :width="15"
          :height="15"
          :class="loading ? 'animate-spin' : ''"
        />
        Recargar
      </button>
    </div>

    <!-- buscador -->
    <div class="relative mt-5 min-w-[240px]">
      <Icon
        icon="carbon:search"
        :width="16"
        :height="16"
        class="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-ink/35"
      />
      <input
        v-model="query"
        type="search"
        placeholder="Buscar por nombre o correo…"
        class="w-full rounded-full border border-ink/15 bg-white py-2.5 pl-10 pr-4 text-sm outline-none transition-colors focus:border-brand"
      />
    </div>

    <!-- cargando -->
    <div
      v-if="loading && !rows.length"
      class="mt-5 flex items-center justify-center gap-2 rounded-3xl border border-ink/10 bg-white py-12 text-ink/45"
    >
      <Icon icon="carbon:renew" :width="18" :height="18" class="animate-spin" />
      Cargando usuarios…
    </div>

    <!-- lista -->
    <ul v-else-if="filtered.length" class="mt-5 space-y-3">
      <li
        v-for="u in filtered"
        :key="u.id"
        class="rounded-3xl border border-ink/10 bg-white p-4"
        :class="{ 'opacity-75': !u.isActive }"
      >
        <div class="flex flex-wrap items-start justify-between gap-3">
          <div class="flex min-w-0 items-start gap-3">
            <span
              class="grid h-10 w-10 shrink-0 place-items-center rounded-2xl text-ink/60"
              :class="u.role === 'admin' ? 'bg-brand/10 text-brand' : 'bg-cream'"
            >
              <Icon
                :icon="u.role === 'admin' ? 'carbon:user-admin' : 'carbon:user'"
                :width="18"
                :height="18"
              />
            </span>
            <div class="min-w-0">
              <div class="flex flex-wrap items-center gap-2">
                <p class="truncate text-sm font-semibold text-ink">{{ u.fullName }}</p>
                <span
                  v-if="isSelf(u)"
                  class="rounded-full bg-brand/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.1em] text-brand"
                >
                  Tú
                </span>
              </div>
              <p class="mt-0.5 truncate text-xs text-ink/50">{{ u.email }}</p>
              <div class="mt-1.5 flex flex-wrap items-center gap-1.5">
                <span
                  class="rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.1em]"
                  :class="
                    u.role === 'admin'
                      ? 'bg-brand/15 text-brand'
                      : 'bg-ink/10 text-ink/55'
                  "
                >
                  {{ u.role === 'admin' ? 'Admin' : 'Cliente' }}
                </span>
                <span
                  class="rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.1em]"
                  :class="
                    u.isActive
                      ? 'bg-green-100 text-green-700'
                      : 'bg-ink/10 text-ink/50'
                  "
                >
                  {{ u.isActive ? 'Activo' : 'Suspendido' }}
                </span>
                <span
                  class="rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.1em]"
                  :class="
                    u.emailVerified
                      ? 'bg-green-100 text-green-700'
                      : 'bg-amber-100 text-amber-700'
                  "
                >
                  {{ u.emailVerified ? 'Verificado' : 'Sin verificar' }}
                </span>
                <span class="text-[11px] text-ink/40">
                  {{ u.reviewCount }} reseña{{ u.reviewCount === 1 ? '' : 's' }}
                </span>
                <span class="text-[11px] text-ink/40">
                  · último acceso {{ formatDate(u.lastLoginAt) }}
                </span>
              </div>
            </div>
          </div>

          <div class="flex shrink-0 flex-wrap gap-1.5">
            <button
              type="button"
              class="inline-flex items-center gap-1 rounded-full px-2.5 py-1.5 text-[11px] font-bold transition-colors"
              :class="
                u.role === 'admin'
                  ? 'bg-ink/10 text-ink/60 hover:bg-ink/15'
                  : 'bg-brand/15 text-brand hover:bg-brand/25'
              "
              :disabled="busyId === u.id || isSelf(u)"
              :title="
                isSelf(u)
                  ? 'No puedes cambiar tu propio rol'
                  : u.role === 'admin'
                    ? 'Quitar rol de admin'
                    : 'Promover a admin'
              "
              @click="toggleRole(u)"
            >
              <Icon
                :icon="u.role === 'admin' ? 'carbon:user' : 'carbon:user-admin'"
                :width="12"
                :height="12"
              />
              {{ u.role === 'admin' ? 'Quitar admin' : 'Hacer admin' }}
            </button>
            <button
              type="button"
              class="inline-flex items-center gap-1 rounded-full px-2.5 py-1.5 text-[11px] font-bold transition-colors"
              :class="
                u.isActive
                  ? 'bg-red-50 text-red-500 hover:bg-red-100'
                  : 'bg-green-100 text-green-700 hover:bg-green-200'
              "
              :disabled="busyId === u.id || isSelf(u)"
              :title="isSelf(u) ? 'No puedes suspenderte a ti mismo' : ''"
              @click="toggleActive(u)"
            >
              <Icon
                :icon="u.isActive ? 'carbon:view-off' : 'carbon:view'"
                :width="12"
                :height="12"
              />
              {{ u.isActive ? 'Suspender' : 'Reactivar' }}
            </button>
          </div>
        </div>
      </li>
    </ul>

    <!-- vacío -->
    <div
      v-else
      class="mt-5 rounded-3xl border border-dashed border-ink/15 bg-white/60 px-6 py-12 text-center"
    >
      <span class="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-cream text-ink/40">
        <Icon icon="carbon:user" :width="22" :height="22" />
      </span>
      <p class="mt-3 text-sm font-semibold text-ink/60">
        {{ query ? 'Ningún usuario coincide' : 'No hay usuarios todavía' }}
      </p>
    </div>
  </div>
</template>

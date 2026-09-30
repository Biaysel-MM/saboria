import { ref, computed } from 'vue'

const BASE_URL = import.meta.env.VITE_API_URL || '/api'
const TOKEN_KEY = 'saboria_token'

const user = ref(null)
const loading = ref(true)

const getToken = () => localStorage.getItem(TOKEN_KEY)
const setToken = (token) => localStorage.setItem(TOKEN_KEY, token)
const clearToken = () => localStorage.removeItem(TOKEN_KEY)

/** Cierra la sesión en memoria y en disco. */
const clearSession = () => {
  clearToken()
  user.value = null
}

const expiredListeners = new Set()
export const onSessionExpired = (cb) => {
  expiredListeners.add(cb)
  return () => expiredListeners.delete(cb)
}
export const notifySessionExpired = () => {
  for (const cb of expiredListeners) {
    try {
      cb()
    } catch {
      /* un listener roto no debe romper la respuesta */
    }
  }
}

const request = async (path, options = {}) => {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), 20000)
  let res
  try {
    res = await fetch(`${BASE_URL}${path}`, {
      ...options,
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
        ...(getToken() ? { Authorization: `Bearer ${getToken()}` } : {}),
        ...options.headers,
      },
    })
  } catch (err) {
    if (err.name === 'AbortError') {
      throw new Error('La solicitud tardó demasiado. Revisa tu conexión.', {
        cause: err,
      })
    }
    throw new Error('No se pudo conectar con el servidor', { cause: err })
  } finally {
    clearTimeout(timer)
  }

  const text = await res.text()
  let data = {}
  if (text) {
    try {
      data = JSON.parse(text)
    } catch {
      data = { message: 'El servidor devolvió una respuesta no válida' }
    }
  }
  if (!res.ok) {
    if (res.status === 401) {
      clearSession()
      notifySessionExpired()
    }
    const message = Array.isArray(data.message)
      ? data.message.join(', ')
      : data.message || 'Error de conexión'
    throw new Error(message)
  }
  return data
}

const loadCurrentUser = async () => {
  const token = getToken()
  if (!token) {
    user.value = null
    loading.value = false
    return
  }
  try {
    user.value = await request('/auth/me')
  } catch {
    clearSession()
  } finally {
    loading.value = false
  }
}

loadCurrentUser()

export const useAuth = () => {
  const isAuthenticated = computed(() => !!user.value)

  const initAuth = async () => {
    if (loading.value) await loadCurrentUser()
    return user.value
  }

  const signIn = async (email, password) => {
    try {
      const data = await request('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      })
      setToken(data.token)
      user.value = data.user
      return { success: true }
    } catch (e) {
      return { success: false, error: e.message }
    }
  }

  const signOut = () => {
    clearSession()
    return { success: true }
  }

  return {
    user: computed(() => user.value),
    loading: computed(() => loading.value),
    isAuthenticated,
    initAuth,
    signIn,
    signOut,
  }
}

export const getAuthToken = getToken
export { clearSession }

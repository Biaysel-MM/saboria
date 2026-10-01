import { getAuthToken, clearSession, notifySessionExpired } from '../stores/auth'
import { notify } from '../stores/toasts.js'

const BASE_URL = import.meta.env.VITE_API_URL || '/api'
const TIMEOUT_MS = 20000

const getHeaders = (includeContentType = true) => {
  const token = getAuthToken()
  return {
    ...(includeContentType ? { 'Content-Type': 'application/json' } : {}),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  }
}

const safeJson = (text) => {
  if (!text) return {}
  try {
    return JSON.parse(text)
  } catch {
    return { message: 'El servidor devolvió una respuesta no válida' }
  }
}

/** Traduce los errores crudos del backend a mensajes amigables. */
const friendlyMessage = (raw, status) => {
  if (status === 401) return 'Tu sesión expiró o no es válida. Vuelve a entrar.'
  if (status === 403) return 'No tienes permisos para realizar esta acción'
  if (status === 429 || /Too Many Requests|ThrottlerException/i.test(raw))
    return 'Demasiadas solicitudes. Espera unos segundos y vuelve a intentarlo.'
  if ([500, 502, 503, 504].includes(status))
    return 'El servidor no está disponible. ¿Está el backend encendido?'
  if (/^Unauthorized$/i.test(raw)) return 'Tu sesión expiró o no es válida. Vuelve a entrar.'
  if (/Failed to fetch|ECONNREFUSED|Load failed/i.test(raw))
    return 'No se pudo conectar con el servidor. ¿Está el backend encendido?'
  if (/El servidor devolvió una respuesta no válida/i.test(raw))
    return 'No se pudo conectar con el servidor. ¿Está el backend encendido?'
  return raw
}

const handleResponse = async (res) => {
  const text = await res.text()
  if (!text) {
    if (!res.ok) throw new Error(friendlyMessage(`Error ${res.status}`, res.status))
    return {}
  }
  const data = safeJson(text)
  if (!res.ok) {
    if (res.status === 401) {
      // Solo avisa de "sesión expirada" si realmente había una sesión:
      // un 401 por login fallido (sin token) no debe confundir al usuario.
      const hadToken = !!getAuthToken()
      clearSession()
      if (hadToken) {
        notifySessionExpired()
        notify('warn', 'Tu sesión expiró o no es válida. Vuelve a entrar.')
      }
    }
    const raw = Array.isArray(data.message)
      ? data.message.join(', ')
      : data.message || data.error || `Error ${res.status}`
    throw new Error(friendlyMessage(raw, res.status))
  }
  return data
}

const prepareBody = (body) => {
  const isForm = body instanceof FormData
  return { contentType: !isForm, payload: isForm ? body : JSON.stringify(body) }
}

const request = (path, init = {}) => {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS)
  return fetch(`${BASE_URL}${path}`, { ...init, signal: controller.signal })
    .then(handleResponse)
    .catch((err) => {
      if (err.name === 'AbortError') {
        throw new Error('La solicitud tardó demasiado. Revisa tu conexión.')
      }
      throw err
    })
    .finally(() => clearTimeout(timer))
}

export const api = {
  get: (path) => request(path, { headers: getHeaders(false) }),

  post: (path, body) => {
    const { contentType, payload } = prepareBody(body)
    return request(path, {
      method: 'POST',
      headers: getHeaders(contentType),
      body: payload,
    })
  },

  put: (path, body) => {
    const { contentType, payload } = prepareBody(body)
    return request(path, {
      method: 'PUT',
      headers: getHeaders(contentType),
      body: payload,
    })
  },

  delete: (path) => request(path, { method: 'DELETE', headers: getHeaders(false) }),
}

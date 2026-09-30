import { getAuthToken, clearSession, notifySessionExpired } from '../stores/auth'

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

const handleResponse = async (res) => {
  const text = await res.text()
  if (!text) {
    if (!res.ok) throw new Error(`Error ${res.status}`)
    return {}
  }
  const data = safeJson(text)
  if (!res.ok) {
    if (res.status === 401) {
      clearSession()
      notifySessionExpired()
    }
    if (Array.isArray(data.message)) {
      throw new Error(data.message.join('\n'))
    }
    throw new Error(data.message || data.error || `Error ${res.status}`)
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

/**
 * Centralized API Client & Service Gateway
 *
 * Configured for secure RESTful communication with the backend API (JWT Bearer Auth).
 * Automatically injects authorization headers, logs endpoints, and resolves production URLs.
 */

export function getApiBaseUrl() {
  const envUrl = import.meta.env.VITE_API_URL
  if (envUrl) return envUrl.replace(/\/+$/, '')

  const isBrowser = typeof window !== 'undefined'
  if (isBrowser) {
    // In browser, route via relative /api so all mobile/desktop devices send requests
    // through the current origin (e.g. port 5173). The Vite dev server proxies /api
    // to http://127.0.0.1:8000, preventing Windows Firewall from blocking port 8000 on mobile.
    return `${window.location.origin}/api`
  }

  return 'http://127.0.0.1:8000/api'
}

export const API_CONFIG = {
  get BASE_URL() {
    return getApiBaseUrl()
  },
  TIMEOUT: 15000,
}

class ApiClient {
  constructor(config = API_CONFIG) {
    this.config = config
  }

  getToken() {
    return localStorage.getItem('auth_token') || ''
  }

  setToken(token) {
    if (token) {
      localStorage.setItem('auth_token', token)
    } else {
      localStorage.removeItem('auth_token')
    }
  }

  clearToken() {
    localStorage.removeItem('auth_token')
  }

  getHeaders(customHeaders = {}) {
    const token = this.getToken()
    return {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
      ...customHeaders,
    }
  }

  async request(endpoint, options = {}) {

    const baseUrl = this.config.BASE_URL
    let cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`
    
    if (options.params) {
      const searchParams = new URLSearchParams()
      Object.entries(options.params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          searchParams.append(key, value)
        }
      })
      const qs = searchParams.toString()
      if (qs) {
        cleanEndpoint += (cleanEndpoint.includes('?') ? '&' : '?') + qs
      }
      delete options.params
    }

    const url = `${baseUrl}${cleanEndpoint}`
    const headers = this.getHeaders(options.headers)

    const response = await fetch(url, {
      ...options,
      headers,
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      const errorMsg = errorData.message || errorData.error || `HTTP ${response.status}: ${response.statusText}`
      const error = new Error(errorMsg)
      error.status = response.status
      error.data = errorData

      // Broadcast auth expiration or unauthorized access
      if (response.status === 401 && !endpoint.includes('/auth/login') && !endpoint.includes('/auth/quick-login')) {
        this.clearToken()
        window.dispatchEvent(new CustomEvent('auth:expired', { detail: { message: errorMsg } }))
      }

      throw error
    }

    const resData = await response.json()
    if (resData && resData.pagination !== undefined) {
      return resData
    }
    return resData && resData.data !== undefined ? resData.data : resData
  }

  get(endpoint, config = {}) {
    return this.request(endpoint, { method: 'GET', ...config })
  }

  post(endpoint, body, config = {}) {
    return this.request(endpoint, { method: 'POST', body: body ? JSON.stringify(body) : undefined, ...config })
  }

  put(endpoint, body, config = {}) {
    return this.request(endpoint, { method: 'PUT', body: body ? JSON.stringify(body) : undefined, ...config })
  }

  patch(endpoint, body, config = {}) {
    return this.request(endpoint, { method: 'PATCH', body: body ? JSON.stringify(body) : undefined, ...config })
  }

  delete(endpoint, config = {}) {
    return this.request(endpoint, { method: 'DELETE', ...config })
  }
}

export const apiClient = new ApiClient()

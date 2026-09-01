/**
 * Centralized API Client & Service Gateway
 *
 * Configured for secure RESTful communication with the backend API (JWT Bearer Auth).
 * Automatically injects authorization headers and handles session expiration gracefully.
 */

const defaultBaseUrl =
  typeof window !== 'undefined' && window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1'
    ? 'https://carrepair-backend.onrender.com/api'
    : 'http://localhost:5000/api'

export const API_CONFIG = {
  USE_REAL_API: true,
  BASE_URL: import.meta.env.VITE_API_URL || defaultBaseUrl,
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
    if (!this.config.USE_REAL_API) {
      throw new Error(`Real API is currently disabled. Using local mock services for: ${endpoint}`)
    }

    const url = `${this.config.BASE_URL}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`
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
    return resData && resData.data !== undefined ? resData.data : resData
  }

  get(endpoint, headers = {}) {
    return this.request(endpoint, { method: 'GET', headers })
  }

  post(endpoint, body, headers = {}) {
    return this.request(endpoint, { method: 'POST', body: body ? JSON.stringify(body) : undefined, headers })
  }

  put(endpoint, body, headers = {}) {
    return this.request(endpoint, { method: 'PUT', body: body ? JSON.stringify(body) : undefined, headers })
  }

  patch(endpoint, body, headers = {}) {
    return this.request(endpoint, { method: 'PATCH', body: body ? JSON.stringify(body) : undefined, headers })
  }

  delete(endpoint, headers = {}) {
    return this.request(endpoint, { method: 'DELETE', headers })
  }
}

export const apiClient = new ApiClient()

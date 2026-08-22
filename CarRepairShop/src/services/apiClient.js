/**
 * Centralized API Client & Service Gateway
 *
 * Configured for RESTful communication with the backend API (Laravel Sanctum / Supabase).
 * Includes mock data fallback to allow immediate UI development and easy swapping to live API endpoints.
 */

export const API_CONFIG = {
  // Toggle this to TRUE when connecting to the live backend API
  USE_REAL_API: true,
  BASE_URL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
  TIMEOUT: 10000,
}

class ApiClient {
  constructor(config = API_CONFIG) {
    this.config = config
  }

  getToken() {
    return localStorage.getItem('auth_token') || ''
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
      const error = new Error(errorData.message || `HTTP ${response.status}: ${response.statusText}`)
      error.status = response.status
      error.data = errorData
      throw error
    }

    return response.json()
  }

  get(endpoint, headers = {}) {
    return this.request(endpoint, { method: 'GET', headers })
  }

  post(endpoint, body, headers = {}) {
    return this.request(endpoint, { method: 'POST', body: JSON.stringify(body), headers })
  }

  put(endpoint, body, headers = {}) {
    return this.request(endpoint, { method: 'PUT', body: JSON.stringify(body), headers })
  }

  patch(endpoint, body, headers = {}) {
    return this.request(endpoint, { method: 'PATCH', body: JSON.stringify(body), headers })
  }

  delete(endpoint, headers = {}) {
    return this.request(endpoint, { method: 'DELETE', headers })
  }
}

export const apiClient = new ApiClient()

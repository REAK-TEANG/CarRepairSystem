import { apiClient } from '@/services/apiClient'

export const authService = {
  /**
   * Log in user with credentials against the backend API
   */
  async login(username, password) {
    const res = await apiClient.post('/auth/login', { username, password })
    if (res?.token) {
      apiClient.setToken(res.token)
    }
    return res
  },

  /**
   * Fast role or user login using real database account
   */
  async quickLogin(roleOrUsername) {
    const payload = typeof roleOrUsername === 'object' ? roleOrUsername : { role: roleOrUsername }
    const res = await apiClient.post('/auth/quick-login', payload)
    if (res?.token) {
      apiClient.setToken(res.token)
    }
    return res
  },

  /**
   * Fetch real registered accounts directly from database
   */
  async getAccounts() {
    const res = await apiClient.get('/auth/accounts')
    return res?.accounts || []
  },

  /**
   * Fetch currently authenticated user profile
   */
  async getMe() {
    const res = await apiClient.get('/auth/me')
    return res && res.user ? res.user : res
  },

  /**
   * Update authenticated user password
   */
  async changePassword(currentPassword, newPassword) {
    return await apiClient.post('/auth/change-password', { currentPassword, newPassword })
  },

  /**
   * Request password reset code
   */
  async forgotPassword(emailOrUsername) {
    return await apiClient.post('/auth/forgot-password', { emailOrUsername })
  },

  /**
   * Submit reset code and set new password
   */
  async resetPassword(emailOrUsername, resetCode, newPassword) {
    return await apiClient.post('/auth/reset-password', { emailOrUsername, resetCode, newPassword })
  },

  /**
   * Log out user, notify server to revoke/blacklist token, and clear stored session
   */
  logout() {
    try {
      const token = apiClient.getToken()
      if (token) {
        fetch(`${apiClient.config.BASE_URL}/auth/logout`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
        }).catch(() => {})
      }
    } catch {
      // non-blocking
    } finally {
      apiClient.clearToken()
      localStorage.removeItem('demo_role')
      localStorage.removeItem('auth_user')
    }
  },
}
